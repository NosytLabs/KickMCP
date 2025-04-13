#!/usr/bin/env node

/**
 * MCP mode entry point
 * This script is used to start the server in MCP mode (stdin/stdout JSON-RPC)
 */

// Set MCP mode environment variable
process.env.MCP_MODE = 'true';

// Import the server
import '../index'; 