#!/bin/sh

# Clean previous build
rm -rf dist/

# Build TypeScript
npx tsc

# Copy static files
cp -r src/public dist/public 2>/dev/null || :

# Set permissions
chmod -R 755 dist/ 