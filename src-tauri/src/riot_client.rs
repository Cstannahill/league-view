use riven::{RiotApi, RiotApiError, consts::PlatformRoute};
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
}
