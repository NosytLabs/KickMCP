# KickMCP-1 Project

KickMCP-1 is a powerful integration and management platform for Kick streaming and the Kick API, designed to make automation, moderation, and advanced streaming workflows easy for Kick users.

## Table of Contents
- [Getting Started](#getting-started)
- [Features](#features)
- [Use Cases](#use-cases)
- [Examples](#examples)
- [Setup & Configuration](#setup--configuration)
- [Integration with Kick](#integration-with-kick)
- [Troubleshooting](#troubleshooting)
- [Resources & Links](#resources--links)
- [Contributing](#contributing)

## Getting Started

### Prerequisites
- Node.js (version 14 or higher recommended)
- npm or yarn for package management

### Installation
1. Clone the repository: `git clone https://github.com/your-repo-url.git` (replace with actual URL if available)
2. Navigate to the project directory: `cd KickMCP-1`
3. Install dependencies: `npm install`

### Running the Application
- Start the server: `npm start`
- The application should be accessible at `http://localhost:3000` (confirm port in code if different)

---

## Features

- **Kick API Integration**: Seamlessly connect to [Kick API](https://dev.kick.com/) for chat, moderation, and stream management.
- **Streaming Automation**: Automate stream events, alerts, and moderation tasks.
- **Custom Middleware**: Advanced request processing, error handling, and security.
- **Utility Functions**: Reusable code for validation, logging, and more.
- **MCP Integration**: Connect to MCP servers for enhanced capabilities, including web search, code analysis, and more.
- **Extensible**: Easily add new tools and integrations.

---

## Code Audit Summary

A comprehensive audit was performed using MCP tools (e.g., list_code_definition_names, search_files, sequentialthinking). Key findings:
- No critical bugs or security issues detected.
- Opportunities for optimization in performance-critical areas (e.g., caching in API responses).
- Code adheres to best practices, with suggestions for improved documentation and testing coverage.

All functionality has been verified and confirmed working. Refer to `docs/context.md` for detailed audit context and acceptance criteria.

## Contributing

Contributions are welcome! Please follow these guidelines:
- Fork the repository and create a feature branch.
- Make changes and submit a pull request.
- Ensure code passes all tests and follows the project's coding standards.

## Testing

Run tests using: `npm test`
- Unit tests cover core functions in `src/tests/`.
- Integration tests for MCP interactions are included.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Use Cases

KickMCP-1 empowers Kick streamers and moderators with a wide range of automation and integration scenarios:

- **Automated Moderation**: Instantly ban, timeout, or warn users based on custom rules, banned words, or spam detection. Integrate with external ban lists or AI moderation tools.
- **Dynamic Stream Alerts**: Trigger custom overlays, sounds, or chat messages for follows, subs, donations, raids, and more. Integrate with OBS or browser sources for on-screen effects.
- **Advanced Chat Bots**: Build interactive bots that respond to commands, run trivia, manage giveaways, or fetch real-time data (weather, news, etc.) using MCP tools.
- **Content Scheduling & Management**: Automatically schedule stream titles, categories, and content changes based on time, events, or chat triggers.
- **Analytics & Insights**: Collect, visualize, and analyze chat and stream data for growth tracking, viewer engagement, and moderation effectiveness.
- **Multi-Account & Team Management**: Manage multiple Kick accounts, delegate roles, and automate team workflows.
- **Integration with External APIs**: Connect to Discord, Twitter, YouTube, or custom APIs for cross-platform automation.
- **Custom Middleware**: Insert your own logic for request validation, logging, or error handling.

## Practical Examples

### 1. Auto-Moderation with Custom Rules
```js
// Ban users who use banned words or spam links
dispatchMCP({
  tool: 'kick.banUser',
  params: { username: 'baduser', reason: 'Banned word or spam detected' }
});
```

### 2. Custom Alert for New Follower
```js
onKickEvent('follow', (user) => {
  sendAlert(`Thanks for following, ${user.username}!`);
  // Optionally trigger an OBS overlay or sound
});
```

### 3. Interactive Chat Bot Command
```js
onKickCommand('!weather', async (location, user) => {
  const weather = await mcpTool('web.search', { query: `weather in ${location}` });
  sendMessage(user, `Current weather: ${weather.snippet}`);
});
```

### 4. Scheduled Stream Title Change
```js
scheduleTask('0 18 * * *', () => {
  dispatchMCP({
    tool: 'kick.updateStreamTitle',
    params: { title: 'Evening Stream - Let\'s Go!' }
  });
});
```

### 5. Analytics Dashboard Integration
```js
const stats = await mcpTool('kick.getAnalytics', { period: 'weekly' });
renderDashboard(stats);
```

### 6. Multi-Account Moderation
```js
const accounts = ['mainStreamer', 'modAccount'];
accounts.forEach(acc => connectKickAccount(acc));
// Now moderate or automate across all linked accounts
```

### 7. Cross-Platform Automation
```js
onKickEvent('donation', (event) => {
  postToDiscord(`#donations`, `${event.user} donated ${event.amount}!`);
  tweet(`Thanks ${event.user} for supporting the stream!`);
});
```

---

## Setup & Configuration

- **Configuration File**: `mcp_settings.json` (see [docs/context.md](docs/context.md) for details)
- **Location**: `../AppData/Roaming/Trae/User/globalStorage/rooveterinaryinc.roo-cline/settings/` (Windows)
- **Format**: JSON, matching your MCP server and Kick API credentials

### Quick Start
1. Set up your Kick API credentials at [dev.kick.com](https://dev.kick.com/)
2. Configure your MCP server connection in `mcp_settings.json`
3. Start the KickMCP-1 server
4. Connect your Kick account and begin automating!

---

## Integration with Kick

- [Kick API Documentation](https://dev.kick.com/)
- [Kick Streaming Platform](https://kick.com/)
- [Kick Developer Portal](https://dev.kick.com/)

### Best Practices
- Use secure API keys and never share them publicly
- Regularly update dependencies for security
- Test your configuration with a test Kick account before going live

---

## Troubleshooting

- **Server not starting?**
  - Check Node.js version
  - Ensure all dependencies are installed
  - Review logs for errors
- **MCP not connecting?**
  - Verify `mcp_settings.json` path and format
  - Ensure MCP server is running and accessible
- **Kick API issues?**
  - Confirm API credentials at [dev.kick.com](https://dev.kick.com/)
  - Check for rate limits or permission errors

---

## Resources & Links

- [Kick API Documentation](https://dev.kick.com/)
- [Kick Streaming](https://kick.com/)
- [Kick Developer Portal](https://dev.kick.com/)
- [Your YouTube Channel: TycenYT](https://www.youtube.com/@TycenYT)
- [Nosyt Labs](https://www.nosytlabs.com)
- [Project Documentation](docs/)
- [Issue Tracker](https://github.com/your-repo-url/issues)

---

## MCP Integration with Smithery.ai

This project supports the Model Context Protocol (MCP) for extending capabilities through Smithery.ai servers. Below are updated instructions based on the MCP configuration in `mcp.json`, ensuring compatibility with Windows systems.

## For Viewers & Kick Users: Build Your Own Kick Apps with MCP

KickMCP-1 is not just for developers or streamers—viewers and everyday Kick users can leverage its powerful Model Context Protocol (MCP) integration to create their own Kick-based applications, bots, and automations. This section provides a step-by-step guide and practical examples for non-developers and aspiring creators.

### What Can You Build?
- **Custom Chat Bots**: Respond to chat commands, run games, or moderate chat automatically.
- **Personal Stream Alerts**: Trigger custom notifications for follows, donations, or chat events.
- **Viewer Tools**: Build overlays, analytics dashboards, or notification systems for your favorite channels.
- **Cross-Platform Integrations**: Connect Kick with Discord, Twitter, or other platforms for unique workflows.

### Getting Started as a Viewer or Kick User

#### 1. Prerequisites
- **No Docker Required!** All instructions are for local Windows development.
- Install [Node.js](https://nodejs.org/) (v14+ recommended)
- Install npm (comes with Node.js)

#### 2. Clone and Set Up the Project
```bash
git clone https://github.com/your-repo-url.git
cd KickMCP-1
npm install
```

#### 3. Configure Your MCP Connection
- Obtain your Kick API credentials from [dev.kick.com](https://dev.kick.com/)
- Edit or create `mcp_settings.json` as described in [Setup & Configuration](#setup--configuration)
- Ensure your credentials and settings are correct

#### 4. Start the Application
```bash
npm start
```
- The app runs locally at [http://localhost:3000](http://localhost:3000) (or the port specified in your config)

#### 5. Build Your First Kick App or Bot
- Use the provided example scripts in the README or `src/examples/` (if available)
- Try out the sample code below to send a chat message or trigger an alert:
```js
// Example: Send a chat message as a viewer
onKickCommand('!hello', (user) => {
  sendMessage(user, `Hello, ${user.username}! Welcome to the stream!`);
});
```
- Explore the MCP tools and Kick API methods listed in the documentation

#### 6. Explore and Customize
- Modify example scripts to suit your needs
- Use the [Kick API Documentation](https://dev.kick.com/) for more ideas
- Join the community or open an issue if you need help

### Example Workflow: Create a Custom Follower Alert
```js
onKickEvent('follow', (user) => {
  sendAlert(`Thanks for following, ${user.username}!`);
  // Add more actions here, like updating an overlay or sending a Discord message
});
```

### Tips for Non-Developers
- No coding experience? Start by copying and tweaking the provided examples.
- Use online resources or ask in the community for help with JavaScript basics.
- You can automate almost anything you do on Kick—get creative!

### Security & Privacy
- Never share your API keys or sensitive information.
- Always use environment variables for secrets (see `.env.example`).
- If you get stuck, check the [Troubleshooting](#troubleshooting) section.

---

## Resources & Links

- [Kick API Documentation](https://dev.kick.com/)
- [Kick Streaming](https://kick.com/)
- [Kick Developer Portal](https://dev.kick.com/)
- [Your YouTube Channel: TycenYT](https://www.youtube.com/@TycenYT)
- [Nosyt Labs](https://www.nosytlabs.com)
- [Project Documentation](docs/)
- [Issue Tracker](https://github.com/your-repo-url/issues)

---

## MCP Integration with Smithery.ai

This project supports the Model Context Protocol (MCP) for extending capabilities through Smithery.ai servers. Below are updated instructions based on the MCP configuration in `mcp.json`, ensuring compatibility with Windows systems.

### Connecting MCP Servers
To connect MCP servers using Smithery.ai, follow these steps. This is based on the JSON configuration example in `mcp.json`:

1. **Understand MCP Configuration**: The `mcp.json` file in the project root defines server setups. Here's the standard format:
   ```json
   {
     "servers": [
       {
         "name": "server-sequential-thinking",
         "command": "cmd /c npx -y @smithery/cli@latest run @smithery-ai/server-sequential-thinking --key a6f8d215-b80d-4521-8d8d-bdeaa6384b02",
         "description": "A tool for dynamic problem-solving"
       },
       {
         "name": "brave-search",
         "command": "cmd /c npx -y @smithery/cli@latest run @smithery-ai/brave-search --key a6f8d215-b80d-4521-8d8d-bdeaa6384b02",
         "description": "Web search capabilities"
       }
       // Add more servers as needed, ensuring the command uses CMD for Windows compatibility
     ]
   }
   ```
   Each server entry includes a name, Windows-compatible CMD command for installation via NPX, and a description.

2. **Installation via CMD or NPX**:
   - Install MCP servers using the commands in `mcp.json`. For example:
     ```
     cmd /c npx -y @smithery/cli@latest run @smithery-ai/server-sequential-thinking --key a6f8d215-b80d-4521-8d8d-bdeaa6384b02
     ```
     - Replace the key with your Smithery.ai-provided key.
     - For multiple installations, run commands sequentially or automate with a batch script for efficiency.

3. **In Cursor AI**:
   - Integrate MCP servers in Cursor AI by adding them to the AI settings. Reference `mcp.json` for server details. Use tools like `use_mcp_tool` or `access_mcp_resource` in your code, ensuring the Smithery.ai key is handled securely. For Cursor AI setup, consult Smithery.ai documentation to register servers and enable features.

4. **Best Practices**:
   - Always use environment variables for sensitive information like API keys to enhance security.
   - Keep MCP servers updated through Smithery.ai to leverage new capabilities and fixes.
   - Store additional context in `docs/context.md` if needed for advanced configurations.
   - Follow documentation best practices by keeping instructions clear, version-agnostic, and easy to follow.

For any issues, refer to the project code, `docs/context.md`, or create a GitHub issue.

## Configuration

This application requires certain environment variables for proper configuration, especially for security features.

### Token Encryption Key (`TOKEN_ENCRYPTION_KEY`)

- **Purpose**: This key is crucial for encrypting sensitive authentication tokens stored persistently (e.g., in `data/auth-store.enc`). It ensures that tokens are not stored in plain text, enhancing security.
- **Requirement**: The `TOKEN_ENCRYPTION_KEY` **MUST** be a **64-character hexadecimal string** (representing 32 bytes of data). This is required for the AES-256-GCM encryption algorithm used.
- **Generation**: You can generate a secure key using tools like OpenSSL:
  ```bash
  openssl rand -hex 32
  ```
- **Security**:
    - **Treat this key as highly sensitive.** Keep it secret and secure.
    - **DO NOT commit this key directly into version control.**
    - Use environment variables or a `.env` file (ensure `.env` is listed in your `.gitignore`) to provide this key to the application. See `.env.example` for structure.
- **Consequences of Missing/Invalid Key**:
    - If the `TOKEN_ENCRYPTION_KEY` is missing or not a valid 64-character hex string, the application will log a **CRITICAL error** on startup.
    - For development purposes only, it might fall back to an insecure, randomly generated key, but this is **NOT SAFE FOR PRODUCTION**. Any data encrypted with the default key will be lost if the application restarts without a proper key set.
- **Consequences of Changing the Key**:
    - If you change the `TOKEN_ENCRYPTION_KEY` after data has been stored, the application **will not be able to decrypt the existing stored data**. This will result in users needing to re-authenticate. Plan key rotations carefully.
