import { AuthService } from '../../../services/kick/AuthService';
import { PersistentStore } from '../../../utils/persistentStore';
import { logger } from '../../../utils/logger';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import path from 'path';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('../../../utils/logger');

// Helper to generate a valid hex key
const generateValidKey = () => crypto.randomBytes(32).toString('hex');

// Define a consistent test file path
const TEST_STORE_PATH = path.resolve(process.cwd(), 'data', 'test-auth-store.enc');

describe('AuthService', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let authService: AuthService; // Declare authService here
  const validKey = generateValidKey();

  beforeEach(() => {
    // Reset mocks and environment variables before each test
    authService = new AuthService(); // Instantiate here for each test
    jest.clearAllMocks();
    originalEnv = { ...process.env }; // Backup original env
    // Default to a valid key unless overridden by the test
    process.env.TOKEN_ENCRYPTION_KEY = validKey;
    // Mock fs operations
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.readFile as jest.Mock).mockRejectedValue({ code: 'ENOENT' }); // Default: file doesn't exist
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv; // Restore original env
  });

  // --- Constructor Tests ---

  it('should initialize PersistentStore with a valid TOKEN_ENCRYPTION_KEY', () => {
    process.env.TOKEN_ENCRYPTION_KEY = validKey;
    new AuthService();
    expect(PersistentStore).toHaveBeenCalledWith({
      filePath: TEST_STORE_PATH,
      encryptionKey: validKey,
    });
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should log error and warning if TOKEN_ENCRYPTION_KEY is missing', () => {
    delete process.env.TOKEN_ENCRYPTION_KEY;
    new AuthService();
    expect(logger.error).toHaveBeenCalledWith(
      'CRITICAL: TOKEN_ENCRYPTION_KEY environment variable is not set.'
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Token persistence will use an insecure default key. THIS IS NOT SAFE FOR PRODUCTION.'
    );
    // Check if PersistentStore is called with an empty string, letting it handle the default
    expect(PersistentStore).toHaveBeenCalledWith({
      filePath: TEST_STORE_PATH,
      encryptionKey: '',
    });
  });

  it('should log error and warning if TOKEN_ENCRYPTION_KEY is invalid (wrong length)', () => {
    process.env.TOKEN_ENCRYPTION_KEY = 'invalid_key_short';
    new AuthService();
    expect(logger.error).toHaveBeenCalledWith(
      'CRITICAL: TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).'
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Token persistence will use an insecure default key due to invalid key format.'
    );
     expect(PersistentStore).toHaveBeenCalledWith({
      filePath: TEST_STORE_PATH,
      encryptionKey: '', // Let PersistentStore handle default
    });
  });

  // --- Initialization Tests ---

  it('initialize should call tokenStore.initialize', async () => {
    const authService = new AuthService();
    const mockInitialize = jest.fn().mockResolvedValue(undefined);
    // Access the mocked PersistentStore instance's prototype
    (PersistentStore.prototype.initialize as jest.Mock) = mockInitialize;

    await authService.initialize();

    expect(mockInitialize).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('AuthService token store initialized successfully.');
  });

   it('initialize should log error if tokenStore.initialize fails', async () => {
    const authService = new AuthService();
    const testError = new Error('Store init failed');
    const mockInitialize = jest.fn().mockRejectedValue(testError);
    (PersistentStore.prototype.initialize as jest.Mock) = mockInitialize;


    await expect(authService.initialize()).rejects.toThrow(testError);
    expect(logger.error).toHaveBeenCalledWith('Failed to initialize AuthService token store.', testError);
  });

  // --- Token Management Tests ---

  it('login should store tokens correctly', async () => {
    // authService is instantiated in beforeEach
    const mockSet = jest.fn().mockResolvedValue(undefined);
    (PersistentStore.prototype.set as jest.Mock) = mockSet;
    // Mock the private method to bypass the initialization check for this test
    const ensureSpy = jest.spyOn(authService as any, 'ensureStoreInitialized').mockImplementation(() => {});


    const userId = 'user123';
    const accessToken = 'access-token';
    const refreshToken = 'refresh-token';
    const expiresIn = 3600; // 1 hour

    await authService.login(userId, accessToken, refreshToken, expiresIn);

    expect(mockSet).toHaveBeenCalledWith('userId', userId);
    expect(mockSet).toHaveBeenCalledWith('accessToken', accessToken);
    expect(mockSet).toHaveBeenCalledWith('refreshToken', refreshToken);
    expect(mockSet).toHaveBeenCalledWith('tokenExpiry', expect.any(Number)); // Check expiry is calculated
    expect(logger.info).toHaveBeenCalledWith(`Tokens stored successfully for user ${userId}.`);
    ensureSpy.mockRestore(); // Clean up spy
  });

  it('getAccessToken should retrieve the stored token', () => {
    // authService is instantiated in beforeEach
    const mockGet = jest.fn();
    (PersistentStore.prototype.get as jest.Mock) = mockGet;
    // Mock the private method to bypass the initialization check for this test
    const ensureSpy = jest.spyOn(authService as any, 'ensureStoreInitialized').mockImplementation(() => {});

    const storedToken = 'stored-access-token';
    mockGet.mockImplementation((key: string) => {
        if (key === 'accessToken') return storedToken;
        if (key === 'tokenExpiry') return Date.now() + 10000; // Not expired
        return undefined;
    });


    const token = authService.getAccessToken();

    expect(token).toBe(storedToken);
    expect(mockGet).toHaveBeenCalledWith('accessToken');
    expect(mockGet).toHaveBeenCalledWith('tokenExpiry');
    ensureSpy.mockRestore(); // Clean up spy
  });

   it('getAccessToken should return undefined if token is expired', () => {
    // authService is instantiated in beforeEach
    const mockGet = jest.fn();
    (PersistentStore.prototype.get as jest.Mock) = mockGet;
    // Mock the private method to bypass the initialization check for this test
    const ensureSpy = jest.spyOn(authService as any, 'ensureStoreInitialized').mockImplementation(() => {});

    mockGet.mockImplementation((key: string) => {
        if (key === 'accessToken') return 'expired-token';
        if (key === 'tokenExpiry') return Date.now() - 10000; // Expired
        return undefined;
    });

    const token = authService.getAccessToken();

    expect(token).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith('Access token expired. Need refresh or re-login.');
    ensureSpy.mockRestore(); // Clean up spy
  });


  it('getRefreshToken should retrieve the stored token', () => {
    // authService is instantiated in beforeEach
     const mockGet = jest.fn();
    (PersistentStore.prototype.get as jest.Mock) = mockGet;
    // Mock the private method to bypass the initialization check for this test
    const ensureSpy = jest.spyOn(authService as any, 'ensureStoreInitialized').mockImplementation(() => {});

    const storedToken = 'stored-refresh-token';
    mockGet.mockReturnValue(storedToken);

    const token = authService.getRefreshToken();

    expect(token).toBe(storedToken);
    expect(mockGet).toHaveBeenCalledWith('refreshToken');
    ensureSpy.mockRestore(); // Clean up spy
  });

  it('clearTokens should call tokenStore.clear', async () => {
    // authService is instantiated in beforeEach
    const mockClear = jest.fn().mockResolvedValue(undefined);
    (PersistentStore.prototype.clear as jest.Mock) = mockClear;
    // Mock the private method to bypass the initialization check for this test
    const ensureSpy = jest.spyOn(authService as any, 'ensureStoreInitialized').mockImplementation(() => {});

    await authService.clearTokens();

    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('Stored authentication tokens cleared.');
    ensureSpy.mockRestore(); // Clean up spy
  });

  // --- Persistence Simulation (Integration-like) ---
  // These tests are more complex as they involve mocking file reads/writes

  // TODO: Add tests simulating file read/write for persistence checks
  // - Test loading existing valid data
  // - Test handling corrupted data / decryption failure on load
  // - Test persistence: save -> new instance -> initialize -> get data
});

// Define an interface for the mocked store methods
interface MockedPersistentStore {
    initialize: jest.Mock;
    save: jest.Mock;
    get: jest.Mock;
    set: jest.Mock;
    delete: jest.Mock;
    clear: jest.Mock;
    _options: unknown;
}

// Mock PersistentStore constructor and methods needed for AuthService tests
jest.mock('../../utils/persistentStore', () => {
    // Keep track of the instance for method mocking
    // Keep track of the instance for method mocking
    let mockInstance: MockedPersistentStore; // Use the defined interface
    const MockPersistentStore = jest.fn().mockImplementation((options) => {
        mockInstance = {
            initialize: jest.fn().mockResolvedValue(undefined),
            save: jest.fn().mockResolvedValue(undefined),
            get: jest.fn().mockReturnValue(undefined),
            set: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined),
            clear: jest.fn().mockResolvedValue(undefined),
            // Store options if needed for assertions
            _options: options,
        };
        return mockInstance;
    });

    // Allow access to the mocked instance methods via prototype
    MockPersistentStore.prototype.initialize = jest.fn();
    MockPersistentStore.prototype.save = jest.fn();
    MockPersistentStore.prototype.get = jest.fn();
    MockPersistentStore.prototype.set = jest.fn();
    MockPersistentStore.prototype.delete = jest.fn();
    MockPersistentStore.prototype.clear = jest.fn();


    return { PersistentStore: MockPersistentStore };
});