// Champion Asset Service for local champion data and images
// This provides champion information and asset URLs without API calls

export interface ChampionData {
  id: number;
  key: string;
  name: string;
  title: string;
  tags: string[];
  roles: string[];
}

export class ChampionAssetService {
  private static instance: ChampionAssetService;
  private championMap: Map<number, ChampionData> = new Map();
  private keyToIdMap: Map<string, number> = new Map();

  private constructor() {
    this.initializeChampionData();
  }

  public static getInstance(): ChampionAssetService {
    if (!ChampionAssetService.instance) {
      ChampionAssetService.instance = new ChampionAssetService();
    }
    return ChampionAssetService.instance;
  }

  private initializeChampionData() {
    // Champion data based on current game state - this would be updated with game updates
    const champions: ChampionData[] = [
      { id: 266, key: "Aatrox", name: "Aatrox", title: "the Darkin Blade", tags: ["Fighter", "Tank"], roles: ["top"] },
      { id: 103, key: "Ahri", name: "Ahri", title: "the Nine-Tailed Fox", tags: ["Mage", "Assassin"], roles: ["middle"] },
      { id: 84, key: "Akali", name: "Akali", title: "the Rogue Assassin", tags: ["Assassin"], roles: ["middle", "top"] },
      { id: 166, key: "Akshan", name: "Akshan", title: "the Rogue Sentinel", tags: ["Marksman", "Assassin"], roles: ["middle", "bottom"] },
      { id: 12, key: "Alistar", name: "Alistar", title: "the Minotaur", tags: ["Tank", "Support"], roles: ["support"] },
      { id: 32, key: "Amumu", name: "Amumu", title: "the Sad Mummy", tags: ["Tank", "Mage"], roles: ["jungle"] },
      { id: 34, key: "Anivia", name: "Anivia", title: "the Cryophoenix", tags: ["Mage"], roles: ["middle"] },
      { id: 1, key: "Annie", name: "Annie", title: "the Dark Child", tags: ["Mage"], roles: ["middle"] },
      { id: 523, key: "Aphelios", name: "Aphelios", title: "the Weapon of the Faithful", tags: ["Marksman"], roles: ["bottom"] },
      { id: 22, key: "Ashe", name: "Ashe", title: "the Frost Archer", tags: ["Marksman", "Support"], roles: ["bottom", "support"] },
      { id: 136, key: "AurelionSol", name: "Aurelion Sol", title: "the Star Forger", tags: ["Mage"], roles: ["middle"] },
      { id: 268, key: "Azir", name: "Azir", title: "the Emperor of the Sands", tags: ["Mage", "Marksman"], roles: ["middle"] },
      { id: 432, key: "Bard", name: "Bard", title: "the Wandering Caretaker", tags: ["Support", "Mage"], roles: ["support"] },
      { id: 200, key: "Belveth", name: "Bel'Veth", title: "the Empress of the Void", tags: ["Fighter"], roles: ["jungle"] },
      { id: 53, key: "Blitzcrank", name: "Blitzcrank", title: "the Great Steam Golem", tags: ["Tank", "Fighter"], roles: ["support"] },
      { id: 63, key: "Brand", name: "Brand", title: "the Burning Vengeance", tags: ["Mage"], roles: ["support", "middle"] },
      { id: 201, key: "Braum", name: "Braum", title: "the Heart of the Freljord", tags: ["Support", "Tank"], roles: ["support"] },
      { id: 51, key: "Caitlyn", name: "Caitlyn", title: "the Sheriff of Piltover", tags: ["Marksman"], roles: ["bottom"] },
      { id: 164, key: "Camille", name: "Camille", title: "the Steel Shadow", tags: ["Fighter", "Tank"], roles: ["top"] },
      { id: 69, key: "Cassiopeia", name: "Cassiopeia", title: "the Serpent's Embrace", tags: ["Mage"], roles: ["middle"] },
      { id: 31, key: "Chogath", name: "Cho'Gath", title: "the Terror of the Void", tags: ["Tank", "Mage"], roles: ["top", "jungle"] },
      { id: 42, key: "Corki", name: "Corki", title: "the Daring Bombardier", tags: ["Marksman", "Mage"], roles: ["middle"] },
      { id: 122, key: "Darius", name: "Darius", title: "the Hand of Noxus", tags: ["Fighter", "Tank"], roles: ["top"] },
      { id: 131, key: "Diana", name: "Diana", title: "Scorn of the Moon", tags: ["Fighter", "Mage"], roles: ["jungle", "middle"] },
      { id: 119, key: "Draven", name: "Draven", title: "the Glorious Executioner", tags: ["Marksman"], roles: ["bottom"] },
      { id: 36, key: "DrMundo", name: "Dr. Mundo", title: "the Madman of Zaun", tags: ["Fighter", "Tank"], roles: ["top", "jungle"] },
      { id: 245, key: "Ekko", name: "Ekko", title: "the Boy Who Shattered Time", tags: ["Assassin", "Fighter"], roles: ["jungle", "middle"] },
      { id: 60, key: "Elise", name: "Elise", title: "the Spider Queen", tags: ["Mage", "Fighter"], roles: ["jungle"] },
      { id: 28, key: "Evelynn", name: "Evelynn", title: "Agony's Embrace", tags: ["Assassin", "Mage"], roles: ["jungle"] },
      { id: 81, key: "Ezreal", name: "Ezreal", title: "the Prodigal Explorer", tags: ["Marksman", "Mage"], roles: ["bottom"] },
      { id: 9, key: "Fiddlesticks", name: "Fiddlesticks", title: "the Harbinger of Doom", tags: ["Mage", "Support"], roles: ["jungle"] },
      { id: 114, key: "Fiora", name: "Fiora", title: "the Grand Duelist", tags: ["Fighter", "Assassin"], roles: ["top"] },
      { id: 105, key: "Fizz", name: "Fizz", title: "the Tidal Trickster", tags: ["Assassin", "Fighter"], roles: ["middle"] },
      { id: 3, key: "Galio", name: "Galio", title: "the Colossus", tags: ["Tank", "Mage"], roles: ["middle", "support"] },
      { id: 41, key: "Gangplank", name: "Gangplank", title: "the Saltwater Scourge", tags: ["Fighter"], roles: ["top"] },
      { id: 86, key: "Garen", name: "Garen", title: "the Might of Demacia", tags: ["Fighter", "Tank"], roles: ["top"] },
      { id: 150, key: "Gnar", name: "Gnar", title: "the Missing Link", tags: ["Fighter", "Tank"], roles: ["top"] },
      { id: 79, key: "Gragas", name: "Gragas", title: "the Rabble Rouser", tags: ["Fighter", "Mage"], roles: ["jungle", "support"] },
      { id: 104, key: "Graves", name: "Graves", title: "the Outlaw", tags: ["Marksman"], roles: ["jungle"] },
      { id: 887, key: "Gwen", name: "Gwen", title: "The Hallowed Seamstress", tags: ["Fighter", "Assassin"], roles: ["top"] },
      { id: 120, key: "Hecarim", name: "Hecarim", title: "the Shadow of War", tags: ["Fighter", "Tank"], roles: ["jungle"] },
      { id: 74, key: "Heimerdinger", name: "Heimerdinger", title: "the Revered Inventor", tags: ["Mage", "Support"], roles: ["middle", "support"] },
      { id: 910, key: "Hwei", name: "Hwei", title: "the Visionary", tags: ["Mage"], roles: ["middle", "support"] },
      { id: 420, key: "Illaoi", name: "Illaoi", title: "the Kraken Priestess", tags: ["Fighter", "Tank"], roles: ["top"] },
      { id: 39, key: "Irelia", name: "Irelia", title: "the Blade Dancer", tags: ["Fighter", "Assassin"], roles: ["top", "middle"] },
      { id: 427, key: "Ivern", name: "Ivern", title: "the Green Father", tags: ["Support", "Mage"], roles: ["jungle"] },
      { id: 40, key: "Janna", name: "Janna", title: "the Storm's Fury", tags: ["Support", "Mage"], roles: ["support"] },
      { id: 59, key: "JarvanIV", name: "Jarvan IV", title: "the Exemplar of Demacia", tags: ["Tank", "Fighter"], roles: ["jungle"] },
      { id: 24, key: "Jax", name: "Jax", title: "Grandmaster at Arms", tags: ["Fighter", "Tank"], roles: ["top", "jungle"] },
      { id: 126, key: "Jayce", name: "Jayce", title: "the Defender of Tomorrow", tags: ["Fighter", "Marksman"], roles: ["top", "middle"] },
      { id: 202, key: "Jhin", name: "Jhin", title: "the Virtuoso", tags: ["Marksman"], roles: ["bottom"] },
      { id: 222, key: "Jinx", name: "Jinx", title: "the Loose Cannon", tags: ["Marksman"], roles: ["bottom"] },
      { id: 145, key: "Kaisa", name: "Kai'Sa", title: "Daughter of the Void", tags: ["Marksman"], roles: ["bottom"] },
      { id: 429, key: "Kalista", name: "Kalista", title: "the Spear of Vengeance", tags: ["Marksman"], roles: ["bottom"] },
      { id: 43, key: "Karma", name: "Karma", title: "the Enlightened One", tags: ["Mage", "Support"], roles: ["support", "middle"] },
      { id: 30, key: "Karthus", name: "Karthus", title: "the Deathsinger", tags: ["Mage"], roles: ["jungle"] },
      { id: 38, key: "Kassadin", name: "Kassadin", title: "the Void Walker", tags: ["Assassin", "Mage"], roles: ["middle"] },
      { id: 55, key: "Katarina", name: "Katarina", title: "the Sinister Blade", tags: ["Assassin", "Mage"], roles: ["middle"] },
      { id: 10, key: "Kayle", name: "Kayle", title: "the Righteous", tags: ["Fighter", "Support"], roles: ["top"] },
      { id: 141, key: "Kayn", name: "Kayn", title: "the Shadow Reaper", tags: ["Fighter", "Assassin"], roles: ["jungle"] },
      { id: 85, key: "Kennen", name: "Kennen", title: "the Heart of the Tempest", tags: ["Mage", "Marksman"], roles: ["top"] },
      { id: 121, key: "Khazix", name: "Kha'Zix", title: "the Voidreaver", tags: ["Assassin"], roles: ["jungle"] },
      { id: 203, key: "Kindred", name: "Kindred", title: "The Eternal Hunters", tags: ["Marksman"], roles: ["jungle"] },
      { id: 240, key: "Kled", name: "Kled", title: "the Cantankerous Cavalier", tags: ["Fighter", "Tank"], roles: ["top"] },
      { id: 96, key: "KogMaw", name: "Kog'Maw", title: "the Mouth of the Abyss", tags: ["Marksman", "Mage"], roles: ["bottom"] },
      { id: 897, key: "KSante", name: "K'Sante", title: "the Pride of Nazumah", tags: ["Tank", "Fighter"], roles: ["top"] },
      { id: 7, key: "Leblanc", name: "LeBlanc", title: "the Deceiver", tags: ["Assassin", "Mage"], roles: ["middle"] },
      { id: 64, key: "LeeSin", name: "Lee Sin", title: "the Blind Monk", tags: ["Fighter", "Assassin"], roles: ["jungle"] },
      { id: 89, key: "Leona", name: "Leona", title: "the Radiant Dawn", tags: ["Tank", "Support"], roles: ["support"] },
      { id: 876, key: "Lillia", name: "Lillia", title: "the Bashful Bloom", tags: ["Fighter", "Mage"], roles: ["jungle"] },
      { id: 127, key: "Lissandra", name: "Lissandra", title: "the Ice Witch", tags: ["Mage"], roles: ["middle"] },
      { id: 236, key: "Lucian", name: "Lucian", title: "the Purifier", tags: ["Marksman"], roles: ["bottom"] },
      { id: 117, key: "Lulu", name: "Lulu", title: "the Fae Sorceress", tags: ["Support", "Mage"], roles: ["support"] },
      { id: 99, key: "Lux", name: "Lux", title: "the Lady of Luminosity", tags: ["Mage", "Support"], roles: ["support", "middle"] },
      { id: 54, key: "Malphite", name: "Malphite", title: "Shard of the Monolith", tags: ["Tank", "Fighter"], roles: ["top"] },
      { id: 90, key: "Malzahar", name: "Malzahar", title: "the Prophet of the Void", tags: ["Mage", "Assassin"], roles: ["middle"] },
      { id: 57, key: "Maokai", name: "Maokai", title: "the Twisted Treant", tags: ["Tank", "Mage"], roles: ["support", "jungle"] },
      { id: 11, key: "MasterYi", name: "Master Yi", title: "the Wuju Bladesman", tags: ["Assassin", "Fighter"], roles: ["jungle"] },
      { id: 902, key: "Milio", name: "Milio", title: "the Gentle Flame", tags: ["Support"], roles: ["support"] },
      { id: 21, key: "MissFortune", name: "Miss Fortune", title: "the Bounty Hunter", tags: ["Marksman"], roles: ["bottom"] },
      { id: 82, key: "Mordekaiser", name: "Mordekaiser", title: "the Iron Revenant", tags: ["Fighter"], roles: ["top"] },
      { id: 25, key: "Morgana", name: "Morgana", title: "the Fallen", tags: ["Mage", "Support"], roles: ["support"] },
      { id: 950, key: "Naafiri", name: "Naafiri", title: "the Hound of a Hundred Bites", tags: ["Assassin"], roles: ["middle"] },
      { id: 267, key: "Nami", name: "Nami", title: "the Tidecaller", tags: ["Support", "Mage"], roles: ["support"] },
      { id: 75, key: "Nasus", name: "Nasus", title: "the Curator of the Sands", tags: ["Fighter", "Tank"], roles: ["top"] },
      { id: 111, key: "Nautilus", name: "Nautilus", title: "the Titan of the Depths", tags: ["Tank", "Fighter"], roles: ["support"] },
      { id: 518, key: "Neeko", name: "Neeko", title: "the Curious Chameleon", tags: ["Mage", "Support"], roles: ["middle", "support"] },
      { id: 76, key: "Nidalee", name: "Nidalee", title: "the Bestial Huntress", tags: ["Assassin", "Mage"], roles: ["jungle"] },
      { id: 895, key: "Nilah", name: "Nilah", title: "the Joy Unbound", tags: ["Fighter", "Assassin"], roles: ["bottom"] },
      { id: 56, key: "Nocturne", name: "Nocturne", title: "the Eternal Nightmare", tags: ["Assassin", "Fighter"], roles: ["jungle"] },
      { id: 20, key: "Nunu", name: "Nunu & Willump", title: "the Boy and His Yeti", tags: ["Tank", "Fighter"], roles: ["jungle"] },
      { id: 2, key: "Olaf", name: "Olaf", title: "the Berserker", tags: ["Fighter", "Tank"], roles: ["top", "jungle"] },
      { id: 61, key: "Orianna", name: "Orianna", title: "the Lady of Clockwork", tags: ["Mage", "Support"], roles: ["middle"] },
      { id: 516, key: "Ornn", name: "Ornn", title: "The Fire Beneath the Mountain", tags: ["Tank", "Fighter"], roles: ["top"] },
      { id: 80, key: "Pantheon", name: "Pantheon", title: "the Unbreakable Spear", tags: ["Fighter", "Assassin"], roles: ["middle", "support"] },
      { id: 78, key: "Poppy", name: "Poppy", title: "Keeper of the Hammer", tags: ["Tank", "Fighter"], roles: ["jungle", "support"] },
      { id: 555, key: "Pyke", name: "Pyke", title: "the Bloodharbor Ripper", tags: ["Support", "Assassin"], roles: ["support"] },
      { id: 246, key: "Qiyana", name: "Qiyana", title: "Empress of the Elements", tags: ["Assassin", "Fighter"], roles: ["middle"] },
      { id: 133, key: "Quinn", name: "Quinn", title: "Demacia's Wings", tags: ["Marksman", "Assassin"], roles: ["top"] },
      { id: 497, key: "Rakan", name: "Rakan", title: "The Charmer", tags: ["Support"], roles: ["support"] },
      { id: 33, key: "Rammus", name: "Rammus", title: "the Armordillo", tags: ["Tank", "Fighter"], roles: ["jungle"] },
      { id: 421, key: "RekSai", name: "Rek'Sai", title: "the Void Burrower", tags: ["Fighter"], roles: ["jungle"] },
      { id: 526, key: "Rell", name: "Rell", title: "the Iron Maiden", tags: ["Tank", "Support"], roles: ["support"] },
      { id: 888, key: "Renata", name: "Renata Glasc", title: "the Chem-Baroness", tags: ["Support", "Mage"], roles: ["support"] },
      { id: 58, key: "Renekton", name: "Renekton", title: "the Butcher of the Sands", tags: ["Fighter", "Tank"], roles: ["top"] },
      { id: 107, key: "Rengar", name: "Rengar", title: "the Pridestalker", tags: ["Assassin", "Fighter"], roles: ["jungle"] },
      { id: 92, key: "Riven", name: "Riven", title: "the Exile", tags: ["Fighter", "Assassin"], roles: ["top"] },
      { id: 68, key: "Rumble", name: "Rumble", title: "the Mechanized Menace", tags: ["Fighter", "Mage"], roles: ["middle", "top"] },
      { id: 13, key: "Ryze", name: "Ryze", title: "the Rune Mage", tags: ["Mage", "Fighter"], roles: ["middle"] },
      { id: 360, key: "Samira", name: "Samira", title: "the Desert Rose", tags: ["Marksman"], roles: ["bottom"] },
      { id: 113, key: "Sejuani", name: "Sejuani", title: "Fury of the North", tags: ["Tank", "Fighter"], roles: ["jungle"] },
      { id: 235, key: "Senna", name: "Senna", title: "the Redeemer", tags: ["Marksman", "Support"], roles: ["support", "bottom"] },
      { id: 147, key: "Seraphine", name: "Seraphine", title: "the Starry-Eyed Songstress", tags: ["Mage", "Support"], roles: ["support", "middle"] },
      { id: 875, key: "Sett", name: "Sett", title: "the Boss", tags: ["Fighter", "Tank"], roles: ["top", "support"] },
      { id: 35, key: "Shaco", name: "Shaco", title: "the Demon Jester", tags: ["Assassin"], roles: ["jungle"] },
      { id: 98, key: "Shen", name: "Shen", title: "the Eye of Twilight", tags: ["Tank"], roles: ["top", "support"] },
      { id: 102, key: "Shyvana", name: "Shyvana", title: "the Half-Dragon", tags: ["Fighter", "Tank"], roles: ["jungle"] },
      { id: 27, key: "Singed", name: "Singed", title: "the Mad Chemist", tags: ["Tank", "Fighter"], roles: ["top"] },
      { id: 14, key: "Sion", name: "Sion", title: "The Undead Juggernaut", tags: ["Tank", "Fighter"], roles: ["top"] },
      { id: 15, key: "Sivir", name: "Sivir", title: "the Battle Mistress", tags: ["Marksman"], roles: ["bottom"] },
      { id: 72, key: "Skarner", name: "Skarner", title: "the Crystal Vanguard", tags: ["Fighter", "Tank"], roles: ["jungle"] },
      { id: 901, key: "Smolder", name: "Smolder", title: "the Fiery Fledgling", tags: ["Marksman"], roles: ["bottom"] },
      { id: 37, key: "Sona", name: "Sona", title: "Maven of the Strings", tags: ["Support", "Mage"], roles: ["support"] },
      { id: 16, key: "Soraka", name: "Soraka", title: "the Starchild", tags: ["Support", "Mage"], roles: ["support"] },
      { id: 50, key: "Swain", name: "Swain", title: "the Noxian Grand General", tags: ["Mage", "Fighter"], roles: ["middle", "support"] },
      { id: 517, key: "Sylas", name: "Sylas", title: "the Unshackled", tags: ["Mage", "Assassin"], roles: ["middle", "jungle"] },
      { id: 134, key: "Syndra", name: "Syndra", title: "the Dark Sovereign", tags: ["Mage"], roles: ["middle"] },
      { id: 223, key: "TahmKench", name: "Tahm Kench", title: "the River King", tags: ["Support", "Tank"], roles: ["support", "top"] },
      { id: 163, key: "Taliyah", name: "Taliyah", title: "the Stoneweaver", tags: ["Mage"], roles: ["jungle", "middle"] },
      { id: 91, key: "Talon", name: "Talon", title: "the Blade's Shadow", tags: ["Assassin"], roles: ["middle"] },
      { id: 44, key: "Taric", name: "Taric", title: "the Shield of Valoran", tags: ["Support", "Fighter"], roles: ["support"] },
      { id: 17, key: "Teemo", name: "Teemo", title: "the Swift Scout", tags: ["Marksman", "Assassin"], roles: ["top"] },
      { id: 412, key: "Thresh", name: "Thresh", title: "the Chain Warden", tags: ["Support", "Fighter"], roles: ["support"] },
      { id: 18, key: "Tristana", name: "Tristana", title: "the Yordle Gunner", tags: ["Marksman", "Assassin"], roles: ["bottom"] },
      { id: 48, key: "Trundle", name: "Trundle", title: "the Troll King", tags: ["Fighter", "Tank"], roles: ["top", "jungle"] },
      { id: 23, key: "Tryndamere", name: "Tryndamere", title: "the Barbarian King", tags: ["Fighter", "Assassin"], roles: ["top"] },
      { id: 4, key: "TwistedFate", name: "Twisted Fate", title: "the Card Master", tags: ["Mage"], roles: ["middle"] },
      { id: 29, key: "Twitch", name: "Twitch", title: "the Plague Rat", tags: ["Marksman", "Assassin"], roles: ["bottom", "jungle"] },
      { id: 77, key: "Udyr", name: "Udyr", title: "the Spirit Walker", tags: ["Fighter", "Tank"], roles: ["jungle"] },
      { id: 6, key: "Urgot", name: "Urgot", title: "the Dreadnought", tags: ["Fighter", "Tank"], roles: ["top"] },
      { id: 110, key: "Varus", name: "Varus", title: "the Arrow of Retribution", tags: ["Marksman", "Mage"], roles: ["bottom"] },
      { id: 67, key: "Vayne", name: "Vayne", title: "the Night Hunter", tags: ["Marksman", "Assassin"], roles: ["bottom"] },
      { id: 45, key: "Veigar", name: "Veigar", title: "the Tiny Master of Evil", tags: ["Mage"], roles: ["middle"] },
      { id: 161, key: "Velkoz", name: "Vel'Koz", title: "the Eye of the Void", tags: ["Mage"], roles: ["support", "middle"] },
      { id: 711, key: "Vex", name: "Vex", title: "the Gloomist", tags: ["Mage"], roles: ["middle"] },
      { id: 254, key: "Vi", name: "Vi", title: "the Piltover Enforcer", tags: ["Fighter", "Assassin"], roles: ["jungle"] },
      { id: 234, key: "Viego", name: "Viego", title: "The Ruined King", tags: ["Assassin", "Fighter"], roles: ["jungle"] },
      { id: 112, key: "Viktor", name: "Viktor", title: "the Machine Herald", tags: ["Mage"], roles: ["middle"] },
      { id: 8, key: "Vladimir", name: "Vladimir", title: "the Crimson Reaper", tags: ["Mage"], roles: ["middle", "top"] },
      { id: 106, key: "Volibear", name: "Volibear", title: "the Relentless Storm", tags: ["Fighter", "Tank"], roles: ["jungle", "top"] },
      { id: 19, key: "Warwick", name: "Warwick", title: "the Uncaged Wrath of Zaun", tags: ["Fighter", "Tank"], roles: ["jungle"] },
      { id: 62, key: "MonkeyKing", name: "Wukong", title: "the Monkey King", tags: ["Fighter", "Tank"], roles: ["top", "jungle"] },
      { id: 498, key: "Xayah", name: "Xayah", title: "the Rebel", tags: ["Marksman"], roles: ["bottom"] },
      { id: 101, key: "Xerath", name: "Xerath", title: "the Magus Ascendant", tags: ["Mage"], roles: ["middle", "support"] },
      { id: 5, key: "XinZhao", name: "Xin Zhao", title: "the Seneschal of Demacia", tags: ["Fighter", "Assassin"], roles: ["jungle"] },
      { id: 157, key: "Yasuo", name: "Yasuo", title: "the Unforgiven", tags: ["Fighter", "Assassin"], roles: ["middle", "top"] },
      { id: 777, key: "Yone", name: "Yone", title: "the Unforgotten", tags: ["Assassin", "Fighter"], roles: ["middle", "top"] },
      { id: 83, key: "Yorick", name: "Yorick", title: "Shepherd of Souls", tags: ["Fighter", "Tank"], roles: ["top"] },
      { id: 350, key: "Yuumi", name: "Yuumi", title: "the Magical Cat", tags: ["Support", "Mage"], roles: ["support"] },
      { id: 154, key: "Zac", name: "Zac", title: "the Secret Weapon", tags: ["Tank", "Fighter"], roles: ["jungle"] },
      { id: 238, key: "Zed", name: "Zed", title: "the Master of Shadows", tags: ["Assassin"], roles: ["middle"] },
      { id: 221, key: "Zeri", name: "Zeri", title: "The Spark of Zaun", tags: ["Marksman"], roles: ["bottom"] },
      { id: 115, key: "Ziggs", name: "Ziggs", title: "the Hexplosives Expert", tags: ["Mage"], roles: ["middle", "bottom"] },
      { id: 26, key: "Zilean", name: "Zilean", title: "the Chronokeeper", tags: ["Support", "Mage"], roles: ["support"] },
      { id: 142, key: "Zoe", name: "Zoe", title: "the Aspect of Twilight", tags: ["Mage", "Support"], roles: ["middle"] },
      { id: 143, key: "Zyra", name: "Zyra", title: "Rise of the Thorns", tags: ["Mage", "Support"], roles: ["support"] }
    ];

    // Populate the maps
    champions.forEach(champion => {
      this.championMap.set(champion.id, champion);
      this.keyToIdMap.set(champion.key.toLowerCase(), champion.id);
    });
  }

  // Get champion data by ID
  getChampionById(id: number): ChampionData | undefined {
    return this.championMap.get(id);
  }

  // Get champion data by key (name)
  getChampionByKey(key: string): ChampionData | undefined {
    const id = this.keyToIdMap.get(key.toLowerCase());
    return id ? this.championMap.get(id) : undefined;
  }

  // Get champion portrait URL (64x64 square)
  getChampionPortraitUrl(championIdOrKey: number | string): string {
    let champion: ChampionData | undefined;
    
    if (typeof championIdOrKey === 'number') {
      champion = this.getChampionById(championIdOrKey);
    } else {
      champion = this.getChampionByKey(championIdOrKey);
    }

    if (!champion) {
      // Fallback to a generic champion icon
      return '/assets/champions/portraits/default.png';
    }

    // For local assets (recommended for performance)
    return `/assets/champions/portraits/${champion.key}.png`;
    
    // Alternative: Use CDN (slower but guaranteed to work)
    // return `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${champion.key}.png`;
  }

  // Get champion splash art URL (1215x717)
  getChampionSplashUrl(championIdOrKey: number | string, skinId: number = 0): string {
    let champion: ChampionData | undefined;
    
    if (typeof championIdOrKey === 'number') {
      champion = this.getChampionById(championIdOrKey);
    } else {
      champion = this.getChampionByKey(championIdOrKey);
    }

    if (!champion) {
      return '/assets/champions/splash/default.jpg';
    }

    // For local assets (recommended for performance)
    return `/assets/champions/splash/${champion.key}_${skinId}.jpg`;
    
    // Alternative: Use CDN
    // return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.key}_${skinId}.jpg`;
  }

  // Get champion icon URL (32x32 small)
  getChampionIconUrl(championIdOrKey: number | string): string {
    let champion: ChampionData | undefined;
    
    if (typeof championIdOrKey === 'number') {
      champion = this.getChampionById(championIdOrKey);
    } else {
      champion = this.getChampionByKey(championIdOrKey);
    }

    if (!champion) {
      return '/assets/champions/icons/default.png';
    }

    return `/assets/champions/icons/${champion.key}.png`;
  }

  // Get all champions
  getAllChampions(): ChampionData[] {
    return Array.from(this.championMap.values());
  }

  // Search champions by name
  searchChampions(query: string): ChampionData[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllChampions().filter(champion => 
      champion.name.toLowerCase().includes(lowercaseQuery) ||
      champion.key.toLowerCase().includes(lowercaseQuery) ||
      champion.title.toLowerCase().includes(lowercaseQuery)
    );
  }
}

// Export a singleton instance
export const championAssets = ChampionAssetService.getInstance();
