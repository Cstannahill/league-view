import React, { useMemo } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Grid,
    Badge,
    Icon,
    Progress,
    Divider,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow
} from '@chakra-ui/react';
import {
    FaChartLine,
    FaEye,
    FaTrophy
} from 'react-icons/fa';
import {
    GiSwordman,
    GiShield,
    GiCrosshair,
    GiStairsGoal,
    GiTwoCoins
} from 'react-icons/gi';
import { TimelineAnalytics, GamePhaseStats } from '../../types/analytics';

interface TimelineAnalyticsComponentProps {
    timelineAnalytics: TimelineAnalytics;
    compactView?: boolean;
}

const TimelineAnalyticsComponent: React.FC<TimelineAnalyticsComponentProps> = ({
    timelineAnalytics,
    compactView = false
}) => {
    const phases = useMemo(() => [
        {
            name: 'Early Game',
            period: '0-15 min',
            data: timelineAnalytics.earlyGame,
            color: 'blue',
            icon: GiSwordman
        },
        {
            name: 'Mid Game',
            period: '15-30 min',
            data: timelineAnalytics.midGame,
            color: 'orange',
            icon: GiCrosshair
        },
        {
            name: 'Late Game',
            period: '30+ min',
            data: timelineAnalytics.lateGame,
            color: 'purple',
            icon: GiShield
        }
    ], [timelineAnalytics]);

    const getBestPhase = () => {
        return phases.reduce(
            (best, phase) =>
                phase.data.winRateInPhase > best.data.winRateInPhase ? phase : best
        );
    };

    const getWeakestPhase = () => {
        return phases.reduce(
            (weakest, phase) =>
                phase.data.winRateInPhase < weakest.data.winRateInPhase ? phase : weakest
        );
    };

    const bestPhase = useMemo(() => getBestPhase(), [phases]);
    const weakestPhase = useMemo(() => getWeakestPhase(), [phases]);

    return (
        <Box borderWidth="1px" borderRadius="lg" p={4}>
            <HStack justify="space-between">
                <HStack>
                    {/* ...existing code... */}
                </HStack>
                <Badge colorScheme="blue" variant="outline">
                    Game Phase Analysis
                </Badge>
            </HStack>
            <Divider my={4} />
            <VStack spacing={4} align="stretch">
                {/* Phase Overview Cards */}
                <Grid templateColumns={{ base: '1fr', md: compactView ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)' }} gap={4}>
                    {phases.map((phase: any) => (
                        <PhaseCard
                            key={phase.name}
                            phase={phase}
                            isStrongest={phase.name === bestPhase.name}
                            isWeakest={phase.name === weakestPhase.name}
                            compactView={compactView}
                        />
                    ))}
                </Grid>

                {!compactView && (
                    <>
                        <Divider />

                        {/* Detailed Phase Comparison */}
                        <Box>
                            <Text fontWeight="semibold" fontSize="md" mb={4}>
                                Phase Performance Breakdown
                            </Text>
                            <PhaseComparisonTable phases={phases} />
                        </Box>

                        <Divider />

                        {/* Timeline Insights */}
                        <TimelineInsights
                            bestPhase={bestPhase}
                            weakestPhase={weakestPhase}
                            timelineAnalytics={timelineAnalytics}
                        />
                    </>
                )}
            </VStack>
        </Box>
    );
}

interface PhaseCardProps {
    phase: {
        name: string;
        period: string;
        data: GamePhaseStats;
        color: string;
        icon: React.ComponentType;
    };
    isStrongest: boolean;
    isWeakest: boolean;
    compactView: boolean;
}

const PhaseCard: React.FC<PhaseCardProps> = ({
    phase,
    isStrongest,
    isWeakest,
    compactView
}) => {
    const kda = (phase.data.avgKills + phase.data.avgAssists) / Math.max(phase.data.avgDeaths, 1);

    const getPerformanceColor = () => {
        if (isStrongest) return 'green';
        if (isWeakest) return 'red';
        return phase.color;
    };

    return (
        <Box
            borderWidth="2px"
            borderRadius="lg"
            p={4}
            borderColor={isStrongest ? 'green.300' : isWeakest ? 'red.300' : `${phase.color}.200`}
            bg={isStrongest ? 'green.50' : isWeakest ? 'red.50' : `${phase.color}.50`}
            _dark={{
                bg: isStrongest ? 'green.900' : isWeakest ? 'red.900' : `${phase.color}.900`,
                borderColor: isStrongest ? 'green.600' : isWeakest ? 'red.600' : `${phase.color}.500`
            }}
            position="relative"
        >
            {isStrongest && (
                <Badge
                    position="absolute"
                    top="-2"
                    right="-2"
                    colorScheme="green"
                    variant="solid"
                    fontSize="xs"
                >
                    Strongest
                </Badge>
            )}
            {isWeakest && (
                <Badge
                    position="absolute"
                    top="-2"
                    right="-2"
                    colorScheme="red"
                    variant="solid"
                    fontSize="xs"
                >
                    Needs Work
                </Badge>
            )}

            <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                        <HStack>
                            <Icon as={phase.icon} color={`${getPerformanceColor()}.500`} />
                            <Text fontWeight="bold" fontSize="lg">
                                {phase.name}
                            </Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                            {phase.period}
                        </Text>
                    </VStack>
                    <VStack align="end" spacing={1}>
                        <Text fontSize="2xl" fontWeight="bold" color={`${getPerformanceColor()}.600`}>
                            {phase.data.winRateInPhase}%
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                            Win Rate
                        </Text>
                    </VStack>
                </HStack>

                <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                    <Box>
                        <Text fontSize="xs" fontWeight="medium">KDA</Text>
                        <Text fontSize="sm">{kda.toFixed(1)}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" fontWeight="medium">Gold Diff</Text>
                        <Text fontSize="sm" color={phase.data.avgGoldDiff >= 0 ? 'green.500' : 'red.500'}>
                            {phase.data.avgGoldDiff >= 0 ? '+' : ''}{phase.data.avgGoldDiff}
                        </Text>
                    </Box>
                </Grid>

                {!compactView && (
                    <>
                        <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                            <Box>
                                <Text fontSize="xs" fontWeight="medium">CS Diff</Text>
                                <Text fontSize="sm" color={phase.data.avgCSDiff >= 0 ? 'green.500' : 'red.500'}>
                                    {phase.data.avgCSDiff >= 0 ? '+' : ''}{phase.data.avgCSDiff}
                                </Text>
                            </Box>
                            <Box>
                                <Text fontSize="xs" fontWeight="medium">Dmg Share</Text>
                                <Text fontSize="sm">
                                    {(phase.data.avgDamageShare * 100).toFixed(0)}%
                                </Text>
                            </Box>
                        </Grid>

                        <Box>
                            <HStack justify="space-between" mb={1}>
                                <Text fontSize="xs" fontWeight="medium">Objective Participation</Text>
                                <Text fontSize="xs">{(phase.data.objectiveParticipation * 100).toFixed(0)}%</Text>
                            </HStack>
                            <Progress
                                value={phase.data.objectiveParticipation * 100}
                                colorScheme={getPerformanceColor()}
                                size="sm"
                                borderRadius="md"
                            />
                        </Box>
                    </>
                )}
            </VStack>
        </Box>
    );
};

interface PhaseComparisonTableProps {
    phases: Array<{
        name: string;
        period: string;
        data: GamePhaseStats;
        color: string;
        icon: React.ComponentType;
    }>;
}

const PhaseComparisonTable: React.FC<PhaseComparisonTableProps> = ({ phases }) => {
    const metrics = [
        { label: 'Win Rate', key: 'winRateInPhase', suffix: '%', icon: FaTrophy },
        { label: 'Avg Kills', key: 'avgKills', suffix: '', icon: GiCrosshair },
        { label: 'Avg Deaths', key: 'avgDeaths', suffix: '', icon: GiShield },
        { label: 'Gold Diff', key: 'avgGoldDiff', suffix: '', icon: GiTwoCoins },
        { label: 'CS Diff', key: 'avgCSDiff', suffix: '', icon: GiSwordman },
        { label: 'Obj Participation', key: 'objectiveParticipation', suffix: '%', icon: FaEye }
    ];

    return (
        <Box overflowX="auto">
            <Grid templateColumns="repeat(4, 1fr)" gap={2} minW="600px">
                {/* Header */}
                <Box></Box>
                {phases.map((phase: any) => (
                    <Text key={phase.name} fontSize="sm" fontWeight="bold" textAlign="center">
                        {phase.name}
                    </Text>
                ))}

                {/* Metrics Rows */}
                {metrics.map((metric) => (
                    <React.Fragment key={metric.label}>
                        <HStack>
                            <Icon as={metric.icon} size="sm" color="gray.500" />
                            <Text fontSize="sm" fontWeight="medium">
                                {metric.label}
                            </Text>
                        </HStack>
                        {phases.map((phase: any) => {
                            const value = (phase.data as any)[metric.key];
                            const displayValue = metric.key === 'objectiveParticipation'
                                ? (value * 100).toFixed(0)
                                : typeof value === 'number'
                                    ? value.toFixed(1)
                                    : value;

                            const isHighest = phases.every(p => (p.data as any)[metric.key] <= value);
                            const isLowest = phases.every(p => (p.data as any)[metric.key] >= value);

                            return (
                                <Box key={`${phase.name}-${metric.key}`} textAlign="center">
                                    <Text
                                        fontSize="sm"
                                        fontWeight={isHighest ? 'bold' : 'normal'}
                                        color={isHighest ? 'green.600' : isLowest ? 'red.600' : 'inherit'}
                                    >
                                        {displayValue}{metric.suffix}
                                    </Text>
                                </Box>
                            );
                        })}
                    </React.Fragment>
                ))}
            </Grid>
        </Box>
    );
};

interface TimelineInsightsProps {
    bestPhase: {
        name: string;
        data: GamePhaseStats;
    };
    weakestPhase: {
        name: string;
        data: GamePhaseStats;
    };
    timelineAnalytics: TimelineAnalytics;
}

const TimelineInsights: React.FC<TimelineInsightsProps> = ({
    bestPhase,
    weakestPhase,
    timelineAnalytics
}) => {
    const generateInsight = () => {
        const insights = [];

        // Best phase insight
        if (bestPhase.name === 'Early Game') {
            insights.push("You excel in the early game. Consider playing champions that can snowball early leads.");
        } else if (bestPhase.name === 'Late Game') {
            insights.push("You're a late game powerhouse. Focus on farming safely and scaling for team fights.");
        } else {
            insights.push("Your mid game is strong. Look for opportunities to group and take objectives.");
        }

        // Weakest phase improvement
        if (weakestPhase.name === 'Early Game') {
            insights.push("Work on your early game by improving trading patterns and jungle awareness.");
        } else if (weakestPhase.name === 'Late Game') {
            insights.push("Focus on late game positioning and decision-making in team fights.");
        } else {
            insights.push("Improve your mid game by better objective control and roaming.");
        }

        // Objective participation insight
        const avgObjectiveParticipation =
            (timelineAnalytics.earlyGame.objectiveParticipation +
                timelineAnalytics.midGame.objectiveParticipation +
                timelineAnalytics.lateGame.objectiveParticipation) / 3;

        if (avgObjectiveParticipation > 0.8) {
            insights.push("Excellent objective focus across all game phases.");
        } else if (avgObjectiveParticipation < 0.6) {
            insights.push("Consider prioritizing objective control more in your gameplay.");
        }

        return insights;
    };

    const insights = generateInsight();

    return (
        <Box>
            <Text fontWeight="semibold" fontSize="md" mb={3}>
                Timeline Performance Insights
            </Text>
            <VStack align="stretch" spacing={3}>
                {insights.map((insight, index) => (
                    <Box
                        key={index}
                        p={3}
                        bg="blue.50"
                        borderRadius="md"
                        borderLeft="4px solid"
                        borderLeftColor="blue.400"
                        _dark={{ bg: 'blue.900' }}
                    >
                        <HStack>
                            <Icon as={FaChartLine} color="blue.400" />
                            <Text fontSize="sm" color="gray.700" _dark={{ color: 'gray.300' }}>
                                {insight}
                            </Text>
                        </HStack>
                    </Box>
                ))}

                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4} mt={4}>
                    <Stat>
                        <StatLabel>
                            <HStack>
                                <Icon as={FaTrophy} color="green.400" />
                                <Text>Strongest Phase</Text>
                            </HStack>
                        </StatLabel>
                        <StatNumber color="green.500">
                            {bestPhase.name}
                        </StatNumber>
                        <StatHelpText>
                            <StatArrow type="increase" />
                            {bestPhase.data.winRateInPhase}% win rate
                        </StatHelpText>
                    </Stat>

                    <Stat>
                        <StatLabel>
                            <HStack>
                                <Icon as={GiStairsGoal} color="orange.400" />
                                <Text>Focus Area</Text>
                            </HStack>
                        </StatLabel>
                        <StatNumber color="orange.500">
                            {weakestPhase.name}
                        </StatNumber>
                        <StatHelpText>
                            <StatArrow type="decrease" />
                            {weakestPhase.data.winRateInPhase}% win rate
                        </StatHelpText>
                    </Stat>

                    <Stat>
                        <StatLabel>
                            <HStack>
                                <Icon as={FaEye} color="blue.400" />
                                <Text>Objective Focus</Text>
                            </HStack>
                        </StatLabel>
                        <StatNumber color="blue.500">
                            {((timelineAnalytics.earlyGame.objectiveParticipation +
                                timelineAnalytics.midGame.objectiveParticipation +
                                timelineAnalytics.lateGame.objectiveParticipation) / 3 * 100).toFixed(0)}%
                        </StatNumber>
                        <StatHelpText>
                            Average participation
                        </StatHelpText>
                    </Stat>
                </Grid>
            </VStack>
        </Box>
    );
};

export default TimelineAnalyticsComponent;
