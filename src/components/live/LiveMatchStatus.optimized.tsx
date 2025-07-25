import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { championAssets } from '../../services/championAssetService';
import { ChampionImage } from '../common/ChampionImage';

interface LiveMatchStatusProps {
    summonerName: string;
    region: string;
    autoStart?: boolean;
}

// Optimized component with memoization and debouncing
const LiveMatchStatus: React.FC<LiveMatchStatusProps> = React.memo(({
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
    
    // Use refs to avoid stale closures
    const toastRef = useRef(toast);
    const errorTimeoutRef = useRef<number | null>(null);
    
    // Memoized functions to prevent unnecessary re-renders
    const handleMatchUpdate = useCallback((data: LiveMatchData) => {
        setMatchData(data);
        setDetectionHistory(prev => {
            const newHistory = [...prev.slice(-9), {
                timestamp: Date.now(),
                isInGame: data.is_in_game,
                confidence: data.detection_confidence
            }];
            return newHistory;
        });
        setLastError(null);
    }, []);

    const handleError = useCallback((error: string) => {
        // Debounce error messages to prevent spam
        if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current);
        }

        errorTimeoutRef.current = setTimeout(() => {
            // Don't show errors for rate limiting or expected conditions
            if (error.includes('Rate limited') || error.includes('rate_limited')) {
                setLastError('Rate limited - reducing check frequency');
                return;
            }

            setLastError(error);
            toastRef.current({
                title: 'Live Match Detection Error',
                description: error,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }, 500); // Debounce for 500ms
    }, []);

    const handleDetectionStatusChange = useCallback((status: boolean) => {
        setIsDetecting(status);
    }, []);

    const handleMonitoringStatusChange = useCallback((status: boolean) => {
        setIsMonitoring(status);
    }, []);

    // Memoized event setup to prevent unnecessary re-subscriptions
    useEffect(() => {
        const unsubscribeMatch = liveMatchService.addMatchListener(handleMatchUpdate);
        const unsubscribeError = liveMatchService.addErrorListener(handleError);

        // Auto-start monitoring if requested
        if (autoStart && summonerName && region) {
            setTimeout(() => {
                if (!isMonitoring) {
                    liveMatchService.startMonitoring(summonerName, region);
                }
            }, 1000);
        }

        return () => {
            unsubscribeMatch();
            unsubscribeError();
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
            }
        };
    }, [summonerName, region, autoStart, handleMatchUpdate, handleError, handleDetectionStatusChange, handleMonitoringStatusChange, isMonitoring]);

    // Memoized handlers to prevent re-renders
    const handleDetectOnce = useCallback(async () => {
        if (!summonerName || !region) return;
        await liveMatchService.detectLiveMatch(summonerName, region);
    }, [summonerName, region]);

    const handleStartMonitoring = useCallback(async () => {
        if (!summonerName || !region) return;
        await liveMatchService.startMonitoring(summonerName, region);
    }, [summonerName, region]);

    const handleStopMonitoring = useCallback(async () => {
        await liveMatchService.stopMonitoring();
    }, []);

    // Memoized computed values
    const statusInfo = useMemo(() => {
        if (!matchData) {
            return {
                color: 'gray',
                text: 'Unknown',
                icon: FaGamepad
            };
        }

        if (matchData.is_in_game) {
            return {
                color: 'green',
                text: 'In Game',
                icon: FaGamepad
            };
        }

        return {
            color: 'red',
            text: 'Not In Game',
            icon: FaShieldAlt
        };
    }, [matchData]);

    const formatGameTime = useCallback((seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }, []);

    // Memoized participant rendering to prevent unnecessary re-renders
    const renderParticipants = useMemo(() => {
        if (!matchData?.is_in_game || !matchData.participants) {
            return null;
        }

        const blueTeam = matchData.participants.filter((_, i) => i < 5);
        const redTeam = matchData.participants.filter((_, i) => i >= 5);

        const renderTeam = (team: ParticipantInfo[], teamName: string, teamColor: string) => (
            <Box key={teamName}>
                <HStack mb={3}>
                    <Icon as={teamName === 'Blue Team' ? FaShieldAlt : GiCrossedSwords} color={teamColor} />
                    <Text fontWeight="bold" color={teamColor}>{teamName}</Text>
                </HStack>
                <VStack align="stretch" spacing={2}>
                    {team.map((participant, index) => {
                        const championData = championAssets.getChampionById(parseInt(participant.champion_id));
                        const championName = championData?.name || 'Unknown';
                        
                        return (
                            <HStack key={`${teamName}-${index}`} p={2} bg="gray.50" borderRadius="md" _dark={{ bg: 'gray.700' }}>
                                <HStack flex={1}>
                                    <ChampionImage
                                        championId={parseInt(participant.champion_id)}
                                        size="small"
                                        type="portrait"
                                        borderRadius="sm"
                                    />
                                    <VStack align="start" spacing={0}>
                                        <Text fontSize="sm" fontWeight="medium">{participant.summoner_name}</Text>
                                        <Text fontSize="xs" color="gray.500">{championName}</Text>
                                    </VStack>
                                </HStack>
                            </HStack>
                        );
                    })}
                </VStack>
            </Box>
        );

        return (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {renderTeam(blueTeam, 'Blue Team', 'blue.400')}
                {renderTeam(redTeam, 'Red Team', 'red.400')}
            </SimpleGrid>
        );
    }, [matchData]);

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
                                    colorScheme={statusInfo.color}
                                    variant="solid"
                                    fontSize="md"
                                    px={3}
                                    py={1}
                                    borderRadius="full"
                                >
                                    {statusInfo.text}
                                </Badge>
                            </StatNumber>
                            {matchData && (
                                <StatHelpText>
                                    Confidence: {Math.round(matchData.detection_confidence * 100)}%
                                </StatHelpText>
                            )}
                        </Stat>

                        <Stat textAlign="center">
                            <StatLabel>Detection Rate</StatLabel>
                            <StatNumber>
                                <CircularProgress
                                    value={isMonitoring ? 100 : 0}
                                    color={isMonitoring ? "green.400" : "gray.400"}
                                    size="50px"
                                    thickness="8px"
                                >
                                    <CircularProgressLabel fontSize="xs">
                                        {isMonitoring ? 'ON' : 'OFF'}
                                    </CircularProgressLabel>
                                </CircularProgress>
                            </StatNumber>
                            <StatHelpText>
                                {isDetecting ? 'Checking...' : 'Idle'}
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
                                    {renderParticipants}
                                </Box>
                            )}

                            {/* Technical Details */}
                            {matchData && (
                                <Box>
                                    <Text fontWeight="bold" mb={3}>Technical Details</Text>
                                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                                        {matchData.map_id && (
                                            <Box p={3} bg="gray.50" borderRadius="md" _dark={{ bg: 'gray.700' }}>
                                                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>Map ID</Text>
                                                <Text fontWeight="medium">{matchData.map_id}</Text>
                                            </Box>
                                        )}
                                        {matchData.game_start_time && (
                                            <Box p={3} bg="gray.50" borderRadius="md" _dark={{ bg: 'gray.700' }}>
                                                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>Start Time</Text>
                                                <Text fontWeight="medium" fontSize="xs">
                                                    {new Date(matchData.game_start_time * 1000).toLocaleTimeString()}
                                                </Text>
                                            </Box>
                                        )}
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
});

LiveMatchStatus.displayName = 'LiveMatchStatus';

export default LiveMatchStatus;
