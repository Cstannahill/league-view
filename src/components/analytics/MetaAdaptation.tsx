import React from 'react';
import { Card, CardHeader, CardBody, Heading, Text, HStack, Icon } from '@chakra-ui/react';
import { GiUpgrade } from 'react-icons/gi';
import { MetaAdaptationAnalysis } from '../../types/analytics';

interface MetaAdaptationComponentProps {
    metaAdaptation: MetaAdaptationAnalysis;
    compactView?: boolean;
}

const MetaAdaptationComponent: React.FC<MetaAdaptationComponentProps> = ({
    metaAdaptation,
    compactView = false
}) => {
    return (
        <Card>
            <CardHeader>
                <HStack>
                    <Icon as={GiUpgrade} color="orange.400" />
                    <Heading size="md">Meta Adaptation Analysis</Heading>
                </HStack>
            </CardHeader>
            <CardBody>
                <Text>
                    Current Patch Performance: {metaAdaptation.currentPatchPerformance.toFixed(1)}%
                </Text>
                <Text>
                    Champion Pool Size: {metaAdaptation.championPoolSize} champions
                </Text>
                <Text>
                    Role Flexibility: {metaAdaptation.roleFlexibility.toFixed(1)}%
                </Text>
                {!compactView && (
                    <>
                        <Text>
                            Item Build Adaptation: {metaAdaptation.itemBuildAdaptation.toFixed(1)}%
                        </Text>
                        <Text>
                            Meta Champion Usage: {metaAdaptation.metaChampionUsage.toFixed(1)}%
                        </Text>
                    </>
                )}
            </CardBody>
        </Card>
    );
};

export default MetaAdaptationComponent;
