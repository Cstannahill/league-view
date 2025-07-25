import React, { useMemo } from 'react';
import { Card, CardHeader, CardBody, Heading, Text, HStack, Icon } from '@chakra-ui/react';
import { FaUsers } from 'react-icons/fa';
import { SocialGameplayAnalytics } from '../../types/analytics';

interface SocialAnalyticsComponentProps {
    socialAnalytics: SocialGameplayAnalytics;
    compactView?: boolean;
}

const SocialAnalyticsComponent: React.FC<SocialAnalyticsComponentProps> = ({
    socialAnalytics,
    compactView = false
}) => {
    const memoizedDuoPerformance = useMemo(() => (
        socialAnalytics.duoPerformance.map((duo, index) => (
            <Text key={index}>
                {duo.partnerName}: {duo.winRate.toFixed(1)}% WR in {duo.gamesPlayed} games
            </Text>
        ))
    ), [socialAnalytics.duoPerformance]);

    return (
        <Card>
            <CardHeader>
                <HStack>
                    <Icon as={FaUsers} color="blue.400" />
                    <Heading size="md">Social & Team Analytics</Heading>
                </HStack>
            </CardHeader>
            <CardBody>
                <Text>
                    Communication Score: {socialAnalytics.communicationScore}/100
                </Text>
                <Text>
                    Leadership Tendency: {socialAnalytics.leadershipTendency}/100
                </Text>
                <Text>
                    Supportiveness Rating: {socialAnalytics.supportivenessRating}/100
                </Text>
                {!compactView && socialAnalytics.duoPerformance.length > 0 && (
                    <>
                        <Text fontWeight="bold" mt={4}>
                            Duo Performance:
                        </Text>
                        {memoizedDuoPerformance}
                    </>
                )}
            </CardBody>
        </Card>
    );
};

export default SocialAnalyticsComponent;
