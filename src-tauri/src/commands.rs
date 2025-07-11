use std::{sync::Arc, time::Duration};

use once_cell::sync::OnceCell;
use serde::Serialize;
use std::collections::HashMap;
use reqwest::Client;
use tauri::{AppHandle, Emitter};
use crate::riot_client::RiotClient;
use riven::consts::QueueType;
use chrono;

pub static APP_STATE: OnceCell<Arc<State>> = OnceCell::new();

async fn get_latest_ddragon_version() -> Result<String, reqwest::Error> {
    let url = "https://ddragon.leagueoflegends.com/api/versions.json";
    let versions: Vec<String> = Client::new().get(url).send().await?.json().await?;
    Ok(versions.into_iter().next().unwrap_or_default())
}

async fn fetch_champion_map() -> Result<HashMap<u32, String>, reqwest::Error> {
    let version = get_latest_ddragon_version().await?;
    let url = format!(
        "https://ddragon.leagueoflegends.com/cdn/{}/data/en_US/champion.json",
        version
    );
    let json: serde_json::Value = Client::new().get(url).send().await?.json().await?;
    let mut map = HashMap::new();
    if let Some(data) = json.get("data").and_then(|d| d.as_object()) {
        for val in data.values() {
            if let (Some(key), Some(name)) = (val.get("key"), val.get("name")) {
                if let (Some(id_str), Some(name_str)) = (key.as_str(), name.as_str()) {
                    if let Ok(id) = id_str.parse::<u32>() {
                        map.insert(id, name_str.to_string());
                    }
                }
            }
        }
    }
    Ok(map)
}

#[derive(Debug)]
pub struct State {
    pub client: RiotClient,
    pub inner: tokio::sync::Mutex<Tracked>,
}

#[derive(Default, Debug)]
pub struct Tracked {
    pub name: Option<String>,
    pub region: Option<String>,
    pub puuid: Option<String>,
    pub in_game: bool,
}

#[derive(Serialize)]
struct ChampionStat {
    id: u32,
    name: String,
    level: u32,
    points: u32,
}

#[derive(Serialize)]
struct RankInfo {
    tier: String,
    rank: String,
    lp: u32,
    wins: u32,
    losses: u32,
    winrate: f32,
}

#[derive(Serialize)]
struct DashboardStats {
    champions: Vec<ChampionStat>,
    rank: Option<RankInfo>,
    performance: Option<PerformanceData>,
}

#[derive(Serialize)]
struct NamedGameSummary {
    champion_id: u32,
    champion_name: String,
    win: bool,
    kills: u32,
    deaths: u32,
    assists: u32,
    duration: u32,
}

#[derive(Serialize)]
struct PerformanceData {
    average_kda: KDAStats,
    win_rate: f32,
    total_lp_gain: i32,
    games_analyzed: u32,
    recent_form: String,
    playstyle_traits: Vec<String>,
}

#[derive(Serialize)]
struct KDAStats {
    kills: f32,
    deaths: f32,
    assists: f32,
}

#[tauri::command]
pub async fn set_tracked_summoner(game_name: String, tag_line: String, region: String) -> Result<(), String> {
    use log::{info};
    info!("Rust setting summoner: {}#{} - {}", game_name, tag_line, region);
    let state = APP_STATE.get().ok_or("not initialized")?.clone();
    info!("State retrieved: {:?}", state);
    let account = state
        .client
        .get_account_by_riot_id(&game_name, &tag_line, &region)
        .await
        .map_err(|e| format!("{:?}", e))?
        .ok_or("account not found")?;
    let _ = state
        .client
        .get_summoner_by_puuid(&account.puuid, &region)
        .await
        .map_err(|e| format!("{:?}", e))?;
    let mut guard = state.inner.lock().await;
    guard.name = Some(format!("{}#{}", game_name, tag_line));
    guard.region = Some(region);
    guard.puuid = Some(account.puuid);
    Ok(())
}

#[tauri::command]
pub async fn refresh_dashboard() -> Result<serde_json::Value, String> {
    use log::{info, error};

    info!("Starting dashboard refresh...");

    let state = APP_STATE.get().ok_or("not initialized")?.clone();
    info!("State retrieved.");

    let (puuid, region) = {
        let t = state.inner.lock().await;
        info!("Locked state.");
        (t.puuid.clone(), t.region.clone())
    };

    let puuid = puuid.ok_or("no summoner")?;
    let region = region.ok_or("no region")?;
    info!("Using puuid: {}, region: {}", puuid, region);

    info!("Fetching champion masteries...");
    let masteries = state
        .client
        .get_champion_masteries(&puuid, &region)
        .await
        .map_err(|e| {
            let msg = format!("Failed to get champion masteries: {:?}", e);
            error!("{}", msg);
            msg
        })?;
    info!("Got {} champion masteries.", masteries.len());

    info!("Fetching ranked stats...");
    let ranked_entries = state
        .client
        .get_ranked_stats(&puuid, &region)
        .await
        .map_err(|e| {
            let msg = format!("Failed to get ranked stats: {:?}", e);
            error!("{}", msg);
            msg
        })?;
    info!("Got {} ranked entries.", ranked_entries.len());

    let mut top = masteries;
    top.sort_by(|a, b| b.champion_points.cmp(&a.champion_points));
    top.truncate(5);
    info!("Top 5 champions selected.");

    info!("Fetching champion map...");
    let champs = fetch_champion_map()
        .await
        .map_err(|e| {
            let msg = format!("Failed to fetch champion map: {:?}", e);
            error!("{}", msg);
            msg
        })?;
    info!("Champion map fetched.");

    let champions: Vec<ChampionStat> = top
        .iter()
        .map(|m| {
            let champ_id = i16::from(m.champion_id) as u32;
            let name = champs
                .get(&champ_id)
                .cloned()
                .unwrap_or_else(|| champ_id.to_string());

            ChampionStat {
                id: champ_id,
                name,
                level: m.champion_level as u32,
                points: m.champion_points as u32,
            }
        })
        .collect();
    info!("Mapped champion stats.");

    let rank = ranked_entries
        .iter()
        .find(|e| e.queue_type == QueueType::RANKED_SOLO_5x5)
        .map(|e| {
            let wins = e.wins as u32;
            let losses = e.losses as u32;
            let total = wins + losses;
            let winrate = if total > 0 {
                wins as f32 / total as f32
            } else {
                0.0
            };
            info!(
                "Found solo queue rank: {} {} ({} LP)",
                e.tier.as_ref().map(|t| t.to_string()).unwrap_or_default(),
                e.rank.as_ref().map(|r| r.to_string()).unwrap_or_default(),
                e.league_points
            );
            RankInfo {
                tier: e.tier
                    .as_ref()
                    .map(|t| t.to_string())
                    .unwrap_or_default(),
                rank: e.rank
                    .as_ref()
                    .map(|r| r.to_string())
                    .unwrap_or_default(),
                lp: e.league_points as u32,
                wins,
                losses,
                winrate,
            }
        });

    // Calculate performance insights
    let performance = calculate_performance_insights(&state.client, &puuid, &region)
        .await
        .ok();

    let stats = DashboardStats { champions, rank, performance };
    info!("Dashboard stats built successfully.");

    Ok(serde_json::to_value(stats).unwrap())
}

#[tauri::command]
pub async fn recent_games(count: Option<u32>) -> Result<serde_json::Value, String> {
    let state = APP_STATE.get().ok_or("not initialized")?.clone();
    let (puuid, region) = {
        let t = state.inner.lock().await;
        (t.puuid.clone(), t.region.clone())
    };
    let puuid = puuid.ok_or("no summoner")?;
    let region = region.ok_or("no region")?;
    let games = state
        .client
        .get_recent_matches(&puuid, &region, count.unwrap_or(10) as usize)
        .await
        .map_err(|e| format!("{:?}", e))?;
    let champs = fetch_champion_map()
        .await
        .map_err(|e| format!("{:?}", e))?;
    let named: Vec<_> = games
        .into_iter()
        .map(|g| NamedGameSummary {
            champion_id: g.champion_id,
            champion_name: champs
                .get(&g.champion_id)
                .cloned()
                .unwrap_or_else(|| g.champion_id.to_string()),
            win: g.win,
            kills: g.kills,
            deaths: g.deaths,
            assists: g.assists,
            duration: g.duration,
        })
        .collect();
    Ok(serde_json::to_value(named).unwrap())
}

async fn calculate_performance_insights(
    client: &RiotClient,
    puuid: &str,
    region: &str,
) -> Result<PerformanceData, String> {
    let games = client
        .get_recent_matches(puuid, region, 10)
        .await
        .map_err(|e| format!("Failed to get recent matches: {:?}", e))?;

    if games.is_empty() {
        return Ok(PerformanceData {
            average_kda: KDAStats {
                kills: 0.0,
                deaths: 0.0,
                assists: 0.0,
            },
            win_rate: 0.0,
            total_lp_gain: 0,
            games_analyzed: 0,
            recent_form: "neutral".to_string(),
            playstyle_traits: vec![],
        });
    }

    let total_games = games.len() as f32;
    let total_kills: u32 = games.iter().map(|g| g.kills).sum();
    let total_deaths: u32 = games.iter().map(|g| g.deaths).sum();
    let total_assists: u32 = games.iter().map(|g| g.assists).sum();
    let wins = games.iter().filter(|g| g.win).count();

    let avg_kda = KDAStats {
        kills: total_kills as f32 / total_games,
        deaths: total_deaths as f32 / total_games,
        assists: total_assists as f32 / total_games,
    };

    let win_rate = (wins as f32 / total_games) * 100.0;

    // Calculate recent form based on last 5 games
    let recent_games = games.iter().take(5).collect::<Vec<_>>();
    let recent_wins = recent_games.iter().filter(|g| g.win).count();
    let recent_form = if recent_wins >= 4 {
        "hot"
    } else if recent_wins <= 1 {
        "cold"
    } else {
        "neutral"
    };

    // Calculate playstyle traits
    let mut traits = Vec::new();
    let avg_kills = avg_kda.kills;
    let avg_deaths = avg_kda.deaths;
    let avg_assists = avg_kda.assists;

    if avg_kills > 8.0 {
        traits.push("Aggressive Player".to_string());
    }
    if avg_deaths < 3.0 {
        traits.push("Safe Player".to_string());
    }
    if avg_assists > 12.0 {
        traits.push("Team Player".to_string());
    }
    if avg_kills + avg_assists > 15.0 {
        traits.push("High Impact".to_string());
    }

    // Estimate LP gain (this is a simplified calculation)
    let estimated_lp_gain = wins as i32 * 18 - (games.len() - wins) as i32 * 15;

    Ok(PerformanceData {
        average_kda: avg_kda,
        win_rate,
        total_lp_gain: estimated_lp_gain,
        games_analyzed: games.len() as u32,
        recent_form: recent_form.to_string(),
        playstyle_traits: traits,
    })
}

#[tauri::command]
pub async fn get_performance_insights() -> Result<serde_json::Value, String> {
    let state = APP_STATE.get().ok_or("not initialized")?.clone();
    let (puuid, region) = {
        let t = state.inner.lock().await;
        (t.puuid.clone(), t.region.clone())
    };
    
    let puuid = puuid.ok_or("no summoner")?;
    let region = region.ok_or("no region")?;
    
    let performance = calculate_performance_insights(&state.client, &puuid, &region).await?;
    Ok(serde_json::to_value(performance).unwrap())
}

#[tauri::command]
pub async fn get_advanced_analytics() -> Result<serde_json::Value, String> {
    let state = APP_STATE.get().ok_or("not initialized")?.clone();
    let (puuid, region) = {
        let t = state.inner.lock().await;
        (t.puuid.clone(), t.region.clone())
    };
    
    let puuid = puuid.ok_or("no summoner")?;
    let region = region.ok_or("no region")?;
    
    let advanced_analysis = state.client
        .calculate_advanced_analysis(&puuid, &region, 10)
        .await
        .map_err(|e| format!("Failed to calculate advanced analysis: {:?}", e))?;
    
    Ok(serde_json::to_value(advanced_analysis).unwrap())
}

#[tauri::command]
pub async fn get_enhanced_traits() -> Result<serde_json::Value, String> {
    let state = APP_STATE.get().ok_or("not initialized")?.clone();
    let (puuid, region) = {
        let t = state.inner.lock().await;
        (t.puuid.clone(), t.region.clone())
    };
    
    let puuid = puuid.ok_or("no summoner")?;
    let region = region.ok_or("no region")?;
    
    let enhanced_traits = state.client
        .calculate_enhanced_traits(&puuid, &region)
        .await
        .map_err(|e| format!("Failed to calculate enhanced traits: {:?}", e))?;
    
    Ok(serde_json::to_value(enhanced_traits).unwrap())
}

pub async fn poll_loop(app: AppHandle, state: Arc<State>) {
    loop {
        let (puuid_opt, region_opt, _in_game) = {
            let t = state.inner.lock().await;
            (t.puuid.clone(), t.region.clone(), t.in_game)
        };

        if let (Some(puuid), Some(region_str)) = (puuid_opt, region_opt.as_deref()) {
            match state.client.get_active_game(&puuid, region_str).await {
                Ok(Some(game)) => {
                    let mut t = state.inner.lock().await;
                    if !t.in_game {
                        t.in_game = true;

                        let _ = app.emit("gameStarted", Some(game.clone()));

                        let ranked_futs = game
                            .participants
                            .iter()
                            .map(|p| {
                                state
                                    .client
                                    .get_ranked_stats(p.puuid.as_deref().unwrap_or(""), region_str)
                            });
                        let ranked: Vec<_> = futures::future::join_all(ranked_futs)
                            .await
                            .into_iter()
                            .map(|r| r.unwrap_or_default())
                            .collect();

                        let trait_futs = game
                            .participants
                            .iter()
                            .map(|p| {
                                state
                                    .client
                                    .calculate_traits(p.puuid.as_deref().unwrap_or(""), region_str)
                            });
                        let traits: Vec<Vec<String>> = futures::future::join_all(trait_futs)
                            .await
                            .into_iter()
                            .map(|r| r.unwrap_or_default())
                            .collect();

                        let payload = MatchPayload {
                            game,
                            ranked,
                            traits,
                        };

                        let _ = app.emit("matchData", Some(payload));
                    }
                }

                Ok(None) => {
                    let mut t = state.inner.lock().await;
                    if t.in_game {
                        t.in_game = false;
                        let _ = app.emit("gameEnded", Some(()));
                    } else {
                        let _ = app.emit("noGame", Some(()));
                    }
                }

                Err(err) => {
                    if let Some(status) = err.status_code() {
                        if status.as_u16() == 429 {
                            if let Some(resp) = err.response() {
                                if let Some(wait) = resp.headers().get("Retry-After") {
                                    if let Ok(wait) = wait.to_str() {
                                        if let Ok(secs) = wait.parse::<u64>() {
                                            tokio::time::sleep(Duration::from_secs(secs)).await;
                                            continue;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        tokio::time::sleep(Duration::from_secs(10)).await;
    }
}

#[derive(Serialize, Clone)]
struct MatchPayload {
    game: riven::models::spectator_v5::CurrentGameInfo,
    ranked: Vec<Vec<riven::models::league_v4::LeagueEntry>>,
    traits: Vec<Vec<String>>,
}

async fn get_champion_name(champion_id: i32) -> String {
    // This is a simplified mapping - in a real implementation, you'd fetch from Data Dragon
    match champion_id {
        1 => "Annie".to_string(),
        2 => "Olaf".to_string(),
        3 => "Galio".to_string(),
        4 => "Twisted Fate".to_string(),
        5 => "Xin Zhao".to_string(),
        6 => "Urgot".to_string(),
        7 => "LeBlanc".to_string(),
        8 => "Vladimir".to_string(),
        9 => "Fiddlesticks".to_string(),
        10 => "Kayle".to_string(),
        11 => "Master Yi".to_string(),
        12 => "Alistar".to_string(),
        13 => "Ryze".to_string(),
        14 => "Sion".to_string(),
        15 => "Sivir".to_string(),
        16 => "Soraka".to_string(),
        17 => "Teemo".to_string(),
        18 => "Tristana".to_string(),
        19 => "Warwick".to_string(),
        20 => "Nunu".to_string(),
        21 => "Miss Fortune".to_string(),
        22 => "Ashe".to_string(),
        23 => "Tryndamere".to_string(),
        24 => "Jax".to_string(),
        25 => "Morgana".to_string(),
        26 => "Zilean".to_string(),
        27 => "Singed".to_string(),
        28 => "Evelynn".to_string(),
        29 => "Twitch".to_string(),
        30 => "Karthus".to_string(),
        31 => "Cho'Gath".to_string(),
        32 => "Amumu".to_string(),
        33 => "Rammus".to_string(),
        34 => "Anivia".to_string(),
        35 => "Shaco".to_string(),
        36 => "Dr. Mundo".to_string(),
        37 => "Sona".to_string(),
        38 => "Kassadin".to_string(),
        39 => "Irelia".to_string(),
        40 => "Janna".to_string(),
        41 => "Gangplank".to_string(),
        42 => "Corki".to_string(),
        43 => "Karma".to_string(),
        44 => "Taric".to_string(),
        45 => "Veigar".to_string(),
        48 => "Trundle".to_string(),
        50 => "Swain".to_string(),
        51 => "Caitlyn".to_string(),
        53 => "Blitzcrank".to_string(),
        54 => "Malphite".to_string(),
        55 => "Katarina".to_string(),
        56 => "Nocturne".to_string(),
        57 => "Maokai".to_string(),
        58 => "Renekton".to_string(),
        59 => "Jarvan IV".to_string(),
        60 => "Elise".to_string(),
        61 => "Orianna".to_string(),
        62 => "Wukong".to_string(),
        63 => "Brand".to_string(),
        64 => "Lee Sin".to_string(),
        67 => "Vayne".to_string(),
        68 => "Rumble".to_string(),
        69 => "Cassiopeia".to_string(),
        72 => "Skarner".to_string(),
        74 => "Heimerdinger".to_string(),
        75 => "Nasus".to_string(),
        76 => "Nidalee".to_string(),
        77 => "Udyr".to_string(),
        78 => "Poppy".to_string(),
        79 => "Gragas".to_string(),
        80 => "Pantheon".to_string(),
        81 => "Ezreal".to_string(),
        82 => "Mordekaiser".to_string(),
        83 => "Yorick".to_string(),
        84 => "Akali".to_string(),
        85 => "Kennen".to_string(),
        86 => "Garen".to_string(),
        87 => "Leona".to_string(),
        88 => "Malzahar".to_string(),
        89 => "Talon".to_string(),
        90 => "Riven".to_string(),
        91 => "Kog'Maw".to_string(),
        92 => "Shen".to_string(),
        96 => "Kog'Maw".to_string(),
        98 => "Shen".to_string(),
        99 => "Lux".to_string(),
        101 => "Xerath".to_string(),
        102 => "Shyvana".to_string(),
        103 => "Ahri".to_string(),
        104 => "Graves".to_string(),
        105 => "Fizz".to_string(),
        106 => "Volibear".to_string(),
        107 => "Rengar".to_string(),
        110 => "Varus".to_string(),
        111 => "Nautilus".to_string(),
        112 => "Viktor".to_string(),
        113 => "Sejuani".to_string(),
        114 => "Fiora".to_string(),
        115 => "Ziggs".to_string(),
        117 => "Lulu".to_string(),
        119 => "Draven".to_string(),
        120 => "Hecarim".to_string(),
        121 => "Kha'Zix".to_string(),
        122 => "Darius".to_string(),
        126 => "Jayce".to_string(),
        127 => "Lissandra".to_string(),
        131 => "Diana".to_string(),
        133 => "Quinn".to_string(),
        134 => "Syndra".to_string(),
        136 => "Aurelion Sol".to_string(),
        141 => "Kayn".to_string(),
        142 => "Zoe".to_string(),
        143 => "Zyra".to_string(),
        145 => "Kai'Sa".to_string(),
        147 => "Seraphine".to_string(),
        150 => "Gnar".to_string(),
        154 => "Zac".to_string(),
        157 => "Yasuo".to_string(),
        161 => "Vel'Koz".to_string(),
        163 => "Taliyah".to_string(),
        164 => "Camille".to_string(),
        166 => "Akshan".to_string(),
        200 => "Bel'Veth".to_string(),
        201 => "Braum".to_string(),
        202 => "Jhin".to_string(),
        203 => "Kindred".to_string(),
        221 => "Zeri".to_string(),
        222 => "Jinx".to_string(),
        223 => "Tahm Kench".to_string(),
        234 => "Viego".to_string(),
        235 => "Senna".to_string(),
        236 => "Lucian".to_string(),
        238 => "Zed".to_string(),
        240 => "Kled".to_string(),
        245 => "Ekko".to_string(),
        246 => "Qiyana".to_string(),
        254 => "Vi".to_string(),
        266 => "Aatrox".to_string(),
        267 => "Nami".to_string(),
        268 => "Azir".to_string(),
        350 => "Yuumi".to_string(),
        360 => "Samira".to_string(),
        412 => "Thresh".to_string(),
        420 => "Illaoi".to_string(),
        421 => "Rek'Sai".to_string(),
        427 => "Ivern".to_string(),
        429 => "Kalista".to_string(),
        432 => "Bard".to_string(),
        516 => "Ornn".to_string(),
        517 => "Sylas".to_string(),
        518 => "Neeko".to_string(),
        523 => "Aphelios".to_string(),
        526 => "Rell".to_string(),
        555 => "Pyke".to_string(),
        711 => "Vex".to_string(),
        777 => "Yone".to_string(),
        875 => "Sett".to_string(),
        876 => "Lillia".to_string(),
        887 => "Gwen".to_string(),
        888 => "Renata Glasc".to_string(),
        895 => "Nilah".to_string(),
        897 => "K'Sante".to_string(),
        901 => "Smolder".to_string(),
        902 => "Milio".to_string(),
        910 => "Hwei".to_string(),
        950 => "Naafiri".to_string(),
        _ => format!("Champion {}", champion_id),
    }
}

/// Detect if player is currently in a live match with robust error handling
#[tauri::command]
pub async fn detect_live_match(
    summoner_name: String,
    region: String,
    app: AppHandle,
) -> Result<serde_json::Value, String> {
    // Check if we're in mock mode
    let api_mode = std::env::var("API_MODE").unwrap_or_else(|_| "real".to_string());
    
    if api_mode == "mock" {
        // Return mock data for development
        let result = serde_json::json!({
            "is_in_game": false,
            "status": "not_in_game",
            "confidence": 1.0,
            "detection_time": chrono::Utc::now().timestamp(),
            "game_info": null,
            "mock_mode": true
        });
        
        // Emit event to frontend
        app.emit("live-match-detected", &result).ok();
        return Ok(result);
    }

    // Add rate limiting - don't check more than once every 30 seconds per summoner
    use std::sync::{Mutex, LazyLock};
    use std::collections::HashMap;
    use std::time::Instant;
    
    static LAST_CHECKS: LazyLock<Mutex<HashMap<String, Instant>>> = LazyLock::new(|| Mutex::new(HashMap::new()));
    
    let rate_limit_key = format!("{}#{}", summoner_name, region);
    {
        let mut last_checks = LAST_CHECKS.lock().unwrap();
        if let Some(last_check) = last_checks.get(&rate_limit_key) {
            if last_check.elapsed() < std::time::Duration::from_secs(30) {
                let result = serde_json::json!({
                    "is_in_game": false,
                    "status": "rate_limited",
                    "confidence": 0.0,
                    "detection_time": chrono::Utc::now().timestamp(),
                    "game_info": null,
                    "message": "Rate limited - waiting before next check"
                });
                return Ok(result);
            }
        }
        last_checks.insert(rate_limit_key, Instant::now());
    }

    let state = APP_STATE
        .get()
        .ok_or("App state not initialized")?;
    
    // Parse game_name and tag_line from summoner_name (format: "GameName#TagLine")
    let (game_name, tag_line) = if let Some(hash_pos) = summoner_name.find('#') {
        let game_name = summoner_name[..hash_pos].to_string();
        let tag_line = summoner_name[hash_pos + 1..].to_string();
        (game_name, tag_line)
    } else {
        // If no # found, assume it's just the game name with default tag
        return Err("Invalid summoner name format. Expected 'GameName#TagLine'".to_string());
    };
    
    // First get account info
    let account = state.client
        .get_account_by_riot_id(&game_name, &tag_line, &region)
        .await
        .map_err(|e| format!("Failed to get account: {}", e))?;
    
    if let Some(account) = account {
        let summoner = state.client
            .get_summoner_by_puuid(&account.puuid, &region)
            .await
            .map_err(|e| format!("Failed to get summoner: {}", e))?;
        
        if let Some(summoner) = summoner {
            // Try to get active game with retry logic
            match detect_active_game_with_retry(&state.client, &summoner.puuid, &region, 3).await {
                Ok(Some(game_info)) => {
                    // Player is in a live match
                    let result = serde_json::json!({
                        "is_in_game": true,
                        "game_id": game_info.game_id,
                        "game_start_time": game_info.game_start_time,
                        "game_length": calculate_game_length(game_info.game_start_time),
                        "game_mode": format!("{:?}", game_info.game_mode),
                        "game_type": format!("{:?}", game_info.game_type),
                        "map_id": 11, // Default to Summoner's Rift
                        "participants": extract_participants_info(&game_info),
                        "detection_confidence": 1.0,
                        "detection_method": "Spectator API",
                        "last_updated": chrono::Utc::now().timestamp(),
                        "next_check_in_seconds": 30
                    });
                    
                    // Emit live match event
                    let _ = app.emit("live-match-detected", &result);
                    
                    Ok(result)
                }
                Ok(None) => {
                    // Not in game
                    Ok(serde_json::json!({
                        "is_in_game": false,
                        "detection_confidence": 0.9,
                        "detection_method": "Spectator API",
                        "last_updated": chrono::Utc::now().timestamp(),
                        "next_check_in_seconds": 60
                    }))
                }
                Err(e) => {
                    // API error - use fallback detection
                    let fallback_result = fallback_match_detection(&state.client, &account.puuid, &region).await;
                    
                    let result = serde_json::json!({
                        "is_in_game": fallback_result.0,
                        "detection_confidence": fallback_result.1,
                        "detection_method": "Fallback Detection",
                        "api_error": format!("{}", e),
                        "last_updated": chrono::Utc::now().timestamp(),
                        "next_check_in_seconds": 120
                    });
                    
                    Ok(result)
                }
            }
        } else {
            Err("Summoner not found".to_string())
        }
    } else {
        Err("Account not found".to_string())
    }
}

/// Start continuous live match monitoring
#[tauri::command]
pub async fn start_live_match_monitoring(
    summoner_name: String,
    region: String,
    app: AppHandle,
) -> Result<String, String> {
    // Check if we're in mock mode
    let api_mode = std::env::var("API_MODE").unwrap_or_else(|_| "real".to_string());
    
    if api_mode == "mock" {
        // In mock mode, just emit periodic mock updates without overwhelming the system
        let app_clone = app.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(120)); // Less frequent in mock mode
            
            loop {
                interval.tick().await;
                
                let mock_result = serde_json::json!({
                    "is_in_game": false,
                    "status": "not_in_game",
                    "confidence": 1.0,
                    "detection_time": chrono::Utc::now().timestamp(),
                    "mock_mode": true
                });
                
                let _ = app_clone.emit("match-status-update", &mock_result);
            }
        });
        
        return Ok("Mock monitoring started".to_string());
    }
    
    let app_clone = app.clone();
    let summoner_clone = summoner_name.clone();
    let region_clone = region.clone();
    
    // Spawn background task for continuous monitoring
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(30));
        
        loop {
            interval.tick().await;
            
            match detect_live_match(summoner_clone.clone(), region_clone.clone(), app_clone.clone()).await {
                Ok(result) => {
                    // Emit match status update
                    let _ = app_clone.emit("match-status-update", &result);
                    
                    // Adjust monitoring frequency based on game state
                    if let Some(is_in_game) = result.get("is_in_game").and_then(|v| v.as_bool()) {
                        if is_in_game {
                            // Check more frequently during active games
                            interval = tokio::time::interval(Duration::from_secs(15));
                        } else {
                            // Check less frequently when not in game
                            interval = tokio::time::interval(Duration::from_secs(60));
                        }
                    }
                }
                Err(e) => {
                    // Emit error event
                    let _ = app_clone.emit("match-detection-error", format!("Monitor error: {}", e));
                    
                    // Reduce frequency on errors
                    interval = tokio::time::interval(Duration::from_secs(120));
                }
            }
        }
    });
    
    Ok("Live match monitoring started".to_string())
}

/// Get enhanced match history with analytics data
#[tauri::command]
pub async fn get_enhanced_match_history(
    summoner_name: String,
    region: String,
    count: Option<i32>,
) -> Result<serde_json::Value, String> {
    let state = APP_STATE
        .get()
        .ok_or("App state not initialized")?;
    
    // Parse game_name and tag_line from summoner_name (format: "GameName#TagLine")
    let (game_name, tag_line) = if let Some(hash_pos) = summoner_name.find('#') {
        let game_name = summoner_name[..hash_pos].to_string();
        let tag_line = summoner_name[hash_pos + 1..].to_string();
        (game_name, tag_line)
    } else {
        // If no # found, assume it's just the game name with default tag
        return Err("Invalid summoner name format. Expected 'GameName#TagLine'".to_string());
    };
    
    let account = state.client
        .get_account_by_riot_id(&game_name, &tag_line, &region)
        .await
        .map_err(|e| format!("Failed to get account: {}", e))?;
    
    if let Some(account) = account {
        let match_count = count.unwrap_or(20);
        
        // Get match history with enhanced analytics
        let matches = get_match_history_with_enhanced_analytics(
            &state.client,
            &account.puuid,
            &region,
            match_count
        ).await?;
        
        let result = serde_json::json!({
            "matches": matches,
            "total_analyzed": matches.len(),
            "analytics_version": "v2.0",
            "last_updated": chrono::Utc::now().timestamp()
        });
        
        Ok(result)
    } else {
        Err("Account not found".to_string())
    }
}

// Helper functions

async fn detect_active_game_with_retry(
    client: &RiotClient,
    puuid: &str,
    region: &str,
    max_retries: u32,
) -> Result<Option<riven::models::spectator_v5::CurrentGameInfo>, riven::RiotApiError> {
    let mut attempts = 0;
    
    while attempts < max_retries {
        match client.get_active_game(puuid, region).await {
            Ok(result) => return Ok(result),
            Err(e) => {
                attempts += 1;
                if attempts >= max_retries {
                    return Err(e);
                }
                
                // Exponential backoff
                let delay = Duration::from_millis(500 * 2_u64.pow(attempts - 1));
                tokio::time::sleep(delay).await;
            }
        }
    }
    
    unreachable!()
}

fn calculate_game_length(game_start_time: i64) -> i64 {
    let current_time = chrono::Utc::now().timestamp_millis();
    (current_time - game_start_time) / 1000 // Convert to seconds
}

fn extract_participants_info(game_info: &riven::models::spectator_v5::CurrentGameInfo) -> Vec<serde_json::Value> {
    game_info.participants.iter().map(|participant| {
        serde_json::json!({
            "champion_id": format!("{:?}", participant.champion_id),                "summoner_name": "Summoner", // CurrentGameParticipant doesn't have summoner name
            "team_id": format!("{:?}", participant.team_id),
            "spell1_id": participant.spell1_id,
            "spell2_id": participant.spell2_id,
            "is_bot": participant.bot
        })
    }).collect()
}

async fn fallback_match_detection(
    _client: &RiotClient,
    _puuid: &str,
    _region: &str,
) -> (bool, f32) {
    // Fallback method 1: Check if recent match was very recent (might be ongoing)
    // This is a simplified fallback - in production would be more sophisticated
    
    // For now, return conservative estimates
    (false, 0.3) // Low confidence, assume not in game
}

async fn get_match_history_with_enhanced_analytics(
    client: &RiotClient,
    puuid: &str,
    region: &str,
    count: i32,
) -> Result<Vec<serde_json::Value>, String> {
    // Temporarily suppress unused parameter warnings
    let _ = client;
    let _ = puuid;
    let _ = region;
    // This would integrate with the analytics system
    // For now, return basic match data
    
    let mut matches = Vec::new();
    
    // Simplified implementation - would be expanded with full analytics
    for i in 0..count.min(5) { // Limit for now
        matches.push(serde_json::json!({
            "match_id": format!("NA1_{}_{}", chrono::Utc::now().timestamp(), i),
            "game_creation": chrono::Utc::now().timestamp_millis() - (i as i64 * 86400000), // Days ago
            "game_duration": 1800 + (i * 300), // Varying game lengths
            "analytics_calculated": false,
            "needs_processing": true
        }));
    }
    
    Ok(matches)
}

/// Get all champions data
#[tauri::command]
pub async fn get_all_champions() -> Result<Vec<serde_json::Value>, String> {
    // In a real implementation, this would fetch from Riot's Data Dragon API
    // For now, return mock data
    let champions = vec![
        serde_json::json!({
            "id": 266,
            "name": "Aatrox",
            "key": "Aatrox",
            "title": "the Darkin Blade",
            "roles": ["top"],
            "image": "/champions/aatrox.png",
            "tags": ["Fighter", "Tank"]
        }),
        serde_json::json!({
            "id": 103,
            "name": "Ahri",
            "key": "Ahri", 
            "title": "the Nine-Tailed Fox",
            "roles": ["middle"],
            "image": "/champions/ahri.png",
            "tags": ["Mage", "Assassin"]
        }),
        serde_json::json!({
            "id": 84,
            "name": "Akali",
            "key": "Akali",
            "title": "the Rogue Assassin", 
            "roles": ["middle", "top"],
            "image": "/champions/akali.png",
            "tags": ["Assassin"]
        }),
        serde_json::json!({
            "id": 12,
            "name": "Alistar",
            "key": "Alistar",
            "title": "the Minotaur",
            "roles": ["support"],
            "image": "/champions/alistar.png", 
            "tags": ["Tank", "Support"]
        }),
        serde_json::json!({
            "id": 32,
            "name": "Amumu",
            "key": "Amumu",
            "title": "the Sad Mummy",
            "roles": ["jungle"],
            "image": "/champions/amumu.png",
            "tags": ["Tank", "Mage"]
        })
    ];
    Ok(champions)
}

/// Get champion masteries for the current summoner
#[tauri::command]
pub async fn get_champion_masteries() -> Result<Vec<serde_json::Value>, String> {
    let state = APP_STATE.get().ok_or("App state not initialized")?;
    
    let puuid = {
        let state_guard = state.inner.lock().await;
        state_guard.puuid.clone()
    };
    
    let puuid = puuid.ok_or("No summoner set")?;
    
    // In a real implementation, this would fetch from Riot API
    // For now, return mock mastery data
    let masteries = vec![
        serde_json::json!({
            "championId": 266,
            "championLevel": 7,
            "championPoints": 234567,
            "lastPlayTime": chrono::Utc::now().timestamp_millis() - 86400000,
            "championPointsSinceLastLevel": 0,
            "championPointsUntilNextLevel": 0,
            "chestGranted": true,
            "tokensEarned": 0,
            "summonerId": puuid
        }),
        serde_json::json!({
            "championId": 103,
            "championLevel": 5,
            "championPoints": 45678,
            "lastPlayTime": chrono::Utc::now().timestamp_millis() - 172800000,
            "championPointsSinceLastLevel": 2345,
            "championPointsUntilNextLevel": 12345,
            "chestGranted": false,
            "tokensEarned": 1,
            "summonerId": puuid
        })
    ];
    
    Ok(masteries)
}

/// Get champion statistics for a specific champion
#[tauri::command]  
pub async fn get_champion_stats(champion_id: i32) -> Result<serde_json::Value, String> {
    // In a real implementation, this would aggregate match history data
    // For now, return mock stats
    let stats = serde_json::json!({
        "championId": champion_id,
        "championName": "Aatrox",
        "gamesPlayed": 47,
        "wins": 29,
        "losses": 18,
        "winRate": 61.7,
        "averageKda": {
            "kills": 8.2,
            "deaths": 5.1,
            "assists": 6.8,
            "kda": 2.94
        },
        "averageStats": {
            "cs": 156.3,
            "gold": 12450,
            "damage": 23890,
            "visionScore": 18.2,
            "gameLength": 28.5
        },
        "recentPerformance": [],
        "bestPerformance": {},
        "roles": {
            "top": {
                "gamesPlayed": 43,
                "winRate": 65.1,
                "averageKda": {
                    "kills": 8.5,
                    "deaths": 4.9,
                    "assists": 6.2,
                    "kda": 3.0
                }
            },
            "middle": {
                "gamesPlayed": 4,
                "winRate": 25.0,
                "averageKda": {
                    "kills": 6.8,
                    "deaths": 7.2,
                    "assists": 9.5,
                    "kda": 2.26
                }
            }
        }
    });
    
    Ok(stats)
}


