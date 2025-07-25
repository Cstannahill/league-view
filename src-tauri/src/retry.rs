use std::future::Future;
use std::time::Duration;
use tokio::time::sleep;
use log::{warn, error, info};
use riven::RiotApiError;

/// Configuration for retry attempts
#[derive(Debug, Clone)]
pub struct RetryConfig {
    pub max_attempts: u32,
    pub base_delay: Duration,
    pub max_delay: Duration,
    pub backoff_multiplier: f64,
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            max_attempts: 3,
            base_delay: Duration::from_millis(500),
            max_delay: Duration::from_secs(30),
            backoff_multiplier: 2.0,
        }
    }
}

/// Connection error types for better handling
#[derive(Debug, PartialEq, Clone)]
pub enum ConnectionErrorType {
    Network,
    RateLimit,
    ServerError,
    NotFound,
    Unauthorized,
    Unknown,
}

impl From<&RiotApiError> for ConnectionErrorType {
    fn from(error: &RiotApiError) -> Self {
        if let Some(status) = error.status_code() {
            match status.as_u16() {
                429 => ConnectionErrorType::RateLimit,
                404 => ConnectionErrorType::NotFound,
                401 | 403 => ConnectionErrorType::Unauthorized,
                500..=599 => ConnectionErrorType::ServerError,
                _ => ConnectionErrorType::Unknown,
            }
        } else {
            // Network-level errors (no HTTP status)
            ConnectionErrorType::Network
        }
    }
}

impl From<RiotApiError> for ConnectionErrorType {
    fn from(error: RiotApiError) -> Self {
        ConnectionErrorType::from(&error)
    }
}

/// Enhanced error information
#[derive(Debug)]
pub struct RetryError {
    pub error_type: ConnectionErrorType,
    pub attempts_made: u32,
    pub last_error: String,
    pub is_retryable: bool,
}

impl std::fmt::Display for RetryError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Failed after {} attempts: {} (Type: {:?}, Retryable: {})",
            self.attempts_made, self.last_error, self.error_type, self.is_retryable
        )
    }
}

impl std::error::Error for RetryError {}

/// Determines if an error should trigger a retry
fn is_retryable_error(error_type: &ConnectionErrorType) -> bool {
    match error_type {
        ConnectionErrorType::Network => true,
        ConnectionErrorType::RateLimit => true,
        ConnectionErrorType::ServerError => true,
        ConnectionErrorType::NotFound => false,
        ConnectionErrorType::Unauthorized => false,
        ConnectionErrorType::Unknown => true,
    }
}

/// Calculates the delay for the next retry attempt
fn calculate_delay(attempt: u32, config: &RetryConfig) -> Duration {
    let delay_ms = config.base_delay.as_millis() as f64 
        * config.backoff_multiplier.powi(attempt as i32);
    
    let delay = Duration::from_millis(delay_ms as u64);
    
    if delay > config.max_delay {
        config.max_delay
    } else {
        delay
    }
}

/// Extracts retry-after header from rate limit responses
fn extract_retry_after(error: &RiotApiError) -> Option<Duration> {
    if let Some(resp) = error.response() {
        if let Some(retry_after) = resp.headers().get("Retry-After") {
            if let Ok(retry_str) = retry_after.to_str() {
                if let Ok(seconds) = retry_str.parse::<u64>() {
                    return Some(Duration::from_secs(seconds));
                }
            }
        }
    }
    None
}

/// Main retry function for async operations
pub async fn retry_with_backoff<F, Fut, T, E>(
    operation: F,
    config: RetryConfig,
    operation_name: &str,
) -> Result<T, RetryError>
where
    F: Fn() -> Fut,
    Fut: Future<Output = Result<T, E>>,
    E: std::fmt::Debug + Into<ConnectionErrorType> + Clone,
{
    let mut last_error = String::new();
    let mut error_type = ConnectionErrorType::Unknown;
    
    for attempt in 0..config.max_attempts {
        info!("Attempting {} (attempt {}/{})", operation_name, attempt + 1, config.max_attempts);
        
        match operation().await {
            Ok(result) => {
                if attempt > 0 {
                    info!("Operation {} succeeded after {} attempts", operation_name, attempt + 1);
                }
                return Ok(result);
            }
            Err(err) => {
                error_type = err.clone().into();
                last_error = format!("{:?}", err);
                
                warn!(
                    "Attempt {}/{} failed for {}: {} (Type: {:?})",
                    attempt + 1, config.max_attempts, operation_name, last_error, error_type
                );
                
                // Don't retry if it's the last attempt
                if attempt + 1 >= config.max_attempts {
                    break;
                }
                
                // Don't retry non-retryable errors
                if !is_retryable_error(&error_type) {
                    warn!("Error type {:?} is not retryable, stopping attempts", error_type);
                    break;
                }
                
                let delay = calculate_delay(attempt, &config);
                
                info!("Waiting {:?} before retry...", delay);
                sleep(delay).await;
            }
        }
    }
    
    error!(
        "Operation {} failed after {} attempts. Last error: {}",
        operation_name, config.max_attempts, last_error
    );
    
    Err(RetryError {
        error_type: error_type.clone(),
        attempts_made: config.max_attempts,
        last_error,
        is_retryable: is_retryable_error(&error_type),
    })
}

/// Specialized retry for RiotApiError
pub async fn retry_riot_api<F, Fut, T>(
    operation: F,
    config: RetryConfig,
    operation_name: &str,
) -> Result<T, RetryError>
where
    F: Fn() -> Fut,
    Fut: Future<Output = Result<T, RiotApiError>>,
{
    let mut last_error = String::new();
    let mut error_type = ConnectionErrorType::Unknown;
    
    for attempt in 0..config.max_attempts {
        info!("Attempting {} (attempt {}/{})", operation_name, attempt + 1, config.max_attempts);
        
        match operation().await {
            Ok(result) => {
                if attempt > 0 {
                    info!("Operation {} succeeded after {} attempts", operation_name, attempt + 1);
                }
                return Ok(result);
            }
            Err(err) => {
                error_type = ConnectionErrorType::from(&err);
                last_error = format!("{:?}", err);
                
                warn!(
                    "Attempt {}/{} failed for {}: {} (Type: {:?})",
                    attempt + 1, config.max_attempts, operation_name, last_error, error_type
                );
                
                // Don't retry if it's the last attempt
                if attempt + 1 >= config.max_attempts {
                    break;
                }
                
                // Don't retry non-retryable errors
                if !is_retryable_error(&error_type) {
                    warn!("Error type {:?} is not retryable, stopping attempts", error_type);
                    break;
                }
                
                // Handle rate limiting specially
                let delay = if error_type == ConnectionErrorType::RateLimit {
                    extract_retry_after(&err).unwrap_or_else(|| calculate_delay(attempt, &config))
                } else {
                    calculate_delay(attempt, &config)
                };
                
                info!("Waiting {:?} before retry...", delay);
                sleep(delay).await;
            }
        }
    }
    
    error!(
        "Operation {} failed after {} attempts. Last error: {}",
        operation_name, config.max_attempts, last_error
    );
    
    Err(RetryError {
        error_type: error_type.clone(),
        attempts_made: config.max_attempts,
        last_error,
        is_retryable: is_retryable_error(&error_type),
    })
}

/// Quick retry for critical operations with shorter timeouts
pub fn quick_retry_config() -> RetryConfig {
    RetryConfig {
        max_attempts: 3,
        base_delay: Duration::from_millis(200),
        max_delay: Duration::from_secs(5),
        backoff_multiplier: 1.5,
    }
}

/// Standard retry for normal operations
pub fn standard_retry_config() -> RetryConfig {
    RetryConfig::default()
}

/// Extended retry for non-critical operations
pub fn extended_retry_config() -> RetryConfig {
    RetryConfig {
        max_attempts: 5,
        base_delay: Duration::from_secs(1),
        max_delay: Duration::from_secs(60),
        backoff_multiplier: 2.0,
    }
}
