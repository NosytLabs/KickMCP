import { MCPInspector } from '../utils/mcp-inspector';
import { logger } from '../utils/logger';

async function main() {
  logger.info('Starting MCP Inspector...');
  
  try {
    // Run general MCP compatibility checks first
    const mcpCompatibilityResults = await MCPInspector.checkMCPCompatibility();
    
    // Then run Kick-specific diagnostics
    const diagnosticResults = await MCPInspector.runDiagnostics();
    
    console.log('\n=== MCP Inspector Results ===\n');
    
    // Display MCP compatibility results
    console.log('MCP Standard Compatibility:');
    mcpCompatibilityResults.checks.forEach(check => {
      const statusSymbol = check.passed ? '✅' : '❌';
      console.log(`${statusSymbol} ${check.name}: ${check.message}`);
    });
    
    console.log('\nKick API Connectivity:');
    diagnosticResults.results.forEach(result => {
      const statusSymbol = result.status === 'pass' ? '✅' : '❌';
      console.log(`${statusSymbol} ${result.name}: ${result.message}`);
    });
    
    console.log('\n===========================');
    const overallSuccess = mcpCompatibilityResults.allPassed && diagnosticResults.success;
    console.log(`Overall Status: ${overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (!overallSuccess) {
      console.log('\nSome tests failed. Please check the logs for more details.');
      process.exit(1);
    }
  } catch (error) {
    logger.error('Error running MCP Inspector:', error);
    console.error('An error occurred while running the MCP Inspector.');
    process.exit(1);
  }
}

main();