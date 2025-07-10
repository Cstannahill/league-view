use std::{sync::Arc, time::Duration};

use once_cell::sync::OnceCell;
use serde::Serialize;
use std::collections::HashMap;
use reqwest::Client;
use tauri::{AppHandle, Emitter};

mod riot_client;
use riot_client::RiotClient;
use riven::consts::QueueType;

static APP_STATE: OnceCell<Arc<State>> = OnceCell::new();

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
struct State {
    client: RiotClient,
    inner: tokio::sync::Mutex<Tracked>,
}

#[derive(Default, Debug)]
struct Tracked {
    name: Option<String>,
    region: Option<String>,
    puuid: Option<String>,
    in_game: bool,
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


#[tauri::command]
async fn set_tracked_summoner(game_name: String, tag_line: String, region: String) -> Result<(), String> {
    let state = APP_STATE.get().ok_or("not initialized")?.clone();
    let account = state
        .client
        .get_account_by_riot_id(&game_name, &tag_line, &region)
        .await
        .map_err(|e| format!("{:?}", e))?
        .ok_or("account not found")?;
    // Fetch full summoner data to ensure region is valid and get puuid if missing
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
async fn refresh_dashboard() -> Result<serde_json::Value, String> {
    let state = APP_STATE.get().ok_or("not initialized")?.clone();
    let (puuid, region) = {
        let t = state.inner.lock().await;
        (t.puuid.clone(), t.region.clone())
    };
    let puuid = puuid.ok_or("no summoner")?;
    let region = region.ok_or("no region")?;

    let masteries = state
        .client
        .get_champion_masteries(&puuid, &region)
        .await
        .map_err(|e| format!("{:?}", e))?;

    let ranked_entries = state
        .client
        .get_ranked_stats(&puuid, &region)
        .await
        .map_err(|e| format!("{:?}", e))?;
    let mut top = masteries;
    top.sort_by(|a, b| b.champion_points.cmp(&a.champion_points));
    top.truncate(5);

    let champs = fetch_champion_map()
        .await
        .map_err(|e| format!("{:?}", e))?;

    let champions: Vec<ChampionStat> = top
        .iter()
        .map(|m| {
            let champ_id = i16::from(m.champion_id) as u32;
            ChampionStat {
                id: champ_id,
                name: champs
                    .get(&champ_id)
                    .cloned()
                    .unwrap_or_else(|| champ_id.to_string()),
                level: m.champion_level as u32,
                points: m.champion_points as u32,
            }
        })
        .collect();

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

    let stats = DashboardStats { champions, rank };
    Ok(serde_json::to_value(stats).unwrap())
}

#[tauri::command]
async fn recent_games(count: Option<u32>) -> Result<serde_json::Value, String> {
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

async fn poll_loop(app: AppHandle, state: Arc<State>) {
    loop {
        let (puuid_opt, region_opt, _in_game) = {
            let t = state.inner.lock().await;
            (t.puuid.clone(), t.region.clone(), t.in_game)
        };

        // unwrap both puuid and region as &str
        if let (Some(puuid), Some(region_str)) = (puuid_opt, region_opt.as_deref()) {
            match state.client.get_active_game(&puuid, region_str).await {
                Ok(Some(game)) => {
                    let mut t = state.inner.lock().await;
                    if !t.in_game {
                        t.in_game = true;

                        // Notify frontend: new game started
                        let _ = app.emit("gameStarted", Some(game.clone()));

                        // Fetch ranked stats for each participant
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

                        // Calculate traits for each participant
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenvy::from_filename(".env").ok();

    let key = std::env::var("RIOT_API_KEY").expect("RIOT_API_KEY not set");
    let client = RiotClient::new(&key);
    let state = Arc::new(State {
        client,
        inner: tokio::sync::Mutex::new(Tracked::default()),
    });
    APP_STATE.set(state.clone()).expect("Failed to set APP_STATE");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            let app_handle = app.handle();
            tauri::async_runtime::spawn(poll_loop(app_handle.clone(), state));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_tracked_summoner,
            refresh_dashboard,
            recent_games
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
