#!/usr/bin/env node

/**
 * MCP mode entry point
 * This script is used to start the server in MCP (stdin/stdout JSON-RPC) mode
 * which is required for Smithery deployment and MCP Inspector.
 */

// Make sure HTTP_MODE is not set, which would override the MCP mode
if (process.env.HTTP_MODE) {
  delete process.env.HTTP_MODE;
}

// Import the server
import '../index'; 