#!/bin/bash
# Champion Asset Download Script
# This script downloads all champion portraits from Riot's CDN for local storage

# Create directories if they don't exist
mkdir -p public/assets/champions/portraits
mkdir -p public/assets/champions/icons
mkdir -p public/assets/champions/splash

# Data Dragon version (update as needed)
VERSION="14.1.1"
BASE_URL="https://ddragon.leagueoflegends.com/cdn"

echo "🎮 Downloading champion assets for maximum performance..."
echo "📦 Version: $VERSION"

# Download the champion data to get the list
echo "📊 Fetching champion data..."
curl -s "$BASE_URL/$VERSION/data/en_US/champion.json" > champion_data.json

# Extract champion keys using jq (if available) or fallback method
if command -v jq &> /dev/null; then
    echo "✅ Using jq for JSON parsing"
    CHAMPIONS=$(jq -r '.data | keys[]' champion_data.json)
else
    echo "⚠️  jq not found, using manual list"
    # Fallback to a predefined list of popular champions
    CHAMPIONS="Aatrox Ahri Akali Akshan Alistar Ammu Annie Ashe Azir Bard Blitzcrank Brand Braum Caitlyn Camille Cassiopeia Chogath Corki Darius Diana Draven Ekko Elise Evelynn Ezreal Fiddlesticks Fiora Fizz Galio Gangplank Garen Gnar Gragas Graves Gwen Hecarim Heimerdinger Illaoi Irelia Ivern Janna JarvanIV Jax Jayce Jhin Jinx Kaisa Kalista Karma Karthus Kassadin Katarina Kayle Kayn Kennen Khazix Kindred Kled KogMaw Leblanc LeeSin Leona Lissandra Lucian Lulu Lux Malphite Malzahar Maokai MasterYi MissFortune Mordekaiser Morgana Nami Nasus Nautilus Neeko Nidalee Nocturne Nunu Olaf Orianna Ornn Pantheon Poppy Pyke Qiyana Quinn Rakan Rammus RekSai Rell Renekton Rengar Riven Rumble Ryze Samira Sejuani Senna Seraphine Sett Shaco Shen Shyvana Singed Sion Sivir Skarner Sona Soraka Swain Sylas Syndra TahmKench Taliyah Talon Taric Teemo Thresh Tristana Trundle Tryndamere TwistedFate Twitch Udyr Urgot Varus Vayne Veigar Velkoz Vex Vi Viego Viktor Vladimir Volibear Warwick MonkeyKing Xayah Xerath XinZhao Yasuo Yone Yorick Yuumi Zac Zed Zeri Ziggs Zilean Zoe Zyra"
fi

# Download portraits (64x64)
echo "🖼️  Downloading champion portraits..."
for champion in $CHAMPIONS; do
    echo "  📥 $champion portrait..."
    curl -s "$BASE_URL/$VERSION/img/champion/$champion.png" -o "public/assets/champions/portraits/$champion.png"
done

# Download icons (same as portraits but smaller reference)
echo "🎯 Creating champion icons (linking to portraits for now)..."
for champion in $CHAMPIONS; do
    if [ -f "public/assets/champions/portraits/$champion.png" ]; then
        cp "public/assets/champions/portraits/$champion.png" "public/assets/champions/icons/$champion.png"
    fi
done

# Download a few splash arts for key champions
echo "🎨 Downloading select champion splash arts..."
KEY_CHAMPIONS="Aatrox Ahri Akali Jinx Yasuo Zed Lux Ezreal"
for champion in $KEY_CHAMPIONS; do
    echo "  🎭 $champion splash..."
    curl -s "$BASE_URL/img/champion/splash/${champion}_0.jpg" -o "public/assets/champions/splash/${champion}_0.jpg"
done

# Create default fallback images
echo "🔧 Creating fallback images..."
# Create a simple default image (we'll use a champion that's likely to exist)
if [ -f "public/assets/champions/portraits/Aatrox.png" ]; then
    cp "public/assets/champions/portraits/Aatrox.png" "public/assets/champions/portraits/default.png"
    cp "public/assets/champions/portraits/Aatrox.png" "public/assets/champions/icons/default.png"
fi

# Clean up
rm -f champion_data.json

echo "✅ Champion assets download complete!"
echo "📁 Assets saved to public/assets/champions/"
echo "📈 Performance: Local assets will load instantly!"
echo ""
echo "🚀 Your app will now have blazing fast champion images!"
