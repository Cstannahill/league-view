import React, { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Card,
    CardHeader,
    CardBody,
    Heading,
    SimpleGrid,
    Badge,
    Icon,
    Button,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    useToast,
    Alert,
    AlertIcon,
    AlertDescription,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    CircularProgress,
    CircularProgressLabel
} from '@chakra-ui/react';
import {
    FaSearch,
    FaUsers,
    FaBrain,
    FaClock
} from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import { AdvancedAnalytics } from '../../types/analytics';

interface PlayerComparisonProps {
    currentPlayerAnalytics: AdvancedAnalytics;
}

interface ComparisonPlayer {
    summonerName: string;
    rank: string;
    analytics: AdvancedAnalytics;
}

const PlayerComparison: React.FC<PlayerComparisonProps> = ({ currentPlayerAnalytics }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('NA1');
    const [comparisonPlayers, setComparisonPlayers] = useState<ComparisonPlayer[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const toast = useToast();

    // Mock comparison data for demonstration
    const mockComparisonPlayers: ComparisonPlayer[] = [
        {
            summonerName: 'ProPlayer123',
            rank: 'Diamond II',
            analytics: {
                ...currentPlayerAnalytics,
                psychologyProfile: {
                    ...currentPlayerAnalytics.psychologyProfile,
                    tiltResistance: 88,
                    clutchFactor: 92,
                    consistencyScore: 85,
                    teamplayRating: 94
                },
                timelineAnalytics: {
                    ...currentPlayerAnalytics.timelineAnalytics,
                    earlyGame: { ...currentPlayerAnalytics.timelineAnalytics.earlyGame, winRateInPhase: 75 },
                    midGame: { ...currentPlayerAnalytics.timelineAnalytics.midGame, winRateInPhase: 82 },
                    lateGame: { ...currentPlayerAnalytics.timelineAnalytics.lateGame, winRateInPhase: 78 }
                }
            }
        },
        {
            summonerName: 'ChallengeMaster',
            rank: 'Master',
            analytics: {
                ...currentPlayerAnalytics,
                psychologyProfile: {
                    ...currentPlayerAnalytics.psychologyProfile,
                    tiltResistance: 95,
                    clutchFactor: 89,
                    consistencyScore: 91,
                    teamplayRating: 87
                },
                timelineAnalytics: {
                    ...currentPlayerAnalytics.timelineAnalytics,
                    earlyGame: { ...currentPlayerAnalytics.timelineAnalytics.earlyGame, winRateInPhase: 82 },
                    midGame: { ...currentPlayerAnalytics.timelineAnalytics.midGame, winRateInPhase: 79 },
                    lateGame: { ...currentPlayerAnalytics.timelineAnalytics.lateGame, winRateInPhase: 85 }
                }
            }
        }
    ];

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            toast({
                title: 'Search Required',
                description: 'Please enter a summoner name to search.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsSearching(true);
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // For demonstration, use mock data
            const foundPlayer = mockComparisonPlayers.find(p =>
                p.summonerName.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (foundPlayer) {
                setComparisonPlayers([foundPlayer]);
                toast({
                    title: 'Player Found',
                    description: `Added ${foundPlayer.summonerName} to comparison.`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                // Add a mock player with the searched name
                const mockPlayer: ComparisonPlayer = {
                    summonerName: searchTerm,
                    rank: 'Gold III',
                    analytics: {
                        ...currentPlayerAnalytics,
                        psychologyProfile: {
                            ...currentPlayerAnalytics.psychologyProfile,
                            tiltResistance: Math.floor(Math.random() * 40) + 40,
                            clutchFactor: Math.floor(Math.random() * 40) + 45,
                            consistencyScore: Math.floor(Math.random() * 35) + 50,
                            teamplayRating: Math.floor(Math.random() * 30) + 55
                        }
                    }
                };
                setComparisonPlayers([mockPlayer]);
                toast({
                    title: 'Player Found',
                    description: `Added ${searchTerm} to comparison.`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            }
        } catch (error) {
            toast({
                title: 'Search Failed',
                description: 'Could not find player. Please check the summoner name and region.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsSearching(false);
        }
    };

    const calculateComparisonScore = (playerValue: number, comparisonValue: number): number => {
        if (comparisonValue === 0) return 0;
        return ((playerValue - comparisonValue) / comparisonValue) * 100;
    };

    const getComparisonColor = (score: number): string => {
        if (score > 10) return 'green';
        if (score > 0) return 'blue';
        if (score > -10) return 'orange';
        return 'red';
    };

    const ComparisonMetric: React.FC<{
        label: string;
        playerValue: number;
        comparisonValue: number;
        format?: 'percentage' | 'number';
    }> = ({ label, playerValue, comparisonValue, format = 'number' }) => {
        const score = calculateComparisonScore(playerValue, comparisonValue);
        const color = getComparisonColor(score);
        const isPositive = score >= 0;

        return (
            <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md" _dark={{ bg: 'gray.700' }}>
                <Text fontSize="sm" fontWeight="medium">{label}</Text>
                <HStack>
                    <Text fontSize="sm" fontWeight="bold">
                        {format === 'percentage' ? `${playerValue.toFixed(0)}%` : playerValue.toFixed(0)}
                    </Text>
                    <Text fontSize="xs" color="gray.500">vs</Text>
                    <Text fontSize="sm" color="gray.600">
                        {format === 'percentage' ? `${comparisonValue.toFixed(0)}%` : comparisonValue.toFixed(0)}
                    </Text>
                    <Badge
                        colorScheme={color}
                        variant="solid"
                        fontSize="xs"
                        minW="45px"
                        textAlign="center"
                    >
                        {isPositive ? '+' : ''}{score.toFixed(0)}%
                    </Badge>
                </HStack>
            </HStack>
        );
    };

    return (
        <Card>
            <CardHeader>
                <HStack justify="space-between">
                    <HStack>
                        <Icon as={FaUsers} color="blue.400" />
                        <Heading size="md">Player Comparison</Heading>
                    </HStack>
                    <Badge colorScheme="blue" variant="outline">
                        Competitive Analysis
                    </Badge>
                </HStack>
            </CardHeader>
            <CardBody>
                <VStack spacing={6} align="stretch">
                    {/* Search Section */}
                    <Box>
                        <Text fontWeight="semibold" mb={3}>Find Players to Compare</Text>
                        <HStack spacing={3}>
                            <InputGroup flex="1">
                                <InputLeftElement>
                                    <Icon as={FaSearch} color="gray.400" />
                                </InputLeftElement>
                                <Input
                                    placeholder="Enter summoner name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </InputGroup>
                            <Select w="120px" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
                                <option value="NA1">NA</option>
                                <option value="EUW1">EUW</option>
                                <option value="EUN1">EUNE</option>
                                <option value="KR">KR</option>
                                <option value="JP1">JP</option>
                            </Select>
                            <Button
                                colorScheme="blue"
                                onClick={handleSearch}
                                isLoading={isSearching}
                                loadingText="Searching..."
                                minW="100px"
                            >
                                Search
                            </Button>
                        </HStack>
                    </Box>

                    {comparisonPlayers.length === 0 ? (
                        <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <AlertDescription>
                                Search for players to compare your performance against similar or higher-ranked players.
                                This helps identify areas for improvement and strengths to maintain.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <VStack spacing={6} align="stretch">
                            {comparisonPlayers.map((player, index) => (
                                <Box key={index}>
                                    <HStack justify="space-between" mb={4}>
                                        <HStack>
                                            <Text fontSize="lg" fontWeight="bold">{player.summonerName}</Text>
                                            <Badge colorScheme="purple" variant="solid">{player.rank}</Badge>
                                        </HStack>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            colorScheme="red"
                                            onClick={() => setComparisonPlayers([])}
                                        >
                                            Remove
                                        </Button>
                                    </HStack>

                                    <Tabs colorScheme="blue">
                                        <TabList>
                                            <Tab><Icon as={FaBrain} mr={2} />Psychology</Tab>
                                            <Tab><Icon as={FaClock} mr={2} />Timeline</Tab>
                                            <Tab><Icon as={GiCrossedSwords} mr={2} />Performance</Tab>
                                        </TabList>

                                        <TabPanels>
                                            {/* Psychology Comparison */}
                                            <TabPanel px={0}>
                                                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                                                    <Box>
                                                        <Text fontWeight="semibold" mb={3}>Your Performance</Text>
                                                        <VStack spacing={3}>
                                                            <HStack justify="space-between" w="full">
                                                                <Text fontSize="sm">Tilt Resistance</Text>
                                                                <CircularProgress
                                                                    value={currentPlayerAnalytics.psychologyProfile.tiltResistance}
                                                                    size="50px"
                                                                    color="blue.400"
                                                                >
                                                                    <CircularProgressLabel fontSize="xs">
                                                                        {currentPlayerAnalytics.psychologyProfile.tiltResistance}
                                                                    </CircularProgressLabel>
                                                                </CircularProgress>
                                                            </HStack>
                                                            <HStack justify="space-between" w="full">
                                                                <Text fontSize="sm">Clutch Factor</Text>
                                                                <CircularProgress
                                                                    value={currentPlayerAnalytics.psychologyProfile.clutchFactor}
                                                                    size="50px"
                                                                    color="green.400"
                                                                >
                                                                    <CircularProgressLabel fontSize="xs">
                                                                        {currentPlayerAnalytics.psychologyProfile.clutchFactor}
                                                                    </CircularProgressLabel>
                                                                </CircularProgress>
                                                            </HStack>
                                                            <HStack justify="space-between" w="full">
                                                                <Text fontSize="sm">Consistency</Text>
                                                                <CircularProgress
                                                                    value={currentPlayerAnalytics.psychologyProfile.consistencyScore}
                                                                    size="50px"
                                                                    color="purple.400"
                                                                >
                                                                    <CircularProgressLabel fontSize="xs">
                                                                        {currentPlayerAnalytics.psychologyProfile.consistencyScore}
                                                                    </CircularProgressLabel>
                                                                </CircularProgress>
                                                            </HStack>
                                                            <HStack justify="space-between" w="full">
                                                                <Text fontSize="sm">Teamplay</Text>
                                                                <CircularProgress
                                                                    value={currentPlayerAnalytics.psychologyProfile.teamplayRating}
                                                                    size="50px"
                                                                    color="orange.400"
                                                                >
                                                                    <CircularProgressLabel fontSize="xs">
                                                                        {currentPlayerAnalytics.psychologyProfile.teamplayRating}
                                                                    </CircularProgressLabel>
                                                                </CircularProgress>
                                                            </HStack>
                                                        </VStack>
                                                    </Box>

                                                    <Box>
                                                        <Text fontWeight="semibold" mb={3}>Comparison</Text>
                                                        <VStack spacing={2}>
                                                            <ComparisonMetric
                                                                label="Tilt Resistance"
                                                                playerValue={currentPlayerAnalytics.psychologyProfile.tiltResistance}
                                                                comparisonValue={player.analytics.psychologyProfile.tiltResistance}
                                                            />
                                                            <ComparisonMetric
                                                                label="Clutch Factor"
                                                                playerValue={currentPlayerAnalytics.psychologyProfile.clutchFactor}
                                                                comparisonValue={player.analytics.psychologyProfile.clutchFactor}
                                                            />
                                                            <ComparisonMetric
                                                                label="Consistency"
                                                                playerValue={currentPlayerAnalytics.psychologyProfile.consistencyScore}
                                                                comparisonValue={player.analytics.psychologyProfile.consistencyScore}
                                                            />
                                                            <ComparisonMetric
                                                                label="Teamplay"
                                                                playerValue={currentPlayerAnalytics.psychologyProfile.teamplayRating}
                                                                comparisonValue={player.analytics.psychologyProfile.teamplayRating}
                                                            />
                                                        </VStack>
                                                    </Box>
                                                </SimpleGrid>
                                            </TabPanel>

                                            {/* Timeline Comparison */}
                                            <TabPanel px={0}>
                                                <TableContainer>
                                                    <Table size="sm">
                                                        <Thead>
                                                            <Tr>
                                                                <Th>Game Phase</Th>
                                                                <Th isNumeric>Your Win Rate</Th>
                                                                <Th isNumeric>Their Win Rate</Th>
                                                                <Th isNumeric>Difference</Th>
                                                            </Tr>
                                                        </Thead>
                                                        <Tbody>
                                                            <Tr>
                                                                <Td fontWeight="medium">Early Game</Td>
                                                                <Td isNumeric>{currentPlayerAnalytics.timelineAnalytics.earlyGame.winRateInPhase.toFixed(0)}%</Td>
                                                                <Td isNumeric>{player.analytics.timelineAnalytics.earlyGame.winRateInPhase.toFixed(0)}%</Td>
                                                                <Td isNumeric>
                                                                    <Badge
                                                                        colorScheme={getComparisonColor(
                                                                            calculateComparisonScore(
                                                                                currentPlayerAnalytics.timelineAnalytics.earlyGame.winRateInPhase,
                                                                                player.analytics.timelineAnalytics.earlyGame.winRateInPhase
                                                                            )
                                                                        )}
                                                                    >
                                                                        {calculateComparisonScore(
                                                                            currentPlayerAnalytics.timelineAnalytics.earlyGame.winRateInPhase,
                                                                            player.analytics.timelineAnalytics.earlyGame.winRateInPhase
                                                                        ) >= 0 ? '+' : ''}{calculateComparisonScore(
                                                                            currentPlayerAnalytics.timelineAnalytics.earlyGame.winRateInPhase,
                                                                            player.analytics.timelineAnalytics.earlyGame.winRateInPhase
                                                                        ).toFixed(0)}%
                                                                    </Badge>
                                                                </Td>
                                                            </Tr>
                                                            <Tr>
                                                                <Td fontWeight="medium">Mid Game</Td>
                                                                <Td isNumeric>{currentPlayerAnalytics.timelineAnalytics.midGame.winRateInPhase.toFixed(0)}%</Td>
                                                                <Td isNumeric>{player.analytics.timelineAnalytics.midGame.winRateInPhase.toFixed(0)}%</Td>
                                                                <Td isNumeric>
                                                                    <Badge
                                                                        colorScheme={getComparisonColor(
                                                                            calculateComparisonScore(
                                                                                currentPlayerAnalytics.timelineAnalytics.midGame.winRateInPhase,
                                                                                player.analytics.timelineAnalytics.midGame.winRateInPhase
                                                                            )
                                                                        )}
                                                                    >
                                                                        {calculateComparisonScore(
                                                                            currentPlayerAnalytics.timelineAnalytics.midGame.winRateInPhase,
                                                                            player.analytics.timelineAnalytics.midGame.winRateInPhase
                                                                        ) >= 0 ? '+' : ''}{calculateComparisonScore(
                                                                            currentPlayerAnalytics.timelineAnalytics.midGame.winRateInPhase,
                                                                            player.analytics.timelineAnalytics.midGame.winRateInPhase
                                                                        ).toFixed(0)}%
                                                                    </Badge>
                                                                </Td>
                                                            </Tr>
                                                            <Tr>
                                                                <Td fontWeight="medium">Late Game</Td>
                                                                <Td isNumeric>{currentPlayerAnalytics.timelineAnalytics.lateGame.winRateInPhase.toFixed(0)}%</Td>
                                                                <Td isNumeric>{player.analytics.timelineAnalytics.lateGame.winRateInPhase.toFixed(0)}%</Td>
                                                                <Td isNumeric>
                                                                    <Badge
                                                                        colorScheme={getComparisonColor(
                                                                            calculateComparisonScore(
                                                                                currentPlayerAnalytics.timelineAnalytics.lateGame.winRateInPhase,
                                                                                player.analytics.timelineAnalytics.lateGame.winRateInPhase
                                                                            )
                                                                        )}
                                                                    >
                                                                        {calculateComparisonScore(
                                                                            currentPlayerAnalytics.timelineAnalytics.lateGame.winRateInPhase,
                                                                            player.analytics.timelineAnalytics.lateGame.winRateInPhase
                                                                        ) >= 0 ? '+' : ''}{calculateComparisonScore(
                                                                            currentPlayerAnalytics.timelineAnalytics.lateGame.winRateInPhase,
                                                                            player.analytics.timelineAnalytics.lateGame.winRateInPhase
                                                                        ).toFixed(0)}%
                                                                    </Badge>
                                                                </Td>
                                                            </Tr>
                                                        </Tbody>
                                                    </Table>
                                                </TableContainer>
                                            </TabPanel>

                                            {/* Performance Comparison */}
                                            <TabPanel px={0}>
                                                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                                                    <Box>
                                                        <Text fontWeight="semibold" mb={3}>Key Insights</Text>
                                                        <VStack spacing={3} align="stretch">
                                                            {currentPlayerAnalytics.psychologyProfile.tiltResistance > player.analytics.psychologyProfile.tiltResistance ? (
                                                                <Alert status="success" size="sm">
                                                                    <AlertIcon />
                                                                    <AlertDescription fontSize="sm">
                                                                        Your mental game is stronger - maintain composure advantage
                                                                    </AlertDescription>
                                                                </Alert>
                                                            ) : (
                                                                <Alert status="warning" size="sm">
                                                                    <AlertIcon />
                                                                    <AlertDescription fontSize="sm">
                                                                        Focus on tilt management - they handle pressure better
                                                                    </AlertDescription>
                                                                </Alert>
                                                            )}

                                                            {currentPlayerAnalytics.psychologyProfile.clutchFactor > player.analytics.psychologyProfile.clutchFactor ? (
                                                                <Alert status="success" size="sm">
                                                                    <AlertIcon />
                                                                    <AlertDescription fontSize="sm">
                                                                        You perform better in crucial moments
                                                                    </AlertDescription>
                                                                </Alert>
                                                            ) : (
                                                                <Alert status="info" size="sm">
                                                                    <AlertIcon />
                                                                    <AlertDescription fontSize="sm">
                                                                        Practice high-pressure scenarios to improve clutch performance
                                                                    </AlertDescription>
                                                                </Alert>
                                                            )}
                                                        </VStack>
                                                    </Box>

                                                    <Box>
                                                        <Text fontWeight="semibold" mb={3}>Recommendations</Text>
                                                        <VStack spacing={2} align="stretch">
                                                            <Text fontSize="sm" p={2} bg="blue.50" borderRadius="md" _dark={{ bg: 'blue.900' }}>
                                                                📈 Study their replay from strongest game phase
                                                            </Text>
                                                            <Text fontSize="sm" p={2} bg="green.50" borderRadius="md" _dark={{ bg: 'green.900' }}>
                                                                🎯 Focus on improving your weakest comparative area
                                                            </Text>
                                                            <Text fontSize="sm" p={2} bg="purple.50" borderRadius="md" _dark={{ bg: 'purple.900' }}>
                                                                🤝 Consider duo queue to learn their playstyle
                                                            </Text>
                                                        </VStack>
                                                    </Box>
                                                </SimpleGrid>
                                            </TabPanel>
                                        </TabPanels>
                                    </Tabs>
                                </Box>
                            ))}
                        </VStack>
                    )}
                </VStack>
            </CardBody>
        </Card>
    );
};

export default PlayerComparison;
