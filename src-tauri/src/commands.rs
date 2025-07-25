use std::{sync::Arc, time::Duration};

use once_cell::sync::OnceCell;
use serde::Serialize;
use std::collections::HashMap;
use reqwest::Client;
use tauri::{AppHandle, Emitter};
use crate::riot_client::RiotClient;
use riven::consts::QueueType;
use chrono;

// Define RetryError type that we're using
#[derive(Debug)]
pub struct RetryError {
    pub message: String,
}

impl std::fmt::Display for RetryError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for RetryError {}

impl From<RetryError> for ApiError {
    fn from(error: RetryError) -> Self {
        ApiError::Unknown(error.message)
    }
}

impl From<crate::retry::RetryError> for ApiError {
    fn from(error: crate::retry::RetryError) -> Self {
        ApiError::Unknown(format!("Retry failed: {}", error))
    }
}

pub static APP_STATE: OnceCell<Arc<State>> = OnceCell::new();

// Add error types for better error handling
#[derive(Debug, Serialize)]
pub enum ApiError {
    ApiKeyInvalid,
    ApiKeyMissing,
    RateLimited,
    NetworkError,
    ServerError,
    NotFound,
    Unknown(String),
}

impl From<riven::RiotApiError> for ApiError {
    fn from(error: riven::RiotApiError) -> Self {
        match error.status_code() {
            Some(status) => {
                match status.as_u16() {
                    401 | 403 => ApiError::ApiKeyInvalid,
                    404 => ApiError::NotFound,
                    429 => ApiError::RateLimited,
                    500..=599 => ApiError::ServerError,
                    _ => ApiError::Unknown(format!("HTTP {}", status))
                }
            }
            None => {
                // Check if it's a network error
                if error.to_string().contains("timeout") || error.to_string().contains("connect") {
                    ApiError::NetworkError
                } else {
                    ApiError::Unknown(error.to_string())
                }
            }
        }
    }
}

// Mock data for fallback when API is unavailable
fn get_mock_dashboard_data() -> DashboardStats {
    DashboardStats {
        champions: vec![
            ChampionStat {
                id: 266,
                name: "Aatrox".to_string(),
                level: 7,
                points: 234567,
            },
            ChampionStat {
                id: 103,
                name: "Ahri".to_string(),
                level: 5,
                points: 87234,
            },
            ChampionStat {
                id: 84,
                name: "Akali".to_string(),
                level: 4,
                points: 45123,
            }
        ],
        rank: Some(RankInfo {
            tier: "Gold".to_string(),
            rank: "II".to_string(),
            lp: 67,
            wins: 23,
            losses: 17,
            winrate: 57.5,
        }),
        performance: Some(PerformanceData {
            average_kda: KDAStats {
                kills: 8.2,
                deaths: 5.1,
                assists: 7.3,
            },
            win_rate: 57.5,
            total_lp_gain: 150,
            games_analyzed: 40,
            recent_form: "hot".to_string(),
            playstyle_traits: vec!["Aggressive Player".to_string(), "Team Player".to_string()],
        }),
    }
}

fn get_mock_recent_games() -> Vec<NamedGameSummary> {
    vec![
        NamedGameSummary {
            champion_id: 266,
            champion_name: "Aatrox".to_string(),
            win: true,
            kills: 12,
            deaths: 3,
            assists: 8,
            duration: 1847,
        },
        NamedGameSummary {
            champion_id: 103,
            champion_name: "Ahri".to_string(),
            win: false,
            kills: 6,
            deaths: 7,
            assists: 12,
            duration: 2156,
        },
        NamedGameSummary {
            champion_id: 84,
            champion_name: "Akali".to_string(),
            win: true,
            kills: 15,
            deaths: 4,
            assists: 6,
            duration: 1634,
        }
    ]
}

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
    use log::{info, warn};
    info!("Rust setting summoner: {}#{} - {}", game_name, tag_line, region);
    let state = APP_STATE.get().ok_or("not initialized")?.clone();
    info!("State retrieved: {:?}", state);
    
    // Check if we should use mock mode
    let should_use_mock = std::env::var("API_MODE").unwrap_or_default() == "mock" ||
                         std::env::var("RIOT_API_KEY").unwrap_or_default() == "DEMO_KEY";

    if should_use_mock {
        warn!("Using mock mode for summoner setting");
        let mut guard = state.inner.lock().await;
        guard.name = Some(format!("{}#{}", game_name, tag_line));
        guard.region = Some(region);
        guard.puuid = Some("mock_puuid_12345".to_string());
        return Ok(());
    }
    
    // Try with retry mechanism first
    let account = match state
        .client
        .get_account_by_riot_id_with_retry(&game_name, &tag_line, &region)
        .await
    {
        Ok(Some(account)) => account,
        Ok(None) => return Err("Account not found".to_string()),
        Err(retry_err) => {
            let api_error = ApiError::from(retry_err);
            match api_error {
                ApiError::ApiKeyInvalid | ApiError::ApiKeyMissing => {
                    return Err("Invalid API key. Please check your Riot API key configuration.".to_string());
                }
                ApiError::NotFound => {
                    return Err("Account not found. Please check the summoner name and tag.".to_string());
                }
                ApiError::RateLimited => {
                    return Err("Rate limited by Riot API. Please try again in a few minutes.".to_string());
                }
                ApiError::NetworkError => {
                    return Err("Network error. Please check your internet connection.".to_string());
                }
                _ => {
                    warn!("Retry mechanism failed: {:?}", api_error);
                    // Fallback to single attempt for better error messages
                    match state
                        .client
                        .get_account_by_riot_id(&game_name, &tag_line, &region)
                        .await
                    {
                        Ok(Some(account)) => account,
                        Ok(None) => return Err("Account not found".to_string()),
                        Err(e) => return Err(format!("Failed to get account: {:?}", e)),
                    }
                }
            }
        }
    };
    
    // Verify summoner exists
    match state
        .client
        .get_summoner_by_puuid_with_retry(&account.puuid, &region)
        .await
    {
        Ok(Some(_)) => {},
        Ok(None) => return Err("Summoner not found".to_string()),
        Err(retry_err) => {
            let api_error = ApiError::from(retry_err);
            match api_error {
                ApiError::ApiKeyInvalid | ApiError::ApiKeyMissing => {
                    return Err("Invalid API key during summoner verification.".to_string());
                }
                _ => {
                    warn!("Retry mechanism failed for summoner lookup: {:?}", api_error);
                    // Fallback to single attempt
                    let _ = state
                        .client
                        .get_summoner_by_puuid(&account.puuid, &region)
                        .await
                        .map_err(|e| format!("Failed to get summoner: {:?}", e))?;
                }
            }
        }
    }
    
    let mut guard = state.inner.lock().await;
    guard.name = Some(format!("{}#{}", game_name, tag_line));
    guard.region = Some(region);
    guard.puuid = Some(account.puuid);
    Ok(())
}

#[tauri::command]
pub async fn refresh_dashboard() -> Result<serde_json::Value, String> {
    use log::{info, error, warn};

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

    // Check if we should use mock data (invalid API key, demo mode, etc.)
    let should_use_mock = std::env::var("API_MODE").unwrap_or_default() == "mock" ||
                         std::env::var("RIOT_API_KEY").unwrap_or_default() == "DEMO_KEY";

    if should_use_mock {
        warn!("Using mock data for dashboard (demo mode or invalid API key)");
        let mock_stats = get_mock_dashboard_data();
        return Ok(serde_json::to_value(mock_stats).unwrap());
    }

    info!("Fetching champion masteries...");
    let masteries = match state
        .client
        .get_champion_masteries_with_retry(&puuid, &region)
        .await
    {
        Ok(masteries) => masteries,
        Err(retry_err) => {
            let api_error = ApiError::from(retry_err);
            match api_error {
                ApiError::ApiKeyInvalid | ApiError::ApiKeyMissing => {
                    warn!("API key invalid, falling back to mock data");
                    let mock_stats = get_mock_dashboard_data();
                    return Ok(serde_json::to_value(mock_stats).unwrap());
                }
                _ => {
                    error!("Failed to get champion masteries after retries: {:?}", api_error);
                    // Try fallback
                    state
                        .client
                        .get_champion_masteries(&puuid, &region)
                        .await
                        .map_err(|e| {
                            let fallback_msg = format!("Failed to get champion masteries (fallback): {:?}", e);
                            error!("{}", fallback_msg);
                            fallback_msg
                        })?
                }
            }
        }
    };
    info!("Got {} champion masteries.", masteries.len());

    info!("Fetching ranked stats...");
    let ranked_entries = match state
        .client
        .get_ranked_stats_with_retry(&puuid, &region)
        .await
    {
        Ok(ranked_entries) => ranked_entries,
        Err(retry_err) => {
            let api_error = ApiError::from(retry_err);
            match api_error {
                ApiError::ApiKeyInvalid | ApiError::ApiKeyMissing => {
                    warn!("API key invalid for ranked stats, using mock data");
                    let mock_stats = get_mock_dashboard_data();
                    return Ok(serde_json::to_value(mock_stats).unwrap());
                }
                _ => {
                    error!("Failed to get ranked stats after retries: {:?}", api_error);
                    // Try fallback
                    state
                        .client
                        .get_ranked_stats(&puuid, &region)
                        .await
                        .map_err(|e| {
                            let fallback_msg = format!("Failed to get ranked stats (fallback): {:?}", e);
                            error!("{}", fallback_msg);
                            fallback_msg
                        })?
                }
            }
        }
    };
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
    
    // Check if we should use mock data
    let should_use_mock = std::env::var("API_MODE").unwrap_or_default() == "mock" ||
                         std::env::var("RIOT_API_KEY").unwrap_or_default() == "DEMO_KEY";

    if should_use_mock {
        let mock_games = get_mock_recent_games();
        return Ok(serde_json::to_value(mock_games).unwrap());
    }
    
    let games = match state
        .client
        .get_recent_matches_with_retry(&puuid, &region, count.unwrap_or(10) as usize)
        .await
    {
        Ok(games) => games,
        Err(retry_err) => {
            let api_error = ApiError::from(retry_err);
            match api_error {
                ApiError::ApiKeyInvalid | ApiError::ApiKeyMissing => {
                    let mock_games = get_mock_recent_games();
                    return Ok(serde_json::to_value(mock_games).unwrap());
                }
                _ => {
                    // Try fallback
                    state
                        .client
                        .get_recent_matches(&puuid, &region, count.unwrap_or(10) as usize)
                        .await
                        .map_err(|e| format!("Failed to get recent matches: {:?}", e))?
                }
            }
        }
    };
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
    let games = match client
        .get_recent_matches_with_retry(puuid, region, 10)
        .await
    {
        Ok(games) => games,
        Err(_retry_err) => {
            // Try fallback
            client
                .get_recent_matches(puuid, region, 10)
                .await
                .map_err(|e| format!("Failed to get recent matches: {:?}", e))?
        }
    };

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
    use log::{info, warn, error};
    let mut consecutive_failures = 0;
    let max_consecutive_failures = 10;
    
    loop {
        let (puuid_opt, region_opt, _in_game) = {
            let t = state.inner.lock().await;
            (t.puuid.clone(), t.region.clone(), t.in_game)
        };

        if let (Some(puuid), Some(region_str)) = (puuid_opt, region_opt.as_deref()) {
            // Try to get active game with retry mechanism
            match state.client.get_active_game_with_retry(&puuid, region_str).await {
                Ok(Some(game)) => {
                    consecutive_failures = 0; // Reset failure counter on success
                    let mut t = state.inner.lock().await;
                    if !t.in_game {
                        t.in_game = true;

                        let _ = app.emit("gameStarted", Some(game.clone()));

                        // Fetch additional match data with retry logic
                        let ranked_futs = game
                            .participants
                            .iter()
                            .map(|p| async {
                                match state
                                    .client
                                    .get_ranked_stats_with_retry(p.puuid.as_deref().unwrap_or(""), region_str)
                                    .await
                                {
                                    Ok(ranked) => ranked,
                                    Err(retry_err) => {
                                        warn!("Failed to get ranked stats for participant after retries: {}", retry_err);
                                        // Fallback to single attempt
                                        state
                                            .client
                                            .get_ranked_stats(p.puuid.as_deref().unwrap_or(""), region_str)
                                            .await
                                            .unwrap_or_default()
                                    }
                                }
                            });
                        let ranked: Vec<_> = futures::future::join_all(ranked_futs)
                            .await;

                        let trait_futs = game
                            .participants
                            .iter()
                            .map(|p| async {
                                match state
                                    .client
                                    .calculate_traits(p.puuid.as_deref().unwrap_or(""), region_str)
                                    .await
                                {
                                    Ok(traits) => traits,
                                    Err(err) => {
                                        warn!("Failed to calculate traits for participant: {:?}", err);
                                        Vec::new()
                                    }
                                }
                            });
                        let traits: Vec<Vec<String>> = futures::future::join_all(trait_futs)
                            .await;

                        let payload = MatchPayload {
                            game,
                            ranked,
                            traits,
                        };

                        let _ = app.emit("matchData", Some(payload));
                    }
                }

                Ok(None) => {
                    consecutive_failures = 0; // Reset failure counter on successful API call
                    let mut t = state.inner.lock().await;
                    if t.in_game {
                        t.in_game = false;
                        let _ = app.emit("gameEnded", Some(()));
                    } else {
                        let _ = app.emit("noGame", Some(()));
                    }
                }

                Err(retry_err) => {
                    consecutive_failures += 1;
                    error!("Failed to check active game after retries: {} (consecutive failures: {})", 
                           retry_err, consecutive_failures);
                    
                    // Emit connection error event to frontend
                    let _ = app.emit("connectionError", Some(serde_json::json!({
                        "error": retry_err.to_string(),
                        "consecutive_failures": consecutive_failures,
                        "is_retryable": retry_err.is_retryable
                    })));
                    
                    // If we have too many consecutive failures, increase polling interval
                    if consecutive_failures >= max_consecutive_failures {
                        warn!("Too many consecutive failures, extending polling interval");
                        tokio::time::sleep(Duration::from_secs(30)).await;
                        continue;
                    }
                    
                    // For network issues, extend the polling interval gradually
                    let extended_delay = match retry_err.error_type {
                        crate::retry::ConnectionErrorType::Network => {
                            Duration::from_secs(20 + consecutive_failures * 5)
                        }
                        crate::retry::ConnectionErrorType::ServerError => {
                            Duration::from_secs(15 + consecutive_failures * 3)
                        }
                        _ => Duration::from_secs(10)
                    };
                    
                    info!("Waiting {:?} before next poll attempt due to error", extended_delay);
                    tokio::time::sleep(extended_delay).await;
                    continue;
                }
            }
        }

        // Normal polling interval
        tokio::time::sleep(Duration::from_secs(10)).await;
    }
}

#[derive(Serialize, Clone)]
struct MatchPayload {
    game: riven::models::spectator_v5::CurrentGameInfo,
    ranked: Vec<Vec<riven::models::league_v4::LeagueEntry>>,
    traits: Vec<Vec<String>>,
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

/// Get all champions data (Updated for July 2025)
#[tauri::command]
pub async fn get_all_champions() -> Result<Vec<serde_json::Value>, String> {
    // Comprehensive champion list as of July 2025
    let champions = vec![
        serde_json::json!({"id": 266, "name": "Aatrox", "key": "Aatrox", "title": "the Darkin Blade", "roles": ["top"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 103, "name": "Ahri", "key": "Ahri", "title": "the Nine-Tailed Fox", "roles": ["middle"], "tags": ["Mage", "Assassin"]}),
        serde_json::json!({"id": 84, "name": "Akali", "key": "Akali", "title": "the Rogue Assassin", "roles": ["middle", "top"], "tags": ["Assassin"]}),
        serde_json::json!({"id": 166, "name": "Akshan", "key": "Akshan", "title": "the Rogue Sentinel", "roles": ["middle", "top"], "tags": ["Marksman", "Assassin"]}),
        serde_json::json!({"id": 12, "name": "Alistar", "key": "Alistar", "title": "the Minotaur", "roles": ["support"], "tags": ["Tank", "Support"]}),
        serde_json::json!({"id": 32, "name": "Amumu", "key": "Amumu", "title": "the Sad Mummy", "roles": ["jungle"], "tags": ["Tank", "Mage"]}),
        serde_json::json!({"id": 34, "name": "Anivia", "key": "Anivia", "title": "the Cryophoenix", "roles": ["middle"], "tags": ["Mage", "Support"]}),
        serde_json::json!({"id": 1, "name": "Annie", "key": "Annie", "title": "the Dark Child", "roles": ["middle"], "tags": ["Mage"]}),
        serde_json::json!({"id": 523, "name": "Aphelios", "key": "Aphelios", "title": "the Weapon of the Faithful", "roles": ["bottom"], "tags": ["Marksman"]}),
        serde_json::json!({"id": 22, "name": "Ashe", "key": "Ashe", "title": "the Frost Archer", "roles": ["bottom"], "tags": ["Marksman", "Support"]}),
        serde_json::json!({"id": 136, "name": "Aurelion Sol", "key": "AurelionSol", "title": "the Star Forger", "roles": ["middle"], "tags": ["Mage"]}),
        serde_json::json!({"id": 893, "name": "Aurora", "key": "Aurora", "title": "the Witch Between Worlds", "roles": ["middle", "top"], "tags": ["Mage", "Assassin"]}),
        serde_json::json!({"id": 268, "name": "Azir", "key": "Azir", "title": "the Emperor of the Sands", "roles": ["middle"], "tags": ["Mage", "Marksman"]}),
        serde_json::json!({"id": 432, "name": "Bard", "key": "Bard", "title": "the Wandering Caretaker", "roles": ["support"], "tags": ["Support", "Mage"]}),
        serde_json::json!({"id": 200, "name": "Bel'Veth", "key": "Belveth", "title": "the Empress of the Void", "roles": ["jungle"], "tags": ["Fighter"]}),
        serde_json::json!({"id": 53, "name": "Blitzcrank", "key": "Blitzcrank", "title": "the Great Steam Golem", "roles": ["support"], "tags": ["Tank", "Fighter"]}),
        serde_json::json!({"id": 63, "name": "Brand", "key": "Brand", "title": "the Burning Vengeance", "roles": ["support", "middle"], "tags": ["Mage"]}),
        serde_json::json!({"id": 201, "name": "Braum", "key": "Braum", "title": "the Heart of the Freljord", "roles": ["support"], "tags": ["Support", "Tank"]}),
        serde_json::json!({"id": 895, "name": "Briar", "key": "Briar", "title": "the Restrained Hunger", "roles": ["jungle"], "tags": ["Fighter", "Assassin"]}),
        serde_json::json!({"id": 51, "name": "Caitlyn", "key": "Caitlyn", "title": "the Sheriff of Piltover", "roles": ["bottom"], "tags": ["Marksman"]}),
        serde_json::json!({"id": 164, "name": "Camille", "key": "Camille", "title": "the Steel Shadow", "roles": ["top"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 69, "name": "Cassiopeia", "key": "Cassiopeia", "title": "the Serpent's Embrace", "roles": ["middle"], "tags": ["Mage"]}),
        serde_json::json!({"id": 31, "name": "Cho'Gath", "key": "Chogath", "title": "the Terror of the Void", "roles": ["top"], "tags": ["Tank", "Mage"]}),
        serde_json::json!({"id": 42, "name": "Corki", "key": "Corki", "title": "the Daring Bombardier", "roles": ["middle"], "tags": ["Marksman"]}),
        serde_json::json!({"id": 122, "name": "Darius", "key": "Darius", "title": "the Hand of Noxus", "roles": ["top"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 131, "name": "Diana", "key": "Diana", "title": "Scorn of the Moon", "roles": ["jungle", "middle"], "tags": ["Fighter", "Mage"]}),
        serde_json::json!({"id": 119, "name": "Draven", "key": "Draven", "title": "the Glorious Executioner", "roles": ["bottom"], "tags": ["Marksman"]}),
        serde_json::json!({"id": 36, "name": "Dr. Mundo", "key": "DrMundo", "title": "the Madman of Zaun", "roles": ["top", "jungle"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 245, "name": "Ekko", "key": "Ekko", "title": "the Boy Who Shattered Time", "roles": ["jungle", "middle"], "tags": ["Assassin", "Fighter"]}),
        serde_json::json!({"id": 60, "name": "Elise", "key": "Elise", "title": "the Spider Queen", "roles": ["jungle"], "tags": ["Mage", "Fighter"]}),
        serde_json::json!({"id": 28, "name": "Evelynn", "key": "Evelynn", "title": "Agony's Embrace", "roles": ["jungle"], "tags": ["Assassin", "Mage"]}),
        serde_json::json!({"id": 81, "name": "Ezreal", "key": "Ezreal", "title": "the Prodigal Explorer", "roles": ["bottom"], "tags": ["Marksman", "Mage"]}),
        serde_json::json!({"id": 9, "name": "Fiddlesticks", "key": "Fiddlesticks", "title": "the Ancient Fear", "roles": ["jungle"], "tags": ["Mage", "Support"]}),
        serde_json::json!({"id": 114, "name": "Fiora", "key": "Fiora", "title": "the Grand Duelist", "roles": ["top"], "tags": ["Fighter", "Assassin"]}),
        serde_json::json!({"id": 105, "name": "Fizz", "key": "Fizz", "title": "the Tidal Trickster", "roles": ["middle"], "tags": ["Assassin", "Fighter"]}),
        serde_json::json!({"id": 3, "name": "Galio", "key": "Galio", "title": "the Colossus", "roles": ["middle", "support"], "tags": ["Tank", "Mage"]}),
        serde_json::json!({"id": 41, "name": "Gangplank", "key": "Gangplank", "title": "the Saltwater Scourge", "roles": ["top"], "tags": ["Fighter"]}),
        serde_json::json!({"id": 86, "name": "Garen", "key": "Garen", "title": "The Might of Demacia", "roles": ["top"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 150, "name": "Gnar", "key": "Gnar", "title": "the Missing Link", "roles": ["top"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 79, "name": "Gragas", "key": "Gragas", "title": "the Rabble Rouser", "roles": ["jungle"], "tags": ["Fighter", "Mage"]}),
        serde_json::json!({"id": 104, "name": "Graves", "key": "Graves", "title": "the Outlaw", "roles": ["jungle"], "tags": ["Marksman"]}),
        serde_json::json!({"id": 887, "name": "Gwen", "key": "Gwen", "title": "The Hallowed Seamstress", "roles": ["top"], "tags": ["Fighter", "Assassin"]}),
        serde_json::json!({"id": 120, "name": "Hecarim", "key": "Hecarim", "title": "the Shadow of War", "roles": ["jungle"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 74, "name": "Heimerdinger", "key": "Heimerdinger", "title": "the Revered Inventor", "roles": ["middle", "support"], "tags": ["Mage", "Support"]}),
        serde_json::json!({"id": 910, "name": "Hwei", "key": "Hwei", "title": "the Visionary", "roles": ["middle", "support"], "tags": ["Mage"]}),
        serde_json::json!({"id": 420, "name": "Illaoi", "key": "Illaoi", "title": "the Kraken Priestess", "roles": ["top"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 39, "name": "Irelia", "key": "Irelia", "title": "the Blade Dancer", "roles": ["top", "middle"], "tags": ["Fighter", "Assassin"]}),
        serde_json::json!({"id": 427, "name": "Ivern", "key": "Ivern", "title": "the Green Father", "roles": ["jungle"], "tags": ["Support", "Mage"]}),
        serde_json::json!({"id": 40, "name": "Janna", "key": "Janna", "title": "the Storm's Fury", "roles": ["support"], "tags": ["Support", "Mage"]}),
        serde_json::json!({"id": 59, "name": "Jarvan IV", "key": "JarvanIV", "title": "the Exemplar of Demacia", "roles": ["jungle"], "tags": ["Tank", "Fighter"]}),
        serde_json::json!({"id": 24, "name": "Jax", "key": "Jax", "title": "Grandmaster at Arms", "roles": ["top", "jungle"], "tags": ["Fighter", "Assassin"]}),
        serde_json::json!({"id": 126, "name": "Jayce", "key": "Jayce", "title": "the Defender of Tomorrow", "roles": ["top", "middle"], "tags": ["Fighter", "Marksman"]}),
        serde_json::json!({"id": 202, "name": "Jhin", "key": "Jhin", "title": "the Virtuoso", "roles": ["bottom"], "tags": ["Marksman"]}),
        serde_json::json!({"id": 222, "name": "Jinx", "key": "Jinx", "title": "the Loose Cannon", "roles": ["bottom"], "tags": ["Marksman"]}),
        serde_json::json!({"id": 145, "name": "Kai'Sa", "key": "Kaisa", "title": "Daughter of the Void", "roles": ["bottom"], "tags": ["Marksman"]}),
        serde_json::json!({"id": 429, "name": "Kalista", "key": "Kalista", "title": "the Spear of Vengeance", "roles": ["bottom"], "tags": ["Marksman"]}),
        serde_json::json!({"id": 43, "name": "Karma", "key": "Karma", "title": "the Enlightened One", "roles": ["support", "middle"], "tags": ["Mage", "Support"]}),
        serde_json::json!({"id": 30, "name": "Karthus", "key": "Karthus", "title": "the Deathsinger", "roles": ["jungle"], "tags": ["Mage"]}),
        serde_json::json!({"id": 38, "name": "Kassadin", "key": "Kassadin", "title": "the Void Walker", "roles": ["middle"], "tags": ["Assassin", "Mage"]}),
        serde_json::json!({"id": 55, "name": "Katarina", "key": "Katarina", "title": "the Sinister Blade", "roles": ["middle"], "tags": ["Assassin", "Mage"]}),
        serde_json::json!({"id": 10, "name": "Kayle", "key": "Kayle", "title": "the Righteous", "roles": ["top"], "tags": ["Fighter", "Support"]}),
        serde_json::json!({"id": 141, "name": "Kayn", "key": "Kayn", "title": "the Shadow Reaper", "roles": ["jungle"], "tags": ["Fighter", "Assassin"]}),
        serde_json::json!({"id": 85, "name": "Kennen", "key": "Kennen", "title": "the Heart of the Tempest", "roles": ["top"], "tags": ["Mage", "Marksman"]}),
        serde_json::json!({"id": 121, "name": "Kha'Zix", "key": "Khazix", "title": "the Voidreaver", "roles": ["jungle"], "tags": ["Assassin"]}),
        serde_json::json!({"id": 203, "name": "Kindred", "key": "Kindred", "title": "The Eternal Hunters", "roles": ["jungle"], "tags": ["Marksman"]}),
        serde_json::json!({"id": 240, "name": "Kled", "key": "Kled", "title": "the Cantankerous Cavalier", "roles": ["top"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 96, "name": "Kog'Maw", "key": "KogMaw", "title": "the Mouth of the Abyss", "roles": ["bottom"], "tags": ["Marksman", "Mage"]}),
        serde_json::json!({"id": 897, "name": "K'Sante", "key": "KSante", "title": "the Pride of Nazumah", "roles": ["top"], "tags": ["Tank", "Fighter"]}),
        serde_json::json!({"id": 7, "name": "LeBlanc", "key": "Leblanc", "title": "the Deceiver", "roles": ["middle"], "tags": ["Assassin", "Mage"]}),
        serde_json::json!({"id": 64, "name": "Lee Sin", "key": "LeeSin", "title": "the Blind Monk", "roles": ["jungle"], "tags": ["Fighter", "Assassin"]}),
        serde_json::json!({"id": 89, "name": "Leona", "key": "Leona", "title": "the Radiant Dawn", "roles": ["support"], "tags": ["Tank", "Support"]}),
        serde_json::json!({"id": 876, "name": "Lillia", "key": "Lillia", "title": "the Bashful Bloom", "roles": ["jungle"], "tags": ["Fighter", "Mage"]}),
        serde_json::json!({"id": 127, "name": "Lissandra", "key": "Lissandra", "title": "the Ice Witch", "roles": ["middle"], "tags": ["Mage"]}),
        serde_json::json!({"id": 236, "name": "Lucian", "key": "Lucian", "title": "the Purifier", "roles": ["bottom"], "tags": ["Marksman"]}),
        serde_json::json!({"id": 117, "name": "Lulu", "key": "Lulu", "title": "the Fae Sorceress", "roles": ["support"], "tags": ["Support", "Mage"]}),
        serde_json::json!({"id": 99, "name": "Lux", "key": "Lux", "title": "the Lady of Luminosity", "roles": ["support", "middle"], "tags": ["Mage", "Support"]}),
        serde_json::json!({"id": 54, "name": "Malphite", "key": "Malphite", "title": "Shard of the Monolith", "roles": ["top"], "tags": ["Tank", "Fighter"]}),
        serde_json::json!({"id": 90, "name": "Malzahar", "key": "Malzahar", "title": "the Prophet of the Void", "roles": ["middle"], "tags": ["Mage", "Assassin"]}),
        serde_json::json!({"id": 57, "name": "Maokai", "key": "Maokai", "title": "the Twisted Treant", "roles": ["support", "jungle"], "tags": ["Tank", "Mage"]}),
        serde_json::json!({"id": 11, "name": "Master Yi", "key": "MasterYi", "title": "the Wuju Bladesman", "roles": ["jungle"], "tags": ["Assassin", "Fighter"]}),
        serde_json::json!({"id": 902, "name": "Milio", "key": "Milio", "title": "the Gentle Flame", "roles": ["support"], "tags": ["Support"]}),
        serde_json::json!({"id": 21, "name": "Miss Fortune", "key": "MissFortune", "title": "the Bounty Hunter", "roles": ["bottom"], "tags": ["Marksman"]}),
        serde_json::json!({"id": 62, "name": "Wukong", "key": "MonkeyKing", "title": "the Monkey King", "roles": ["top", "jungle"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 82, "name": "Mordekaiser", "key": "Mordekaiser", "title": "the Iron Revenant", "roles": ["top"], "tags": ["Fighter"]}),
        serde_json::json!({"id": 25, "name": "Morgana", "key": "Morgana", "title": "the Fallen", "roles": ["support"], "tags": ["Mage", "Support"]}),
        serde_json::json!({"id": 267, "name": "Nami", "key": "Nami", "title": "the Tidecaller", "roles": ["support"], "tags": ["Support", "Mage"]}),
        serde_json::json!({"id": 75, "name": "Nasus", "key": "Nasus", "title": "the Curator of the Sands", "roles": ["top"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 111, "name": "Nautilus", "key": "Nautilus", "title": "the Titan of the Depths", "roles": ["support"], "tags": ["Tank", "Fighter"]}),
        serde_json::json!({"id": 518, "name": "Neeko", "key": "Neeko", "title": "the Curious Chameleon", "roles": ["middle", "support"], "tags": ["Mage", "Support"]}),
        serde_json::json!({"id": 76, "name": "Nidalee", "key": "Nidalee", "title": "the Bestial Huntress", "roles": ["jungle"], "tags": ["Assassin", "Mage"]}),
        serde_json::json!({"id": 895, "name": "Nilah", "key": "Nilah", "title": "the Joy Unbound", "roles": ["bottom"], "tags": ["Fighter", "Assassin"]}),
        serde_json::json!({"id": 56, "name": "Nocturne", "key": "Nocturne", "title": "the Eternal Nightmare", "roles": ["jungle"], "tags": ["Assassin", "Fighter"]}),
        serde_json::json!({"id": 20, "name": "Nunu & Willump", "key": "Nunu", "title": "the Boy and His Yeti", "roles": ["jungle"], "tags": ["Tank", "Fighter"]}),
        serde_json::json!({"id": 2, "name": "Olaf", "key": "Olaf", "title": "the Berserker", "roles": ["top", "jungle"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 61, "name": "Orianna", "key": "Orianna", "title": "the Lady of Clockwork", "roles": ["middle"], "tags": ["Mage", "Support"]}),
        serde_json::json!({"id": 516, "name": "Ornn", "key": "Ornn", "title": "The Fire Beneath the Mountain", "roles": ["top"], "tags": ["Tank", "Fighter"]}),
        serde_json::json!({"id": 80, "name": "Pantheon", "key": "Pantheon", "title": "the Unbreakable Spear", "roles": ["middle", "support"], "tags": ["Fighter", "Assassin"]}),
        serde_json::json!({"id": 78, "name": "Poppy", "key": "Poppy", "title": "Keeper of the Hammer", "roles": ["jungle", "top"], "tags": ["Tank", "Fighter"]}),
        serde_json::json!({"id": 555, "name": "Pyke", "key": "Pyke", "title": "the Bloodharbor Ripper", "roles": ["support"], "tags": ["Support", "Assassin"]}),
        serde_json::json!({"id": 246, "name": "Qiyana", "key": "Qiyana", "title": "Empress of the Elements", "roles": ["middle"], "tags": ["Assassin", "Fighter"]}),
        serde_json::json!({"id": 133, "name": "Quinn", "key": "Quinn", "title": "Demacia's Wings", "roles": ["top"], "tags": ["Marksman", "Assassin"]}),
        serde_json::json!({"id": 497, "name": "Rakan", "key": "Rakan", "title": "The Charmer", "roles": ["support"], "tags": ["Support"]}),
        serde_json::json!({"id": 33, "name": "Rammus", "key": "Rammus", "title": "the Armordillo", "roles": ["jungle"], "tags": ["Tank", "Fighter"]}),
        serde_json::json!({"id": 421, "name": "Rek'Sai", "key": "RekSai", "title": "the Void Burrower", "roles": ["jungle"], "tags": ["Fighter"]}),
        serde_json::json!({"id": 526, "name": "Rell", "key": "Rell", "title": "the Iron Maiden", "roles": ["support"], "tags": ["Tank", "Support"]}),
        serde_json::json!({"id": 888, "name": "Renata Glasc", "key": "Renata", "title": "the Chem-Baroness", "roles": ["support"], "tags": ["Support", "Mage"]}),
        serde_json::json!({"id": 58, "name": "Renekton", "key": "Renekton", "title": "the Butcher of the Sands", "roles": ["top"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 107, "name": "Rengar", "key": "Rengar", "title": "the Pridestalker", "roles": ["jungle"], "tags": ["Assassin", "Fighter"]}),
        serde_json::json!({"id": 92, "name": "Riven", "key": "Riven", "title": "the Exile", "roles": ["top"], "tags": ["Fighter", "Assassin"]}),
        serde_json::json!({"id": 68, "name": "Rumble", "key": "Rumble", "title": "the Mechanized Menace", "roles": ["top"], "tags": ["Fighter", "Mage"]}),
        serde_json::json!({"id": 13, "name": "Ryze", "key": "Ryze", "title": "the Rune Mage", "roles": ["middle"], "tags": ["Mage", "Fighter"]}),
        serde_json::json!({"id": 360, "name": "Samira", "key": "Samira", "title": "the Desert Rose", "roles": ["bottom"], "tags": ["Marksman"]}),
        serde_json::json!({"id": 113, "name": "Sejuani", "key": "Sejuani", "title": "Fury of the North", "roles": ["jungle"], "tags": ["Tank", "Fighter"]}),
        serde_json::json!({"id": 235, "name": "Senna", "key": "Senna", "title": "the Redeemer", "roles": ["support", "bottom"], "tags": ["Marksman", "Support"]}),
        serde_json::json!({"id": 147, "name": "Seraphine", "key": "Seraphine", "title": "the Starry-Eyed Songstress", "roles": ["support", "middle"], "tags": ["Mage", "Support"]}),
        serde_json::json!({"id": 875, "name": "Sett", "key": "Sett", "title": "the Boss", "roles": ["top", "support"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 35, "name": "Shaco", "key": "Shaco", "title": "the Demon Jester", "roles": ["jungle"], "tags": ["Assassin"]}),
        serde_json::json!({"id": 98, "name": "Shen", "key": "Shen", "title": "the Eye of Twilight", "roles": ["top"], "tags": ["Tank"]}),
        serde_json::json!({"id": 102, "name": "Shyvana", "key": "Shyvana", "title": "the Half-Dragon", "roles": ["jungle"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 27, "name": "Singed", "key": "Singed", "title": "the Mad Chemist", "roles": ["top"], "tags": ["Tank", "Fighter"]}),
        serde_json::json!({"id": 14, "name": "Sion", "key": "Sion", "title": "The Undead Juggernaut", "roles": ["top"], "tags": ["Tank", "Fighter"]}),
        serde_json::json!({"id": 15, "name": "Sivir", "key": "Sivir", "title": "the Battle Mistress", "roles": ["bottom"], "tags": ["Marksman"]}),
        serde_json::json!({"id": 72, "name": "Skarner", "key": "Skarner", "title": "the Crystal Vanguard", "roles": ["jungle"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 901, "name": "Smolder", "key": "Smolder", "title": "the Fiery Fledgling", "roles": ["bottom"], "tags": ["Marksman"]}),
        serde_json::json!({"id": 37, "name": "Sona", "key": "Sona", "title": "Maven of the Strings", "roles": ["support"], "tags": ["Support", "Mage"]}),
        serde_json::json!({"id": 16, "name": "Soraka", "key": "Soraka", "title": "the Starchild", "roles": ["support"], "tags": ["Support", "Mage"]}),
        serde_json::json!({"id": 50, "name": "Swain", "key": "Swain", "title": "the Noxian Grand General", "roles": ["middle", "support"], "tags": ["Mage", "Fighter"]}),
        serde_json::json!({"id": 517, "name": "Sylas", "key": "Sylas", "title": "the Unshackled", "roles": ["middle", "jungle"], "tags": ["Mage", "Assassin"]}),
        serde_json::json!({"id": 134, "name": "Syndra", "key": "Syndra", "title": "the Dark Sovereign", "roles": ["middle"], "tags": ["Mage"]}),
        serde_json::json!({"id": 223, "name": "Tahm Kench", "key": "TahmKench", "title": "the River King", "roles": ["support", "top"], "tags": ["Support", "Tank"]}),
        serde_json::json!({"id": 163, "name": "Taliyah", "key": "Taliyah", "title": "the Stoneweaver", "roles": ["jungle", "middle"], "tags": ["Mage", "Support"]}),
        serde_json::json!({"id": 91, "name": "Talon", "key": "Talon", "title": "the Blade's Shadow", "roles": ["middle"], "tags": ["Assassin"]}),
        serde_json::json!({"id": 44, "name": "Taric", "key": "Taric", "title": "the Shield of Valoran", "roles": ["support"], "tags": ["Support", "Fighter"]}),
        serde_json::json!({"id": 17, "name": "Teemo", "key": "Teemo", "title": "the Swift Scout", "roles": ["top"], "tags": ["Marksman", "Assassin"]}),
        serde_json::json!({"id": 412, "name": "Thresh", "key": "Thresh", "title": "the Chain Warden", "roles": ["support"], "tags": ["Support", "Fighter"]}),
        serde_json::json!({"id": 18, "name": "Tristana", "key": "Tristana", "title": "the Yordle Gunner", "roles": ["bottom"], "tags": ["Marksman", "Assassin"]}),
        serde_json::json!({"id": 48, "name": "Trundle", "key": "Trundle", "title": "the Troll King", "roles": ["top", "jungle"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 23, "name": "Tryndamere", "key": "Tryndamere", "title": "the Barbarian King", "roles": ["top"], "tags": ["Fighter", "Assassin"]}),
        serde_json::json!({"id": 4, "name": "Twisted Fate", "key": "TwistedFate", "title": "the Card Master", "roles": ["middle"], "tags": ["Mage"]}),
        serde_json::json!({"id": 29, "name": "Twitch", "key": "Twitch", "title": "the Plague Rat", "roles": ["bottom"], "tags": ["Marksman", "Assassin"]}),
        serde_json::json!({"id": 77, "name": "Udyr", "key": "Udyr", "title": "the Spirit Walker", "roles": ["jungle"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 6, "name": "Urgot", "key": "Urgot", "title": "the Dreadnought", "roles": ["top"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 110, "name": "Varus", "key": "Varus", "title": "the Arrow of Retribution", "roles": ["bottom"], "tags": ["Marksman", "Mage"]}),
        serde_json::json!({"id": 67, "name": "Vayne", "key": "Vayne", "title": "the Night Hunter", "roles": ["bottom"], "tags": ["Marksman", "Assassin"]}),
        serde_json::json!({"id": 45, "name": "Veigar", "key": "Veigar", "title": "the Tiny Master of Evil", "roles": ["middle"], "tags": ["Mage"]}),
        serde_json::json!({"id": 161, "name": "Vel'Koz", "key": "Velkoz", "title": "the Eye of the Void", "roles": ["middle", "support"], "tags": ["Mage"]}),
        serde_json::json!({"id": 711, "name": "Vex", "key": "Vex", "title": "the Gloomist", "roles": ["middle"], "tags": ["Mage"]}),
        serde_json::json!({"id": 254, "name": "Vi", "key": "Vi", "title": "the Piltover Enforcer", "roles": ["jungle"], "tags": ["Fighter", "Assassin"]}),
        serde_json::json!({"id": 234, "name": "Viego", "key": "Viego", "title": "The Ruined King", "roles": ["jungle"], "tags": ["Assassin", "Fighter"]}),
        serde_json::json!({"id": 112, "name": "Viktor", "key": "Viktor", "title": "the Machine Herald", "roles": ["middle"], "tags": ["Mage"]}),
        serde_json::json!({"id": 8, "name": "Vladimir", "key": "Vladimir", "title": "the Crimson Reaper", "roles": ["middle", "top"], "tags": ["Mage"]}),
        serde_json::json!({"id": 106, "name": "Volibear", "key": "Volibear", "title": "the Relentless Storm", "roles": ["jungle", "top"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 19, "name": "Warwick", "key": "Warwick", "title": "the Uncaged Wrath of Zaun", "roles": ["jungle"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 498, "name": "Xayah", "key": "Xayah", "title": "the Rebel", "roles": ["bottom"], "tags": ["Marksman"]}),
        serde_json::json!({"id": 101, "name": "Xerath", "key": "Xerath", "title": "the Magus Ascendant", "roles": ["middle", "support"], "tags": ["Mage"]}),
        serde_json::json!({"id": 5, "name": "Xin Zhao", "key": "XinZhao", "title": "the Seneschal of Demacia", "roles": ["jungle"], "tags": ["Fighter", "Assassin"]}),
        serde_json::json!({"id": 115, "name": "Yasuo", "key": "Yasuo", "title": "the Unforgiven", "roles": ["middle", "top"], "tags": ["Fighter", "Assassin"]}),
        serde_json::json!({"id": 777, "name": "Yone", "key": "Yone", "title": "the Unforgotten", "roles": ["middle", "top"], "tags": ["Assassin", "Fighter"]}),
        serde_json::json!({"id": 83, "name": "Yorick", "key": "Yorick", "title": "Shepherd of Souls", "roles": ["top"], "tags": ["Fighter", "Tank"]}),
        serde_json::json!({"id": 350, "name": "Yuumi", "key": "Yuumi", "title": "the Magical Cat", "roles": ["support"], "tags": ["Support", "Mage"]}),
        serde_json::json!({"id": 154, "name": "Zac", "key": "Zac", "title": "the Secret Weapon", "roles": ["jungle"], "tags": ["Tank", "Fighter"]}),
        serde_json::json!({"id": 238, "name": "Zed", "key": "Zed", "title": "the Master of Shadows", "roles": ["middle"], "tags": ["Assassin"]}),
        serde_json::json!({"id": 221, "name": "Zeri", "key": "Zeri", "title": "The Spark of Zaun", "roles": ["bottom"], "tags": ["Marksman"]}),
        serde_json::json!({"id": 115, "name": "Ziggs", "key": "Ziggs", "title": "the Hexplosives Expert", "roles": ["middle"], "tags": ["Mage"]}),
        serde_json::json!({"id": 26, "name": "Zilean", "key": "Zilean", "title": "the Chronokeeper", "roles": ["support"], "tags": ["Support", "Mage"]}),
        serde_json::json!({"id": 142, "name": "Zoe", "key": "Zoe", "title": "the Aspect of Twilight", "roles": ["middle"], "tags": ["Mage", "Support"]}),
        serde_json::json!({"id": 143, "name": "Zyra", "key": "Zyra", "title": "Rise of the Thorns", "roles": ["support"], "tags": ["Mage", "Support"]})
    ];
    Ok(champions)
}

/// Get champion builds for a specific champion and role
#[tauri::command]
pub async fn get_champion_builds(_champion_id: i32, _role: String, rank: Option<String>) -> Result<Vec<serde_json::Value>, String> {
    let _rank = rank.unwrap_or_else(|| "diamond+".to_string());
    
    // Mock build data - in production this would come from external APIs like op.gg, u.gg, etc.
    let builds = vec![
        serde_json::json!({
            "id": "meta_build_1",
            "name": "Meta Build",
            "source": "Community",
            "pickRate": 67.8,
            "winRate": 52.4,
            "games": 12450,
            "items": {
                "core": [3074, 3071, 3156], // Ravenous Hydra, Black Cleaver, Maw of Malmortius
                "boots": [3047], // Plated Steelcaps
                "situational": [3193, 3026, 3065, 3053]
            },
            "runes": {
                "primary": {
                    "tree": "Precision",
                    "keystone": "Conqueror",
                    "runes": ["Triumph", "Legend: Alacrity", "Last Stand"]
                },
                "secondary": {
                    "tree": "Resolve",
                    "runes": ["Second Wind", "Unflinching"]
                },
                "shards": ["Adaptive Force", "Adaptive Force", "Health"]
            },
            "skillOrder": "Q>E>W",
            "startingItems": [1054, 2003], // Doran's Shield, Health Potion
            "summonerSpells": ["Flash", "Teleport"]
        }),
        serde_json::json!({
            "id": "aggressive_build_1",
            "name": "Aggressive Build",
            "source": "Pro Play",
            "pickRate": 23.1,
            "winRate": 54.7,
            "games": 4230,
            "items": {
                "core": [3074, 3071, 3812], // Ravenous Hydra, Black Cleaver, Death's Dance
                "boots": [3006], // Berserker's Greaves
                "situational": [3156, 3053, 3026]
            },
            "runes": {
                "primary": {
                    "tree": "Precision",
                    "keystone": "Conqueror",
                    "runes": ["Triumph", "Legend: Bloodline", "Coup de Grace"]
                },
                "secondary": {
                    "tree": "Domination",
                    "runes": ["Sudden Impact", "Ravenous Hunter"]
                },
                "shards": ["Adaptive Force", "Adaptive Force", "Health"]
            },
            "skillOrder": "Q>W>E",
            "startingItems": [1055, 2003], // Doran's Blade, Health Potion
            "summonerSpells": ["Flash", "Ignite"]
        })
    ];
    
    Ok(builds)
}

/// Get champion matchups for a specific champion and role
#[tauri::command]
pub async fn get_champion_matchups(_champion_id: i32, _role: String, rank: Option<String>) -> Result<Vec<serde_json::Value>, String> {
    let _rank = rank.unwrap_or_else(|| "diamond+".to_string());
    
    // Mock matchup data
    let matchups = vec![
        serde_json::json!({
            "enemyChampionId": 54, // Malphite
            "enemyChampionName": "Malphite",
            "difficulty": "Hard",
            "winRate": 42.3,
            "games": 1850,
            "goldDiff15": -287,
            "csDiff15": -12,
            "tips": [
                "Rush Blade of the Ruined King for % health damage",
                "Take short trades when his passive is down",
                "Avoid all-ins when he has ultimate"
            ],
            "counters": ["Build MR early", "Take Fleet Footwork", "Consider Hexdrinker"]
        }),
        serde_json::json!({
            "enemyChampionId": 92, // Riven
            "enemyChampionName": "Riven",
            "difficulty": "Easy",
            "winRate": 58.7,
            "games": 2340,
            "goldDiff15": 156,
            "csDiff15": 8,
            "tips": [
                "Trade when her abilities are on cooldown",
                "Use Q to interrupt her combos",
                "Build armor early"
            ],
            "counters": ["Bramble Vest rush", "Play around cooldowns", "Don't chase"]
        }),
        serde_json::json!({
            "enemyChampionId": 122, // Darius
            "enemyChampionName": "Darius",
            "difficulty": "Medium",
            "winRate": 49.8,
            "games": 3120,
            "goldDiff15": -45,
            "csDiff15": -2,
            "tips": [
                "Respect his level 6 power spike",
                "Don't fight when he has 5 stacks",
                "Use range advantage with Q"
            ],
            "counters": ["Kite with Q", "Build healing reduction", "Avoid extended trades"]
        })
    ];
    
    Ok(matchups)
}

/// Get counter data (champions that counter this champion and champions this champion counters)
#[tauri::command]
pub async fn get_counter_data(champion_id: i32, role: String, rank: Option<String>) -> Result<serde_json::Value, String> {
    let _rank = rank.unwrap_or_else(|| "diamond+".to_string());
    
    // Mock counter data
    let counter_data = serde_json::json!({
        "championId": champion_id,
        "role": role,
        "counters": {
            "hardCounters": [
                {
                    "championId": 54,
                    "championName": "Malphite",
                    "winRateAgainst": 42.3,
                    "difficulty": "Hard",
                    "reason": "Tank with heavy armor and CC"
                },
                {
                    "championId": 57,
                    "championName": "Maokai", 
                    "winRateAgainst": 44.1,
                    "difficulty": "Hard",
                    "reason": "Sustain and crowd control"
                }
            ],
            "softCounters": [
                {
                    "championId": 17,
                    "championName": "Teemo",
                    "winRateAgainst": 46.8,
                    "difficulty": "Medium",
                    "reason": "Range advantage and blind"
                },
                {
                    "championId": 85,
                    "championName": "Kennen",
                    "winRateAgainst": 47.2,
                    "difficulty": "Medium", 
                    "reason": "Range and escape tools"
                }
            ]
        },
        "goodAgainst": {
            "hardCounters": [
                {
                    "championId": 92,
                    "championName": "Riven",
                    "winRateAgainst": 58.7,
                    "difficulty": "Easy",
                    "reason": "Can interrupt her combos and sustain"
                },
                {
                    "championId": 114,
                    "championName": "Fiora",
                    "winRateAgainst": 56.4,
                    "difficulty": "Easy",
                    "reason": "Good sustain and can match split push"
                }
            ],
            "softCounters": [
                {
                    "championId": 24,
                    "championName": "Jax",
                    "winRateAgainst": 53.2,
                    "difficulty": "Medium",
                    "reason": "Better early game presence"
                }
            ]
        },
        "banRecommendations": [
            {
                "championId": 54,
                "championName": "Malphite",
                "banRate": 15.2,
                "reason": "Hardest counter in current meta"
            },
            {
                "championId": 122,
                "championName": "Darius", 
                "banRate": 12.8,
                "reason": "Popular pick with good matchup"
            }
        ]
    });
    
    Ok(counter_data)
}

/// Get detailed champion statistics including user performance
#[tauri::command]
pub async fn get_detailed_champion_stats(champion_id: i32) -> Result<serde_json::Value, String> {
    let state = APP_STATE.get().ok_or("App state not initialized")?;
    
    let (_puuid, _region) = {
        let state_guard = state.inner.lock().await;
        (state_guard.puuid.clone(), state_guard.region.clone())
    };
    
    // Mock detailed stats - in production would aggregate from match history
    let stats = serde_json::json!({
        "championId": champion_id,
        "championName": "Aatrox", // Would be dynamically determined
        "userStats": {
            "gamesPlayed": 47,
            "wins": 29,
            "losses": 18,
            "winRate": 61.7,
            "kda": {
                "kills": 8.2,
                "deaths": 5.1,
                "assists": 6.8,
                "ratio": 2.94
            },
            "averageStats": {
                "cs": 156.3,
                "csPerMinute": 5.5,
                "gold": 12450,
                "damage": 23890,
                "damageToChampions": 18340,
                "visionScore": 18.2,
                "gameLength": 28.5
            },
            "masteryInfo": {
                "level": 7,
                "points": 234567,
                "tokensEarned": 0,
                "chestGranted": true
            },
            "recentForm": {
                "last10Games": {
                    "wins": 7,
                    "losses": 3,
                    "winRate": 70.0
                },
                "trend": "improving"
            }
        },
        "globalStats": {
            "pickRate": 8.2,
            "banRate": 12.5,
            "winRate": 51.8,
            "tier": "S",
            "rank": 15
        },
        "rolePerformance": {
            "top": {
                "gamesPlayed": 43,
                "winRate": 65.1,
                "kda": 3.0,
                "primaryRole": true
            },
            "middle": {
                "gamesPlayed": 4,
                "winRate": 25.0,
                "kda": 2.26,
                "primaryRole": false
            }
        },
        "itemStats": {
            "mostBuilt": [
                {"itemId": 3074, "itemName": "Ravenous Hydra", "buildRate": 78.2, "winRate": 54.1},
                {"itemId": 3071, "itemName": "Black Cleaver", "buildRate": 65.8, "winRate": 52.8},
                {"itemId": 3156, "itemName": "Maw of Malmortius", "buildRate": 45.2, "winRate": 56.3}
            ],
            "highestWinRate": [
                {"itemId": 3812, "itemName": "Death's Dance", "buildRate": 35.1, "winRate": 58.7},
                {"itemId": 3156, "itemName": "Maw of Malmortius", "buildRate": 45.2, "winRate": 56.3}
            ]
        },
        "skillOrder": {
            "mostPopular": "Q>E>W",
            "highestWinRate": "Q>W>E",
            "userPreference": "Q>E>W"
        }
    });
    
    Ok(stats)
}

#[tauri::command]
pub async fn test_connection_with_retry() -> Result<String, String> {
    use log::info;
    info!("Testing connection with retry mechanism...");
    
    // First check if we have a valid API key
    let api_key = std::env::var("RIOT_API_KEY").unwrap_or_default();
    if api_key.is_empty() || api_key == "DEMO_KEY" {
        return Ok("Demo mode - no API key configured".to_string());
    }
    
    let state = APP_STATE.get().ok_or("not initialized")?.clone();
    
    // Test with a simple API call - get account by Riot ID
    match state.client.get_account_by_riot_id_with_retry("Riot", "API", "na1").await {
        Ok(Some(_account)) => Ok("Connection test successful - API key is valid".to_string()),
        Ok(None) => Ok("Connection test successful - API key is valid (test account not found, but API responded)".to_string()),
        Err(retry_err) => {
            let api_error = ApiError::from(retry_err);
            match api_error {
                ApiError::ApiKeyInvalid => Err("API key is invalid or expired".to_string()),
                ApiError::ApiKeyMissing => Err("API key is missing".to_string()),
                ApiError::RateLimited => Ok("API key is valid but rate limited".to_string()),
                ApiError::NetworkError => Err("Network connection error".to_string()),
                ApiError::ServerError => Err("Riot API server error".to_string()),
                _ => Err(format!("Connection test failed: {:?}", api_error)),
            }
        }
    }
}


