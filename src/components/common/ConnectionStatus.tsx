import React from 'react';
import {
  Box,
  HStack,
  Text,
  Icon,
  Spinner,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react';
import { FaWifi, FaExclamationTriangle } from 'react-icons/fa';

interface ConnectionStatusProps {
  status: 'connected' | 'reconnecting' | 'disconnected';
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'green.500',
          icon: FaWifi,
          text: 'Connected',
          description: 'All systems operational',
        };
      case 'reconnecting':
        return {
          color: 'yellow.500',
          icon: null,
          text: 'Reconnecting',
          description: 'Attempting to restore connection...',
        };
      case 'disconnected':
        return {
          color: 'red.500',
          icon: FaExclamationTriangle,
          text: 'Disconnected',
          description: 'Connection lost. Check your internet connection.',
        };
      default:
        return {
          color: 'gray.500',
          icon: FaWifi,
          text: 'Unknown',
          description: 'Connection status unknown',
        };
    }
  };

  const config = getStatusConfig();

  if (status === 'connected') {
    // Don't show when connected to reduce UI clutter
    return null;
  }

  return (
    <Tooltip label={config.description} placement="bottom">
      <Box
        position="fixed"
        top={4}
        right={4}
        zIndex={1000}
        bg={bgColor}
        border="1px"
        borderColor={borderColor}
        borderRadius="md"
        px={3}
        py={2}
        shadow="md"
        transition="all 0.2s"
      >
        <HStack spacing={2}>
          {status === 'reconnecting' ? (
            <Spinner size="sm" color={config.color} />
          ) : (
            config.icon && <Icon as={config.icon} color={config.color} />
          )}
          <Text fontSize="sm" fontWeight="medium" color={config.color}>
            {config.text}
          </Text>
        </HStack>
      </Box>
    </Tooltip>
  );
};

export default ConnectionStatus;
