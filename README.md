# 🎮 KickMCP - Kick API Integration Made Easy
## 🚀 Quick Start

1. Install the package:
```bash
npm install kick-mcp
```

2. Create your MCP configuration (mcp.json):
```json
{
  "mcpServers": {
    "kickmcp": {
      "command": "node",
      "args": ["./dist/bin/mcp.js"]
    }
  },
  "version": "1.0.0",
  "description": "MCP configuration for KickMCP project",
  "defaultServer": "kickmcp"
```

3. Get your credentials:
- Visit [Kick Developer Settings](https://kick.com/settings/developer) to obtain your Client ID
- Get your Smithery key from [Smithery.ai](https://smithery.ai/server/@NosytLabs/kickmcp)
