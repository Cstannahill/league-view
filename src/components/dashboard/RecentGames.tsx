import { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import { FaTrophy, FaCrown, FaSkull } from 'react-icons/fa';
import { invoke } from '@tauri-apps/api/core';
import { GameSummary } from '../../store';
import { useStore } from '../../store';

interface Props {
  autoLoad?: boolean;
}

export default function RecentGames({ autoLoad = true }: Props) {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { gameName, tagLine, region } = useStore();

  const hasValidSummoner = Boolean(gameName && tagLine && region);

  useEffect(() => {
    if (!autoLoad || !hasValidSummoner) {
      return;
    }

    const loadGames = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await invoke('recent_games', { count: 10 });
        setGames(result as GameSummary[]);
      } catch (err) {
        setError('Failed to load recent games');
        console.error('Error loading recent games:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, [autoLoad, hasValidSummoner, gameName, tagLine, region]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const calculateKDA = (kills: number, deaths: number, assists: number) => {
    const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;
    return kda.toFixed(2);
  };

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
        {error}
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

  const winCount = games.filter(g => g.win).length;
  const winRate = ((winCount / games.length) * 100).toFixed(1);

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
