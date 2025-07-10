use riven::{
    consts::PlatformRoute,
    reqwest::Method,
    RiotApi, RiotApiError,
};
use std::str::FromStr;

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
}
