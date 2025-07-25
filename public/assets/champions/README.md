# Champion Assets Setup

This directory contains champion assets for maximum performance:

## Structure:
- `portraits/` - Champion square portraits (64x64)
- `splash/` - Champion splash arts (1215x717)
- `icons/` - Small champion icons (32x32)

## Performance Benefits:
- ✅ No API calls required
- ✅ Instant loading
- ✅ No network dependency
- ✅ Consistent availability
- ✅ Reduced bandwidth usage

## Asset Sources:
All assets are sourced from Riot's Data Dragon CDN and cached locally:
- Base URL: `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/`
- Format: PNG files
- Resolution: 64x64 for portraits, 1215x717 for splash

## Usage:
Import the ChampionAssetService to get champion data and asset URLs.
