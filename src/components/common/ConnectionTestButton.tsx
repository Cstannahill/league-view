import React, { useState } from 'react';
import {
  Button,
  VStack,
  Text,
  Alert,
  AlertIcon,
  Box,
  useToast,
} from '@chakra-ui/react';
import { FaNetworkWired } from 'react-icons/fa';
import { invoke } from '@tauri-apps/api/core';

const ConnectionTestButton: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const testConnection = async () => {
    setTesting(true);
    setResult(null);
    setError(null);

    try {
      const result = await invoke('test_connection_with_retry') as string;
      setResult(result);
      toast({
        title: 'Connection Test Successful',
        description: result,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      const errorMessage = err?.toString() || 'Connection test failed';
      setError(errorMessage);
      toast({
        title: 'Connection Test Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Box p={4} bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
      <VStack spacing={3} align="stretch">
        <Text fontSize="sm" fontWeight="medium" color="gray.700">
          Connection Test (with Retry)
        </Text>
        
        <Button
          leftIcon={<FaNetworkWired />}
          onClick={testConnection}
          isLoading={testing}
          loadingText="Testing Connection..."
          colorScheme="blue"
          size="sm"
        >
          Test Connection
        </Button>

        {result && (
          <Alert status="success" size="sm">
            <AlertIcon />
            <Text fontSize="sm">{result}</Text>
          </Alert>
        )}

        {error && (
          <Alert status="error" size="sm">
            <AlertIcon />
            <Text fontSize="sm">{error}</Text>
          </Alert>
        )}
      </VStack>
    </Box>
  );
};

export default ConnectionTestButton;
