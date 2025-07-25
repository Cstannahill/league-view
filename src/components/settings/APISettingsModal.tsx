import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Switch,
    FormControl,
    FormLabel,
    VStack,
    HStack,
    Text,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Box,
    Heading,
    Input
} from '@chakra-ui/react';
import { ConfigService, APIConfig } from '../../services/configService';

interface APISettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const APISettingsModal: React.FC<APISettingsModalProps> = ({ isOpen, onClose }) => {
    const [config, setConfig] = useState<APIConfig>({
        enabled: true,
        useExternalAPIs: false,
        fallbackToMock: true,
        rateLimitDelay: 1000,
        maxRetries: 3,
        timeoutMs: 10000,
        debugMode: false,
        riotAPIKey: undefined
    });

    const configService = ConfigService.getInstance();

    useEffect(() => {
        setConfig(configService.getConfig());
    }, [isOpen]);

    const handleConfigChange = (key: keyof APIConfig, value: any) => {
        const updatedConfig = { ...config, [key]: value };
        setConfig(updatedConfig);
        configService.updateConfig(updatedConfig);
    };

    const handleSave = () => {
        configService.updateConfig(config);
        onClose();
    };

    const handleReset = () => {
        configService.resetToDefaults();
        setConfig(configService.getConfig());
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>API Settings</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={6} align="stretch">
                        <Alert status="info" mb={6}>
                            <AlertIcon />
                            <Box>
                                <AlertTitle>External API Configuration</AlertTitle>
                                <AlertDescription>
                                    Configure legitimate data sources. For real data, use the official Riot Games Developer API 
                                    (requires registration at https://developer.riotgames.com/).
                                    Third-party sites like U.GG, OP.GG, and Mobalytics do not provide public APIs.
                                </AlertDescription>
                            </Box>
                        </Alert>

                        {/* Riot API Key Section */}
                        <Box mb={6} p={4} border="1px" borderColor="gray.200" borderRadius="md">
                            <Heading size="sm" mb={3}>Official Riot Games API</Heading>
                            <FormControl mb={3}>
                                <FormLabel>API Key</FormLabel>
                                <Input
                                    type="password"
                                    placeholder="Enter your Riot Games API key"
                                    value={config.riotAPIKey || ''}
                                    onChange={(e) => handleConfigChange('riotAPIKey', e.target.value)}
                                />
                                <Text fontSize="sm" color="gray.500" mt={1}>
                                    Get your API key from{' '}
                                    <a 
                                        href="https://developer.riotgames.com/" 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        style={{ color: 'blue', textDecoration: 'underline' }}
                                    >
                                        developer.riotgames.com
                                    </a>
                                </Text>
                            </FormControl>
                        </Box>

                        <Box>
                            <FormControl display="flex" alignItems="center" mb={4}>
                                <FormLabel htmlFor="api-enabled" mb="0">
                                    Enable API Integration
                                </FormLabel>
                                <Switch
                                    id="api-enabled"
                                    isChecked={config.enabled}
                                    onChange={(e) => handleConfigChange('enabled', e.target.checked)}
                                />
                            </FormControl>

                            <FormControl display="flex" alignItems="center" mb={4}>
                                <FormLabel htmlFor="external-apis" mb="0">
                                    Use External APIs (when available)
                                </FormLabel>
                                <Switch
                                    id="external-apis"
                                    isChecked={config.useExternalAPIs}
                                    onChange={(e) => handleConfigChange('useExternalAPIs', e.target.checked)}
                                />
                            </FormControl>

                            <FormControl display="flex" alignItems="center" mb={4}>
                                <FormLabel htmlFor="fallback-mock" mb="0">
                                    Fallback to Mock Data
                                </FormLabel>
                                <Switch
                                    id="fallback-mock"
                                    isChecked={config.fallbackToMock}
                                    onChange={(e) => handleConfigChange('fallbackToMock', e.target.checked)}
                                />
                            </FormControl>

                            <FormControl display="flex" alignItems="center" mb={4}>
                                <FormLabel htmlFor="debug-mode" mb="0">
                                    Debug Mode
                                </FormLabel>
                                <Switch
                                    id="debug-mode"
                                    isChecked={config.debugMode}
                                    onChange={(e) => handleConfigChange('debugMode', e.target.checked)}
                                />
                            </FormControl>
                        </Box>

                        {/* Advanced Settings */}
                        <Box>
                            <Heading size="sm" mb={3}>Advanced Settings</Heading>
                            
                            <FormControl mb={4}>
                                <FormLabel>Rate Limit Delay (ms)</FormLabel>
                                <NumberInput
                                    value={config.rateLimitDelay}
                                    min={100}
                                    max={5000}
                                    onChange={(valueString) => 
                                        handleConfigChange('rateLimitDelay', parseInt(valueString) || 1000)
                                    }
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                                <Text fontSize="sm" color="gray.500">
                                    Delay between API requests to avoid rate limiting
                                </Text>
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel>Max Retries</FormLabel>
                                <NumberInput
                                    value={config.maxRetries}
                                    min={0}
                                    max={10}
                                    onChange={(valueString) => 
                                        handleConfigChange('maxRetries', parseInt(valueString) || 3)
                                    }
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                                <Text fontSize="sm" color="gray.500">
                                    Number of retry attempts for failed requests
                                </Text>
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel>Request Timeout (ms)</FormLabel>
                                <NumberInput
                                    value={config.timeoutMs}
                                    min={1000}
                                    max={30000}
                                    onChange={(valueString) => 
                                        handleConfigChange('timeoutMs', parseInt(valueString) || 10000)
                                    }
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                                <Text fontSize="sm" color="gray.500">
                                    Maximum time to wait for API responses
                                </Text>
                            </FormControl>
                        </Box>

                        {config.debugMode && (
                            <Alert status="warning">
                                <AlertIcon />
                                <Box>
                                    <AlertTitle>Debug Mode Enabled</AlertTitle>
                                    <AlertDescription>
                                        Additional logging and debugging information will be displayed in the console.
                                    </AlertDescription>
                                </Box>
                            </Alert>
                        )}
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <HStack>
                        <Button variant="ghost" onClick={handleReset}>
                            Reset to Defaults
                        </Button>
                        <Button colorScheme="blue" onClick={handleSave}>
                            Save Changes
                        </Button>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
