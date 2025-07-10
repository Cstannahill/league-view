import { Box, Spinner, Text } from '@chakra-ui/react';

export default function PreMatchView() {
  return (
    <Box p={4} textAlign="center">
      <Spinner size="xl" />
      <Text mt={2}>Loading match data...</Text>
    </Box>
  );
}
