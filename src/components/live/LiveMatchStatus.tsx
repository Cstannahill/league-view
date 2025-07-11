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
    Badge,
    Icon,
    Button,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Divider,
    useToast,
    Tooltip,
    CircularProgress,
    CircularProgressLabel,
    Switch,
    FormControl,
    FormLabel,
    Collapse,
    useDisclosure
} from '@chakra-ui/react';
import {
    FaGamepad,
    FaPlay,
    FaStop,
    FaRedo,
    FaInfoCircle,
    FaUsers,
    FaClock,
    FaShieldAlt,
    FaSignal
} from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import { liveMatchService, LiveMatchData, ParticipantInfo } from '../../services/liveMatchDetectionService';

interface LiveMatchStatusProps {
    summonerName: string;
    region: string;
    autoStart?: boolean;
}

const LiveMatchStatus: React.FC<LiveMatchStatusProps> = ({
    summonerName,
    region,
    autoStart = false
}) => {
    const [matchData, setMatchData] = useState<LiveMatchData | null>(null);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [detectionHistory, setDetectionHistory] = useState<Array<{
        timestamp: number;
        isInGame: boolean;
        confidence: number;
    }>>([]);

    const { isOpen: showDetails, onToggle: toggleDetails } = useDisclosure();
    const toast = useToast();

    useEffect(() => {
        // Set up listeners
        const unsubscribeMatch = liveMatchService.addMatchListener((data: LiveMatchData) => {
            setMatchData(data);
            setDetectionHistory(prev => [...prev.slice(-9), {
                timestamp: Date.now(),
                isInGame: data.is_in_game,
                confidence: data.detection_confidence
            }]);
            setLastError(null);
        });

        const unsubscribeError = liveMatchService.addErrorListener((error: string) => {
            // Don't show errors for rate limiting or expected conditions
            if (error.includes('Rate limited') || error.includes('rate_limited')) {
                setLastError('Rate limited - reducing check frequency');
                return;
            }

            setLastError(error);
            toast({
                title: 'Live Match Detection Error',
                description: error,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        });

        // Auto-start monitoring if requested
        if (autoStart && summonerName && region) {
            handleStartMonitoring();
        }

        return () => {
            unsubscribeMatch();
            unsubscribeError();
        };
    }, [summonerName, region, autoStart, toast]);

    const handleDetectOnce = async () => {
        if (!summonerName || !region) {
            toast({
                title: 'Missing Information',
                description: 'Summoner name and region are required.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsDetecting(true);
        try {
            await liveMatchService.detectLiveMatch(summonerName, region);
            toast({
                title: 'Match Detection Complete',
                description: 'Successfully checked for live match.',
                status: 'success',
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            // Error already handled by error listener
        } finally {
            setIsDetecting(false);
        }
    };

    const handleStartMonitoring = async () => {
        if (!summonerName || !region) {
            toast({
                title: 'Missing Information',
                description: 'Summoner name and region are required for monitoring.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            await liveMatchService.startMonitoring(summonerName, region);
            setIsMonitoring(true);
            toast({
                title: 'Monitoring Started',
                description: 'Live match monitoring is now active.',
                status: 'success',
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            // Error already handled by error listener
        }
    };

    const handleStopMonitoring = () => {
        liveMatchService.stopMonitoring();
        setIsMonitoring(false);
        toast({
            title: 'Monitoring Stopped',
            description: 'Live match monitoring has been disabled.',
            status: 'info',
            duration: 2000,
            isClosable: true,
        });
    };

    const getStatusColor = () => {
        if (!matchData) return 'gray';
        if (matchData.is_in_game) return 'green';
        return 'blue';
    };

    const getStatusText = () => {
        if (!matchData) return 'Unknown';
        if (matchData.is_in_game) return 'In Live Match';
        return 'Not In Game';
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'green';
        if (confidence >= 0.6) return 'yellow';
        if (confidence >= 0.4) return 'orange';
        return 'red';
    };

    const formatGameTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const ParticipantsList: React.FC<{ participants: ParticipantInfo[] }> = ({ participants }) => {
        const team100 = participants.filter(p => p.team_id.includes('100') || p.team_id.includes('Blue'));
        const team200 = participants.filter(p => p.team_id.includes('200') || p.team_id.includes('Red'));

        return (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box>
                    <Text fontWeight="bold" color="blue.500" mb={2}>
                        <Icon as={FaShieldAlt} mr={1} />
                        Blue Team
                    </Text>
                    <VStack spacing={1} align="stretch">
                        {team100.map((participant, index) => (
                            <HStack key={index} justify="space-between" p={2} bg="blue.50" borderRadius="md" _dark={{ bg: 'blue.900' }}>
                                <Text fontSize="sm" fontWeight="medium">{participant.summoner_name}</Text>
                                <Badge variant="outline" size="sm">{participant.champion_id}</Badge>
                            </HStack>
                        ))}
                    </VStack>
                </Box>

                <Box>
                    <Text fontWeight="bold" color="red.500" mb={2}>
                        <Icon as={GiCrossedSwords} mr={1} />
                        Red Team
                    </Text>
                    <VStack spacing={1} align="stretch">
                        {team200.map((participant, index) => (
                            <HStack key={index} justify="space-between" p={2} bg="red.50" borderRadius="md" _dark={{ bg: 'red.900' }}>
                                <Text fontSize="sm" fontWeight="medium">{participant.summoner_name}</Text>
                                <Badge variant="outline" size="sm">{participant.champion_id}</Badge>
                            </HStack>
                        ))}
                    </VStack>
                </Box>
            </SimpleGrid>
        );
    };

    return (
        <Card>
            <CardHeader>
                <HStack justify="space-between">
                    <HStack>
                        <Icon as={FaGamepad} color="purple.400" />
                        <Heading size="md">Live Match Detection</Heading>
                        {isMonitoring && (
                            <Badge colorScheme="green" variant="solid" ml={2}>
                                <Icon as={FaSignal} mr={1} />
                                Monitoring
                            </Badge>
                        )}
                    </HStack>
                    <HStack>
                        <FormControl display="flex" alignItems="center">
                            <FormLabel htmlFor="auto-monitor" mb="0" fontSize="sm">
                                Auto Monitor
                            </FormLabel>
                            <Switch
                                id="auto-monitor"
                                isChecked={isMonitoring}
                                onChange={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
                                colorScheme="purple"
                                size="sm"
                            />
                        </FormControl>
                    </HStack>
                </HStack>
            </CardHeader>
            <CardBody>
                <VStack spacing={6} align="stretch">
                    {/* Current Status */}
                    <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4}>
                        <Stat textAlign="center">
                            <StatLabel>Match Status</StatLabel>
                            <StatNumber>
                                <Badge
                                    colorScheme={getStatusColor()}
                                    variant="solid"
                                    fontSize="md"
                                    px={3}
                                    py={1}
                                    borderRadius="full"
                                >
                                    {getStatusText()}
                                </Badge>
                            </StatNumber>
                            {matchData && (
                                <StatHelpText>
                                    Last updated: {new Date(matchData.last_updated * 1000).toLocaleTimeString()}
                                </StatHelpText>
                            )}
                        </Stat>

                        <Stat textAlign="center">
                            <StatLabel>Detection Confidence</StatLabel>
                            <StatNumber>
                                <CircularProgress
                                    value={matchData ? matchData.detection_confidence * 100 : 0}
                                    size="60px"
                                    color={matchData ? getConfidenceColor(matchData.detection_confidence) : 'gray'}
                                    thickness="8px"
                                >
                                    <CircularProgressLabel fontSize="sm">
                                        {matchData ? `${Math.round(matchData.detection_confidence * 100)}%` : '0%'}
                                    </CircularProgressLabel>
                                </CircularProgress>
                            </StatNumber>
                            <StatHelpText>
                                {matchData?.detection_method || 'No data'}
                            </StatHelpText>
                        </Stat>

                        <Stat textAlign="center">
                            <StatLabel>Game Time</StatLabel>
                            <StatNumber>
                                {matchData?.is_in_game && matchData.game_length ? (
                                    <>
                                        <Icon as={FaClock} mr={2} color="green.400" />
                                        {formatGameTime(matchData.game_length)}
                                    </>
                                ) : (
                                    <Text color="gray.500">Not in game</Text>
                                )}
                            </StatNumber>
                            {matchData?.is_in_game && (
                                <StatHelpText>
                                    {matchData.game_mode} • {matchData.game_type}
                                </StatHelpText>
                            )}
                        </Stat>
                    </SimpleGrid>

                    <Divider />

                    {/* Control Buttons */}
                    <HStack justify="center" spacing={4}>
                        <Button
                            leftIcon={<Icon as={FaRedo} />}
                            onClick={handleDetectOnce}
                            isLoading={isDetecting}
                            loadingText="Detecting..."
                            colorScheme="blue"
                            variant="outline"
                        >
                            Check Now
                        </Button>

                        {!isMonitoring ? (
                            <Button
                                leftIcon={<Icon as={FaPlay} />}
                                onClick={handleStartMonitoring}
                                colorScheme="green"
                            >
                                Start Monitoring
                            </Button>
                        ) : (
                            <Button
                                leftIcon={<Icon as={FaStop} />}
                                onClick={handleStopMonitoring}
                                colorScheme="red"
                                variant="outline"
                            >
                                Stop Monitoring
                            </Button>
                        )}

                        <Button
                            leftIcon={<Icon as={FaInfoCircle} />}
                            onClick={toggleDetails}
                            variant="ghost"
                            size="sm"
                        >
                            {showDetails ? 'Hide' : 'Show'} Details
                        </Button>
                    </HStack>

                    {/* Error Display */}
                    {lastError && (
                        <Alert status="error" borderRadius="md">
                            <AlertIcon />
                            <Box>
                                <AlertTitle>Detection Error</AlertTitle>
                                <AlertDescription fontSize="sm">{lastError}</AlertDescription>
                            </Box>
                        </Alert>
                    )}

                    {/* Detailed Information */}
                    <Collapse in={showDetails} animateOpacity>
                        <VStack spacing={4} align="stretch">
                            <Divider />

                            {/* Detection History */}
                            {detectionHistory.length > 0 && (
                                <Box>
                                    <Text fontWeight="bold" mb={2}>Detection History</Text>
                                    <HStack spacing={2} overflowX="auto" pb={2}>
                                        {detectionHistory.map((record, index) => (
                                            <Tooltip
                                                key={index}
                                                label={`${new Date(record.timestamp).toLocaleTimeString()} - ${record.isInGame ? 'In Game' : 'Not In Game'} (${Math.round(record.confidence * 100)}% confidence)`}
                                            >
                                                <Box
                                                    w="8px"
                                                    h="20px"
                                                    bg={record.isInGame ? 'green.400' : 'gray.300'}
                                                    borderRadius="sm"
                                                    opacity={record.confidence}
                                                    cursor="pointer"
                                                />
                                            </Tooltip>
                                        ))}
                                    </HStack>
                                </Box>
                            )}

                            {/* Live Match Details */}
                            {matchData?.is_in_game && matchData.participants && (
                                <Box>
                                    <HStack mb={3}>
                                        <Icon as={FaUsers} color="blue.400" />
                                        <Text fontWeight="bold">Match Participants</Text>
                                    </HStack>
                                    <ParticipantsList participants={matchData.participants} />
                                </Box>
                            )}

                            {/* Technical Information */}
                            {matchData && (
                                <Box>
                                    <Text fontWeight="bold" mb={2}>Technical Information</Text>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                        <Box p={3} bg="gray.50" borderRadius="md" _dark={{ bg: 'gray.700' }}>
                                            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>Detection Method</Text>
                                            <Text fontWeight="medium">{matchData.detection_method}</Text>
                                        </Box>
                                        <Box p={3} bg="gray.50" borderRadius="md" _dark={{ bg: 'gray.700' }}>
                                            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>Next Check In</Text>
                                            <Text fontWeight="medium">{matchData.next_check_in_seconds}s</Text>
                                        </Box>
                                        {matchData.game_id && (
                                            <Box p={3} bg="gray.50" borderRadius="md" _dark={{ bg: 'gray.700' }}>
                                                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>Game ID</Text>
                                                <Text fontWeight="medium" fontSize="xs">{matchData.game_id}</Text>
                                            </Box>
                                        )}
                                        {matchData.api_error && (
                                            <Box p={3} bg="red.50" borderRadius="md" _dark={{ bg: 'red.900' }}>
                                                <Text fontSize="sm" color="red.600" _dark={{ color: 'red.400' }}>API Error</Text>
                                                <Text fontWeight="medium" fontSize="xs">{matchData.api_error}</Text>
                                            </Box>
                                        )}
                                    </SimpleGrid>
                                </Box>
                            )}
                        </VStack>
                    </Collapse>
                </VStack>
            </CardBody>
        </Card>
    );
};

export default LiveMatchStatus;
