import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Card,
    CardHeader,
    CardBody,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    Badge,
    Select,
    Skeleton,
    Alert,
    AlertIcon,
    Icon,
    Image,
    Heading,
    Divider,
    Container
} from '@chakra-ui/react';
import { FaChartLine, FaEye, FaCoins, FaUsers } from 'react-icons/fa';
import { GiCrossedSwords, GiOnTarget } from 'react-icons/gi';
import {
    Champion,
    ChampionMastery,
    ChampionStats,
    ChampionBuild,
    ChampionMatchup,
    CounterData,
    ChampionRole
} from '../../types/champion';
import { championService } from '../../services/championService';

interface ChampionDetailViewProps {
    champion: Champion;
    mastery?: ChampionMastery;
}

const ChampionDetailView: React.FC<ChampionDetailViewProps> = ({ champion, mastery }) => {
    const [stats, setStats] = useState<ChampionStats | null>(null);
    const [builds, setBuilds] = useState<ChampionBuild[]>([]);
    const [matchups, setMatchups] = useState<ChampionMatchup[]>([]);
    const [counterData, setCounterData] = useState<CounterData | null>(null);
    const [selectedRole, setSelectedRole] = useState<ChampionRole>(champion.roles[0]);
    const [selectedRank, setSelectedRank] = useState('Diamond+');
    const [loading, setLoading] = useState(true);

    // Memoized Overview Section
    const memoizedOverviewSection = useMemo(() => (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {/* ...overview content... */}
        </SimpleGrid>
    ), [champion, mastery, stats]);


    // Memoized Matchups Section
    const memoizedMatchupsSection = useMemo(() => (
        <VStack spacing={6} align="stretch">
            {/* ...matchups content... */}
        </VStack>
    ), [matchups, selectedRole]);


    const selectedRoleMemo = useMemo(() => champion.roles[0], [champion.roles]);
    const selectedRankMemo = useMemo(() => 'Diamond+', []);

    const loadChampionData = useCallback(async () => {
        setLoading(true);
        try {
            const stats = await championService.getChampionStats(champion.id);
            setStats(stats);
            const builds = await championService.getChampionBuilds(champion.id, selectedRoleMemo, selectedRankMemo);
            setBuilds(builds);
            const matchups = await championService.getChampionMatchups(champion.id, selectedRoleMemo, selectedRankMemo);
            setMatchups(matchups);
            const counterData = await championService.getCounterData(champion.id, selectedRoleMemo, selectedRankMemo);
            setCounterData(counterData);
        } catch (error) {
            console.error('Failed to load champion data:', error);
        } finally {
            setLoading(false);
        }
    }, [champion.id, selectedRoleMemo, selectedRankMemo]);

    useEffect(() => {
        loadChampionData();
    }, [loadChampionData]);

    const getWinRateColor = (winRate: number) => {
        if (winRate >= 55) return 'green';
        if (winRate >= 50) return 'yellow';
        return 'red';
    };


    // Memoized Builds Section
    const memoizedBuildsSection = useMemo(() => (
        <VStack spacing={6} align="stretch">
            {builds.length > 0 ? (
                <>
                    <Text fontSize="lg" fontWeight="bold">Recommended Builds for {selectedRole}</Text>
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                        {builds.map((build, index) => (
                            <Card key={build.id || index}>
                                {/* ...existing code for build card... */}
                            </Card>
                        ))}
                    </SimpleGrid>
                </>
            ) : (
                <Alert status="info">
                    <AlertIcon />
                    No build data available for this champion and role combination.
                </Alert>
            )}
        </VStack>
    ), [builds, selectedRole]);


    // Memoized Counters Section
    const memoizedCountersSection = useMemo(() => (
        <VStack spacing={6} align="stretch">
            {counterData ? (
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                    {/* ...existing code for counters cards... */}
                </SimpleGrid>
            ) : (
                <Alert status="info">
                    <AlertIcon />
                    No counter data available for this champion.
                </Alert>
            )}
        </VStack>
    ), [counterData, champion]);

    return (
        <Container maxW="7xl" py={6}>
            <VStack spacing={6} align="stretch">
                {/* Header */}
                <HStack spacing={4} align="center">
                    <Image
                        src={champion.iconUrl || champion.squareUrl}
                        alt={champion.name}
                        boxSize="60px"
                        borderRadius="lg"
                        fallbackSrc="/assets/champions/icons/default.png"
                    />
                    <VStack align="start" spacing={0}>
                        <Heading size="xl">{champion.name}</Heading>
                        <Text fontSize="lg" color="gray.500">{champion.title}</Text>
                    </VStack>
                    <Box flex={1} />
                    {/* Role and Rank Selectors */}
                    <HStack spacing={3}>
                        <Select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as ChampionRole)}
                            width="120px"
                        >
                            {champion.roles.map(role => (
                                <option key={role} value={role}>
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </option>
                            ))}
                        </Select>
                        <Select
                            value={selectedRank}
                            onChange={(e) => setSelectedRank(e.target.value)}
                            width="120px"
                        >
                            <option value="All">All Ranks</option>
                            <option value="Iron">Iron</option>
                            <option value="Bronze">Bronze</option>
                            <option value="Silver">Silver</option>
                            <option value="Gold">Gold</option>
                            <option value="Platinum">Platinum</option>
                            <option value="Diamond">Diamond</option>
                            <option value="Diamond+">Diamond+</option>
                            <option value="Master+">Master+</option>
                        </Select>
                    </HStack>
                </HStack>


                {loading ? (
                    <VStack spacing={4}>
                        <Skeleton height="400px" />
                        <Skeleton height="300px" />
                    </VStack>
                ) : (
                    <Tabs variant="enclosed" colorScheme="blue">
                        <TabList>
                            <Tab>
                                <Icon as={FaEye} mr={2} />
                                Overview
                            </Tab>
                            <Tab>
                                <Icon as={FaCoins} mr={2} />
                                Builds
                            </Tab>
                            <Tab>
                                <Icon as={GiCrossedSwords} mr={2} />
                                Matchups
                            </Tab>
                            <Tab>
                                <Icon as={GiOnTarget} mr={2} />
                                Counters
                            </Tab>
                            <Tab>
                                <Icon as={FaChartLine} mr={2} />
                                Statistics
                            </Tab>
                        </TabList>

                        <TabPanels>
                            {/* Overview Tab */}
                            <TabPanel>
                                {memoizedOverviewSection}
                            </TabPanel>

                            {/* Builds Tab */}
                            <TabPanel>
                                {memoizedBuildsSection}
                            </TabPanel>

                            {/* Matchups Tab */}
                            <TabPanel>
                                {memoizedMatchupsSection}
                            </TabPanel>

                            {/* Counters Tab */}
                            <TabPanel>
                                {memoizedCountersSection}
                            </TabPanel>

                            {/* Statistics Tab */}
                            <TabPanel>
                                <VStack spacing={6} align="stretch">
                                    {stats ? (
                                        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                                            {/* Role Performance */}
                                            <Card>
                                                <CardHeader>
                                                    <HStack>
                                                        <Icon as={FaUsers} color="blue.500" />
                                                        <Heading size="md">Role Performance</Heading>
                                                    </HStack>
                                                </CardHeader>
                                                <CardBody>
                                                    <VStack align="stretch" spacing={4}>
                                                        {Object.entries(stats.rolePerformance || {}).map(([role, performance]) => (
                                                            <Box key={role} p={3} bg="gray.50" borderRadius="md">
                                                                <HStack justify="space-between" mb={2}>
                                                                    <Text fontWeight="bold" textTransform="capitalize">{role}</Text>
                                                                    {performance.primaryRole && (
                                                                        <Badge colorScheme="blue">Primary</Badge>
                                                                    )}
                                                                </HStack>
                                                                <SimpleGrid columns={3} spacing={4}>
                                                                    <Stat size="sm">
                                                                        <StatLabel>Games</StatLabel>
                                                                        <StatNumber>{performance.gamesPlayed}</StatNumber>
                                                                    </Stat>
                                                                    <Stat size="sm">
                                                                        <StatLabel>Win Rate</StatLabel>
                                                                        <StatNumber color={getWinRateColor(performance.winRate)}>
                                                                            {performance.winRate.toFixed(1)}%
                                                                        </StatNumber>
                                                                    </Stat>
                                                                    <Stat size="sm">
                                                                        <StatLabel>KDA</StatLabel>
                                                                        <StatNumber>{performance.kda.toFixed(2)}</StatNumber>
                                                                    </Stat>
                                                                </SimpleGrid>
                                                            </Box>
                                                        ))}
                                                    </VStack>
                                                </CardBody>
                                            </Card>

                                            {/* Item Statistics */}
                                            <Card>
                                                <CardHeader>
                                                    <HStack>
                                                        <Icon as={FaCoins} color="gold" />
                                                        <Heading size="md">Item Statistics</Heading>
                                                    </HStack>
                                                </CardHeader>
                                                <CardBody>
                                                    <VStack align="stretch" spacing={4}>
                                                        <Box>
                                                            <Text fontWeight="bold" mb={2}>Most Built Items</Text>
                                                            <VStack align="stretch" spacing={2}>
                                                                {stats.itemStats?.mostBuilt?.map((item, index) => (
                                                                    <HStack key={index} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                                                                        <HStack>
                                                                            <Box w="24px" h="24px" bg="gray.200" borderRadius="sm" />
                                                                            <Text fontSize="sm">{item.itemName}</Text>
                                                                        </HStack>
                                                                        <HStack spacing={4}>
                                                                            <Text fontSize="xs" color="gray.600">
                                                                                {item.buildRate?.toFixed(1)}% built
                                                                            </Text>
                                                                            <Badge colorScheme={getWinRateColor(item.winRate || 0)} fontSize="xs">
                                                                                {item.winRate?.toFixed(1)}% WR
                                                                            </Badge>
                                                                        </HStack>
                                                                    </HStack>
                                                                ))}
                                                            </VStack>
                                                        </Box>
                                                        
                                                        <Divider />
                                                        
                                                        <Box>
                                                            <Text fontWeight="bold" mb={2}>Highest Win Rate Items</Text>
                                                            <VStack align="stretch" spacing={2}>
                                                                {stats.itemStats?.highestWinRate?.map((item, index) => (
                                                                    <HStack key={index} justify="space-between" p={2} bg="green.50" borderRadius="md">
                                                                        <HStack>
                                                                            <Box w="24px" h="24px" bg="gray.200" borderRadius="sm" />
                                                                            <Text fontSize="sm">{item.itemName}</Text>
                                                                        </HStack>
                                                                        <HStack spacing={4}>
                                                                            <Text fontSize="xs" color="gray.600">
                                                                                {item.buildRate?.toFixed(1)}% built
                                                                            </Text>
                                                                            <Badge colorScheme="green" fontSize="xs">
                                                                                {item.winRate?.toFixed(1)}% WR
                                                                            </Badge>
                                                                        </HStack>
                                                                    </HStack>
                                                                ))}
                                                            </VStack>
                                                        </Box>
                                                    </VStack>
                                                </CardBody>
                                            </Card>
                                        </SimpleGrid>
                                    ) : (
                                        <Alert status="info">
                                            <AlertIcon />
                                            No detailed statistics available for this champion.
                                        </Alert>
                                    )}
                                </VStack>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                )}
            </VStack>
        </Container>
    );
};

export default ChampionDetailView;
