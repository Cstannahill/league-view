use std::{sync::Arc, time::Duration};

use once_cell::sync::OnceCell;
use serde::Serialize;
use tauri::{AppHandle, Manager};

mod riot_client;
use riot_client::RiotClient;

static APP_STATE: OnceCell<Arc<State>> = OnceCell::new();

#[derive(Clone)]
struct State {
    client: RiotClient,
    inner: tokio::sync::Mutex<Tracked>,
}

#[derive(Default)]
struct Tracked {
    name: Option<String>,
    region: Option<String>,
    puuid: Option<String>,
    in_game: bool,
}

#[tauri::command]
async fn set_tracked_summoner(name: String, region: String) -> Result<(), String> {
    let state = APP_STATE.get().ok_or("not initialized")?.clone();
    let summoner = state
        .client
        .get_summoner_by_name(&name, &region)
        .await
        .map_err(|e| format!("{:?}", e))?;
    let mut guard = state.inner.lock().await;
    guard.name = Some(name);
    guard.region = Some(region);
    guard.puuid = Some(summoner.puuid.clone());
    Ok(())
}

#[tauri::command]
async fn refresh_dashboard() -> Result<serde_json::Value, String> {
    // Placeholder empty stats
    Ok(serde_json::json!({}))
}

async fn poll_loop(app: AppHandle, state: Arc<State>) {
    loop {
        let (puuid, region, in_game) = {
            let t = state.inner.lock().await;
            (
                t.puuid.clone(),
                t.region.clone(),
                t.in_game,
            )
        };
        if let (Some(puuid), Some(region)) = (puuid, region) {
            match state.client.get_active_game(&puuid, &region).await {
                Ok(Some(game)) => {
                    let mut t = state.inner.lock().await;
                    if !t.in_game {
                        t.in_game = true;
                        let _ = app.emit_all("gameStarted", &game);
                        let ranked_futs = game
                            .participants
                            .iter()
                            .map(|p| state.client.get_ranked_stats(&p.puuid, &region));
                        let ranked: Vec<_> = futures::future::join_all(ranked_futs)
                            .await
                            .into_iter()
                            .map(|r| r.unwrap_or_default())
                            .collect();
                        let trait_futs = game
                            .participants
                            .iter()
                            .map(|p| state.client.calculate_traits(&p.puuid, &region));
                        let traits: Vec<Vec<String>> = futures::future::join_all(trait_futs)
                            .await
                            .into_iter()
                            .map(|r| r.unwrap_or_default())
                            .collect();
                        let payload = MatchPayload { game, ranked, traits };
                        let _ = app.emit_all("matchData", payload);
                    }
                }
                Ok(None) => {
                    let mut t = state.inner.lock().await;
                    if t.in_game {
                        t.in_game = false;
                        let _ = app.emit_all("gameEnded", ());
                    } else {
                        let _ = app.emit_all("noGame", ());
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

#[derive(Serialize)]
struct MatchPayload {
    game: riven::models::spectator_v5::CurrentGameInfo,
    ranked: Vec<Vec<riven::models::league_v4::LeagueEntry>>,
    traits: Vec<Vec<String>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenvy::dotenv().ok();
    let key = std::env::var("RIOT_API_KEY").expect("RIOT_API_KEY not set");
    let client = RiotClient::new(&key);
    let state = Arc::new(State {
        client,
        inner: tokio::sync::Mutex::new(Tracked::default()),
    });
    APP_STATE.set(state.clone()).unwrap();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            let app_handle = app.handle();
            tauri::async_runtime::spawn(poll_loop(app_handle, state));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_tracked_summoner,
            refresh_dashboard
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
