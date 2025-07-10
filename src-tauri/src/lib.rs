pub mod commands;
pub mod riot_client;
use commands::{set_tracked_summoner, refresh_dashboard, recent_games};
use std::sync::Arc;
use crate::riot_client::RiotClient;
use crate::commands::{APP_STATE, State, Tracked, poll_loop};

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
            recent_games,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
