import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { ChampionStat } from '../../store';

interface Props {
  champions: ChampionStat[];
}

export default function ChampionStats({ champions }: Props) {
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
        <Tbody>
          {champions.map((c) => (
            <Tr key={c.id}>
              <Td>{c.name}</Td>
              <Td>{c.level}</Td>
              <Td isNumeric>{c.points}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
