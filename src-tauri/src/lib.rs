pub mod commands;
pub mod riot_client;
use commands::{
    set_tracked_summoner, 
    refresh_dashboard, 
    recent_games, 
    get_performance_insights, 
    get_advanced_analytics, 
    get_enhanced_traits,
    detect_live_match,
    start_live_match_monitoring,
    get_enhanced_match_history,
    get_all_champions,
    get_champion_masteries,
    get_champion_stats
};
use std::sync::Arc;
use crate::riot_client::RiotClient;
use crate::commands::{APP_STATE, State, Tracked, poll_loop};

pub fn run() {
    dotenvy::from_filename(".env").ok();

    // Try to get API key, use mock mode if not available or invalid
    let key = std::env::var("RIOT_API_KEY").unwrap_or_else(|_| "DEMO_KEY".to_string());
    let api_mode = std::env::var("API_MODE").unwrap_or_else(|_| "real".to_string());
    
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
            get_performance_insights,
            get_advanced_analytics,
            get_enhanced_traits,
            detect_live_match,
            start_live_match_monitoring,
            get_enhanced_match_history,
            get_all_champions,
            get_champion_masteries,
            get_champion_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
