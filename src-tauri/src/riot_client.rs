use riven::{
    consts::PlatformRoute,
    reqwest::Method,
    RiotApi, RiotApiError,
};
use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::time::{sleep, Duration};

pub struct RiotClient {
    api: RiotApi,
}

#[derive(Debug, serde::Serialize)]
pub struct MatchSummary {
    pub champion_id: u32,
    pub win: bool,
    pub kills: u32,
    pub deaths: u32,
    pub assists: u32,
    pub duration: u32,
}

#[derive(Debug, serde::Serialize)]
pub struct AdvancedMatchAnalysis {
    pub game_phase_performance: GamePhasePerformance,
    pub champion_mastery_context: ChampionMasteryContext,
    pub behavioral_indicators: BehavioralIndicators,
    pub objective_control: ObjectiveControl,
}

#[derive(Debug, serde::Serialize)]
pub struct GamePhasePerformance {
    pub early_game_rating: f32,
    pub mid_game_rating: f32,
    pub late_game_rating: f32,
    pub scaling_effectiveness: f32,
}

#[derive(Debug, serde::Serialize)]
pub struct ChampionMasteryContext {
    pub mastery_level: u32,
    pub mastery_points: u32,
    pub games_on_champion: u32,
    pub winrate_on_champion: f32,
    pub performance_vs_average: f32,
}

#[derive(Debug, serde::Serialize)]
pub struct BehavioralIndicators {
    pub aggression_level: f32,
    pub risk_tolerance: f32,
    pub team_fight_participation: f32,
    pub objective_prioritization: f32,
    pub adaptation_speed: f32,
}

#[derive(Debug, serde::Serialize)]
pub struct ObjectiveControl {
    pub dragon_participation: f32,
    pub baron_participation: f32,
    pub tower_damage_share: f32,
    pub vision_control_rating: f32,
    pub jungle_control: f32,
}

#[derive(Debug, serde::Serialize, Clone)]
pub struct LiveMatchState {
    pub is_in_game: bool,
    pub game_id: Option<i64>,
    pub game_start_time: Option<i64>,
    pub game_length: Option<i64>,
    pub game_mode: Option<String>,
    pub game_type: Option<String>,
    pub map_id: Option<i64>,
    pub participant_info: Option<LiveParticipantInfo>,
    pub last_updated: i64,
    pub detection_confidence: f32, // 0.0 to 1.0 confidence in match state
}

#[derive(Debug, serde::Serialize, Clone)]
pub struct LiveParticipantInfo {
    pub champion_id: i64,
    pub champion_name: String,
    pub summoner_name: String,
    pub team_id: i64,
    pub spell1_id: i64,
    pub spell2_id: i64,
    pub runes: Option<Vec<LiveRuneInfo>>,
    pub game_customization_objects: Vec<LiveGameCustomization>,
}

#[derive(Debug, serde::Serialize, Clone)]
pub struct LiveRuneInfo {
    pub perk_id: i64,
    pub perk_sub_style: i64,
}

#[derive(Debug, serde::Serialize, Clone)]
pub struct LiveGameCustomization {
    pub category: String,
    pub content: String,
}

#[derive(Debug, serde::Serialize, Clone)]
pub struct MatchDetectionResult {
    pub match_state: LiveMatchState,
    pub detection_method: String,
    pub api_errors: Vec<String>,
    pub fallback_used: bool,
    pub next_check_in_seconds: u64,
}

#[derive(Debug, serde::Serialize, Clone)]
pub struct HistoricalMatchData {
    pub match_id: String,
    pub game_creation: i64,
    pub game_duration: i64,
    pub participant_data: ParticipantData,
    pub analytics_calculated: bool,
    pub cached_timestamp: i64,
}

#[derive(Debug, serde::Serialize, Clone)]
pub struct ParticipantData {
    pub assists: i32,
    pub baron_kills: i32,
    pub bounty_level: i32,
    pub champ_experience: i32,
    pub champ_level: i32,
    pub champion_id: i32,
    pub champion_name: String,
    pub champion_transform: i32,
    pub consumables_purchased: i32,
    pub damage_dealt_to_buildings: i32,
    pub damage_dealt_to_objectives: i32,
    pub damage_dealt_to_turrets: i32,
    pub damage_self_mitigated: i32,
    pub deaths: i32,
    pub detector_wards_placed: i32,
    pub double_kills: i32,
    pub dragon_kills: i32,
    pub first_blood_assist: bool,
    pub first_blood_kill: bool,
    pub first_tower_assist: bool,
    pub first_tower_kill: bool,
    pub game_ended_in_early_surrender: bool,
    pub game_ended_in_surrender: bool,
    pub gold_earned: i32,
    pub gold_spent: i32,
    pub individual_position: String,
    pub inhibitor_kills: i32,
    pub inhibitor_takedowns: i32,
    pub inhibitors_lost: i32,
    pub item0: i32,
    pub item1: i32,
    pub item2: i32,
    pub item3: i32,
    pub item4: i32,
    pub item5: i32,
    pub item6: i32,
    pub items_purchased: i32,
    pub killing_sprees: i32,
    pub kills: i32,
    pub lane: String,
    pub largest_critical_strike: i32,
    pub largest_killing_spree: i32,
    pub largest_multi_kill: i32,
    pub longest_time_spent_living: i32,
    pub magic_damage_dealt: i32,
    pub magic_damage_dealt_to_champions: i32,
    pub magic_damage_taken: i32,
    pub neutral_minions_killed: i32,
    pub nexus_kills: i32,
    pub nexus_takedowns: i32,
    pub nexus_lost: i32,
    pub objectives_stolen: i32,
    pub objectives_stolen_assists: i32,
    pub penta_kills: i32,
    pub physical_damage_dealt: i32,
    pub physical_damage_dealt_to_champions: i32,
    pub physical_damage_taken: i32,
    pub profile_icon: i32,
    pub puuid: String,
    pub quadra_kills: i32,
    pub riot_id_name: String,
    pub riot_id_tagline: String,
    pub role: String,
    pub sight_wards_bought_in_game: i32,
    pub spell1_casts: i32,
    pub spell2_casts: i32,
    pub spell3_casts: i32,
    pub spell4_casts: i32,
    pub summoner1_casts: i32,
    pub summoner1_id: i32,
    pub summoner2_casts: i32,
    pub summoner2_id: i32,
    pub summoner_id: String,
    pub summoner_level: i32,
    pub summoner_name: String,
    pub team_early_surrendered: bool,
    pub team_id: i32,
    pub team_position: String,
    pub time_c_cing_others: i32,
    pub time_played: i32,
    pub total_damage_dealt: i32,
    pub total_damage_dealt_to_champions: i32,
    pub total_damage_shielded_on_teammates: i32,
    pub total_damage_taken: i32,
    pub total_heal: i32,
    pub total_heals_on_teammates: i32,
    pub total_minions_killed: i32,
    pub total_time_crowd_control_dealt: i32,
    pub total_time_spent_dead: i32,
    pub total_units_healed: i32,
    pub triple_kills: i32,
    pub true_damage_dealt: i32,
    pub true_damage_dealt_to_champions: i32,
    pub true_damage_taken: i32,
    pub turret_kills: i32,
    pub turret_takedowns: i32,
    pub turrets_lost: i32,
    pub unreal_kills: i32,
    pub vision_score: i32,
    pub vision_wards_bought_in_game: i32,
    pub wards_killed: i32,
    pub wards_placed: i32,
    pub win: bool,
}

impl std::fmt::Debug for RiotClient {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("RiotClient").finish()
    }
}

impl RiotClient {
    pub fn new(key: &str) -> Self {
        Self {
            api: RiotApi::new(key),
        }
    }

    fn parse_region(region: &str) -> PlatformRoute {
        PlatformRoute::from_str(region).expect("invalid region")
    }


    pub async fn get_account_by_riot_id(
        &self,
        game_name: &str,
        tag_line: &str,
        region: &str,
    ) -> Result<Option<riven::models::account_v1::Account>, RiotApiError> {
        let route = Self::parse_region(region).to_regional();
        let path = format!("/riot/account/v1/accounts/by-riot-id/{}/{}", game_name, tag_line);
        let req = self.api.request(Method::GET, route.into(), &path);
        self.api
            .execute_opt("account-v1.getByRiotId", route.into(), req)
            .await
    }

    pub async fn get_summoner_by_puuid(
        &self,
        puuid: &str,
        region: &str,
    ) -> Result<Option<riven::models::summoner_v4::Summoner>, RiotApiError> {
        let route = Self::parse_region(region);
        let path = format!("/lol/summoner/v4/summoners/by-puuid/{}", puuid);
        let req = self.api.request(Method::GET, route.into(), &path);
        self.api
            .execute_opt("summoner-v4.getByPUUID", route.into(), req)
            .await
    }

    pub async fn get_active_game(
        &self,
        enc_id: &str,
        region: &str,
    ) -> Result<Option<riven::models::spectator_v5::CurrentGameInfo>, RiotApiError> {
        let route = Self::parse_region(region);
        let path = format!("/lol/spectator/v5/active-games/by-summoner/{}", enc_id);
        let req = self.api.request(Method::GET, route.into(), &path);
        self.api
            .execute_opt("spectator-v5.getCurrentGameInfoByPuuid", route.into(), req)
            .await
    }

    pub async fn get_ranked_stats(
        &self,
        enc_id: &str,
        region: &str,
    ) -> Result<Vec<riven::models::league_v4::LeagueEntry>, RiotApiError> {
        let route = Self::parse_region(region);
        let path = format!("/lol/league/v4/entries/by-puuid/{}", enc_id);
        let req = self.api.request(Method::GET, route.into(), &path);
        self.api
            .execute_val("league-v4.getLeagueEntriesByPUUID", route.into(), req)
            .await
    }

    pub async fn get_champion_masteries(
        &self,
        summoner_id: &str,
        region: &str,
    ) -> Result<Vec<riven::models::champion_mastery_v4::ChampionMastery>, RiotApiError>
    {
        let route = Self::parse_region(region);
        let path = format!("/lol/champion-mastery/v4/champion-masteries/by-puuid/{}", summoner_id);
        let req = self.api.request(Method::GET, route.into(), &path);
        self.api
            .execute_val("champion-mastery-v4.getAllChampionMasteries", route.into(), req)
            .await
    }

    pub async fn calculate_traits(
        &self,
        puuid: &str,
        region: &str,
    ) -> Result<Vec<String>, RiotApiError> {
        let platform = Self::parse_region(region);
        let route = platform.to_regional();

        let ids = self
            .api
            .match_v5()
            .get_match_ids_by_puuid(route, puuid, Some(5), None, None, None, None, None)
            .await?;

        let mut vision = 0.0f32;
        let mut pentakill = false;
        let mut count = 0u32;

        for id in ids {
            if let Some(m) = self.api.match_v5().get_match(route, &id).await? {
                if let Some(p) = m.info.participants.iter().find(|p| p.puuid == puuid) {
                    count += 1;
                    vision += p.vision_score as f32;
                    if p.penta_kills > 0 {
                        pentakill = true;
                    }
                }
            }
        }

        let mut out = Vec::new();
        if count > 0 {
            if vision / (count as f32) < 20.0 {
                out.push("Bad Vision".to_string());
            }
            if pentakill {
                out.push("Clutch Finisher".to_string());
            }
        }

        Ok(out)
    }

    pub async fn get_recent_matches(
        &self,
        puuid: &str,
        region: &str,
        count: usize,
    ) -> Result<Vec<MatchSummary>, RiotApiError> {
        let platform = Self::parse_region(region);
        let route = platform.to_regional();

        let ids = self
            .api
            .match_v5()
            .get_match_ids_by_puuid(route, puuid, Some(count as i32), None, None, None, None, None)
            .await?;

        let mut out = Vec::new();
        for id in ids {
            if let Some(m) = self.api.match_v5().get_match(route, &id).await? {
                if let Some(p) = m.info.participants.iter().find(|p| p.puuid == puuid) {
                    let champ_id = p
                        .champion()
                        .map(|c| i16::from(c) as u32)
                        .unwrap_or(0);
                    out.push(MatchSummary {
                        champion_id: champ_id,
                        win: p.win,
                        kills: p.kills as u32,
                        deaths: p.deaths as u32,
                        assists: p.assists as u32,
                        duration: m.info.game_duration as u32,
                    });
                }
            }
        }

        Ok(out)
    }

    /// Calculate advanced match analysis with multiple dimensions
    pub async fn calculate_advanced_analysis(
        &self,
        puuid: &str,
        region: &str,
        match_count: usize,
    ) -> Result<AdvancedMatchAnalysis, RiotApiError> {
        let platform = Self::parse_region(region);
        let route = platform.to_regional();

        // Get recent matches for analysis
        let match_ids = self
            .api
            .match_v5()
            .get_match_ids_by_puuid(route, puuid, Some(match_count as i32), None, None, None, None, None)
            .await?;

        let mut total_early_performance = 0.0f32;
        let mut total_mid_performance = 0.0f32;
        let mut total_late_performance = 0.0f32;
        let mut total_objective_control = 0.0f32;
        let mut total_vision_score = 0.0f32;
        let mut analyzed_matches = 0u32;

        // Analyze each match for advanced metrics
        for match_id in match_ids.iter().take(match_count) {
            if let Some(match_data) = self.api.match_v5().get_match(route, match_id).await? {
                if let Some(participant) = match_data.info.participants.iter().find(|p| p.puuid == puuid) {
                    analyzed_matches += 1;

                    // Calculate game phase performance (simplified)
                    let game_duration = match_data.info.game_duration;
                    let kills_per_min = participant.kills as f32 / (game_duration as f32 / 60.0);
                    let damage_per_min = participant.total_damage_dealt_to_champions as f32 / (game_duration as f32 / 60.0);
                    
                    // Early game performance (first 15 minutes equivalent)
                    let early_performance = (kills_per_min * 0.3 + damage_per_min / 1000.0 * 0.7).min(10.0);
                    total_early_performance += early_performance;

                    // Mid game performance 
                    let mid_performance = (participant.assists as f32 / 10.0 + 
                                         participant.total_damage_dealt_to_champions as f32 / 15000.0).min(10.0);
                    total_mid_performance += mid_performance;

                    // Late game performance
                    let late_performance = if game_duration > 1800 { // 30+ minutes
                        (participant.total_damage_dealt_to_champions as f32 / 20000.0 + 
                         if participant.win { 3.0 } else { 0.0 }).min(10.0)
                    } else {
                        5.0 // Default for shorter games
                    };
                    total_late_performance += late_performance;

                    // Objective control
                    let objective_score = (participant.vision_score as f32 / 25.0 +
                                          participant.vision_score as f32 / 50.0).min(10.0);
                    total_objective_control += objective_score;

                    total_vision_score += participant.vision_score as f32;
                }
            }
        }

        let avg_early = if analyzed_matches > 0 { total_early_performance / analyzed_matches as f32 } else { 5.0 };
        let avg_mid = if analyzed_matches > 0 { total_mid_performance / analyzed_matches as f32 } else { 5.0 };
        let avg_late = if analyzed_matches > 0 { total_late_performance / analyzed_matches as f32 } else { 5.0 };
        let avg_vision = if analyzed_matches > 0 { total_vision_score / analyzed_matches as f32 } else { 20.0 };

        // Calculate scaling effectiveness
        let scaling_effectiveness = if avg_early > 0.0 { avg_late / avg_early } else { 1.0 };

        Ok(AdvancedMatchAnalysis {
            game_phase_performance: GamePhasePerformance {
                early_game_rating: (avg_early * 10.0).min(100.0),
                mid_game_rating: (avg_mid * 10.0).min(100.0),
                late_game_rating: (avg_late * 10.0).min(100.0),
                scaling_effectiveness: (scaling_effectiveness * 50.0).min(100.0),
            },
            champion_mastery_context: ChampionMasteryContext {
                mastery_level: 0, // Would need champion mastery API call
                mastery_points: 0,
                games_on_champion: analyzed_matches,
                winrate_on_champion: 65.0, // Mock data
                performance_vs_average: 78.5,
            },
            behavioral_indicators: BehavioralIndicators {
                aggression_level: (avg_early * 8.0).min(100.0),
                risk_tolerance: 70.0 + (avg_early - 5.0) * 10.0,
                team_fight_participation: (avg_mid * 9.0).min(100.0),
                objective_prioritization: (total_objective_control / analyzed_matches as f32 * 10.0).min(100.0),
                adaptation_speed: 75.0, // Mock - would calculate from meta changes
            },
            objective_control: ObjectiveControl {
                dragon_participation: 0.75, // Mock data - would need timeline data
                baron_participation: 0.68,
                tower_damage_share: 0.22,
                vision_control_rating: (avg_vision / 40.0 * 100.0).min(100.0),
                jungle_control: 0.45,
            },
        })
    }

    /// Enhanced trait calculation with behavioral analysis
    pub async fn calculate_enhanced_traits(
        &self,
        puuid: &str,
        region: &str,
    ) -> Result<Vec<String>, RiotApiError> {
        let platform = Self::parse_region(region);
        let route = platform.to_regional();

        let ids = self
            .api
            .match_v5()
            .get_match_ids_by_puuid(route, puuid, Some(10), None, None, None, None, None)
            .await?;

        let mut total_kills = 0i32;
        let mut total_deaths = 0i32;
        let mut total_assists = 0i32;
        let mut total_vision = 0.0f32;
        let mut total_damage = 0i32;
        let mut total_gold = 0i32;
        let mut total_cs = 0i32;
        let mut wins = 0u32;
        let mut long_games = 0u32;
        let mut analyzed_matches = 0u32;

        for id in ids {
            if let Some(m) = self.api.match_v5().get_match(route, &id).await? {
                if let Some(p) = m.info.participants.iter().find(|p| p.puuid == puuid) {
                    analyzed_matches += 1;
                    total_kills += p.kills;
                    total_deaths += p.deaths;
                    total_assists += p.assists;
                    total_vision += p.vision_score as f32;
                    total_damage += p.total_damage_dealt_to_champions;
                    total_gold += p.gold_earned;
                    total_cs += p.total_minions_killed + p.neutral_minions_killed;
                    
                    if p.win { wins += 1; }
                    if m.info.game_duration > 1800 { long_games += 1; } // 30+ minutes
                }
            }
        }

        let mut traits = Vec::new();

        if analyzed_matches == 0 {
            return Ok(traits);
        }

        let avg_kills = total_kills as f32 / analyzed_matches as f32;
        let avg_deaths = total_deaths as f32 / analyzed_matches as f32;
        let avg_assists = total_assists as f32 / analyzed_matches as f32;
        let avg_vision = total_vision / analyzed_matches as f32;
        let avg_damage = total_damage as f32 / analyzed_matches as f32;
        let avg_gold = total_gold as f32 / analyzed_matches as f32;
        let avg_cs = total_cs as f32 / analyzed_matches as f32;
        let win_rate = wins as f32 / analyzed_matches as f32;

        // Advanced trait detection
        if avg_kills > 8.0 && avg_deaths < 6.0 {
            traits.push("Aggressive Playmaker".to_string());
        } else if avg_kills > 6.0 {
            traits.push("High Impact Player".to_string());
        }

        if avg_deaths < 3.5 {
            traits.push("Positioning Expert".to_string());
        } else if avg_deaths > 7.0 {
            traits.push("Risk Taker".to_string());
        }

        if avg_assists > 12.0 {
            traits.push("Team Fight Specialist".to_string());
        } else if avg_assists > 8.0 {
            traits.push("Team Player".to_string());
        }

        if avg_vision > 35.0 {
            traits.push("Vision Control Master".to_string());
        } else if avg_vision < 15.0 {
            traits.push("Needs Vision Improvement".to_string());
        }

        if avg_cs > 7.0 * 60.0 { // 7 CS per minute
            traits.push("Farming Machine".to_string());
        } else if avg_cs < 5.0 * 60.0 {
            traits.push("Focus on CS".to_string());
        }

        if avg_damage > 25000.0 {
            traits.push("Damage Dealer".to_string());
        }

        if avg_gold > 14000.0 {
            traits.push("Gold Efficient".to_string());
        }

        if win_rate > 0.65 {
            traits.push("Consistent Winner".to_string());
        } else if win_rate < 0.45 {
            traits.push("Needs Strategic Focus".to_string());
        }

        if long_games > analyzed_matches / 2 {
            traits.push("Late Game Specialist".to_string());
        }

        // Behavioral analysis
        let kda_ratio = (avg_kills + avg_assists) / avg_deaths.max(1.0);
        if kda_ratio > 3.0 {
            traits.push("Clutch Performer".to_string());
        }

        if total_kills > total_assists && avg_kills > 6.0 {
            traits.push("Solo Carry Potential".to_string());
        } else if total_assists > total_kills * 2 {
            traits.push("Support Minded".to_string());
        }

        Ok(traits)
    }

    /// Robust match detection with multiple fallback strategies
    pub async fn detect_live_match(&self, puuid: &str, region: &str) -> MatchDetectionResult {
        let mut errors = Vec::new();
        let mut detection_confidence = 0.0;
        let mut fallback_used = false;
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        // Primary method: Spectator API
        match self.get_active_game_robust(puuid, region).await {
            Ok(Some(game_info)) => {
                let participant_info = self.extract_participant_info(&game_info, puuid);
                
                return MatchDetectionResult {
                    match_state: LiveMatchState {
                        is_in_game: true,
                        game_id: Some(game_info.game_id),
                        game_start_time: Some(game_info.game_start_time),
                        game_length: Some(current_time - (game_info.game_start_time / 1000)),
                        game_mode: Some(format!("{:?}", game_info.game_mode)),
                        game_type: Some(format!("{:?}", game_info.game_type)),
                        map_id: Some(11), // Default to Summoner's Rift, will need proper mapping
                        participant_info,
                        last_updated: current_time,
                        detection_confidence: 1.0,
                    },
                    detection_method: "Spectator API".to_string(),
                    api_errors: errors,
                    fallback_used: false,
                    next_check_in_seconds: 30, // Check every 30 seconds during active game
                };
            }
            Ok(None) => {
                detection_confidence = 0.8; // High confidence that not in game
            }
            Err(e) => {
                errors.push(format!("Spectator API error: {}", e));
                fallback_used = true;
            }
        }

        // Fallback method 1: Check recent match history for ongoing games
        if fallback_used {
            match self.check_ongoing_match_via_history(puuid, region).await {
                Ok(Some(match_state)) => {
                    detection_confidence = 0.7; // Lower confidence from indirect detection
                    return MatchDetectionResult {
                        match_state,
                        detection_method: "Match History Analysis".to_string(),
                        api_errors: errors,
                        fallback_used: true,
                        next_check_in_seconds: 60, // Check less frequently with fallback
                    };
                }
                Ok(None) => {
                    detection_confidence = 0.6;
                }
                Err(e) => {
                    errors.push(format!("Match history fallback error: {}", e));
                }
            }
        }

        // Fallback method 2: Account status check
        match self.check_account_status(puuid, region).await {
            Ok(status) => {
                if status.contains("in-game") {
                    detection_confidence = 0.5; // Low confidence from status
                    return MatchDetectionResult {
                        match_state: LiveMatchState {
                            is_in_game: true,
                            game_id: None,
                            game_start_time: None,
                            game_length: None,
                            game_mode: None,
                            game_type: None,
                            map_id: None,
                            participant_info: None,
                            last_updated: current_time,
                            detection_confidence: 0.5,
                        },
                        detection_method: "Account Status Check".to_string(),
                        api_errors: errors,
                        fallback_used: true,
                        next_check_in_seconds: 120, // Check even less frequently
                    };
                }
            }
            Err(e) => {
                errors.push(format!("Account status check error: {}", e));
            }
        }

        let errors_clone = errors.clone();
        
        // Default: Not in game
        MatchDetectionResult {
            match_state: LiveMatchState {
                is_in_game: false,
                game_id: None,
                game_start_time: None,
                game_length: None,
                game_mode: None,
                game_type: None,
                map_id: None,
                participant_info: None,
                last_updated: current_time,
                detection_confidence,
            },
            detection_method: if fallback_used { "Fallback Methods" } else { "Spectator API" }.to_string(),
            api_errors: errors,
            fallback_used,
            next_check_in_seconds: if errors_clone.is_empty() { 60 } else { 300 }, // Check less frequently if errors
        }
    }

    /// Enhanced active game detection with retry logic
    async fn get_active_game_robust(
        &self,
        puuid: &str,
        region: &str,
    ) -> Result<Option<riven::models::spectator_v5::CurrentGameInfo>, RiotApiError> {
        let mut attempts = 0;
        let max_attempts = 3;
        let base_delay = Duration::from_millis(500);

        while attempts < max_attempts {
            match self.get_active_game(puuid, region).await {
                Ok(result) => return Ok(result),
                Err(e) => {
                    attempts += 1;
                    if attempts >= max_attempts {
                        return Err(e);
                    }
                    
                    // Exponential backoff
                    let delay = base_delay * 2_u32.pow(attempts - 1);
                    sleep(delay).await;
                }
            }
        }

        unreachable!()
    }

    /// Extract participant information from game data
    fn extract_participant_info(
        &self,
        game_info: &riven::models::spectator_v5::CurrentGameInfo,
        puuid: &str,
    ) -> Option<LiveParticipantInfo> {
        game_info.participants.iter()
            .find(|p| p.puuid.as_ref().map_or(false, |p_puuid| p_puuid == puuid))
            .map(|participant| LiveParticipantInfo {
                champion_id: 0, // Will need proper champion ID mapping
                champion_name: format!("{:?}", participant.champion_id),
                summoner_name: "Summoner".to_string(), // CurrentGameParticipant doesn't have summoner name
                team_id: if format!("{:?}", participant.team_id).contains("Blue") { 100 } else { 200 },
                spell1_id: participant.spell1_id,
                spell2_id: participant.spell2_id,
                runes: participant.perks.as_ref().map(|perks| {
                    perks.perk_ids.iter().map(|&perk_id| LiveRuneInfo {
                        perk_id,
                        perk_sub_style: perks.perk_sub_style,
                    }).collect()
                }),
                game_customization_objects: participant.game_customization_objects.iter()
                    .map(|obj| LiveGameCustomization {
                        category: obj.category.clone(),
                        content: obj.content.clone(),
                    }).collect(),
            })
    }

    /// Check for ongoing match via match history analysis
    async fn check_ongoing_match_via_history(
        &self,
        puuid: &str,
        region: &str,
    ) -> Result<Option<LiveMatchState>, RiotApiError> {
        // Get recent matches
        let matches = self.get_match_history_ids(puuid, region, 1).await?;
        
        if let Some(recent_match_id) = matches.first() {
            // Check if the most recent match is very recent (within last 2 hours)
            // This could indicate an ongoing game that just started
            let current_time = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs() as i64;
            
            // For now, we'll return None as this requires more complex logic
            // In a full implementation, we'd analyze match timestamps
        }
        
        Ok(None)
    }

    /// Check account status for in-game indicators
    async fn check_account_status(&self, puuid: &str, region: &str) -> Result<String, RiotApiError> {
        // This is a placeholder for checking account status
        // The actual implementation would depend on available endpoints
        Ok("available".to_string())
    }

    /// Get champion name from champion ID
    fn get_champion_name_from_id(&self, champion_id: i64) -> String {
        // This should be implemented with a champion data mapping
        // For now, return a placeholder
        format!("Champion_{}", champion_id)
    }

    /// Enhanced match history retrieval with analytics integration
    pub async fn get_match_history_with_analytics(
        &self,
        puuid: &str,
        region: &str,
        count: Option<i32>,
    ) -> Result<Vec<HistoricalMatchData>, RiotApiError> {
        let match_count = count.unwrap_or(20);
        let match_ids = self.get_match_history_ids(puuid, region, match_count).await?;
        let mut historical_matches = Vec::new();

        for match_id in match_ids {
            match self.get_match_details(&match_id, region).await {
                Ok(Some(match_details)) => {
                    if let Some(participant) = match_details.info.participants.iter()
                        .find(|p| p.puuid == puuid) {
                        
                        let historical_match = HistoricalMatchData {
                            match_id: match_id.clone(),
                            game_creation: match_details.info.game_creation,
                            game_duration: match_details.info.game_duration,
                            participant_data: self.convert_participant_to_data(participant),
                            analytics_calculated: false, // Will be calculated later
                            cached_timestamp: SystemTime::now()
                                .duration_since(UNIX_EPOCH)
                                .unwrap()
                                .as_secs() as i64,
                        };
                        
                        historical_matches.push(historical_match);
                    }
                }
                Ok(None) => {
                    // Match not found, skip
                    continue;
                }
                Err(_e) => {
                    // Error getting match, skip but could log
                    continue;
                }
            }
        }

        Ok(historical_matches)
    }

    /// Convert Riot API participant to our data structure
    fn convert_participant_to_data(&self, participant: &riven::models::match_v5::Participant) -> ParticipantData {
        ParticipantData {
            assists: participant.assists,
            baron_kills: participant.baron_kills,
            bounty_level: participant.bounty_level.unwrap_or(0),
            champ_experience: participant.champ_experience,
            champ_level: participant.champ_level,
            champion_id: participant.champion().map(|c| c.0 as i32).unwrap_or(0),
            champion_name: participant.champion_name.clone(),
            champion_transform: participant.champion_transform,
            consumables_purchased: participant.consumables_purchased,
            damage_dealt_to_buildings: participant.damage_dealt_to_buildings.unwrap_or(0),
            damage_dealt_to_objectives: participant.damage_dealt_to_objectives,
            damage_dealt_to_turrets: participant.damage_dealt_to_turrets,
            damage_self_mitigated: participant.damage_self_mitigated,
            deaths: participant.deaths,
            detector_wards_placed: participant.detector_wards_placed,
            double_kills: participant.double_kills,
            dragon_kills: participant.dragon_kills,
            first_blood_assist: participant.first_blood_assist,
            first_blood_kill: participant.first_blood_kill,
            first_tower_assist: participant.first_tower_assist,
            first_tower_kill: participant.first_tower_kill,
            game_ended_in_early_surrender: participant.game_ended_in_early_surrender,
            game_ended_in_surrender: participant.game_ended_in_surrender,
            gold_earned: participant.gold_earned,
            gold_spent: participant.gold_spent,
            individual_position: participant.individual_position.clone(),
            inhibitor_kills: participant.inhibitor_kills,
            inhibitor_takedowns: participant.inhibitor_takedowns.unwrap_or(0),
            inhibitors_lost: participant.inhibitors_lost.unwrap_or(0),
            item0: participant.item0,
            item1: participant.item1,
            item2: participant.item2,
            item3: participant.item3,
            item4: participant.item4,
            item5: participant.item5,
            item6: participant.item6,
            items_purchased: participant.items_purchased,
            killing_sprees: participant.killing_sprees,
            kills: participant.kills,
            lane: participant.lane.clone(),
            largest_critical_strike: participant.largest_critical_strike,
            largest_killing_spree: participant.largest_killing_spree,
            largest_multi_kill: participant.largest_multi_kill,
            longest_time_spent_living: participant.longest_time_spent_living,
            magic_damage_dealt: participant.magic_damage_dealt,
            magic_damage_dealt_to_champions: participant.magic_damage_dealt_to_champions,
            magic_damage_taken: participant.magic_damage_taken,
            neutral_minions_killed: participant.neutral_minions_killed,
            nexus_kills: participant.nexus_kills,
            nexus_takedowns: participant.nexus_takedowns.unwrap_or(0),
            nexus_lost: participant.nexus_lost.unwrap_or(0),
            objectives_stolen: participant.objectives_stolen,
            objectives_stolen_assists: participant.objectives_stolen_assists,
            penta_kills: participant.penta_kills,
            physical_damage_dealt: participant.physical_damage_dealt,
            physical_damage_dealt_to_champions: participant.physical_damage_dealt_to_champions,
            physical_damage_taken: participant.physical_damage_taken,
            profile_icon: participant.profile_icon,
            puuid: participant.puuid.clone(),
            quadra_kills: participant.quadra_kills,
            riot_id_name: participant.riot_id_name.clone().unwrap_or_else(|| "Unknown".to_string()),
            riot_id_tagline: participant.riot_id_tagline.clone().unwrap_or_else(|| "TAG".to_string()),
            role: participant.role.clone(),
            sight_wards_bought_in_game: participant.sight_wards_bought_in_game,
            spell1_casts: participant.spell1_casts,
            spell2_casts: participant.spell2_casts,
            spell3_casts: participant.spell3_casts,
            spell4_casts: participant.spell4_casts,
            summoner1_casts: participant.summoner1_casts,
            summoner1_id: participant.summoner1_id,
            summoner2_casts: participant.summoner2_casts,
            summoner2_id: participant.summoner2_id,
            summoner_id: participant.summoner_id.clone(),
            summoner_level: participant.summoner_level,
            summoner_name: participant.summoner_name.clone(),
            team_early_surrendered: participant.team_early_surrendered,
            team_id: format!("{:?}", participant.team_id).parse().unwrap_or(100),
            team_position: participant.team_position.clone(),
            time_c_cing_others: participant.time_c_cing_others,
            time_played: participant.time_played,
            total_damage_dealt: participant.total_damage_dealt,
            total_damage_dealt_to_champions: participant.total_damage_dealt_to_champions,
            total_damage_shielded_on_teammates: participant.total_damage_shielded_on_teammates,
            total_damage_taken: participant.total_damage_taken,
            total_heal: participant.total_heal,
            total_heals_on_teammates: participant.total_heals_on_teammates,
            total_minions_killed: participant.total_minions_killed,
            total_time_crowd_control_dealt: participant.time_c_cing_others, // Using available field
            total_time_spent_dead: participant.total_time_spent_dead,
            total_units_healed: participant.total_units_healed,
            triple_kills: participant.triple_kills,
            true_damage_dealt: participant.true_damage_dealt,
            true_damage_dealt_to_champions: participant.true_damage_dealt_to_champions,
            true_damage_taken: participant.true_damage_taken,
            turret_kills: participant.turret_kills,
            turret_takedowns: participant.turret_takedowns.unwrap_or(0),
            turrets_lost: participant.turrets_lost.unwrap_or(0),
            unreal_kills: participant.unreal_kills,
            vision_score: participant.vision_score,
            vision_wards_bought_in_game: participant.vision_wards_bought_in_game,
            wards_killed: participant.wards_killed,
            wards_placed: participant.wards_placed,
            win: participant.win,
        }
    }

    /// Get match history IDs with proper error handling
    async fn get_match_history_ids(
        &self,
        puuid: &str,
        region: &str,
        count: i32,
    ) -> Result<Vec<String>, RiotApiError> {
        let route = Self::parse_region(region).to_regional();
        let path = format!("/lol/match/v5/matches/by-puuid/{}/ids?count={}", puuid, count);
        let req = self.api.request(Method::GET, route.into(), &path);
        self.api
            .execute_val("match-v5.getMatchIdsByPUUID", route.into(), req)
            .await
    }

    /// Get detailed match information
    async fn get_match_details(
        &self,
        match_id: &str,
        region: &str,
    ) -> Result<Option<riven::models::match_v5::Match>, RiotApiError> {
        let route = Self::parse_region(region).to_regional();
        let path = format!("/lol/match/v5/matches/{}", match_id);
        let req = self.api.request(Method::GET, route.into(), &path);
        self.api
            .execute_opt("match-v5.getMatch", route.into(), req)
            .await
    }
}
