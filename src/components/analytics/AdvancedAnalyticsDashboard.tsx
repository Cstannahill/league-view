import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Card,
    CardHeader,
    CardBody,
    Heading,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Badge,
    Icon,
    Button,
    useToast,
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription
} from '@chakra-ui/react';
import { FaChartBar, FaBrain, FaClock, FaRedo, FaChartLine, FaBalanceScale } from 'react-icons/fa';
import { GiCrossedSwords, GiUpgrade } from 'react-icons/gi';
import { AdvancedAnalytics } from '../../types/analytics';
import { advancedAnalyticsService } from '../../services/advancedAnalyticsService';
import ChampionMatchupAnalysis from './ChampionMatchupAnalysis';
import PsychologyProfileComponent from './PsychologyProfile';
import TimelineAnalyticsComponent from './TimelineAnalytics';
// import MetaAdaptationComponent from './MetaAdaptation';
// import SkillProgressionComponent from './SkillProgression';
// import SocialAnalyticsComponent from './SocialAnalytics';
import AnalyticsSummary from './AnalyticsSummary';
import PlayerComparison from './PlayerComparison';

interface AdvancedAnalyticsDashboardProps {
    enabled?: boolean;
    compactView?: boolean;
    hasValidSummoner?: boolean;
}

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
    enabled = true,
    compactView = false,
    hasValidSummoner = true
}) => {
    const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const toast = useToast();

    const loadAnalytics = async () => {
        if (!enabled || !hasValidSummoner) return;

        setLoading(true);
        setError(null);

        try {
            // In a real implementation, this would fetch from the backend
            // For now, we'll use mock data
            const mockAnalytics = advancedAnalyticsService.generateMockAnalytics();

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            setAnalytics(mockAnalytics);
            toast({
                title: 'Analytics Updated',
                description: 'Advanced analytics have been refreshed with latest data.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
            setError(errorMessage);
            toast({
                title: 'Error Loading Analytics',
                description: errorMessage,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, [enabled, hasValidSummoner]);

    if (!hasValidSummoner) {
        return (
            <Card>
                <CardBody>
                    <VStack spacing={4} py={8}>
                        <Icon as={FaChartBar} size="3xl" color="gray.400" />
                        <Text fontSize="lg" fontWeight="semibold" color="gray.600">
                            Advanced Analytics
                        </Text>
                        <Text textAlign="center" color="gray.500" maxW="md">
                            Advanced analytics will be available after setting up your summoner information.
                        </Text>
                    </VStack>
                </CardBody>
            </Card>
        );
    }

    if (!enabled) {
        return (
            <Card>
                <CardBody>
                    <VStack spacing={4} py={8}>
                        <Icon as={FaChartBar} size="3xl" color="gray.400" />
                        <Text fontSize="lg" fontWeight="semibold" color="gray.600">
                            Advanced Analytics
                        </Text>
                        <Text textAlign="center" color="gray.500" maxW="md">
                            Advanced analytics provide deep insights into your gameplay patterns,
                            psychological profile, and strategic performance across all game phases.
                        </Text>
                        <Button
                            colorScheme="blue"
                            size="lg"
                            leftIcon={<Icon as={GiUpgrade} />}
                            onClick={() => loadAnalytics()}
                        >
                            Enable Advanced Analytics
                        </Button>
                    </VStack>
                </CardBody>
            </Card>
        );
    }

    if (loading && !analytics) {
        return (
            <Card>
                <CardBody>
                    <VStack spacing={4} py={8}>
                        <Spinner size="xl" color="blue.400" thickness="4px" />
                        <Text fontSize="lg" fontWeight="semibold">
                            Analyzing Your Gameplay...
                        </Text>
                        <Text color="gray.600" textAlign="center">
                            Processing match history and calculating advanced metrics
                        </Text>
                    </VStack>
                </CardBody>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Box>
                    <AlertTitle>Analytics Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Box>
                <Button
                    ml="auto"
                    size="sm"
                    onClick={loadAnalytics}
                    leftIcon={<Icon as={FaRedo} />}
                >
                    Retry
                </Button>
            </Alert>
        );
    }

    if (!analytics) {
        return (
            <Card>
                <CardBody>
                    <Text color="gray.600" textAlign="center">
                        No analytics data available. Please ensure you have recent match history.
                    </Text>
                </CardBody>
            </Card>
        );
    }

    const tabsData = [
        {
            label: 'Summary',
            icon: FaChartLine,
            component: (
                <AnalyticsSummary analytics={analytics} />
            )
        },
        {
            label: 'Champion Analysis',
            icon: GiCrossedSwords,
            component: (
                <ChampionMatchupAnalysis
                    championAnalytics={analytics.championAnalytics}
                    compactView={compactView}
                />
            )
        },
        {
            label: 'Psychology',
            icon: FaBrain,
            component: (
                <PsychologyProfileComponent
                    profile={analytics.psychologyProfile}
                    compactView={compactView}
                />
            )
        },
        {
            label: 'Timeline',
            icon: FaClock,
            component: (
                <TimelineAnalyticsComponent
                    timelineAnalytics={analytics.timelineAnalytics}
                    compactView={compactView}
                />
            )
        },
        // {
        //     label: 'Meta Adaptation',
        //     icon: GiUpgrade,
        //     component: (
        //         <MetaAdaptationComponent
        //             metaAdaptation={analytics.metaAdaptation}
        //             compactView={compactView}
        //         />
        //     )
        // },
        // {
        //     label: 'Skill Progress',
        //     icon: FaChartBar,
        //     component: (
        //         <SkillProgressionComponent
        //             skillProgression={analytics.skillProgression}
        //             compactView={compactView}
        //         />
        //     )
        // },
        // {
        //     label: 'Social',
        //     icon: FaUsers,
        //     component: (
        //         <SocialAnalyticsComponent
        //             socialAnalytics={analytics.socialAnalytics}
        //             compactView={compactView}
        //         />
        //     )
        // },
        {
            label: 'Compare',
            icon: FaBalanceScale,
            component: (
                <PlayerComparison currentPlayerAnalytics={analytics} />
            )
        }
    ];

    if (compactView) {
        return (
            <Card>
                <CardHeader>
                    <HStack justify="space-between">
                        <HStack>
                            <Icon as={FaChartBar} color="purple.400" />
                            <Heading size="md">Advanced Analytics</Heading>
                        </HStack>
                        <HStack>
                            <Badge colorScheme="purple" variant="outline">
                                AI-Powered Insights
                            </Badge>
                            <Button
                                size="sm"
                                variant="ghost"
                                leftIcon={<Icon as={FaRedo} />}
                                onClick={loadAnalytics}
                                isLoading={loading}
                            >
                                Refresh
                            </Button>
                        </HStack>
                    </HStack>
                </CardHeader>
                <CardBody>
                    <VStack spacing={4} align="stretch">
                        {/* Show top 3 components in compact view */}
                        <ChampionMatchupAnalysis
                            championAnalytics={analytics.championAnalytics.slice(0, 2)}
                            compactView={true}
                        />
                        <PsychologyProfileComponent
                            profile={analytics.psychologyProfile}
                            compactView={true}
                        />
                        <TimelineAnalyticsComponent
                            timelineAnalytics={analytics.timelineAnalytics}
                            compactView={true}
                        />
                    </VStack>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <HStack justify="space-between">
                    <HStack>
                        <Icon as={FaChartBar} color="purple.400" />
                        <Heading size="md">Advanced Analytics Dashboard</Heading>
                    </HStack>
                    <HStack>
                        <Badge colorScheme="purple" variant="outline">
                            AI-Powered Insights
                        </Badge>
                        <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<Icon as={FaRedo} />}
                            onClick={loadAnalytics}
                            isLoading={loading}
                        >
                            Refresh Analytics
                        </Button>
                    </HStack>
                </HStack>
            </CardHeader>
            <CardBody>
                <Tabs variant="enclosed" colorScheme="purple">
                    <TabList flexWrap="wrap">
                        {tabsData.map((tab, index) => (
                            <Tab key={index}>
                                <HStack>
                                    <Icon as={tab.icon} />
                                    <Text>{tab.label}</Text>
                                </HStack>
                            </Tab>
                        ))}
                    </TabList>

                    <TabPanels>
                        {tabsData.map((tab, index) => (
                            <TabPanel key={index} px={0}>
                                {tab.component}
                            </TabPanel>
                        ))}
                    </TabPanels>
                </Tabs>
            </CardBody>
        </Card>
    );
};

export default AdvancedAnalyticsDashboard;
