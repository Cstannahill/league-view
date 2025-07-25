import React, { useMemo } from 'react';
import { SimpleGrid } from '@chakra-ui/react';

interface BadgeDisplayProps {
  compactView?: boolean;
  hasValidSummoner?: boolean;
  playerBadgeData?: {
    badges: any[];
    badgeProgress: Map<string, number>;
  };
}

const mockData: { badges: any[]; badgeProgress: Map<string, number> } = {
  badges: [],
  badgeProgress: new Map<string, number>()
};

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ compactView = false, hasValidSummoner = false, playerBadgeData }) => {
  // Simulate selectedCategory state for demo
  const selectedCategory = 'all';

  if (!hasValidSummoner) {
    return (
      <Box p={4} textAlign="center">
        <VStack spacing={2}>
          <Icon as={FaTrophy} size="3xl" color="gray.400" />
          <Text fontSize="lg" fontWeight="semibold" color="gray.600">Player Badges</Text>
          <Text textAlign="center" color="gray.500" maxW="md">Player badges will be available after setting up your summoner information.</Text>
        </VStack>
      </Box>
    );
  }

  const data = playerBadgeData || mockData;

  if (!data) {
    return (
      <Box p={4} textAlign="center">
        <Text>Loading badge data...</Text>
      </Box>
    );
  }

  // Filter badges by category
  const filteredBadges = useMemo(() => selectedCategory === 'all'
    ? data.badges
    : data.badges.filter((badge: any) => badge.category === selectedCategory), [data.badges, selectedCategory]);

  // Get badge progress for unearned badges
  const progressBadges = Array.from(data.badgeProgress.entries() as Iterable<[string, number]>)
    .filter((entry) => entry[1] > 25)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Removed unused cardBg and borderColor

  if (compactView) {
    return (
      <Box>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
          {filteredBadges.map((badge: any) => (
            <BadgeCard key={badge.id} badge={badge} showProgress={true} />
          ))}
        </SimpleGrid>
      </Box>
    );
  }

  return (
    <Box>
      <VStack align="stretch" spacing={4}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {filteredBadges.map((badge: any) => (
            <BadgeCard key={badge.id} badge={badge} showProgress={true} />
          ))}
        </SimpleGrid>
        {progressBadges.length > 0 && (
          <Box>
            <Heading size="md" mb={4}>Badge Progress</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {progressBadges.map(([badgeId, progress]) => (
                <BadgeProgressCard key={badgeId} badgeId={badgeId} progress={progress} />
              ))}
            </SimpleGrid>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default BadgeDisplay;
// import React from 'react';
import { Box, VStack, HStack, Text, Badge as ChakraBadge, Progress, Card, CardHeader, CardBody, Heading, Icon } from '@chakra-ui/react';
import { FaTrophy } from 'react-icons/fa';
import { Badge, BadgeCategory, BadgeTier } from '../../types/badges';
import { BadgeCalculationService } from '../../services/badgeService';

const tierColors = {
    [BadgeTier.BRONZE]: 'orange.400',
    [BadgeTier.SILVER]: 'gray.400',
    [BadgeTier.GOLD]: 'yellow.400',
    [BadgeTier.PLATINUM]: 'cyan.400',
    [BadgeTier.DIAMOND]: 'blue.400'
};

const categoryIcons = {
    [BadgeCategory.STRATEGIC_MACRO]: FaTrophy,
    [BadgeCategory.RESOURCE_MANAGEMENT]: FaTrophy,
    [BadgeCategory.TEAMPLAY_SUPPORT]: FaTrophy,
    [BadgeCategory.ADAPTABILITY_RESILIENCE]: FaTrophy,
    [BadgeCategory.EARLY_GAME_LANING]: FaTrophy,
    [BadgeCategory.LATE_GAME_SCALING]: FaTrophy,
    [BadgeCategory.ANTI_CARRY_DISRUPTION]: FaTrophy
};

export const BadgeCard: React.FC<{ badge: Badge; showProgress?: boolean }> = React.memo(({ badge, showProgress = true }) => {
    const tierColor = tierColors[badge.tier];
    const CategoryIcon = categoryIcons[badge.category];
    return (
        <Card size="sm" variant="outline" borderColor={tierColor} borderWidth={2}>
            <CardHeader pb={2}>
                <HStack justify="space-between">
                    <HStack spacing={2}>
                        <Icon as={CategoryIcon} color={tierColor} />
                        <Icon as={FaTrophy} color={tierColor} />
                    </HStack>
                    <ChakraBadge colorScheme={badge.tier} variant="solid" textTransform="capitalize">
                        {badge.tier}
                    </ChakraBadge>
                </HStack>
            </CardHeader>
            <CardBody pt={0}>
                <VStack align="start" spacing={2}>
                    <Heading size="sm" color={tierColor}>{badge.name}</Heading>
                    <Text fontSize="xs" color="gray.500" noOfLines={2}>
                        {badge.description}
                    </Text>
                    {showProgress && badge.progress !== undefined && (
                        <Box w="full">
                            <HStack justify="space-between" mb={1}>
                                <Text fontSize="xs">Progress</Text>
                                <Text fontSize="xs">{badge.progress}%</Text>
                            </HStack>
                            <Progress value={badge.progress} colorScheme={badge.tier} size="sm" />
                        </Box>
                    )}
                    {badge.achievedAt && (
                        <Text fontSize="xs" color="gray.400">
                            Earned: {badge.achievedAt.toLocaleDateString()}
                        </Text>
                    )}
                </VStack>
            </CardBody>
        </Card>
    );
});

export const BadgeProgressCard: React.FC<{ badgeId: string; progress: number }> = React.memo(({ badgeId, progress }) => {
    const badge = BadgeCalculationService.getBadgeDefinition(badgeId);
    if (!badge) return null;
    const CategoryIcon = categoryIcons[badge.category];
    return (
        <Card size="sm" variant="outline" opacity={0.7}>
            <CardHeader pb={2}>
                <HStack spacing={2}>
                    <Icon as={CategoryIcon} color="gray.400" />
                    <Icon as={FaTrophy} color="gray.400" />
                </HStack>
            </CardHeader>
            <CardBody pt={0}>
                <VStack align="start" spacing={2}>
                    <Heading size="sm" color="gray.500">{badge.name}</Heading>
                    <Text fontSize="xs" color="gray.400" noOfLines={2}>
                        {badge.description}
                    </Text>
                    <Box w="full">
                        <HStack justify="space-between" mb={1}>
                            <Text fontSize="xs">Progress</Text>
                            <Text fontSize="xs">{Math.round(progress)}%</Text>
                        </HStack>
                        <Progress value={progress} colorScheme={badge.tier} size="sm" />
                    </Box>
                </VStack>
            </CardBody>
        </Card>
    );
});
// End of file
// End of file
// End of file
// End of file
// End of file
// End of file
// End of file
// import React, { useMemo } from 'react';
// import {
//     Box,
//     VStack,
//     HStack,
//     Text,
//     Badge as ChakraBadge,
//     Progress,
//     Card,
//     CardHeader,
//     CardBody,
//     Heading,
//     Icon
// } from '@chakra-ui/react';
// import { FaTrophy } from 'react-icons/fa';
// import { Badge, BadgeCategory, BadgeTier } from '../../types/badges';
// import { BadgeCalculationService } from '../../services/badgeService';
//                     <Icon as={FaTrophy} size="3xl" color="gray.400" />
//                     <Text fontSize="lg" fontWeight="semibold" color="gray.600">
//                         Player Badges
//                     </Text>
//                     <Text textAlign="center" color="gray.500" maxW="md">
//                         Player badges will be available after setting up your summoner information.
//                     </Text>
//                 </VStack>
//             </Box>
//         );
//     }

//     const data = playerBadgeData || mockData;

//     if (!data) {
//         return (
//             <Box p={4} textAlign="center">
//                 <Text>Loading badge data...</Text>
//             </Box>
//         );
//     }

//     // Filter badges by category
//     const filteredBadges = useMemo(() => selectedCategory === 'all'
//         ? data.badges
//         : data.badges.filter(badge => badge.category === selectedCategory), [data.badges, selectedCategory]);

//     // Get badge progress for unearned badges
//     const progressBadges = Array.from(data.badgeProgress.entries())
//         .filter(([_, progress]) => progress > 25) // Only show badges with some progress
//         .sort(([, a], [, b]) => b - a) // Sort by progress descending
//         .slice(0, 6); // Limit to top 6

//     const cardBg = useColorModeValue('white', 'gray.800');
//     const borderColor = useColorModeValue('gray.200', 'gray.600');

//     if (compactView) {
//         return (
//             <Box>
//                 <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
//                     {filteredBadges.slice(0, 6).map(badge => (
//                         <BadgeCard key={badge.id} badge={badge} showProgress={false} />
//                     ))}
//                 </SimpleGrid>
//                 {filteredBadges.length > 6 && (
//                     <Text fontSize="sm" color="gray.500" mt={2} textAlign="center">
//                         +{filteredBadges.length - 6} more badges
//                     </Text>
//                 )}
//             </Box>
//         );
//     }

//     return (
//         <Box p={4} bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor}>
//             <VStack spacing={6} align="stretch">
//                 <HStack justify="space-between" align="center">
//                     <Heading size="lg">
//                         <Icon as={FaTrophy} color="yellow.400" mr={2} />
//                         Player Badges
//                     </Heading>
//                     <Button
//                         size="sm"
//                         onClick={() => {
//                             const newMockStats = MockDataGenerator.generateMockPlayerStats();
//                             const newMockData = BadgeCalculationService.evaluatePlayerBadges(newMockStats);
//                             newMockData.playerId = 'mock-player';
//                             setMockData(newMockData);
//                         }}
//                     >
//                         Generate New Data
//                     </Button>
//                 </HStack>

//                 <Tabs onChange={(index) => {
//                     const categories = ['all', ...Object.values(BadgeCategory)];
//                     setSelectedCategory(categories[index]);
//                 }}>
//                     <TabList>
//                         <Tab>All</Tab>
//                         {Object.values(BadgeCategory).map(category => (
//                             <Tab key={category} fontSize="sm">{category.split(' ')[0]}</Tab>
//                         ))}
//                     </TabList>

//                     <TabPanels>
//                         <TabPanel px={0}>
//                             <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
//                                 {data.badges.map(badge => (
//                                     <BadgeCard key={badge.id} badge={badge} showProgress={showProgress} />
//                                 ))}
//                             </SimpleGrid>
//                         </TabPanel>

//                         {Object.values(BadgeCategory).map(category => (
//                             <TabPanel key={category} px={0}>
//                                 <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
//                                     {data.badges
//                                         .filter(badge => badge.category === category)
//                                         .map(badge => (
//                                             <BadgeCard key={badge.id} badge={badge} showProgress={showProgress} />
//                                         ))
//                                     }
//                                 </SimpleGrid>
//                             </TabPanel>
//                         ))}
//                     </TabPanels>
//                 </Tabs>

//                 {progressBadges.length > 0 && (
//                     <Box>
//                         <Heading size="md" mb={4}>Badge Progress</Heading>
//                         <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
//                             {progressBadges.map(([badgeId, progress]) => (
//                                 <BadgeProgressCard key={badgeId} badgeId={badgeId} progress={progress} />
//                             ))}
//                         </SimpleGrid>
//                     </Box>
//                 )}

//                 <BadgeStats playerBadgeData={data} />
//             </VStack>
//         </Box>
//     );
// };

// export default BadgeDisplay;
