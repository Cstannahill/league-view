import React from 'react';
import {
    Box,
    HStack,
    Button,
    Text,
    Icon,
    useColorModeValue
} from '@chakra-ui/react';
import {
    FaHome,
    FaGamepad
} from 'react-icons/fa';
import { useStore, Mode } from '../../store';

const Navigation: React.FC = () => {
    const { mode, setMode } = useStore();
    const bg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const navItems = [
        {
            mode: 'dashboard' as Mode,
            label: 'Dashboard',
            icon: FaHome,
            description: 'Overview and stats'
        },
        {
            mode: 'champions' as Mode,
            label: 'Champions',
            icon: FaGamepad,
            description: 'Champion guides and builds'
        }
    ];

    return (
        <Box
            bg={bg}
            borderBottom="1px"
            borderColor={borderColor}
            px={6}
            py={3}
            position="sticky"
            top={0}
            zIndex={10}
        >
            <HStack spacing={1} justify="center">
                {navItems.map((item) => (
                    <Button
                        key={item.mode}
                        variant={mode === item.mode ? 'solid' : 'ghost'}
                        colorScheme={mode === item.mode ? 'blue' : 'gray'}
                        leftIcon={<Icon as={item.icon} />}
                        onClick={() => setMode(item.mode)}
                        size="md"
                        fontWeight={mode === item.mode ? 'bold' : 'normal'}
                    >
                        <Text>{item.label}</Text>
                    </Button>
                ))}
            </HStack>
        </Box>
    );
};

export default Navigation;
