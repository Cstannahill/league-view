import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Card,
    CardBody,
    Image,
    Badge,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    FormControl,
    FormLabel,
    Icon,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Tooltip,
    SimpleGrid,
    Checkbox,
    CheckboxGroup,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Alert,
    AlertIcon
} from '@chakra-ui/react';
import {
    FaSearch,
    FaGamepad
} from 'react-icons/fa';
import {
    Champion,
    ChampionMastery,
    ChampionRole,
    ChampionSortBy,
    ChampionFilters
} from '../../types/champion';
import { championService } from '../../services/championService';
// import ChampionDetailView from './ChampionDetailView';
import ChampionDetailView from './ChampionDetailView';

interface ChampionsListProps {
    onChampionSelect?: (champion: Champion) => void;
}

const ChampionsList: React.FC<ChampionsListProps> = ({ onChampionSelect }) => {
    const [champions, setChampions] = useState<Champion[]>([]);
    const [masteries, setMasteries] = useState<ChampionMastery[]>([]);
    const [filteredChampions, setFilteredChampions] = useState<Champion[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);
    // Removed unused loading state
    const [sortBy, setSortBy] = useState<ChampionSortBy>(ChampionSortBy.NAME);
    const [sortAscending, setSortAscending] = useState(true);
    const [filters, setFilters] = useState<ChampionFilters>({
        roles: [],
        masteryLevel: null,
        minGames: 0,
        search: ''
    });
    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(() => {
        loadData();
    }, []);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setFilters((prev) => ({ ...prev, search: searchInput }));
        }, 200);
        return () => clearTimeout(handler);
    }, [searchInput]);

    // Memoize filtered champions

    const memoizedFilteredChampions = useMemo(() => {
        if (champions.length === 0) return [];
        return championService.sortAndFilterChampions(
            champions,
            masteries,
            sortBy,
            filters,
            sortAscending
        );
    }, [champions, masteries, sortBy, sortAscending, filters]);

    useEffect(() => {
        setFilteredChampions(memoizedFilteredChampions);
    }, [memoizedFilteredChampions]);

    const loadData = async () => {
        try {
            const [champData, masteryData] = await Promise.all([
                championService.getAllChampions(),
                championService.getChampionMasteries()
            ]);
            setChampions(champData);
            setMasteries(masteryData);
        } catch (error) {
            console.error('Failed to load champions data:', error);
        } finally {
            setFilteredChampions(champions);
        }
    };

    const handleChampionClick = (champion: Champion) => {
        setSelectedChampion(champion);
        onChampionSelect?.(champion);
        onOpen();
    };

    const handleSortChange = (newSortBy: ChampionSortBy) => {
        if (sortBy === newSortBy) {
            setSortAscending(!sortAscending);
        } else {
            setSortBy(newSortBy);
            setSortAscending(true);
        }
    };

    const getMasteryLevel = (championId: number): number => {
        return masteries.find(m => m.championId === championId)?.championLevel || 0;
    };

    const getMasteryPoints = (championId: number): number => {
        return masteries.find(m => m.championId === championId)?.championPoints || 0;
    };

    const roleOptions = [
        { value: ChampionRole.TOP, label: 'Top', color: 'blue' },
        { value: ChampionRole.JUNGLE, label: 'Jungle', color: 'green' },
        { value: ChampionRole.MIDDLE, label: 'Mid', color: 'yellow' },
        { value: ChampionRole.BOTTOM, label: 'ADC', color: 'red' },
        { value: ChampionRole.SUPPORT, label: 'Support', color: 'cyan' }
    ];

    // Memoized Champion Card with proper props
    interface ChampionCardProps {
        champion: Champion;
        masteryLevel: number;
        masteryPoints: number;
        onClick: (champion: Champion) => void;
    }
    const ChampionCard = useCallback(
        React.memo(({ champion, masteryLevel, masteryPoints, onClick }: ChampionCardProps) => (
            <Card
                key={champion.id}
                cursor="pointer"
                onClick={() => onClick(champion)}
                _hover={{ transform: 'scale(1.05)', shadow: 'lg' }}
                transition="all 0.2s"
                position="relative"
            >
                <CardBody p={2}>
                    <VStack spacing={2}>
                        {/* Champion Image */}
                        <Box position="relative">
                            <Image
                                src={champion.squareUrl || champion.image}
                                alt={champion.name}
                                boxSize="60px"
                                borderRadius="md"
                                fallbackSrc="https://via.placeholder.com/60x60?text=?"
                            />
                            {masteryLevel > 0 && (
                                <Badge
                                    position="absolute"
                                    top="-2"
                                    right="-2"
                                    colorScheme={masteryLevel >= 7 ? 'purple' : masteryLevel >= 5 ? 'gold' : 'blue'}
                                    borderRadius="full"
                                    fontSize="xs"
                                >
                                    {masteryLevel}
                                </Badge>
                            )}
                        </Box>
                        {/* Champion Name */}
                        <Tooltip label={champion.title}>
                            <Text
                                fontSize="sm"
                                fontWeight="semibold"
                                textAlign="center"
                                noOfLines={1}
                            >
                                {champion.name}
                            </Text>
                        </Tooltip>
                        {/* Roles */}
                        <HStack justify="center" wrap="wrap">
                            {champion.roles.map((role: ChampionRole) => {
                                const roleOption = roleOptions.find(r => r.value === role);
                                return (
                                    <Badge
                                        key={role}
                                        colorScheme={roleOption?.color || 'gray'}
                                        size="xs"
                                    >
                                        {roleOption?.label || role}
                                    </Badge>
                                );
                            })}
                        </HStack>
                        {/* Mastery Info */}
                        {masteryPoints > 0 && (
                            <Text fontSize="xs" color="gray.500" textAlign="center">
                                {masteryPoints.toLocaleString()} pts
                            </Text>
                        )}
                    </VStack>
                </CardBody>
            </Card>
        )),
        []
    );

    return (
        <Box p={4}>
            <VStack spacing={6} align="stretch">
                {/* Header */}
                <HStack justify="space-between" wrap="wrap">
                    <Text fontSize="2xl" fontWeight="bold">
                        Champions ({filteredChampions.length})
                    </Text>
                    <HStack>
                        <Icon as={FaGamepad} />
                        <Text fontSize="sm" color="gray.500">
                            {masteries.length} Champions Played
                        </Text>
                    </HStack>
                </HStack>

                {/* Filters and Search */}
                <Card>
                    <CardBody>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                            {/* Search */}
                            <FormControl>
                                <FormLabel>Search Champions</FormLabel>
                                <InputGroup>
                                    <InputLeftElement>
                                        <Icon as={FaSearch} />
                                    </InputLeftElement>
                                    <Input
                                        placeholder="Search by name..."
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                    />
                                </InputGroup>
                            </FormControl>

                            {/* Role Filter */}
                            <FormControl>
                                <FormLabel>Roles</FormLabel>
                                <CheckboxGroup
                                    value={filters.roles}
                                    onChange={(roles) => setFilters({ ...filters, roles: roles as ChampionRole[] })}
                                >
                                    <HStack wrap="wrap">
                                        {roleOptions.map(role => (
                                            <Checkbox key={role.value} value={role.value}>
                                                <Badge colorScheme={role.color} size="sm">
                                                    {role.label}
                                                </Badge>
                                            </Checkbox>
                                        ))}
                                    </HStack>
                                </CheckboxGroup>
                            </FormControl>

                            {/* Mastery Level Filter */}
                            <FormControl>
                                <FormLabel>Min Mastery Level</FormLabel>
                                <NumberInput
                                    value={filters.masteryLevel || ''}
                                    onChange={(_, num) => setFilters({ ...filters, masteryLevel: isNaN(num) ? null : num })}
                                    min={0}
                                    max={7}
                                >
                                    <NumberInputField placeholder="Any" />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            {/* Sort Options */}
                            <FormControl>
                                <FormLabel>Sort By</FormLabel>
                                <Select
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value as ChampionSortBy)}
                                >
                                    <option value={ChampionSortBy.NAME}>Name</option>
                                    <option value={ChampionSortBy.MASTERY_LEVEL}>Mastery Level</option>
                                    <option value={ChampionSortBy.MASTERY_POINTS}>Mastery Points</option>
                                    <option value={ChampionSortBy.WIN_RATE}>Win Rate</option>
                                    <option value={ChampionSortBy.GAMES_PLAYED}>Games Played</option>
                                </Select>
                            </FormControl>
                        </SimpleGrid>
                    </CardBody>
                </Card>

                {/* Champions Grid */}
                {filteredChampions.length === 0 ? (
                    <Alert status="info">
                        <AlertIcon />
                        No champions found matching your filters.
                    </Alert>
                ) : (
                    <SimpleGrid columns={{ base: 2, md: 4, lg: 6, xl: 8 }} spacing={4}>
                        {filteredChampions.map((champion) => {
                            const masteryLevel = getMasteryLevel(champion.id);
                            const masteryPoints = getMasteryPoints(champion.id);
                            return (
                                <ChampionCard
                                    key={champion.id}
                                    champion={champion}
                                    masteryLevel={masteryLevel}
                                    masteryPoints={masteryPoints}
                                    onClick={handleChampionClick}
                                />
                            );
                        })}
                    </SimpleGrid>
                )}
            </VStack>

            {/* Champion Detail Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="6xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {selectedChampion && (
                            <HStack>
                                <Image
                                    src={selectedChampion.squareUrl || selectedChampion.image}
                                    alt={selectedChampion.name}
                                    boxSize="40px"
                                    borderRadius="md"
                                />
                                <VStack align="start" spacing={0}>
                                    <Text>{selectedChampion.name}</Text>
                                    <Text fontSize="sm" color="gray.500">
                                        {selectedChampion.title}
                                    </Text>
                                </VStack>
                            </HStack>
                        )}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        {selectedChampion && (
                            <ChampionDetailView champion={selectedChampion} />
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default ChampionsList;
