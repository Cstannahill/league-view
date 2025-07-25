# Robust Reconnection Mechanism - Testing Guide

## Overview
This League View application now includes a comprehensive reconnection mechanism that gracefully handles API failures and connection issues. The system will automatically retry failed requests up to 3 times with exponential backoff before surfacing errors to the user.

## Features Implemented

### Backend (Rust/Tauri)
- **Retry Utility Module** (`src-tauri/src/retry.rs`)
  - Configurable retry attempts (default: 3)
  - Exponential backoff strategy (1s, 2s, 4s)
  - Error type categorization (retryable vs non-retryable)

- **Enhanced Riot API Client** (`src-tauri/src/riot_client.rs`)
  - All major API calls now use retry logic
  - Robust live match detection with fallback methods
  - Graceful degradation on API failures

- **Improved Tauri Commands** (`src-tauri/src/commands.rs`)
  - Live match polling with adaptive intervals
  - Connection error event emission
  - Fallback strategies for critical functions

### Frontend (React/TypeScript)
- **Connection Status Component** (`src/components/common/ConnectionStatus.tsx`)
  - Real-time connection status indicator
  - Toast notifications for connection issues

- **API Retry Hooks** (`src/hooks/useApiWithRetry.ts`)
  - Automatic retry logic for frontend API calls
  - Loading states and error handling

- **Enhanced Dashboard Components**
  - `DashboardView.tsx`, `SummonerForm.tsx`, `RecentGames.tsx`
  - All integrated with retry-enabled API calls

## Testing the Reconnection Logic

### 1. Testing Backend Reconnection

#### Test Invalid API Key
1. Set an invalid Riot API key in your environment:
   ```bash
   export RIOT_API_KEY="invalid_key_test"
   ```

2. Run the application:
   ```bash
   npm run tauri dev
   ```

3. Try to search for a summoner - you should see:
   - Toast notifications about connection issues
   - Red connection status indicator
   - Automatic retry attempts (check browser console for retry logs)

#### Test Network Issues
1. Use a network simulator or disable internet temporarily
2. Try any API operation
3. Observe the retry behavior and user feedback

### 2. Testing Frontend Reconnection

#### Test Connection Recovery
1. Start with a valid API key
2. Use browser dev tools to throttle network or disable internet
3. Try summoner searches or match loading
4. Re-enable network and observe automatic recovery

### 3. Manual Connection Testing

#### Development Test Button
A test connection button is available in development mode:
- Located in the main application interface
- Manually triggers connection test with retry logic
- Shows toast notifications with results

**Note:** Remove or hide this button in production builds.

### 4. Live Match Detection Testing

#### Robust Detection
The live match detection now includes:
- Primary: Spectator API (most reliable)
- Fallback 1: Recent match history analysis
- Fallback 2: Account status checking
- Adaptive polling intervals based on connection quality

#### Testing Steps
1. Have a summoner currently in a game
2. Search for them with various network conditions
3. Observe fallback method usage in console logs

## Expected Behaviors

### Success Scenarios
- ✅ Instant response with good connection
- ✅ Delayed response with poor connection but eventual success
- ✅ Toast notification on successful retry
- ✅ Green connection status indicator

### Failure Scenarios
- ⚠️ Multiple retry attempts visible in console
- ⚠️ Yellow/orange connection status during retries
- ❌ Red connection status after all retries exhausted
- ❌ Clear error message to user after final failure
- ❌ Graceful fallback to cached data where possible

## Monitoring and Logging

### Browser Console
- Check for retry attempt logs
- Connection error events
- API response timing information

### Network Tab
- Observe actual HTTP request retries
- Check response codes and timing

### User Interface
- Connection status component state changes
- Toast notification appearance and timing
- Loading state persistence during retries

## Production Configuration

### Environment Variables
```bash
# Required for production
RIOT_API_KEY=your_actual_riot_api_key

# Optional configurations
API_MODE=real  # Default mode
RETRY_ATTEMPTS=3  # Max retry attempts
RETRY_BASE_DELAY=1000  # Base delay in milliseconds
```

### Build for Production
```bash
# Remove test components and enable optimizations
npm run tauri build
```

## Troubleshooting

### Common Issues
1. **Infinite retry loops**: Check error categorization in retry.rs
2. **UI freeze during retries**: Ensure proper async handling in components
3. **Memory leaks**: Verify cleanup of retry timers and event listeners

### Debug Mode
Enable debug mode for detailed retry logging:
```bash
export RUST_LOG=debug
npm run tauri dev
```

## Architecture Summary

The reconnection system implements multiple layers of resilience:

1. **Network Layer**: HTTP client with timeout and retry configuration
2. **API Layer**: Retry wrapper around all Riot API calls
3. **Command Layer**: Fallback strategies for Tauri commands
4. **UI Layer**: User feedback and loading states
5. **State Layer**: Connection status tracking and recovery

This comprehensive approach ensures the application remains responsive and user-friendly even under poor network conditions or API instability.
