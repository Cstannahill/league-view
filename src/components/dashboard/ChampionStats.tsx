import React, { useMemo } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tooltip,
  Progress,
  Text,
} from '@chakra-ui/react';
import { ChampionStat } from '../../store';

interface Props {
  champions: ChampionStat[];
}

const ChampionStats: React.FC<Props> = React.memo(({ champions }: Props) => {
  const tableRows = useMemo(() => {
    return champions.map((c) => (
      <Tr key={c.id}>
        <Td>
          <Tooltip label={`Level ${c.level} | ${c.points} pts`} placement="top">
            <span>{c.name}</span>
          </Tooltip>
        </Td>
        <Td>{c.level}</Td>
        <Td isNumeric>
          <Box w="100%">
            <Progress value={c.points} max={100000} colorScheme={c.points > 50000 ? 'green' : c.points > 20000 ? 'yellow' : 'red'} size="sm" borderRadius="md" />
            <Text fontSize="xs" color="gray.500">{c.points} pts</Text>
          </Box>
        </Td>
      </Tr>
    ));
  }, [champions]);

  if (!champions.length) {
    return (
      <Box>
        <Heading size="md">No champion stats available</Heading>
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="md" mb={2}>
        Top Champions
      </Heading>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>Champion</Th>
            <Th>Level</Th>
            <Th isNumeric>Points</Th>
          </Tr>
        </Thead>
        <Tbody>{tableRows}</Tbody>
      </Table>
    </Box>
  );
});

export default ChampionStats;
