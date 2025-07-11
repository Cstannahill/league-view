import { Box, HStack, VStack, Tag, Text, Badge, Flex, Spacer, Icon } from '@chakra-ui/react';
import { FaCrown, FaFire, FaSnowflake, FaTrophy } from 'react-icons/fa';
import { BadgeCalculationService, MockDataGenerator } from '../../services/badgeService';
import { useMemo } from 'react';

interface Props {
  player: any;
  ranked: any[];
  traits: string[];
}

const getRankColor = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case 'challenger': return 'purple.400';
    case 'grandmaster': return 'red.400';
    case 'master': return 'purple.300';
    case 'diamond': return 'blue.400';
    case 'emerald': return 'green.400';
    case 'platinum': return 'cyan.400';
    case 'gold': return 'yellow.400';
    case 'silver': return 'gray.400';
    case 'bronze': return 'orange.400';
    case 'iron': return 'gray.600';
    default: return 'gray.400';
  }
};

const getTeamColor = (teamId: number) => {
  return teamId === 100 ? 'blue.500' : 'red.500';
};

export default function PlayerCard({ player, ranked, traits }: Props) {
  const entry = ranked && ranked[0];
  const isRanked = entry && entry.tier;
  const winRate = entry ? ((entry.wins / (entry.wins + entry.losses)) * 100).toFixed(1) : null;

  // Generate mock player stats and calculate badges for demonstration
  const playerBadges = useMemo(() => {
    const mockStats = MockDataGenerator.generateMockPlayerStats(player.role || 'mid');
    const badgeData = BadgeCalculationService.evaluatePlayerBadges(mockStats);
    // Return top 2 badges for compact display
    return badgeData.badges.slice(0, 2);
  }, [player]);

  return (
    <Box
      borderWidth="2px"
      borderColor={getTeamColor(player.teamId)}
      borderRadius="lg"
      p={3}
      bg="gray.800"
      _hover={{ bg: "gray.700" }}
      transition="all 0.2s"
    >
      <VStack align="start" spacing={2}>
        {/* Player Name and Champion */}
        <Flex w="full" align="center">
          <VStack align="start" spacing={0} flex={1}>
            <Text fontWeight="bold" color="white" fontSize="sm" noOfLines={1}>
              {player.summonerName}
            </Text>
            <Text fontSize="xs" color="gray.400">
              Champion: {player.championId} {/* You might want to map this to champion name */}
            </Text>
          </VStack>
          {player.teamId === 100 && (
            <Icon as={FaCrown} color="blue.400" boxSize={3} />
          )}
        </Flex>

        {/* Rank Information */}
        {isRanked ? (
          <HStack spacing={2} w="full">
            <Badge
              colorScheme="blue"
              variant="solid"
              fontSize="xs"
              color={getRankColor(entry.tier)}
              bg="gray.700"
            >
              {entry.tier} {entry.rank}
            </Badge>
            <Text fontSize="xs" color="gray.400">
              {entry.leaguePoints} LP
            </Text>
            <Spacer />
            {winRate && (
              <Text fontSize="xs" color={parseFloat(winRate) >= 50 ? "green.400" : "red.400"}>
                {winRate}% WR
              </Text>
            )}
          </HStack>
        ) : (
          <Badge variant="outline" colorScheme="gray" fontSize="xs">
            Unranked
          </Badge>
        )}

        {/* Traits */}
        {traits && traits.length > 0 && (
          <HStack spacing={1} wrap="wrap" w="full">
            {traits.slice(0, 3).map((trait, i) => {
              const isHotStreak = trait.toLowerCase().includes('hot') || trait.toLowerCase().includes('fire');
              const isColdStreak = trait.toLowerCase().includes('cold') || trait.toLowerCase().includes('bad');

              return (
                <Tag
                  key={i}
                  size="sm"
                  variant="subtle"
                  colorScheme={isHotStreak ? "red" : isColdStreak ? "blue" : "gray"}
                  fontSize="xs"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  {isHotStreak && <Icon as={FaFire} boxSize={2} />}
                  {isColdStreak && <Icon as={FaSnowflake} boxSize={2} />}
                  {trait}
                </Tag>
              );
            })}
            {traits.length > 3 && (
              <Tag size="sm" variant="subtle" colorScheme="gray" fontSize="xs">
                +{traits.length - 3}
              </Tag>
            )}
          </HStack>
        )}

        {/* Match count indicator */}
        {entry && (
          <Text fontSize="xs" color="gray.500">
            {entry.wins + entry.losses} games this season
          </Text>
        )}

        {/* Player Badges - New Section */}
        {playerBadges.length > 0 && (
          <HStack spacing={1} w="full">
            <Icon as={FaTrophy} boxSize={3} color="yellow.400" />
            <HStack spacing={1} wrap="wrap" flex={1}>
              {playerBadges.map((badge) => (
                <Tag
                  key={badge.id}
                  size="sm"
                  variant="solid"
                  colorScheme={badge.tier === 'gold' ? 'yellow' : badge.tier === 'silver' ? 'gray' : 'orange'}
                  fontSize="xs"
                  title={badge.description}
                >
                  {badge.name}
                </Tag>
              ))}
            </HStack>
          </HStack>
        )}
      </VStack>
    </Box>
  );
}
