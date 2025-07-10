import { Box, Heading, Table, Tbody, Td, Th, Thead, Tr, Badge } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { GameSummary } from '../../store';

export default function RecentGames() {
  const [games, setGames] = useState<GameSummary[]>([]);

  useEffect(() => {
    invoke<GameSummary[]>('recent_games', { count: 10 }).then(setGames).catch(() => setGames([]));
  }, []);

  if (!games.length) {
    return null;
  }

  return (
    <Box>
      <Heading size="md" mb={2}>Recent Games</Heading>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>Champion</Th>
            <Th>K/D/A</Th>
            <Th isNumeric>Duration</Th>
            <Th>Result</Th>
          </Tr>
        </Thead>
        <Tbody>
          {games.map((g, i) => (
            <Tr key={i}>
              <Td>{g.champion_name}</Td>
              <Td>{`${g.kills}/${g.deaths}/${g.assists}`}</Td>
              <Td isNumeric>{Math.round(g.duration / 60)}m</Td>
              <Td>{g.win ? <Badge colorScheme="green">W</Badge> : <Badge colorScheme="red">L</Badge>}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
