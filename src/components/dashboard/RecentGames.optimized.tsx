import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Badge,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  Button,
} from '@chakra-ui/react';
import { FaTrophy, FaCrown, FaSkull, FaRedo } from 'react-icons/fa';
import { GameSummary } from '../../store';
import { useStore } from '../../store';
import { useRecentGames } from '../../hooks/useApiWithRetry';

interface Props {
  autoLoad?: boolean;
}

// Memoized game item component to prevent unnecessary re-renders
const GameItem = React.memo(({ game, index }: { game: GameSummary; index: number }) => {
  const calculateKDA = useCallback((kills: number, deaths: number, assists: number) => {
    const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;
    return kda.toFixed(2);
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  }, []);

  return (
    <Box
      key={index}
      p={3}
      bg={game.win ? "green.900" : "red.900"}
      borderRadius="md"
      borderLeft="4px solid"
      borderLeftColor={game.win ? "green.400" : "red.400"}
      w="full"
    >
      <HStack justify="space-between" align="center">
        <VStack align="start" spacing={1}>
          <HStack>
            <Text fontWeight="bold" color="white" fontSize="sm">
              {game.champion_name}
            </Text>
            <Badge
              variant="subtle"
              colorScheme={game.win ? "green" : "red"}
              fontSize="xs"
            >
              {game.win ? "Victory" : "Defeat"}
            </Badge>
          </HStack>
          <HStack spacing={3} fontSize="xs" color="gray.300">
            <HStack>
              <Icon as={FaCrown} color="yellow.400" boxSize={3} />
              <Text>{game.kills}</Text>
            </HStack>
            <HStack>
              <Icon as={FaSkull} color="red.400" boxSize={3} />
              <Text>{game.deaths}</Text>
            </HStack>
            <HStack>
              <Text color="blue.400">A</Text>
              <Text>{game.assists}</Text>
            </HStack>
          </HStack>
        </VStack>

        <VStack align="end" spacing={1}>
          <Text fontSize="sm" fontWeight="bold" color="white">
            {calculateKDA(game.kills, game.deaths, game.assists)} KDA
          </Text>
          <Text fontSize="xs" color="gray.400">
            {formatDuration(game.duration)}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
});

GameItem.displayName = 'GameItem';

// Memoized summary stats component
const SummaryStats = React.memo(({ games }: { games: GameSummary[] }) => {
  const avgStats = useMemo(() => {
    if (games.length === 0) return { kills: 0, deaths: 0, assists: 0 };
    
    return {
      kills: (games.reduce((sum, g) => sum + g.kills, 0) / games.length).toFixed(1),
      deaths: (games.reduce((sum, g) => sum + g.deaths, 0) / games.length).toFixed(1),
      assists: (games.reduce((sum, g) => sum + g.assists, 0) / games.length).toFixed(1)
    };
  }, [games]);

  return (
    <SimpleGrid columns={3} spacing={4} pt={2}>
      <Box textAlign="center">
        <Text fontSize="lg" fontWeight="bold" color="white">
          {avgStats.kills}
        </Text>
        <Text fontSize="xs" color="gray.400">Avg Kills</Text>
      </Box>
      <Box textAlign="center">
        <Text fontSize="lg" fontWeight="bold" color="white">
          {avgStats.deaths}
        </Text>
        <Text fontSize="xs" color="gray.400">Avg Deaths</Text>
      </Box>
      <Box textAlign="center">
        <Text fontSize="lg" fontWeight="bold" color="white">
          {avgStats.assists}
        </Text>
        <Text fontSize="xs" color="gray.400">Avg Assists</Text>
      </Box>
    </SimpleGrid>
  );
});

SummaryStats.displayName = 'SummaryStats';

const RecentGames: React.FC<Props> = React.memo(({ autoLoad = true }) => {
  const { gameName, tagLine, region } = useStore();
  const { 
    data: recentGamesData, 
    loading: retryLoading, 
    error: retryError, 
    execute: loadGames,
    retry 
  } = useRecentGames(10);

  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasValidSummoner = useMemo(() => 
    Boolean(gameName && tagLine && region), 
    [gameName, tagLine, region]
  );

  // Optimized effect with proper dependencies
  useEffect(() => {
    if (!autoLoad || !hasValidSummoner) {
      return;
    }

    // Load games using the retry mechanism
    loadGames();
  }, [autoLoad, hasValidSummoner, loadGames]);

  // Update local state when retry data changes
  useEffect(() => {
    if (recentGamesData) {
      setGames(recentGamesData as GameSummary[]);
      setError(null);
    }
    if (retryError) {
      setError(retryError);
    }
    setLoading(retryLoading);
  }, [recentGamesData, retryError, retryLoading]);

  // Memoized win rate calculation
  const winStats = useMemo(() => {
    if (games.length === 0) return { winCount: 0, winRate: '0.0' };
    
    const winCount = games.filter(g => g.win).length;
    const winRate = ((winCount / games.length) * 100).toFixed(1);
    return { winCount, winRate };
  }, [games]);

  // Memoized rendered games list
  const renderedGames = useMemo(() => 
    games.map((game, index) => (
      <GameItem key={`${game.champion_id}-${index}`} game={game} index={index} />
    )), 
    [games]
  );

  if (!hasValidSummoner) {
    return (
      <Box p={4} bg="gray.700" borderRadius="lg" textAlign="center">
        <Text color="gray.400">Recent games will appear after setting up your summoner</Text>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box p={4} bg="gray.700" borderRadius="lg" textAlign="center">
        <Spinner color="blue.400" />
        <Text mt={2} color="gray.400">Loading recent games...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" bg="gray.700" borderRadius="lg">
        <AlertIcon />
        <VStack align="start" flex="1" spacing={2}>
          <Text>{error}</Text>
          <Button
            size="sm"
            colorScheme="red"
            variant="outline"
            leftIcon={<Icon as={FaRedo} />}
            onClick={retry}
            isLoading={loading}
          >
            Retry
          </Button>
        </VStack>
      </Alert>
    );
  }

  if (games.length === 0) {
    return (
      <Box p={4} bg="gray.700" borderRadius="lg" textAlign="center">
        <Text color="gray.400">No recent games found</Text>
      </Box>
    );
  }

  return (
    <Box p={4} bg="gray.700" borderRadius="lg" border="1px solid" borderColor="gray.600">
      <VStack align="stretch" spacing={4}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack>
            <Icon as={FaTrophy} color="yellow.400" />
            <Text fontSize="lg" fontWeight="bold" color="white">
              Recent Games
            </Text>
          </HStack>
          <Badge
            colorScheme={parseFloat(winStats.winRate) >= 50 ? 'green' : 'red'}
            variant="solid"
            fontSize="sm"
          >
            {winStats.winCount}W {games.length - winStats.winCount}L ({winStats.winRate}%)
          </Badge>
        </HStack>

        {/* Games List */}
        <VStack spacing={2}>
          {renderedGames}
        </VStack>

        {/* Summary Stats */}
        <SummaryStats games={games} />
      </VStack>
    </Box>
  );
});

RecentGames.displayName = 'RecentGames';

export default RecentGames;
