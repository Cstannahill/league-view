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
  Button
} from '@chakra-ui/react';
import { FaTrophy, FaCrown, FaSkull, FaRedo } from 'react-icons/fa';
import { GameSummary } from '../../store';
import { useStore } from '../../store';
import { useRecentGames } from '../../hooks/useApiWithRetry';

interface Props {
  autoLoad?: boolean;
}

// Memoized game item component to prevent unnecessary re-renders
const GameItem = React.memo(({ game, index, calculateKDA, formatDuration }: { game: GameSummary; index: number, calculateKDA: (kills: number, deaths: number, assists: number) => string, formatDuration: (seconds: number) => string }) => {
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

export default function RecentGames({ autoLoad = true }: Props) {
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

  const calculateKDA = useCallback((kills: number, deaths: number, assists: number) => {
    const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;
    return kda.toFixed(2);
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  }, []);

  // Load games effect
  useEffect(() => {
    if (!autoLoad || !hasValidSummoner) {
      return;
    }
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

  const winCount = winStats.winCount;
  const winRate = winStats.winRate;

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
            colorScheme={parseFloat(winRate) >= 50 ? 'green' : 'red'}
            variant="solid"
            fontSize="sm"
          >
            {winCount}W {games.length - winCount}L ({winRate}%)
          </Badge>
        </HStack>

        {/* Games List */}
        <VStack spacing={2}>
          {games.map((game, index) => (
            <GameItem key={`${game.champion_id}-${index}`} game={game} index={index} calculateKDA={calculateKDA} formatDuration={formatDuration} />
          ))}
        </VStack>

        {/* Summary Stats */}
        <SimpleGrid columns={3} spacing={4} pt={2}>
          <Box textAlign="center">
            <Text fontSize="lg" fontWeight="bold" color="white">
              {(games.reduce((sum, g) => sum + g.kills, 0) / games.length).toFixed(1)}
            </Text>
            <Text fontSize="xs" color="gray.400">Avg Kills</Text>
          </Box>
          <Box textAlign="center">
            <Text fontSize="lg" fontWeight="bold" color="white">
              {(games.reduce((sum, g) => sum + g.deaths, 0) / games.length).toFixed(1)}
            </Text>
            <Text fontSize="xs" color="gray.400">Avg Deaths</Text>
          </Box>
          <Box textAlign="center">
            <Text fontSize="lg" fontWeight="bold" color="white">
              {(games.reduce((sum, g) => sum + g.assists, 0) / games.length).toFixed(1)}
            </Text>
            <Text fontSize="xs" color="gray.400">Avg Assists</Text>
          </Box>
        </SimpleGrid>
      </VStack>
    </Box>
  );
}
