import * as fs from 'fs/promises';
import { logger } from './logger';
import path from 'path';

interface PersistentStoreOptions {
  filePath: string;
}

export class PersistentStore<T extends Record<string, unknown>> {
  private store: T = {} as T;
  private readonly filePath: string;
  private isInitialized = false;

  constructor(options: PersistentStoreOptions) {
    this.filePath = options.filePath;
  }

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
        this.store = JSON.parse(fileContent);
        logger.info(`Persistent store loaded successfully from ${this.filePath}`);
      }
      this.isInitialized = true;
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        logger.info(`Persistent store file not found, initializing new store at ${this.filePath}`);
        this.store = {} as T;
        this.isInitialized = true;
      } else if (error instanceof SyntaxError) {
        logger.error(`Failed to load persistent store from ${this.filePath}. Data will be reset.`, error);
        this.store = {} as T;
        this.isInitialized = true;
        await this.save();
      } else {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to initialize persistent store from ${this.filePath}`, message);
        throw new Error(`Failed to initialize persistent store: ${message}`);
      }
    }
  }

  async save(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.store, null, 2), 'utf-8');
    logger.info(`Persistent store saved to ${this.filePath}`);
  }

  get(key: keyof T): T[keyof T] | undefined {
    return this.store[key];
  }

  set(key: keyof T, value: T[keyof T]): void {
    this.store[key] = value;
  }

  getAll(): T {
    return this.store;
  }

  clear(): void {
    this.store = {} as T;
  }
}