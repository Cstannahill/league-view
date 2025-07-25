#!/bin/bash

# Create splash directory if it doesn't exist
mkdir -p ../public/assets/champions/splash

# Array of all champion names for splash arts
champions=(
    "Aatrox" "Ahri" "Akali" "Akshan" "Alistar" "Amumu" "Anivia" "Annie" "Aphelios"
    "Ashe" "AurelionSol" "Azir" "Bard" "Blitzcrank" "Brand" "Braum" "Caitlyn"
    "Camille" "Cassiopeia" "Chogath" "Corki" "Darius" "Diana" "Draven" "DrMundo"
    "Ekko" "Elise" "Evelynn" "Ezreal" "Fiddlesticks" "Fiora" "Fizz" "Galio"
    "Gangplank" "Garen" "Gnar" "Gragas" "Graves" "Gwen" "Hecarim" "Heimerdinger"
    "Illaoi" "Irelia" "Ivern" "Janna" "JarvanIV" "Jax" "Jayce" "Jhin" "Jinx"
    "Kaisa" "Kalista" "Karma" "Karthus" "Kassadin" "Katarina" "Kayle" "Kayn"
    "Kennen" "Khazix" "Kindred" "Kled" "KogMaw" "Leblanc" "LeeSin" "Leona"
    "Lillia" "Lissandra" "Lucian" "Lulu" "Lux" "Malphite" "Malzahar" "Maokai"
    "MasterYi" "MissFortune" "Mordekaiser" "Morgana" "Nami" "Nasus" "Nautilus"
    "Neeko" "Nidalee" "Nocturne" "Nunu" "Olaf" "Orianna" "Ornn" "Pantheon"
    "Poppy" "Pyke" "Qiyana" "Quinn" "Rakan" "Rammus" "RekSai" "Rell" "Renata"
    "Renekton" "Rengar" "Riven" "Rumble" "Ryze" "Samira" "Sejuani" "Senna"
    "Seraphine" "Sett" "Shaco" "Shen" "Shyvana" "Singed" "Sion" "Sivir" "Skarner"
    "Sona" "Soraka" "Swain" "Sylas" "Syndra" "TahmKench" "Taliyah" "Talon"
    "Taric" "Teemo" "Thresh" "Tristana" "Trundle" "Tryndamere" "TwistedFate"
    "Twitch" "Udyr" "Urgot" "Varus" "Vayne" "Veigar" "Velkoz" "Vex" "Vi"
    "Viego" "Viktor" "Vladimir" "Volibear" "Warwick" "Wukong" "Xayah" "Xerath"
    "XinZhao" "Yasuo" "Yone" "Yorick" "Yuumi" "Zac" "Zed" "Ziggs" "Zilean"
    "Zoe" "Zyra"
)

echo "Downloading splash arts for ${#champions[@]} champions..."

# Counter for progress
count=0
total=${#champions[@]}

# Download each champion's splash art
for champion in "${champions[@]}"; do
    ((count++))
    echo "[$count/$total] Downloading $champion splash art..."
    
    # Check if file already exists
    if [ -f "../public/assets/champions/splash/${champion}_0.jpg" ]; then
        echo "  ✓ $champion splash already exists, skipping"
        continue
    fi
    
    # Download the splash art
    curl -s -f "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion}_0.jpg" \
         -o "../public/assets/champions/splash/${champion}_0.jpg"
    
    if [ $? -eq 0 ]; then
        echo "  ✓ Downloaded $champion splash"
    else
        echo "  ✗ Failed to download $champion splash"
        # Try alternate name format if first fails
        alt_name=$(echo "$champion" | sed 's/[A-Z]/ &/g' | sed 's/^ //' | sed 's/ //g')
        if [ "$alt_name" != "$champion" ]; then
            echo "  Trying alternate name: $alt_name"
            curl -s -f "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${alt_name}_0.jpg" \
                 -o "../public/assets/champions/splash/${champion}_0.jpg"
            if [ $? -eq 0 ]; then
                echo "  ✓ Downloaded $champion splash (alternate name)"
            else
                echo "  ✗ Failed with alternate name too"
            fi
        fi
    fi
    
    # Small delay to be nice to the server
    sleep 0.1
done

echo ""
echo "Splash art download complete!"
echo "Downloaded files:"
ls -la ../public/assets/champions/splash/ | grep -v "^d" | wc -l
echo "total splash arts"
