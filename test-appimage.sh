#!/bin/bash

echo "🧪 Testing League View AppImage..."
echo "=================================="

# Check if AppImage exists
APPIMAGE_PATH="./src-tauri/target/release/bundle/appimage/league-view_0.1.0_amd64.AppImage"

if [ ! -f "$APPIMAGE_PATH" ]; then
    echo "❌ AppImage not found at: $APPIMAGE_PATH"
    echo "🔨 Building AppImage first..."
    pnpm tauri build
fi

echo "✅ AppImage found"

# Make sure it's executable
chmod +x "$APPIMAGE_PATH"
echo "✅ Made AppImage executable"

# Test the AppImage
echo "🚀 Starting AppImage..."
echo "💡 The app should open. Try entering a summoner name to test the Riot API connection."
echo "💡 If connection fails, it means the API key wasn't properly embedded."
echo ""
echo "Press Ctrl+C to stop the app when done testing..."

# Run the AppImage
"$APPIMAGE_PATH"
