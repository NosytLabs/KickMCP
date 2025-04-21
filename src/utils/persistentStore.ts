import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import { logger } from './logger';
import path from 'path';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES-GCM
const AUTH_TAG_LENGTH = 16; // For AES-GCM
const KEY_LENGTH = 32; // For AES-256

interface PersistentStoreOptions {
  filePath: string;
  encryptionKey: string;
}

interface EncryptedData {
  iv: string; // hex encoded
  tag: string; // hex encoded
  encrypted: string; // hex encoded
}

export class PersistentStore<T extends Record<string, unknown>> {
  private store: T = {} as T;
  private readonly filePath: string;
  private readonly encryptionKey: Buffer;
  private isInitialized = false;

  constructor(options: PersistentStoreOptions) {
    this.filePath = options.filePath;

    if (!options.encryptionKey || options.encryptionKey.length !== KEY_LENGTH * 2) {
        // Expecting a 64-character hex string for a 32-byte key
        logger.error('Invalid TOKEN_ENCRYPTION_KEY: Must be a 64-character hex string (32 bytes).');
        // In a real app, you might throw or prevent startup here.
        // For now, we'll log and proceed with an insecure default (NOT FOR PRODUCTION)
        logger.warn('Using insecure default key for persistent store. SET TOKEN_ENCRYPTION_KEY!');
        this.encryptionKey = crypto.randomBytes(KEY_LENGTH);
    } else {
        this.encryptionKey = Buffer.from(options.encryptionKey, 'hex');
    }
  }

  /**
   * Loads data from the encrypted file. Must be called before other operations.
   * Handles decryption errors, potentially indicating a wrong key or corrupted file.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    try {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const fileContent = await fs.readFile(this.filePath, 'utf-8');
      if (!fileContent) {
        this.store = {} as T;
        logger.info(`Persistent store file not found or empty, initializing new store at ${this.filePath}`);
      } else {
        const encryptedData: EncryptedData = JSON.parse(fileContent);
        this.store = this.decrypt(encryptedData);
        logger.info(`Persistent store loaded successfully from ${this.filePath}`);
      }
      this.isInitialized = true;
    } catch (error: unknown) {
      // Type guard for NodeJS.ErrnoException
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        logger.info(`Persistent store file not found, initializing new store at ${this.filePath}`);
        this.store = {} as T;
        this.isInitialized = true;
      } else if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('decrypt'))) {
          logger.error(`Failed to load or decrypt persistent store from ${this.filePath}. Check TOKEN_ENCRYPTION_KEY or file integrity. Data will be reset.`, error);
          // Reset store if decryption fails (potential key change or corruption)
          this.store = {} as T;
          this.isInitialized = true;
          // Optionally back up the corrupted file here
          await this.save(); // Save the empty store
      } else {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to initialize persistent store from ${this.filePath}`, message);
        // Decide how to handle critical failure - maybe throw?
        throw new Error(`Failed to initialize persistent store: ${message}`);
      }
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('PersistentStore must be initialized before use. Call initialize().');
    }
  }

  private encrypt(data: T): EncryptedData {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
    const serializedData = JSON.stringify(data);

    let encrypted = cipher.update(serializedData, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      encrypted: encrypted,
    };
  }

  private decrypt(encryptedData: EncryptedData): T {
    try {
        const iv = Buffer.from(encryptedData.iv, 'hex');
        const tag = Buffer.from(encryptedData.tag, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted) as T;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('Decryption failed:', message);
        // Rethrow a more specific error to be caught by initialize
        throw new Error(`Decryption failed: ${message}`);
    }
  }

  /**
   * Saves the current store state to the encrypted file.
   */
  async save(): Promise<void> {
    this.ensureInitialized();
    try {
      const encryptedData = this.encrypt(this.store);
      await fs.writeFile(this.filePath, JSON.stringify(encryptedData), 'utf-8');
      logger.debug(`Persistent store saved to ${this.filePath}`);
    } catch (error) {
      logger.error(`Failed to save persistent store to ${this.filePath}`, error);
      throw error; // Re-throw to indicate failure
    }
  }

  /**
   * Gets a value from the store.
   * @param key The key of the item to retrieve.
   * @returns The value, or undefined if the key doesn't exist.
   */
  get<K extends keyof T>(key: K): T[K] | undefined {
    this.ensureInitialized();
    return this.store[key];
  }

  /**
   * Sets a value in the store. Automatically saves after setting.
   * @param key The key of the item to set.
   * @param value The value to set.
   */
  async set<K extends keyof T>(key: K, value: T[K]): Promise<void> {
    this.ensureInitialized();
    this.store[key] = value;
    await this.save();
  }

  /**
   * Deletes a key from the store. Automatically saves after deleting.
   * @param key The key to delete.
   */
  async delete<K extends keyof T>(key: K): Promise<void> {
    this.ensureInitialized();
    if (key in this.store) {
      delete this.store[key];
      await this.save();
    }
  }

  /**
   * Clears the entire store. Automatically saves after clearing.
   */
  async clear(): Promise<void> {
      this.ensureInitialized();
      this.store = {} as T;
      await this.save();
      logger.info(`Persistent store cleared at ${this.filePath}`);
  }
}