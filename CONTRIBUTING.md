# Contributing to Kick MCP Server

Thank you for your interest in contributing to the Kick MCP Server! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct.

## How to Contribute

1. Fork the repository
2. Create a new branch for your feature/fix
3. Make your changes
4. Run tests and ensure they pass
5. Submit a pull request

## Development Setup

1. Clone your fork:
```bash
git clone https://github.com/your-username/KickMCP.git
cd KickMCP
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

## Code Style

- Follow the existing code style
- Use ESLint and Prettier for formatting
- Write clear, descriptive commit messages
- Include tests for new features
- Update documentation as needed

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the version number in package.json
3. The PR must pass all CI checks
4. The PR must be reviewed and approved by a maintainer

## Testing

Run the test suite:
```bash
npm test
```

## Documentation

- Keep documentation up to date
- Use clear, concise language
- Include examples where helpful
- Follow the existing documentation style

## Questions?

Feel free to open an issue or contact the maintainers with any questions. 