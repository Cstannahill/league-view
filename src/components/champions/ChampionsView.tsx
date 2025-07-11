import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Icon,
    Container
} from '@chakra-ui/react';
import { FaGamepad } from 'react-icons/fa';
import ChampionsList from './ChampionsList';

const ChampionsView: React.FC = () => {
    return (
        <Container maxW="7xl" py={6}>
            <VStack spacing={6} align="stretch">
                {/* Header */}
                <HStack spacing={3}>
                    <Icon as={FaGamepad} boxSize={8} color="blue.500" />
                    <VStack align="start" spacing={0}>
                        <Text fontSize="3xl" fontWeight="bold">
                            Champions
                        </Text>
                        <Text fontSize="lg" color="gray.500">
                            Browse your champion mastery, builds, and matchups
                        </Text>
                    </VStack>
                </HStack>

                {/* Main Content */}
                <Box>
                    <ChampionsList />
                </Box>
            </VStack>
        </Container>
    );
};

export default ChampionsView;
