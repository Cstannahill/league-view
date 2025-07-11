import { Box, SimpleGrid, VStack, Text, Divider, Icon, Flex } from '@chakra-ui/react';
import { FaShieldAlt } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import { MatchPayload } from '../../store';
import PlayerCard from './PlayerCard';

interface Props {
  data: MatchPayload | null;
}

export default function MatchView({ data }: Props) {
  if (!data) return <Box p={4} textAlign="center" color="gray.400">Loading match data...</Box>;

  // Separate players by team
  const blueTeam = data.game.participants.filter((p: any) => p.teamId === 100);
  const redTeam = data.game.participants.filter((p: any) => p.teamId === 200);

  const getTeamData = (players: any[], startIndex: number) => {
    return players.map((player, idx) => {
      const globalIndex = startIndex + idx;
      return {
        player,
        ranked: data.ranked[globalIndex] || [],
        traits: data.traits[globalIndex] || []
      };
    });
  };

  const blueTeamData = getTeamData(blueTeam, 0);
  const redTeamData = getTeamData(redTeam, 5);

  return (
    <Box p={4} maxW="1200px" mx="auto">
      <VStack spacing={6}>
        {/* Game Info Header */}
        <Box textAlign="center" py={4}>
          <Text fontSize="xl" fontWeight="bold" color="white" mb={2}>
            Live Match Analysis
          </Text>
          <Text fontSize="sm" color="gray.400">
            Game ID: {data.game.gameId} • Mode: {data.game.gameMode}
          </Text>
        </Box>

        {/* Teams Layout */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} w="full">
          {/* Blue Team */}
          <VStack spacing={4}>
            <Flex align="center" gap={2} color="blue.400">
              <Icon as={FaShieldAlt} />
              <Text fontSize="lg" fontWeight="bold">
                Blue Team
              </Text>
            </Flex>
            <VStack spacing={3} w="full">
              {blueTeamData.map((data, idx) => (
                <PlayerCard
                  key={`blue-${idx}`}
                  player={data.player}
                  ranked={data.ranked}
                  traits={data.traits}
                />
              ))}
            </VStack>
          </VStack>

          {/* Red Team */}
          <VStack spacing={4}>
            <Flex align="center" gap={2} color="red.400">
              <Icon as={GiCrossedSwords} />
              <Text fontSize="lg" fontWeight="bold">
                Red Team
              </Text>
            </Flex>
            <VStack spacing={3} w="full">
              {redTeamData.map((data, idx) => (
                <PlayerCard
                  key={`red-${idx}`}
                  player={data.player}
                  ranked={data.ranked}
                  traits={data.traits}
                />
              ))}
            </VStack>
          </VStack>
        </SimpleGrid>

        {/* Game Duration */}
        <Divider borderColor="gray.600" />
        <Text fontSize="sm" color="gray.400" textAlign="center">
          Game Length: {Math.floor(data.game.gameLength / 60)}:{(data.game.gameLength % 60).toString().padStart(2, '0')}
        </Text>
      </VStack>
    </Box>
  );
}
