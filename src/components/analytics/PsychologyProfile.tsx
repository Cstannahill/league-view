import React, { useMemo } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Progress,
    Card,
    CardHeader,
    CardBody,
    Heading,
    SimpleGrid,
    Badge,
    Icon,
    Tooltip,
    CircularProgress,
    CircularProgressLabel,
    Divider
} from '@chakra-ui/react';
import {
    FaBrain,
    FaStar,
    FaBalanceScale,
    FaUsers,
    FaFire
} from 'react-icons/fa';
import {
    GiMountainClimbing,
    GiBullseye,
    GiShield
} from 'react-icons/gi';
import { PlayerPsychologyProfile } from '../../types/analytics';

interface PsychologyProfileComponentProps {
    profile: PlayerPsychologyProfile;
    compactView?: boolean;
}

const PsychologyProfileComponent: React.FC<PsychologyProfileComponentProps> = ({
    profile,
    compactView = false
}) => {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'green';
        if (score >= 65) return 'blue';
        if (score >= 50) return 'yellow';
        if (score >= 35) return 'orange';
        return 'red';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 85) return 'Exceptional';
        if (score >= 70) return 'Strong';
        if (score >= 55) return 'Good';
        if (score >= 40) return 'Developing';
        return 'Needs Work';
    };

    const psychTraits = [
        {
            name: 'Tilt Resistance',
            value: profile.tiltResistance,
            icon: GiShield,
            description: 'Ability to maintain performance after losses',
            color: 'blue'
        },
        {
            name: 'Comeback Potential',
            value: profile.combackPotential,
            icon: GiMountainClimbing,
            description: 'Performance when behind in games',
            color: 'green'
        },
        {
            name: 'Clutch Factor',
            value: profile.clutchFactor,
            icon: GiBullseye,
            description: 'Performance in high-pressure situations',
            color: 'red'
        },
        {
            name: 'Consistency',
            value: profile.consistencyScore,
            icon: FaBalanceScale,
            description: 'Reliability of performance across games',
            color: 'purple'
        },
        {
            name: 'Adaptability',
            value: profile.adaptabilityScore,
            icon: FaBrain,
            description: 'Ability to adjust to new situations',
            color: 'orange'
        },
        {
            name: 'Teamplay',
            value: profile.teamplayRating,
            icon: FaUsers,
            description: 'Effectiveness in team coordination',
            color: 'cyan'
        }
    ];

    const topTraits = useMemo(() => psychTraits
        .sort((a, b) => b.value - a.value)
        .slice(0, 3), [psychTraits]);

    const improvementAreas = useMemo(() => psychTraits
        .filter(trait => trait.value < 60)
        .sort((a, b) => a.value - b.value), [psychTraits]);

    return (
        <Card>
            <CardHeader>
                <HStack justify="space-between">
                    <HStack>
                        <Icon as={FaBrain} color="purple.400" />
                        <Heading size="md">Psychology Profile</Heading>
                    </HStack>
                    <Badge colorScheme="purple" variant="outline">
                        Mental Game Analysis
                    </Badge>
                </HStack>
            </CardHeader>
            <CardBody>
                <VStack spacing={4} align="stretch">
                    {/* Overall Psychology Score */}
                    <Box textAlign="center" py={2}>
                        <CircularProgress
                            value={psychTraits.reduce((sum, trait) => sum + trait.value, 0) / psychTraits.length}
                            size="100px"
                            color={getScoreColor(psychTraits.reduce((sum, trait) => sum + trait.value, 0) / psychTraits.length)}
                            thickness="8px"
                        >
                            <CircularProgressLabel fontSize="lg" fontWeight="bold">
                                {Math.round(psychTraits.reduce((sum, trait) => sum + trait.value, 0) / psychTraits.length)}
                            </CircularProgressLabel>
                        </CircularProgress>
                        <Text mt={2} fontSize="sm" color="gray.600">
                            Overall Mental Strength
                        </Text>
                        <Badge
                            colorScheme={getScoreColor(psychTraits.reduce((sum, trait) => sum + trait.value, 0) / psychTraits.length)}
                            variant="subtle"
                            mt={1}
                        >
                            {getScoreLabel(psychTraits.reduce((sum, trait) => sum + trait.value, 0) / psychTraits.length)}
                        </Badge>
                    </Box>

                    <Divider />

                    {/* Individual Trait Scores */}
                    <SimpleGrid columns={{ base: 1, md: compactView ? 2 : 3 }} spacing={4}>
                        {psychTraits.map((trait) => (
                            <Box key={trait.name}>
                                <HStack justify="space-between" mb={2}>
                                    <HStack>
                                        <Icon as={trait.icon} color={`${trait.color}.400`} />
                                        <Tooltip label={trait.description} placement="top">
                                            <Text fontSize="sm" fontWeight="medium" cursor="help">
                                                {trait.name}
                                            </Text>
                                        </Tooltip>
                                    </HStack>
                                    <Text fontSize="sm" fontWeight="bold" color={`${getScoreColor(trait.value)}.500`}>
                                        {trait.value}
                                    </Text>
                                </HStack>
                                <Progress
                                    value={trait.value}
                                    colorScheme={getScoreColor(trait.value)}
                                    size="sm"
                                    borderRadius="md"
                                />
                            </Box>
                        ))}
                    </SimpleGrid>

                    {!compactView && (
                        <>
                            <Divider />

                            {/* Strengths and Areas for Improvement */}
                            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                                {/* Top Strengths */}
                                <Box>
                                    <HStack mb={3}>
                                        <Icon as={FaStar} color="yellow.400" />
                                        <Text fontWeight="semibold" fontSize="md">
                                            Mental Strengths
                                        </Text>
                                    </HStack>
                                    <VStack align="stretch" spacing={2}>
                                        {topTraits.map((trait) => (
                                            <HStack key={trait.name} justify="space-between" p={2} bg="green.50" borderRadius="md" _dark={{ bg: 'green.900' }}>
                                                <HStack>
                                                    <Icon as={trait.icon} color={`${trait.color}.400`} size="sm" />
                                                    <Text fontSize="sm">{trait.name}</Text>
                                                </HStack>
                                                <Badge colorScheme="green" size="sm">
                                                    {trait.value}
                                                </Badge>
                                            </HStack>
                                        ))}
                                    </VStack>
                                </Box>

                                {/* Areas for Improvement */}
                                {improvementAreas.length > 0 && (
                                    <Box>
                                        <HStack mb={3}>
                                            <Icon as={FaFire} color="orange.400" />
                                            <Text fontWeight="semibold" fontSize="md">
                                                Growth Opportunities
                                            </Text>
                                        </HStack>
                                        <VStack align="stretch" spacing={2}>
                                            {improvementAreas.slice(0, 3).map((trait) => (
                                                <HStack key={trait.name} justify="space-between" p={2} bg="orange.50" borderRadius="md" _dark={{ bg: 'orange.900' }}>
                                                    <HStack>
                                                        <Icon as={trait.icon} color={`${trait.color}.400`} size="sm" />
                                                        <Text fontSize="sm">{trait.name}</Text>
                                                    </HStack>
                                                    <Badge colorScheme="orange" size="sm">
                                                        {trait.value}
                                                    </Badge>
                                                </HStack>
                                            ))}
                                        </VStack>
                                    </Box>
                                )}
                            </SimpleGrid>

                            <Divider />

                            {/* Psychology Insights */}
                            <Box>
                                <Text fontWeight="semibold" fontSize="md" mb={3}>
                                    Mental Game Insights
                                </Text>
                                <VStack align="stretch" spacing={2}>
                                    <PsychologyInsight
                                        title="Tilt Management"
                                        score={profile.tiltResistance}
                                        insight={getTiltInsight(profile.tiltResistance)}
                                    />
                                    <PsychologyInsight
                                        title="Pressure Performance"
                                        score={profile.clutchFactor}
                                        insight={getClutchInsight(profile.clutchFactor)}
                                    />
                                    <PsychologyInsight
                                        title="Team Dynamics"
                                        score={profile.teamplayRating}
                                        insight={getTeamplayInsight(profile.teamplayRating)}
                                    />
                                </VStack>
                            </Box>
                        </>
                    )}
                </VStack>
            </CardBody>
        </Card>
    );
};

interface PsychologyInsightProps {
    title: string;
    score: number;
    insight: string;
}

const PsychologyInsight: React.FC<PsychologyInsightProps> = ({
    title,
    score,
    insight
}) => {
    const getInsightColor = (score: number) => {
        if (score >= 70) return 'green.100';
        if (score >= 50) return 'blue.100';
        return 'orange.100';
    };

    return (
        <Box
            p={3}
            bg={getInsightColor(score)}
            borderRadius="md"
            borderLeft="4px solid"
            borderLeftColor={score >= 70 ? 'green.400' : score >= 50 ? 'blue.400' : 'orange.400'}
            _dark={{
                bg: score >= 70 ? 'green.900' : score >= 50 ? 'blue.900' : 'orange.900'
            }}
        >
            <HStack justify="space-between" mb={1}>
                <Text fontSize="sm" fontWeight="medium">
                    {title}
                </Text>
                <Text fontSize="xs" color="gray.600">
                    Score: {score}
                </Text>
            </HStack>
            <Text fontSize="xs" color="gray.700" _dark={{ color: 'gray.300' }}>
                {insight}
            </Text>
        </Box>
    );
};

const getTiltInsight = (score: number): string => {
    if (score >= 80) return "Excellent mental fortitude. You maintain consistent performance even after difficult losses.";
    if (score >= 65) return "Good tilt resistance. You generally bounce back well from setbacks.";
    if (score >= 50) return "Moderate tilt resistance. Consider taking breaks between games after losses.";
    return "Tilt may be affecting your performance. Focus on mental reset techniques between games.";
};

const getClutchInsight = (score: number): string => {
    if (score >= 80) return "Outstanding clutch performance. You excel in high-pressure situations and late-game scenarios.";
    if (score >= 65) return "Good clutch factor. You often rise to the occasion when the game is on the line.";
    if (score >= 50) return "Decent performance under pressure. Work on decision-making in crucial moments.";
    return "Pressure situations may be challenging. Practice staying calm and focused during intense moments.";
};

const getTeamplayInsight = (score: number): string => {
    if (score >= 80) return "Exceptional team coordination. You excel at enabling your teammates and working as a unit.";
    if (score >= 65) return "Strong teamplay skills. You contribute well to team objectives and coordination.";
    if (score >= 50) return "Good team awareness. Consider focusing more on team objectives and communication.";
    return "Team coordination could be improved. Focus on following up on team plays and objective control.";
};

export default PsychologyProfileComponent;
