import React, { useMemo } from 'react';
import { Card, CardHeader, CardBody, Heading, Text, HStack, Icon } from '@chakra-ui/react';
import { FaChartLine } from 'react-icons/fa';
import { SkillProgressionData } from '../../types/analytics';

interface SkillProgressionComponentProps {
    skillProgression: SkillProgressionData;
    compactView?: boolean;
}

const SkillProgressionComponent: React.FC<SkillProgressionComponentProps> = ({
    skillProgression,
    compactView = false
}) => {
    const memoizedStrengthAreas = useMemo(() => skillProgression.strengthAreas.join(', '), [skillProgression.strengthAreas]);
    const memoizedImprovementAreas = useMemo(() => skillProgression.improvementAreas.join(', '), [skillProgression.improvementAreas]);

    return (
        <Card>
            <CardHeader>
                <HStack>
                    <Icon as={FaChartLine} color="green.400" />
                    <Heading size="md">Skill Progression</Heading>
                </HStack>
            </CardHeader>
            <CardBody>
                <Text>
                    Overall Rating: {skillProgression.overallRating}/100
                </Text>
                <Text>
                    Mechanical Skill: {skillProgression.skillTrends.mechanical.current.toFixed(1)}
                </Text>
                <Text>
                    Game Knowledge: {skillProgression.skillTrends.gameKnowledge.current.toFixed(1)}
                </Text>
                {!compactView && (
                    <>
                        <Text>
                            Strength Areas: {memoizedStrengthAreas}
                        </Text>
                        <Text>
                            Improvement Areas: {memoizedImprovementAreas}
                        </Text>
                    </>
                )}
            </CardBody>
        </Card>
    );
};

export default SkillProgressionComponent;
