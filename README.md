# League View - Enhanced Companion App

A powerful League of Legends companion application built with Tauri, React, TypeScript, and Rust. This app provides real-time match analysis, detailed player statistics, and comprehensive performance insights.

## ✨ Features

### 🏠 Dashboard View

- **Rank Information**: Current rank, LP, wins/losses, and win rate
- **Champion Mastery**: Top 5 champions with mastery levels and points
- **Performance Insights**:
  - Average KDA analysis
  - Win rate tracking
  - Recent form detection (hot/cold streaks)
  - Playstyle traits identification
- **Enhanced Recent Games**:
  - Detailed match history with KDA visualization
  - Victory/defeat tracking with visual indicators
  - Game duration and champion performance
  - Statistical summaries (average kills/deaths/assists)

### ⚔️ Live Match Analysis

- **Real-time Game Detection**: Automatically detects when you enter a match
- **Team-based Layout**: Players organized by Blue and Red teams
- **Comprehensive Player Cards**:
  - Summoner names and champion information
  - Rank and LP for each player
  - Win rate percentage
  - Playstyle traits and performance indicators
  - Visual rank tier coloring
  - Hot/cold streak detection
- **Match Information**: Game mode, duration, and match ID

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Rust (latest stable version)
- Riot Games API Key

### Local Development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment**

   ```bash
   cp .env.example .env
   # Edit .env and add your RIOT_API_KEY
   ```

3. **Start development server**

   ```bash
   npm run tauri dev
   # or
   cargo tauri dev
   ```

4. **Configure your summoner**
   - Enter your **Riot ID** (game name and tag line) and region
   - The app will start tracking your matches automatically

## 🎮 Usage

1. **Dashboard**: View your rank, champion mastery, and performance insights
2. **Live Detection**: App automatically detects when you enter a match
3. **Match Analysis**: See detailed player information for all 10 players
4. **Performance Tracking**: Monitor your improvement with advanced statistics

## 📊 Enhanced Features

### Performance Insights

- **KDA Analysis**: Track your kill/death/assist ratios
- **Win Rate Tracking**: Monitor your success rate over time
- **Playstyle Traits**: Automatic detection of your playing style
- **Form Analysis**: Hot streaks, cold streaks, and performance trends

### Match Analysis

- **Team Organization**: Clear blue vs red team layout
- **Player Intelligence**: Rank, win rate, and traits for each player
- **Visual Indicators**: Color-coded rank tiers and performance indicators
- **Real-time Updates**: Live data during champion select and loading

## 🛠️ Technical Stack

- **Frontend**: React + TypeScript + Chakra UI + Framer Motion
- **Backend**: Rust + Tauri + Riven (Riot API)
- **State Management**: Zustand
- **Styling**: Chakra UI with custom dark theme

## 🔧 Development Tools

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Tauri Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

### Available Scripts

- `npm run dev`: Start Vite development server
- `npm run build`: Build for production
- `npm run tauri dev`: Start Tauri development with hot reload
- `npm run tauri build`: Build distributable application

## 📝 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

League View is not affiliated with Riot Games. League of Legends is a trademark of Riot Games, Inc.
