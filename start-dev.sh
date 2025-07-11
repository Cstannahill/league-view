#!/bin/bash

echo "🚀 Starting League View Development..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your RIOT_API_KEY"
    echo "Example:"
    echo "RIOT_API_KEY=your_api_key_here"
    exit 1
fi

# Check if API key is set
if ! grep -q "RIOT_API_KEY=" .env; then
    echo "❌ Error: RIOT_API_KEY not found in .env file!"
    exit 1
fi

echo "✅ Environment file found"

# Start the development server
echo "🔧 Starting Tauri development server..."
npm run tauri dev
