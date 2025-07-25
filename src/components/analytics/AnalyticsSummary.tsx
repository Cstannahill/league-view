import React from 'react';
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
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Divider,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    List,
    ListItem,
    ListIcon,
    CircularProgress,
    CircularProgressLabel
} from '@chakra-ui/react';
import {
    FaChartLine,
    FaTrophy,
    FaExclamationTriangle,
    FaLightbulb,
    FaBullseye,
    FaStar
} from 'react-icons/fa';
import {
    GiMountainClimbing,
    GiTrophyCup,
    GiSkills
} from 'react-icons/gi';
import { AdvancedAnalytics } from '../../types/analytics';

interface AnalyticsSummaryProps {
    analytics: AdvancedAnalytics;
}

const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ analytics }) => {
    const calculateOverallRating = () => {
        const psychScore =
            (analytics.psychologyProfile.tiltResistance +
                analytics.psychologyProfile.combackPotential +
                analytics.psychologyProfile.clutchFactor +
                analytics.psychologyProfile.consistencyScore +
                analytics.psychologyProfile.adaptabilityScore +
                analytics.psychologyProfile.teamplayRating) / 6;

        const timelineScore =
            (analytics.timelineAnalytics.earlyGame.winRateInPhase +
                analytics.timelineAnalytics.midGame.winRateInPhase +
                analytics.timelineAnalytics.lateGame.winRateInPhase) / 3;

        const metaScore =
            (analytics.metaAdaptation.currentPatchPerformance +
                analytics.metaAdaptation.roleFlexibility +
                analytics.metaAdaptation.itemBuildAdaptation) / 3;

        return (psychScore * 0.4 + timelineScore * 0.4 + metaScore * 0.2);
    };

    const getTopStrengths = () => {
        const strengths = [];
        const profile = analytics.psychologyProfile;
        const timeline = analytics.timelineAnalytics;

        if (profile.clutchFactor >= 80) strengths.push({ name: 'Clutch Performance', score: profile.clutchFactor });
        if (profile.teamplayRating >= 80) strengths.push({ name: 'Team Coordination', score: profile.teamplayRating });
        if (profile.tiltResistance >= 75) strengths.push({ name: 'Mental Resilience', score: profile.tiltResistance });
        if (timeline.lateGame.winRateInPhase >= 70) strengths.push({ name: 'Late Game Mastery', score: timeline.lateGame.winRateInPhase });
        if (timeline.earlyGame.winRateInPhase >= 70) strengths.push({ name: 'Early Game Power', score: timeline.earlyGame.winRateInPhase });

        return strengths.sort((a, b) => b.score - a.score).slice(0, 3);
    };

    const getImprovementAreas = () => {
        const areas = [];
        const profile = analytics.psychologyProfile;
        const timeline = analytics.timelineAnalytics;

        if (profile.tiltResistance < 60) areas.push({ name: 'Tilt Management', score: profile.tiltResistance, priority: 'high' });
        if (profile.consistencyScore < 65) areas.push({ name: 'Performance Consistency', score: profile.consistencyScore, priority: 'medium' });
        if (timeline.earlyGame.winRateInPhase < 50) areas.push({ name: 'Early Game Impact', score: timeline.earlyGame.winRateInPhase, priority: 'high' });
        if (timeline.midGame.winRateInPhase < 55) areas.push({ name: 'Mid Game Transition', score: timeline.midGame.winRateInPhase, priority: 'medium' });
        if (analytics.metaAdaptation.championPoolSize < 5) areas.push({ name: 'Champion Pool Expansion', score: analytics.metaAdaptation.championPoolSize * 20, priority: 'low' });

        return areas.sort((a, b) => a.score - b.score).slice(0, 4);
    };

    const getStrategicRecommendations = () => {
        const recommendations = [];
        const bestPhase = getBestGamePhase();
        const weakestPhase = getWeakestGamePhase();

        recommendations.push({
            type: 'champion_selection',
            title: 'Champion Selection Strategy',
            description: `Focus on champions that excel in ${bestPhase.name.toLowerCase()} to leverage your strength.`,
            priority: 'high'
        });

        if (weakestPhase.score < 55) {
            recommendations.push({
                type: 'skill_development',
                title: `${weakestPhase.name} Improvement`,
                description: `Dedicate practice time to ${weakestPhase.name.toLowerCase()} fundamentals and decision-making.`,
                priority: 'high'
            });
        }

        if (analytics.psychologyProfile.tiltResistance < 65) {
            recommendations.push({
                type: 'mental_game',
                title: 'Mental Game Training',
                description: 'Consider taking breaks between losses and focusing on mental reset techniques.',
                priority: 'medium'
            });
        }

        if (analytics.metaAdaptation.championPoolSize < 6) {
            recommendations.push({
                type: 'champion_pool',
                title: 'Expand Champion Pool',
                description: 'Learn 2-3 new champions to increase adaptation to meta changes.',
                priority: 'low'
            });
        }

        return recommendations;
    };

    const getBestGamePhase = () => {
        const phases = [
            { name: 'Early Game', score: analytics.timelineAnalytics.earlyGame.winRateInPhase },
            { name: 'Mid Game', score: analytics.timelineAnalytics.midGame.winRateInPhase },
            { name: 'Late Game', score: analytics.timelineAnalytics.lateGame.winRateInPhase }
        ];
        return phases.reduce((best, phase) => phase.score > best.score ? phase : best);
    };

    const getWeakestGamePhase = () => {
        const phases = [
            { name: 'Early Game', score: analytics.timelineAnalytics.earlyGame.winRateInPhase },
            { name: 'Mid Game', score: analytics.timelineAnalytics.midGame.winRateInPhase },
            { name: 'Late Game', score: analytics.timelineAnalytics.lateGame.winRateInPhase }
        ];
        return phases.reduce((weakest, phase) => phase.score < weakest.score ? phase : weakest);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'red';
            case 'medium': return 'yellow';
            case 'low': return 'green';
            default: return 'blue';
        }
    };

    const overallRating = calculateOverallRating();
    const topStrengths = getTopStrengths();
    const improvementAreas = getImprovementAreas();
    const recommendations = getStrategicRecommendations();

    return (
        <Card>
            <CardHeader>
                <HStack justify="space-between">
                    <HStack>
                        <Icon as={FaChartLine} color="purple.400" />
                        <Heading size="md">Performance Analytics Summary</Heading>
                    </HStack>
                    <Badge
                        colorScheme={overallRating >= 75 ? 'green' : overallRating >= 60 ? 'blue' : 'orange'}
                        variant="solid"
                        fontSize="md"
                        px={3}
                        py={1}
                    >
                        {overallRating.toFixed(0)}/100 Rating
                    </Badge>
                </HStack>
            </CardHeader>
            <CardBody>
                <VStack spacing={6} align="stretch">
                    {/* Overall Performance Overview */}
                    <SimpleGrid columns={{ base: 1, lg: 4 }} spacing={4}>
                        <Box textAlign="center">
                            <CircularProgress
                                value={overallRating}
                                size="80px"
                                color={overallRating >= 75 ? 'green' : overallRating >= 60 ? 'blue' : 'orange'}
                                thickness="8px"
                            >
                                <CircularProgressLabel fontSize="sm" fontWeight="bold">
                                    {overallRating.toFixed(0)}
                                </CircularProgressLabel>
                            </CircularProgress>
                            <Text fontSize="sm" fontWeight="medium" mt={2}>
                                Overall Performance
                            </Text>
                        </Box>

                        <Stat>
                            <StatLabel>Best Phase</StatLabel>
                            <StatNumber color="green.500" fontSize="md">
                                {getBestGamePhase().name}
                            </StatNumber>
                            <StatHelpText>
                                <StatArrow type="increase" />
                                {getBestGamePhase().score.toFixed(0)}% win rate
                            </StatHelpText>
                        </Stat>

                        <Stat>
                            <StatLabel>Champion Pool</StatLabel>
                            <StatNumber color="blue.500" fontSize="md">
                                {analytics.metaAdaptation.championPoolSize}
                            </StatNumber>
                            <StatHelpText>
                                Unique champions played
                            </StatHelpText>
                        </Stat>

                        <Stat>
                            <StatLabel>Mental Strength</StatLabel>
                            <StatNumber
                                color={analytics.psychologyProfile.tiltResistance >= 70 ? 'green.500' : 'orange.500'}
                                fontSize="md"
                            >
                                {analytics.psychologyProfile.tiltResistance.toFixed(0)}
                            </StatNumber>
                            <StatHelpText>
                                Tilt resistance score
                            </StatHelpText>
                        </Stat>
                    </SimpleGrid>

                    <Divider />

                    {/* Strengths and Improvement Areas */}
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                        {/* Top Strengths */}
                        <Box>
                            <HStack mb={4}>
                                <Icon as={FaTrophy} color="yellow.400" />
                                <Text fontWeight="bold" fontSize="lg">
                                    Top Strengths
                                </Text>
                            </HStack>
                            <VStack align="stretch" spacing={3}>
                                {topStrengths.map((strength, index) => (
                                    <HStack key={strength.name} justify="space-between" p={3} bg="green.50" borderRadius="md" _dark={{ bg: 'green.900' }}>
                                        <HStack>
                                            <Badge colorScheme="green" variant="solid">
                                                #{index + 1}
                                            </Badge>
                                            <Text fontSize="sm" fontWeight="medium">
                                                {strength.name}
                                            </Text>
                                        </HStack>
                                        <Text fontSize="sm" fontWeight="bold" color="green.600">
                                            {strength.score.toFixed(0)}
                                        </Text>
                                    </HStack>
                                ))}
                                {topStrengths.length === 0 && (
                                    <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                                        Continue playing to identify your strengths!
                                    </Text>
                                )}
                            </VStack>
                        </Box>

                        {/* Improvement Areas */}
                        <Box>
                            <HStack mb={4}>
                                <Icon as={FaBullseye} color="orange.400" />
                                <Text fontWeight="bold" fontSize="lg">
                                    Focus Areas
                                </Text>
                            </HStack>
                            <VStack align="stretch" spacing={3}>
                                {improvementAreas.map((area) => (
                                    <HStack key={area.name} justify="space-between" p={3} bg="orange.50" borderRadius="md" _dark={{ bg: 'orange.900' }}>
                                        <HStack>
                                            <Badge colorScheme={getPriorityColor(area.priority)} variant="outline" size="sm">
                                                {area.priority}
                                            </Badge>
                                            <Text fontSize="sm" fontWeight="medium">
                                                {area.name}
                                            </Text>
                                        </HStack>
                                        <Text fontSize="sm" fontWeight="bold" color="orange.600">
                                            {area.score.toFixed(0)}
                                        </Text>
                                    </HStack>
                                ))}
                                {improvementAreas.length === 0 && (
                                    <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                                        Great performance across all areas!
                                    </Text>
                                )}
                            </VStack>
                        </Box>
                    </SimpleGrid>

                    <Divider />

                    {/* Strategic Recommendations */}
                    <Box>
                        <HStack mb={4}>
                            <Icon as={FaLightbulb} color="blue.400" />
                            <Text fontWeight="bold" fontSize="lg">
                                Strategic Recommendations
                            </Text>
                        </HStack>
                        <VStack align="stretch" spacing={3}>
                            {recommendations.map((rec, index) => (
                                <Alert
                                    key={index}
                                    status={rec.priority === 'high' ? 'warning' : rec.priority === 'medium' ? 'info' : 'success'}
                                    borderRadius="md"
                                    variant="left-accent"
                                >
                                    <AlertIcon />
                                    <Box>
                                        <AlertTitle fontSize="sm">
                                            {rec.title}
                                        </AlertTitle>
                                        <AlertDescription fontSize="xs">
                                            {rec.description}
                                        </AlertDescription>
                                    </Box>
                                    <Badge
                                        ml="auto"
                                        colorScheme={getPriorityColor(rec.priority)}
                                        variant="outline"
                                        size="sm"
                                    >
                                        {rec.priority}
                                    </Badge>
                                </Alert>
                            ))}
                        </VStack>
                    </Box>

                    <Divider />

                    {/* Quick Action Items */}
                    <Box>
                        <HStack mb={4}>
                            <Icon as={GiSkills} color="purple.400" />
                            <Text fontWeight="bold" fontSize="lg">
                                Immediate Action Items
                            </Text>
                        </HStack>
                        <List spacing={2}>
                            <ListItem>
                                <ListIcon as={FaStar} color="yellow.400" />
                                <Text as="span" fontSize="sm">
                                    Play champions that excel in {getBestGamePhase().name.toLowerCase()}
                                </Text>
                            </ListItem>
                            {improvementAreas.length > 0 && (
                                <ListItem>
                                    <ListIcon as={FaExclamationTriangle} color="orange.400" />
                                    <Text as="span" fontSize="sm">
                                        Focus practice sessions on {improvementAreas[0].name.toLowerCase()}
                                    </Text>
                                </ListItem>
                            )}
                            <ListItem>
                                <ListIcon as={GiMountainClimbing} color="green.400" />
                                <Text as="span" fontSize="sm">
                                    Review replays from your strongest performances to identify patterns
                                </Text>
                            </ListItem>
                            {analytics.psychologyProfile.tiltResistance < 70 && (
                                <ListItem>
                                    <ListIcon as={GiTrophyCup} color="blue.400" />
                                    <Text as="span" fontSize="sm">
                                        Take 5-10 minute breaks between ranked games to maintain mental clarity
                                    </Text>
                                </ListItem>
                            )}
                        </List>
                    </Box>
                </VStack>
            </CardBody>
        </Card>
    );
};

export default AnalyticsSummary;
