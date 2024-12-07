#!/bin/bash

# Exit on error
set -e

# Get version from manifest.json
VERSION=$(grep '"version"' manifest.json | cut -d'"' -f4)
echo "🚀 Starting build process for version $VERSION..."

# Ensure dist directory exists
mkdir -p dist

# Create zip file for Chrome Web Store
echo "🗜️ Creating zip file..."
zip -r "dist/smart-search-v$VERSION.zip" \
    manifest.json \
    popup.html \
    popup.js \
    background.js \
    content_script.js \
    suggest.js \
    icons

echo "✅ Build completed! The extension package is ready at dist/smart-search-v$VERSION.zip"
echo "📦 Files included in the package:"
unzip -l "dist/smart-search-v$VERSION.zip"
