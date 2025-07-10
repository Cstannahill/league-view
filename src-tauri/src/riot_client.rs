use riven::{RiotApi, RiotApiError, consts::{PlatformRoute, RegionalRoute}};
use std::str::FromStr;

/// Wrapper around [`RiotApi`] with helpers for common calls.
pub struct RiotClient {
    api: RiotApi,
}

impl RiotClient {
    pub fn new(key: &str) -> Self {
        Self { api: RiotApi::new(key) }
    }

    fn parse_region(region: &str) -> PlatformRoute {
        PlatformRoute::from_str(region).expect("invalid region")
    }

    /// Get a summoner by name.
    pub async fn get_summoner_by_name(
        &self,
        name: &str,
        region: &str,
    ) -> Result<riven::models::summoner_v4::Summoner, RiotApiError> {
        let route = Self::parse_region(region);
        // Summoner-v4 by-name endpoint was removed from riven meta, so construct manually
        let path = format!("/lol/summoner/v4/summoners/by-name/{}", name);
        let req = self.api.request(reqwest::Method::GET, route.into(), &path);
        self.api
            .execute_val("summoner-v4.getBySummonerName", route.into(), req)
            .await
    }

    /// Get active game information for the summoner.
    pub async fn get_active_game(
        &self,
        enc_id: &str,
        region: &str,
    ) -> Result<Option<riven::models::spectator_v5::CurrentGameInfo>, RiotApiError> {
        let route = Self::parse_region(region);
        let path = format!(
            "/lol/spectator/v5/active-games/by-summoner/{}",
            enc_id
        );
        let req = self.api.request(reqwest::Method::GET, route.into(), &path);
        self.api
            .execute_opt("spectator-v5.getCurrentGameInfoByPuuid", route.into(), req)
            .await
    }

    /// Get ranked stats for the summoner.
    pub async fn get_ranked_stats(
        &self,
        enc_id: &str,
        region: &str,
    ) -> Result<Vec<riven::models::league_v4::LeagueEntry>, RiotApiError> {
        let route = Self::parse_region(region);
        let path = format!("/lol/league/v4/entries/by-puuid/{}", enc_id);
        let req = self.api.request(reqwest::Method::GET, route.into(), &path);
        self.api
            .execute_val("league-v4.getLeagueEntriesByPUUID", route.into(), req)
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
            .endpoints()
            .match_v5()
            .get_match_ids_by_puuid(route, puuid, Some(5), None, None, None, None, None)
            .await?;
        let mut vision = 0.0f32;
        let mut roam = 0u32;
        let mut pentakill = false;
        let mut count = 0u32;
        for id in ids {
            if let Some(m) = self.api.endpoints().match_v5().get_match(route, &id).await? {
                if let Some(p) = m.info.participants.iter().find(|p| p.puuid == puuid) {
                    count += 1;
                    if let Some(v) = p.vision_score {
                        vision += v as f32;
                    }
                    if let Some(k) = p.kills_on_other_lanes_early_jungle_as_laner {
                        roam += k as u32;
                    }
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
            if (roam as f32) / (count as f32) > 1.0 {
                out.push("Roamer".to_string());
            }
            if pentakill {
                out.push("Clutch Finisher".to_string());
            }
        }
        Ok(out)
    }
}
