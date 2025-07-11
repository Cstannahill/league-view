import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Grid,
    GridItem,
    Badge,
    Divider,
    Icon
} from '@chakra-ui/react';
import { FaFire, FaShieldAlt, FaStar, FaTrophy } from 'react-icons/fa';
import { PerformanceData } from '../../store';

interface Props {
    data: PerformanceData | null;
}

const PerformanceInsights: React.FC<Props> = ({ data }) => {
    if (!data) {
        return (
            <Box p={4} bg="gray.700" borderRadius="lg" border="1px solid" borderColor="gray.600">
                <Text color="gray.400" textAlign="center">
                    Performance insights will appear after analyzing recent matches
                </Text>
            </Box>
        );
    }

    const { average_kda, win_rate, total_lp_gain, games_analyzed, recent_form, playstyle_traits } = data;
    const kdaRatio = average_kda.deaths > 0 ? (average_kda.kills + average_kda.assists) / average_kda.deaths : average_kda.kills + average_kda.assists;



    const getFormIcon = (form: string) => {
        switch (form) {
            case 'hot': return FaFire;
            case 'cold': return FaShieldAlt;
            default: return FaStar;
        }
    };

    return (
        <Box p={4} bg="gray.700" borderRadius="lg" border="1px solid" borderColor="gray.600">
            <HStack mb={4} align="center">
                <Icon as={FaTrophy} color="yellow.400" />
                <Text fontSize="lg" fontWeight="bold" color="white">
                    Performance Insights
                </Text>
                <Badge
                    colorScheme={recent_form === 'hot' ? 'red' : recent_form === 'cold' ? 'blue' : 'gray'}
                    display="flex"
                    alignItems="center"
                    gap={1}
                >
                    <Icon as={getFormIcon(recent_form)} boxSize={2} />
                    {recent_form === 'hot' ? 'Hot Streak' : recent_form === 'cold' ? 'Cold Streak' : 'Neutral'}
                </Badge>
            </HStack>

            <Grid templateColumns="repeat(auto-fit, minmax(120px, 1fr))" gap={4} mb={4}>
                <GridItem>
                    <Stat size="sm">
                        <StatLabel color="gray.300">Average KDA</StatLabel>
                        <StatNumber color="white" fontSize="md">
                            {average_kda.kills.toFixed(1)} / {average_kda.deaths.toFixed(1)} / {average_kda.assists.toFixed(1)}
                        </StatNumber>
                        <StatHelpText color="gray.400">
                            Ratio: {kdaRatio.toFixed(2)}
                        </StatHelpText>
                    </Stat>
                </GridItem>

                <GridItem>
                    <Stat size="sm">
                        <StatLabel color="gray.300">Win Rate</StatLabel>
                        <StatNumber color={win_rate >= 50 ? "green.400" : "red.400"} fontSize="md">
                            {win_rate.toFixed(1)}%
                        </StatNumber>
                        <StatHelpText color="gray.400">
                            {games_analyzed} games
                        </StatHelpText>
                    </Stat>
                </GridItem>

                <GridItem>
                    <Stat size="sm">
                        <StatLabel color="gray.300">LP Change</StatLabel>
                        <StatNumber
                            color={total_lp_gain >= 0 ? "green.400" : "red.400"}
                            fontSize="md"
                            display="flex"
                            alignItems="center"
                        >
                            <StatArrow type={total_lp_gain >= 0 ? 'increase' : 'decrease'} />
                            {Math.abs(total_lp_gain)}
                        </StatNumber>
                        <StatHelpText color="gray.400">
                            Recent games
                        </StatHelpText>
                    </Stat>
                </GridItem>
            </Grid>

            {playstyle_traits.length > 0 && (
                <>
                    <Divider borderColor="gray.600" mb={3} />
                    <VStack align="start" spacing={2}>
                        <Text fontSize="sm" fontWeight="semibold" color="gray.300">
                            Playstyle Traits
                        </Text>
                        <HStack wrap="wrap" spacing={2}>
                            {playstyle_traits.map((trait: string, index: number) => (
                                <Badge
                                    key={index}
                                    variant="subtle"
                                    colorScheme="blue"
                                    fontSize="xs"
                                    px={2}
                                    py={1}
                                >
                                    {trait}
                                </Badge>
                            ))}
                        </HStack>
                    </VStack>
                </>
            )}
        </Box>
    );
};

export default PerformanceInsights;