import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Badge as ChakraBadge,
    Progress,
    SimpleGrid,
    Card,
    CardHeader,
    CardBody,
    Heading,
    Icon,
    Tab,
    Tabs,
    TabList,
    TabPanel,
    TabPanels,
    Button,
    useColorModeValue
} from '@chakra-ui/react';
import { FaTrophy, FaChartLine, FaUsers, FaSyncAlt, FaClock } from 'react-icons/fa';
import { GiCrossedSwords, GiTreasureMap } from 'react-icons/gi';
import { Badge, BadgeCategory, BadgeTier, PlayerBadgeData } from '../../types/badges';
import { BadgeCalculationService, MockDataGenerator } from '../../services/badgeService';

interface BadgeDisplayProps {
    playerBadgeData?: PlayerBadgeData;
    showProgress?: boolean;
    compactView?: boolean;
    hasValidSummoner?: boolean;
}

// Category icons mapping
const categoryIcons = {
    [BadgeCategory.STRATEGIC_MACRO]: FaChartLine,
    [BadgeCategory.RESOURCE_MANAGEMENT]: GiTreasureMap,
    [BadgeCategory.TEAMPLAY_SUPPORT]: FaUsers,
    [BadgeCategory.ADAPTABILITY_RESILIENCE]: FaSyncAlt,
    [BadgeCategory.EARLY_GAME_LANING]: GiCrossedSwords,
    [BadgeCategory.LATE_GAME_SCALING]: FaClock,
    [BadgeCategory.ANTI_CARRY_DISRUPTION]: GiCrossedSwords
};

// Tier colors
const tierColors = {
    [BadgeTier.BRONZE]: 'orange.400',
    [BadgeTier.SILVER]: 'gray.400',
    [BadgeTier.GOLD]: 'yellow.400',
    [BadgeTier.PLATINUM]: 'cyan.400',
    [BadgeTier.DIAMOND]: 'blue.400'
};

const BadgeCard: React.FC<{ badge: Badge; showProgress?: boolean }> = ({ badge, showProgress = true }) => {
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
};

const BadgeProgressCard: React.FC<{ badgeId: string; progress: number }> = ({ badgeId, progress }) => {
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
                        <Progress value={progress} colorScheme="gray" size="sm" />
                    </Box>
                </VStack>
            </CardBody>
        </Card>
    );
};

const BadgeStats: React.FC<{ playerBadgeData: PlayerBadgeData }> = ({ playerBadgeData }) => {
    const distribution = BadgeCalculationService.analyzeBadgeDistribution(playerBadgeData);
    const completionPercentage = BadgeCalculationService.getBadgeCompletionPercentage(playerBadgeData);

    return (
        <VStack spacing={4} align="stretch">
            <Card>
                <CardHeader>
                    <Heading size="md">Badge Statistics</Heading>
                </CardHeader>
                <CardBody>
                    <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                            <Text>Total Badges Earned:</Text>
                            <Text fontWeight="bold">{playerBadgeData.badges.length}</Text>
                        </HStack>
                        <HStack justify="space-between">
                            <Text>Completion Rate:</Text>
                            <Text fontWeight="bold">{completionPercentage}%</Text>
                        </HStack>
                        <Progress value={completionPercentage} colorScheme="green" />

                        <Text fontSize="sm" fontWeight="semibold" mt={4}>Category Distribution:</Text>
                        {Object.entries(distribution).map(([category, count]) => (
                            <HStack key={category} justify="space-between">
                                <Text fontSize="sm">{category}:</Text>
                                <Text fontSize="sm" fontWeight="bold">{count}</Text>
                            </HStack>
                        ))}
                    </VStack>
                </CardBody>
            </Card>
        </VStack>
    );
};

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
    playerBadgeData,
    showProgress = true,
    compactView = false,
    hasValidSummoner = true
}) => {
    const [mockData, setMockData] = useState<PlayerBadgeData | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Generate mock data if no real data is provided and we have a valid summoner
    useEffect(() => {
        if (!playerBadgeData && hasValidSummoner) {
            const mockStats = MockDataGenerator.generateMockPlayerStats('mid');
            const mockBadgeData = BadgeCalculationService.evaluatePlayerBadges(mockStats);
            mockBadgeData.playerId = 'mock-player';
            setMockData(mockBadgeData);
        } else if (!hasValidSummoner) {
            setMockData(null);
        }
    }, [playerBadgeData, hasValidSummoner]);

    if (!hasValidSummoner) {
        return (
            <Box p={4} bg="gray.800" borderRadius="lg" border="1px solid" borderColor="gray.600">
                <VStack spacing={4} py={8}>
                    <Icon as={FaTrophy} size="3xl" color="gray.400" />
                    <Text fontSize="lg" fontWeight="semibold" color="gray.600">
                        Player Badges
                    </Text>
                    <Text textAlign="center" color="gray.500" maxW="md">
                        Player badges will be available after setting up your summoner information.
                    </Text>
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
    const filteredBadges = selectedCategory === 'all'
        ? data.badges
        : data.badges.filter(badge => badge.category === selectedCategory);

    // Get badge progress for unearned badges
    const progressBadges = Array.from(data.badgeProgress.entries())
        .filter(([_, progress]) => progress > 25) // Only show badges with some progress
        .sort(([, a], [, b]) => b - a) // Sort by progress descending
        .slice(0, 6); // Limit to top 6

    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    if (compactView) {
        return (
            <Box>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                    {filteredBadges.slice(0, 6).map(badge => (
                        <BadgeCard key={badge.id} badge={badge} showProgress={false} />
                    ))}
                </SimpleGrid>
                {filteredBadges.length > 6 && (
                    <Text fontSize="sm" color="gray.500" mt={2} textAlign="center">
                        +{filteredBadges.length - 6} more badges
                    </Text>
                )}
            </Box>
        );
    }

    return (
        <Box p={4} bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor}>
            <VStack spacing={6} align="stretch">
                <HStack justify="space-between" align="center">
                    <Heading size="lg">
                        <Icon as={FaTrophy} color="yellow.400" mr={2} />
                        Player Badges
                    </Heading>
                    <Button
                        size="sm"
                        onClick={() => {
                            const newMockStats = MockDataGenerator.generateMockPlayerStats();
                            const newMockData = BadgeCalculationService.evaluatePlayerBadges(newMockStats);
                            newMockData.playerId = 'mock-player';
                            setMockData(newMockData);
                        }}
                    >
                        Generate New Data
                    </Button>
                </HStack>

                <Tabs onChange={(index) => {
                    const categories = ['all', ...Object.values(BadgeCategory)];
                    setSelectedCategory(categories[index]);
                }}>
                    <TabList>
                        <Tab>All</Tab>
                        {Object.values(BadgeCategory).map(category => (
                            <Tab key={category} fontSize="sm">{category.split(' ')[0]}</Tab>
                        ))}
                    </TabList>

                    <TabPanels>
                        <TabPanel px={0}>
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                                {data.badges.map(badge => (
                                    <BadgeCard key={badge.id} badge={badge} showProgress={showProgress} />
                                ))}
                            </SimpleGrid>
                        </TabPanel>

                        {Object.values(BadgeCategory).map(category => (
                            <TabPanel key={category} px={0}>
                                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                                    {data.badges
                                        .filter(badge => badge.category === category)
                                        .map(badge => (
                                            <BadgeCard key={badge.id} badge={badge} showProgress={showProgress} />
                                        ))
                                    }
                                </SimpleGrid>
                            </TabPanel>
                        ))}
                    </TabPanels>
                </Tabs>

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

                <BadgeStats playerBadgeData={data} />
            </VStack>
        </Box>
    );
};

export default BadgeDisplay;
