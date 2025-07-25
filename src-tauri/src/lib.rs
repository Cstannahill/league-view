pub mod commands;
pub mod riot_client;
pub mod retry;
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
    get_champion_builds,
    get_champion_matchups,
    get_counter_data,
    get_detailed_champion_stats,
    test_connection_with_retry
};
use std::sync::Arc;
use crate::riot_client::RiotClient;
use crate::commands::{APP_STATE, State, Tracked, poll_loop};

pub fn run() {
    // Try to load .env file, but don't fail if it doesn't exist (production case)
    dotenvy::from_filename(".env").ok();
    
    // In production, try compile-time API key first, then environment, then demo
    let key = option_env!("RIOT_API_KEY")
        .map(|s| s.to_string())
        .or_else(|| std::env::var("RIOT_API_KEY").ok())
        .unwrap_or_else(|| {
            eprintln!("Warning: No Riot API key found. Using demo mode.");
            "DEMO_KEY".to_string()
        });
    
    let _api_mode = std::env::var("API_MODE").unwrap_or_else(|_| "real".to_string());
    
    println!("Initializing Riot client with key: {}...", 
        if key.starts_with("RGAPI-") { 
            format!("RGAPI-{}", "*".repeat(key.len() - 6)) 
        } else { 
            key.clone() 
        });
    
    println!("Step 1: About to create RiotClient");
    let client = RiotClient::new(&key);
    println!("Step 2: RiotClient created successfully");
    
    println!("Step 3: About to create State");
    let state = Arc::new(State {
        client,
        inner: tokio::sync::Mutex::new(Tracked::default()),
    });
    println!("Step 4: State created successfully");
    
    println!("Step 5: About to set APP_STATE");
    APP_STATE.set(state.clone()).expect("Failed to set APP_STATE");
    println!("Step 6: APP_STATE set successfully");

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
            get_champion_builds,
            get_champion_matchups,
            get_counter_data,
            get_detailed_champion_stats,
            test_connection_with_retry,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
