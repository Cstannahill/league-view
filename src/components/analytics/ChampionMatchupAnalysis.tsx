import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Badge,
    Tooltip,
    SimpleGrid,
    Divider,
    Icon,
    Card,
    CardHeader,
    CardBody,
    Heading,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow
} from '@chakra-ui/react';
import { FaShieldAlt, FaTrophy, FaChartLine } from 'react-icons/fa';
import { GiCrossedSwords, GiTrophy } from 'react-icons/gi';
import { ChampionAnalytics } from '../../types/analytics';

interface ChampionMatchupAnalysisProps {
    championAnalytics: ChampionAnalytics[];
    compactView?: boolean;
}

const ChampionMatchupAnalysis: React.FC<ChampionMatchupAnalysisProps> = ({
    championAnalytics,
    compactView = false
}) => {
    const topChampions = championAnalytics
        .sort((a, b) => b.totalGames - a.totalGames)
        .slice(0, compactView ? 3 : 6);

    if (topChampions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <Heading size="md">Champion Matchup Analysis</Heading>
                </CardHeader>
                <CardBody>
                    <Text color="gray.500">No champion data available for matchup analysis.</Text>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <HStack justify="space-between">
                    <HStack>
                        <Icon as={GiCrossedSwords} color="blue.400" />
                        <Heading size="md">Champion Matchup Analysis</Heading>
                    </HStack>
                    <Badge colorScheme="blue" variant="outline">
                        Advanced Analytics
                    </Badge>
                </HStack>
            </CardHeader>
            <CardBody>
                <VStack spacing={4} align="stretch">
                    <SimpleGrid columns={{ base: 1, lg: compactView ? 1 : 2 }} spacing={4}>
                        {topChampions.map((champion) => (
                            <ChampionMatchupCard
                                key={champion.championId}
                                champion={champion}
                                compactView={compactView}
                            />
                        ))}
                    </SimpleGrid>

                    {!compactView && (
                        <>
                            <Divider />
                            <MatchupInsights championAnalytics={championAnalytics} />
                        </>
                    )}
                </VStack>
            </CardBody>
        </Card>
    );
};

interface ChampionMatchupCardProps {
    champion: ChampionAnalytics;
    compactView: boolean;
}

const ChampionMatchupCard: React.FC<ChampionMatchupCardProps> = ({
    champion,
    compactView
}) => {
    const strongMatchups = champion.matchupData.filter(m => m.winRate > 60);
    const weakMatchups = champion.matchupData.filter(m => m.winRate < 40);

    const getWinRateColor = (winRate: number) => {
        if (winRate >= 70) return 'green';
        if (winRate >= 55) return 'blue';
        if (winRate >= 45) return 'yellow';
        return 'red';
    };

    const getTrendIcon = () => {
        switch (champion.recentTrend) {
            case 'improving':
                return <StatArrow type="increase" />;
            case 'declining':
                return <StatArrow type="decrease" />;
            default:
                return <Icon as={FaChartLine} color="gray.400" />;
        }
    };

    return (
        <Box
            borderWidth="1px"
            borderRadius="lg"
            p={4}
            bg="gray.50"
            _dark={{ bg: 'gray.700' }}
        >
            <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                        <HStack>
                            <Text fontWeight="bold" fontSize="lg">
                                {champion.championName}
                            </Text>
                            {getTrendIcon()}
                        </HStack>
                        <HStack>
                            <Badge colorScheme={getWinRateColor(champion.winRate)}>
                                {champion.winRate.toFixed(1)}% WR
                            </Badge>
                            <Text fontSize="sm" color="gray.500">
                                {champion.totalGames} games
                            </Text>
                        </HStack>
                    </VStack>

                    <VStack align="end" spacing={1}>
                        <Stat size="sm">
                            <StatLabel>KDA</StatLabel>
                            <StatNumber fontSize="md">
                                {((champion.averageKDA.kills + champion.averageKDA.assists) /
                                    Math.max(champion.averageKDA.deaths, 1)).toFixed(1)}
                            </StatNumber>
                        </Stat>
                    </VStack>
                </HStack>

                {!compactView && (
                    <>
                        <SimpleGrid columns={3} spacing={2}>
                            <Stat size="sm">
                                <StatLabel>Avg CS</StatLabel>
                                <StatNumber fontSize="sm">{champion.averageCS.toFixed(0)}</StatNumber>
                            </Stat>
                            <Stat size="sm">
                                <StatLabel>Avg Gold</StatLabel>
                                <StatNumber fontSize="sm">{(champion.averageGold / 1000).toFixed(1)}k</StatNumber>
                            </Stat>
                            <Stat size="sm">
                                <StatLabel>Vision</StatLabel>
                                <StatNumber fontSize="sm">{champion.averageVisionScore.toFixed(0)}</StatNumber>
                            </Stat>
                        </SimpleGrid>

                        <Divider />

                        <VStack align="stretch" spacing={2}>
                            <Text fontSize="sm" fontWeight="semibold">Matchup Performance</Text>

                            {strongMatchups.length > 0 && (
                                <Box>
                                    <HStack>
                                        <Icon as={FaTrophy} color="green.400" size="xs" />
                                        <Text fontSize="xs" color="green.600" fontWeight="medium">
                                            Strong vs:
                                        </Text>
                                    </HStack>
                                    <HStack flexWrap="wrap" spacing={1} mt={1}>
                                        {strongMatchups.slice(0, 3).map((matchup) => (
                                            <Tooltip
                                                key={matchup.enemyChampionId}
                                                label={`${matchup.winRate.toFixed(1)}% WR in ${matchup.games} games`}
                                            >
                                                <Badge
                                                    size="sm"
                                                    colorScheme="green"
                                                    variant="subtle"
                                                    cursor="help"
                                                >
                                                    {matchup.enemyChampion}
                                                </Badge>
                                            </Tooltip>
                                        ))}
                                    </HStack>
                                </Box>
                            )}

                            {weakMatchups.length > 0 && (
                                <Box>
                                    <HStack>
                                        <Icon as={FaShieldAlt} color="red.400" size="xs" />
                                        <Text fontSize="xs" color="red.600" fontWeight="medium">
                                            Weak vs:
                                        </Text>
                                    </HStack>
                                    <HStack flexWrap="wrap" spacing={1} mt={1}>
                                        {weakMatchups.slice(0, 3).map((matchup) => (
                                            <Tooltip
                                                key={matchup.enemyChampionId}
                                                label={`${matchup.winRate.toFixed(1)}% WR in ${matchup.games} games`}
                                            >
                                                <Badge
                                                    size="sm"
                                                    colorScheme="red"
                                                    variant="subtle"
                                                    cursor="help"
                                                >
                                                    {matchup.enemyChampion}
                                                </Badge>
                                            </Tooltip>
                                        ))}
                                    </HStack>
                                </Box>
                            )}
                        </VStack>
                    </>
                )}
            </VStack>
        </Box>
    );
};

interface MatchupInsightsProps {
    championAnalytics: ChampionAnalytics[];
}

const MatchupInsights: React.FC<MatchupInsightsProps> = ({ championAnalytics }) => {
    const totalMatchups = championAnalytics.reduce(
        (sum, champion) => sum + champion.matchupData.length,
        0
    );

    const favorableMatchups = championAnalytics.reduce(
        (sum, champion) => sum + champion.matchupData.filter(m => m.winRate > 55).length,
        0
    );

    const hardCounters = championAnalytics.reduce(
        (sum, champion) => sum + champion.matchupData.filter(m => m.winRate < 35).length,
        0
    );

    return (
        <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={3}>
                Matchup Intelligence Summary
            </Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Stat>
                    <StatLabel>
                        <HStack>
                            <Icon as={GiTrophy} color="green.400" />
                            <Text>Favorable Matchups</Text>
                        </HStack>
                    </StatLabel>
                    <StatNumber color="green.400">
                        {favorableMatchups}
                    </StatNumber>
                    <StatHelpText>
                        {totalMatchups > 0 ? ((favorableMatchups / totalMatchups) * 100).toFixed(0) : 0}% of analyzed matchups
                    </StatHelpText>
                </Stat>

                <Stat>
                    <StatLabel>
                        <HStack>
                            <Icon as={GiCrossedSwords} color="red.400" />
                            <Text>Hard Counters</Text>
                        </HStack>
                    </StatLabel>
                    <StatNumber color="red.400">
                        {hardCounters}
                    </StatNumber>
                    <StatHelpText>
                        Champions to avoid or ban
                    </StatHelpText>
                </Stat>

                <Stat>
                    <StatLabel>
                        <HStack>
                            <Icon as={FaChartLine} color="blue.400" />
                            <Text>Adaptation Rate</Text>
                        </HStack>
                    </StatLabel>
                    <StatNumber color="blue.400">
                        {totalMatchups > 0 ? Math.max(0, 100 - (hardCounters / totalMatchups) * 100).toFixed(0) : 0}%
                    </StatNumber>
                    <StatHelpText>
                        Ability to handle diverse matchups
                    </StatHelpText>
                </Stat>
            </SimpleGrid>
        </Box>
    );
};

export default ChampionMatchupAnalysis;
