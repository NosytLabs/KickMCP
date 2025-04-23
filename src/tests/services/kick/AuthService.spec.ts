import { AuthService } from '../../../services/kick/AuthService';
import { PersistentStore } from '../../../utils/persistentStore';
import { logger } from '../../../utils/logger';
import * as fs from 'fs/promises';
import path from 'path';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('../../../utils/logger');

// Define a consistent test file path
const TEST_STORE_PATH = path.resolve(process.cwd(), 'data', 'test-auth-store.enc');

describe('AuthService', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let authService: AuthService; // Declare authService here

  beforeEach(() => {
    // Reset mocks and environment variables before each test
    authService = new AuthService(); // Instantiate here for each test
    jest.clearAllMocks();
    originalEnv = { ...process.env }; // Backup original env
    // Mock fs operations
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.readFile as jest.Mock).mockRejectedValue({ code: 'ENOENT' }); // Default: file doesn't exist
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv; // Restore original env
  });

  // --- Constructor Tests ---

  it('should initialize PersistentStore without encryption key', () => {
    new AuthService();
    expect(PersistentStore).toHaveBeenCalledWith({
      filePath: TEST_STORE_PATH
    });
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  // Additional tests for AuthService logic can be added here
});