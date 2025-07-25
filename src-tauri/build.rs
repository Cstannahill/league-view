fn main() {
    // Try to load .env file from the parent directory during build time
    if dotenvy::from_filename("../.env").is_ok() {
        println!("cargo:warning=Successfully loaded .env file during build");
    } else {
        println!("cargo:warning=Could not load .env file during build");
    }
    
    // Pass the API key to the build as an environment variable for option_env!
    if let Ok(api_key) = std::env::var("RIOT_API_KEY") {
        println!("cargo:rustc-env=RIOT_API_KEY={}", api_key);
        println!("cargo:warning=API key found and embedded: {}...", &api_key[..10.min(api_key.len())]);
    } else {
        println!("cargo:warning=No RIOT_API_KEY found in environment during build");
    }
    
    tauri_build::build()
}
