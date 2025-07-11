import React, { useState, useEffect } from 'react';
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
    StatHelpText,
    Progress,
    Badge,
    Select,
    Skeleton,
    Alert,
    AlertIcon,
    Tooltip,
    Icon,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Image,
    Flex
} from '@chakra-ui/react';
import {
    FaTrophy,
    FaGamepad,
    FaChartLine,
    FaEye,
    FaCoins,
    FaClock,
    FaFire
} from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import {
    Champion,
    ChampionMastery,
    ChampionStats,
    ChampionBuild,
    ChampionMatchup,
    CounterData,
    ChampionRole,
    MatchupDifficulty
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

    useEffect(() => {
        loadChampionData();
    }, [champion.id, selectedRole, selectedRank]);

    const loadChampionData = async () => {
        setLoading(true);
        try {
            const [statsData, buildsData, matchupsData, countersData] = await Promise.all([
                championService.getChampionStats(champion.id),
                championService.getChampionBuilds(champion.id, selectedRole, selectedRank),
                championService.getChampionMatchups(champion.id, selectedRole, selectedRank),
                championService.getCounterData(champion.id, selectedRole, selectedRank)
            ]);

            setStats(statsData);
            setBuilds(buildsData);
            setMatchups(matchupsData);
            setCounterData(countersData);
        } catch (error) {
            console.error('Failed to load champion data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyColor = (difficulty: MatchupDifficulty) => {
        switch (difficulty) {
            case MatchupDifficulty.VERY_EASY: return 'green';
            case MatchupDifficulty.EASY: return 'green';
            case MatchupDifficulty.EVEN: return 'yellow';
            case MatchupDifficulty.HARD: return 'orange';
            case MatchupDifficulty.VERY_HARD: return 'red';
            default: return 'gray';
        }
    };

    const formatKDA = (kda: { kills: number; deaths: number; assists: number }) => {
        return `${kda.kills.toFixed(1)} / ${kda.deaths.toFixed(1)} / ${kda.assists.toFixed(1)}`;
    };

    const getMasteryColor = () => {
        if (!mastery) return 'gray';
        if (mastery.championLevel >= 7) return 'purple';
        if (mastery.championLevel >= 5) return 'gold';
        if (mastery.championLevel >= 4) return 'blue';
        return 'gray';
    };

    return (
        <Box>
            {/* Champion Header with Splash Art */}
            <Box
                position="relative"
                height="200px"
                borderRadius="lg"
                overflow="hidden"
                mb={6}
                bgGradient="linear(to-r, blue.400, purple.500)"
            >
                {champion.splashUrl && (
                    <Image
                        src={champion.splashUrl}
                        alt={`${champion.name} splash art`}
                        width="100%"
                        height="100%"
                        objectFit="cover"
                        opacity={0.8}
                    />
                )}
                <Box
                    position="absolute"
                    bottom={0}
                    left={0}
                    right={0}
                    bgGradient="linear(to-t, blackAlpha.800, transparent)"
                    p={6}
                >
                    <Flex align="end" justify="space-between">
                        <VStack align="start" spacing={1}>
                            <Text fontSize="2xl" fontWeight="bold" color="white">
                                {champion.name}
                            </Text>
                            <Text fontSize="md" color="gray.200">
                                {champion.title}
                            </Text>
                            <HStack>
                                {champion.roles.map(role => (
                                    <Badge key={role} colorScheme="blue" variant="solid">
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </Badge>
                                ))}
                            </HStack>
                        </VStack>
                        {mastery && (
                            <VStack align="end" spacing={1}>
                                <Badge colorScheme={getMasteryColor()} fontSize="lg" p={2}>
                                    Mastery {mastery.championLevel}
                                </Badge>
                                <Text fontSize="sm" color="gray.200">
                                    {mastery.championPoints.toLocaleString()} points
                                </Text>
                            </VStack>
                        )}
                    </Flex>
                </Box>
            </Box>

            <Tabs>
                <TabList>
                    <Tab>Overview</Tab>
                    <Tab>Builds</Tab>
                    <Tab>Matchups</Tab>
                </TabList>

                <TabPanels>
                    {/* Overview Tab */}
                    <TabPanel>
                        <VStack spacing={6} align="stretch">
                            {/* Role and Rank Selection */}
                            <HStack spacing={4}>
                                <Select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value as ChampionRole)}
                                    maxW="200px"
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
                                    maxW="200px"
                                >
                                    <option value="All">All Ranks</option>
                                    <option value="Iron">Iron</option>
                                    <option value="Bronze">Bronze</option>
                                    <option value="Silver">Silver</option>
                                    <option value="Gold">Gold</option>
                                    <option value="Platinum">Platinum</option>
                                    <option value="Diamond+">Diamond+</option>
                                    <option value="Master+">Master+</option>
                                </Select>
                            </HStack>

                            {/* Mastery and Quick Stats */}
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                                {/* Mastery Card */}
                                <Card>
                                    <CardBody>
                                        <VStack spacing={2}>
                                            <Icon as={FaTrophy} color={getMasteryColor()} boxSize={6} />
                                            <Text fontSize="lg" fontWeight="bold">
                                                Mastery Level {mastery?.championLevel || 0}
                                            </Text>
                                            <Text fontSize="sm" color="gray.500">
                                                {mastery?.championPoints.toLocaleString() || 0} Points
                                            </Text>
                                            {mastery && mastery.championLevel < 7 && (
                                                <Progress
                                                    value={(mastery.championPointsSinceLastLevel /
                                                        (mastery.championPointsSinceLastLevel + mastery.championPointsUntilNextLevel)) * 100}
                                                    size="sm"
                                                    colorScheme={getMasteryColor()}
                                                    w="full"
                                                />
                                            )}
                                        </VStack>
                                    </CardBody>
                                </Card>

                                {/* Games Played */}
                                <Card>
                                    <CardBody>
                                        <Stat>
                                            <StatLabel>
                                                <HStack>
                                                    <Icon as={FaGamepad} />
                                                    <Text>Games Played</Text>
                                                </HStack>
                                            </StatLabel>
                                            <StatNumber>{stats?.gamesPlayed || 0}</StatNumber>
                                            <StatHelpText>
                                                {stats?.wins || 0}W / {stats?.losses || 0}L
                                            </StatHelpText>
                                        </Stat>
                                    </CardBody>
                                </Card>

                                {/* Win Rate */}
                                <Card>
                                    <CardBody>
                                        <Stat>
                                            <StatLabel>
                                                <HStack>
                                                    <Icon as={FaChartLine} />
                                                    <Text>Win Rate</Text>
                                                </HStack>
                                            </StatLabel>
                                            <StatNumber color={stats && stats.winRate >= 50 ? 'green.400' : 'red.400'}>
                                                {stats?.winRate.toFixed(1) || 0}%
                                            </StatNumber>
                                        </Stat>
                                    </CardBody>
                                </Card>

                                {/* KDA */}
                                <Card>
                                    <CardBody>
                                        <Stat>
                                            <StatLabel>
                                                <HStack>
                                                    <Icon as={GiCrossedSwords} />
                                                    <Text>Average KDA</Text>
                                                </HStack>
                                            </StatLabel>
                                            <StatNumber fontSize="md">
                                                {stats ? formatKDA(stats.averageKda) : '0 / 0 / 0'}
                                            </StatNumber>
                                            <StatHelpText>
                                                {stats?.averageKda.kda.toFixed(2) || 0} KDA
                                            </StatHelpText>
                                        </Stat>
                                    </CardBody>
                                </Card>
                            </SimpleGrid>

                            {/* Performance by Role */}
                            {stats && stats.roles && Object.keys(stats.roles).length > 1 && (
                                <Card>
                                    <CardHeader>
                                        <Text fontSize="lg" fontWeight="bold">Performance by Role</Text>
                                    </CardHeader>
                                    <CardBody>
                                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                                            {Object.entries(stats.roles).map(([role, roleStats]) => (
                                                <Box key={role} p={4} borderWidth={1} borderRadius="md">
                                                    <VStack spacing={2}>
                                                        <Badge colorScheme="blue" size="lg">
                                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                                        </Badge>
                                                        <Text fontWeight="bold" color={roleStats.winRate >= 50 ? 'green.400' : 'red.400'}>
                                                            {roleStats.winRate.toFixed(1)}% WR
                                                        </Text>
                                                        <Text fontSize="sm">
                                                            {roleStats.gamesPlayed} games
                                                        </Text>
                                                        <Text fontSize="sm" color="gray.500">
                                                            {formatKDA(roleStats.averageKda)}
                                                        </Text>
                                                    </VStack>
                                                </Box>
                                            ))}
                                        </SimpleGrid>
                                    </CardBody>
                                </Card>
                            )}

                            {/* Average Stats */}
                            {stats && (
                                <Card>
                                    <CardHeader>
                                        <Text fontSize="lg" fontWeight="bold">Average Performance</Text>
                                    </CardHeader>
                                    <CardBody>
                                        <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={4}>
                                            <Stat>
                                                <StatLabel>
                                                    <HStack>
                                                        <Icon as={FaCoins} color="yellow.400" />
                                                        <Text>CS</Text>
                                                    </HStack>
                                                </StatLabel>
                                                <StatNumber>{stats.averageStats.cs.toFixed(1)}</StatNumber>
                                            </Stat>
                                            <Stat>
                                                <StatLabel>
                                                    <HStack>
                                                        <Icon as={FaCoins} color="gold" />
                                                        <Text>Gold</Text>
                                                    </HStack>
                                                </StatLabel>
                                                <StatNumber>{stats.averageStats.gold.toLocaleString()}</StatNumber>
                                            </Stat>
                                            <Stat>
                                                <StatLabel>
                                                    <HStack>
                                                        <Icon as={FaFire} color="red.400" />
                                                        <Text>Damage</Text>
                                                    </HStack>
                                                </StatLabel>
                                                <StatNumber>{stats.averageStats.damage.toLocaleString()}</StatNumber>
                                            </Stat>
                                            <Stat>
                                                <StatLabel>
                                                    <HStack>
                                                        <Icon as={FaEye} color="purple.400" />
                                                        <Text>Vision</Text>
                                                    </HStack>
                                                </StatLabel>
                                                <StatNumber>{stats.averageStats.visionScore.toFixed(1)}</StatNumber>
                                            </Stat>
                                            <Stat>
                                                <StatLabel>
                                                    <HStack>
                                                        <Icon as={FaClock} />
                                                        <Text>Game Length</Text>
                                                    </HStack>
                                                </StatLabel>
                                                <StatNumber>{Math.floor(stats.averageStats.gameLength)}m</StatNumber>
                                            </Stat>
                                        </SimpleGrid>
                                    </CardBody>
                                </Card>
                            )}
                        </VStack>
                    </TabPanel>

                    {/* Builds Tab */}
                    <TabPanel>
                        {loading ? (
                            <VStack spacing={4}>
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={i} height="200px" w="full" />
                                ))}
                            </VStack>
                        ) : builds.length === 0 ? (
                            <Alert status="info">
                                <AlertIcon />
                                No build data available for this champion and role.
                            </Alert>
                        ) : (
                            <VStack spacing={6} align="stretch">
                                {builds.map((build) => (
                                    <Card key={build.id}>
                                        <CardHeader>
                                            <HStack justify="space-between">
                                                <VStack align="start" spacing={1}>
                                                    <Text fontSize="lg" fontWeight="bold">{build.name}</Text>
                                                    <HStack>
                                                        <Badge colorScheme="green">{build.winRate.toFixed(1)}% WR</Badge>
                                                        <Badge colorScheme="blue">{build.pickRate.toFixed(1)}% Pick</Badge>
                                                        <Badge variant="outline">{build.sampleSize.toLocaleString()} games</Badge>
                                                    </HStack>
                                                </VStack>
                                                <Text fontSize="sm" color="gray.500">
                                                    {build.sources.join(', ')}
                                                </Text>
                                            </HStack>
                                        </CardHeader>
                                        <CardBody>
                                            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
                                                {/* Items */}
                                                <Box>
                                                    <Text fontWeight="bold" mb={2}>Items</Text>
                                                    <VStack align="start" spacing={2}>
                                                        <Text fontSize="sm" color="gray.500">Core Build:</Text>
                                                        <HStack wrap="wrap">
                                                            {build.items.core.map((itemId, i) => (
                                                                <Tooltip key={i} label={`Item ${itemId}`}>
                                                                    <Box
                                                                        w="32px"
                                                                        h="32px"
                                                                        bg="gray.200"
                                                                        borderRadius="md"
                                                                        display="flex"
                                                                        alignItems="center"
                                                                        justifyContent="center"
                                                                        fontSize="xs"
                                                                    >
                                                                        {itemId}
                                                                    </Box>
                                                                </Tooltip>
                                                            ))}
                                                        </HStack>
                                                    </VStack>
                                                </Box>

                                                {/* Runes */}
                                                <Box>
                                                    <Text fontWeight="bold" mb={2}>Runes</Text>
                                                    <VStack align="start" spacing={2}>
                                                        <Text fontSize="sm">
                                                            Primary: Tree {build.runes.primaryTree}
                                                        </Text>
                                                        <Text fontSize="sm">
                                                            Keystone: {build.runes.keystone}
                                                        </Text>
                                                        <Text fontSize="sm">
                                                            Secondary: Tree {build.runes.secondaryTree}
                                                        </Text>
                                                    </VStack>
                                                </Box>

                                                {/* Skill Order */}
                                                <Box>
                                                    <Text fontWeight="bold" mb={2}>Skill Order</Text>
                                                    <VStack align="start" spacing={2}>
                                                        <Text fontSize="sm">
                                                            Max Order: {build.skillOrder.maxOrder}
                                                        </Text>
                                                        <Text fontSize="xs" color="gray.500">
                                                            {build.skillOrder.description}
                                                        </Text>
                                                    </VStack>
                                                </Box>
                                            </SimpleGrid>
                                        </CardBody>
                                    </Card>
                                ))}
                            </VStack>
                        )}
                    </TabPanel>

                    {/* Matchups Tab */}
                    <TabPanel>
                        {loading ? (
                            <Skeleton height="400px" />
                        ) : (
                            <VStack spacing={6} align="stretch">
                                {/* Counters */}
                                {counterData && (
                                    <>
                                        <Card>
                                            <CardHeader>
                                                <Text fontSize="lg" fontWeight="bold" color="red.400">
                                                    Champions that Counter {champion.name}
                                                </Text>
                                            </CardHeader>
                                            <CardBody>
                                                <TableContainer>
                                                    <Table size="sm">
                                                        <Thead>
                                                            <Tr>
                                                                <Th>Champion</Th>
                                                                <Th isNumeric>Win Rate vs You</Th>
                                                                <Th isNumeric>Games</Th>
                                                                <Th isNumeric>Advantage</Th>
                                                                <Th>Confidence</Th>
                                                            </Tr>
                                                        </Thead>
                                                        <Tbody>
                                                            {counterData.counters.map((counter) => (
                                                                <Tr key={counter.championId}>
                                                                    <Td>{counter.championName}</Td>
                                                                    <Td isNumeric color="red.400">
                                                                        {counter.winRate.toFixed(1)}%
                                                                    </Td>
                                                                    <Td isNumeric>{counter.gamesPlayed}</Td>
                                                                    <Td isNumeric color="red.400">
                                                                        +{counter.advantage.toFixed(1)}%
                                                                    </Td>
                                                                    <Td>
                                                                        <Progress
                                                                            value={counter.confidence * 100}
                                                                            size="sm"
                                                                            colorScheme="blue"
                                                                            maxW="60px"
                                                                        />
                                                                    </Td>
                                                                </Tr>
                                                            ))}
                                                        </Tbody>
                                                    </Table>
                                                </TableContainer>
                                            </CardBody>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <Text fontSize="lg" fontWeight="bold" color="green.400">
                                                    Champions {champion.name} Counters
                                                </Text>
                                            </CardHeader>
                                            <CardBody>
                                                <TableContainer>
                                                    <Table size="sm">
                                                        <Thead>
                                                            <Tr>
                                                                <Th>Champion</Th>
                                                                <Th isNumeric>Your Win Rate</Th>
                                                                <Th isNumeric>Games</Th>
                                                                <Th isNumeric>Advantage</Th>
                                                                <Th>Confidence</Th>
                                                            </Tr>
                                                        </Thead>
                                                        <Tbody>
                                                            {counterData.countered.map((counter) => (
                                                                <Tr key={counter.championId}>
                                                                    <Td>{counter.championName}</Td>
                                                                    <Td isNumeric color="green.400">
                                                                        {(100 - counter.winRate).toFixed(1)}%
                                                                    </Td>
                                                                    <Td isNumeric>{counter.gamesPlayed}</Td>
                                                                    <Td isNumeric color="green.400">
                                                                        +{Math.abs(counter.advantage).toFixed(1)}%
                                                                    </Td>
                                                                    <Td>
                                                                        <Progress
                                                                            value={counter.confidence * 100}
                                                                            size="sm"
                                                                            colorScheme="blue"
                                                                            maxW="60px"
                                                                        />
                                                                    </Td>
                                                                </Tr>
                                                            ))}
                                                        </Tbody>
                                                    </Table>
                                                </TableContainer>
                                            </CardBody>
                                        </Card>
                                    </>
                                )}

                                {/* Detailed Matchups */}
                                {matchups.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <Text fontSize="lg" fontWeight="bold">
                                                Detailed Matchup Analysis
                                            </Text>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack spacing={4} align="stretch">
                                                {matchups.slice(0, 5).map((matchup) => (
                                                    <Box
                                                        key={matchup.enemyChampionId}
                                                        p={4}
                                                        borderWidth={1}
                                                        borderRadius="md"
                                                        borderColor={getDifficultyColor(matchup.difficulty)}
                                                    >
                                                        <HStack justify="space-between" mb={2}>
                                                            <Text fontWeight="bold">
                                                                vs {matchup.enemyChampionName}
                                                            </Text>
                                                            <Badge colorScheme={getDifficultyColor(matchup.difficulty)}>
                                                                {matchup.difficulty.replace('_', ' ')}
                                                            </Badge>
                                                        </HStack>
                                                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                                                            <Box>
                                                                <Text fontSize="sm" fontWeight="bold">
                                                                    Win Rate: {matchup.winRate.toFixed(1)}%
                                                                </Text>
                                                                <Text fontSize="sm" color="gray.500">
                                                                    {matchup.gamesPlayed} games
                                                                </Text>
                                                            </Box>
                                                            <Box>
                                                                <Text fontSize="sm" fontWeight="bold">
                                                                    Average KDA
                                                                </Text>
                                                                <Text fontSize="sm">
                                                                    {formatKDA(matchup.averageKda)}
                                                                </Text>
                                                            </Box>
                                                            <Box>
                                                                <Text fontSize="sm" fontWeight="bold">Tips:</Text>
                                                                <Text fontSize="xs" color="gray.600">
                                                                    {matchup.tips.slice(0, 2).join(', ')}
                                                                </Text>
                                                            </Box>
                                                        </SimpleGrid>
                                                    </Box>
                                                ))}
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                )}
                            </VStack>
                        )}
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
};

export default ChampionDetailView;
