import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
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
  Spinner
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
    const toast = useToast();

    const loadAnalytics = useCallback(async () => {
        if (!enabled || !hasValidSummoner) return;

        setLoading(true);

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
    }, [enabled, hasValidSummoner, toast]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    const noSummonerContent = useMemo(() => (
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
    ), []);

    const disabledContent = useMemo(() => (
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
    ), [loadAnalytics]);

    const loadingContent = useMemo(() => (
        <Card>
            <CardBody>
                <VStack spacing={4} py={8}>
                    <Spinner size="xl" color="blue.400" thickness="4px" />
                    <Text fontSize="lg" fontWeight="semibold">
                        Analyzing Your Gameplay...
                    </Text>
                    <Text color="gray.600" textAlign="center">
                        Please wait while we analyze your gameplay data.
                    </Text>
                </VStack>
            </CardBody>
        </Card>
    ), []);

    if (!hasValidSummoner) return noSummonerContent;
    if (!enabled) return disabledContent;
    if (loading && !analytics) return loadingContent;

    const tabsData = [
        {
            label: 'Summary',
            icon: FaChartLine,
            component: analytics ? (
                <AnalyticsSummary analytics={analytics} />
            ) : <Text color="red.400">No analytics data available.</Text>
        },
        {
            label: 'Champion Analysis',
            icon: GiCrossedSwords,
            component: analytics ? (
                <ChampionMatchupAnalysis
                    championAnalytics={analytics.championAnalytics}
                    compactView={compactView}
                />
            ) : <Text color="red.400">No analytics data available.</Text>
        },
        {
            label: 'Psychology',
            icon: FaBrain,
            component: analytics ? (
                <PsychologyProfileComponent
                    profile={analytics.psychologyProfile}
                    compactView={compactView}
                />
            ) : <Text color="red.400">No analytics data available.</Text>
        },
        {
            label: 'Timeline',
            icon: FaClock,
            component: analytics ? (
                <TimelineAnalyticsComponent
                    timelineAnalytics={analytics.timelineAnalytics}
                    compactView={compactView}
                />
            ) : <Text color="red.400">No analytics data available.</Text>
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
            component: analytics ? (
                <PlayerComparison currentPlayerAnalytics={analytics} />
            ) : <Text color="red.400">No analytics data available.</Text>
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
                        {analytics ? (
                            <>
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
                            </>
                        ) : (
                            <Text color="red.400">No analytics data available.</Text>
                        )}
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
                <Tabs variant="enclosed" colorScheme="purple" isLazy>
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
