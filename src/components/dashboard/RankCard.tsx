import { Box, Text, Stat, StatLabel, StatNumber, StatHelpText } from '@chakra-ui/react';
import { RankInfo } from '../../store';

interface Props {
  rank: RankInfo | null | undefined;
}

export default function RankCard({ rank }: Props) {
  if (!rank) {
    return (
      <Box borderWidth="1px" p={2} borderRadius="md">
        <Text>No ranked data</Text>
      </Box>
    );
  }

  const winrate = (rank.winrate * 100).toFixed(1);

  return (
    <Box borderWidth="1px" p={2} borderRadius="md">
      <Stat>
        <StatLabel>
          {rank.tier} {rank.rank}
        </StatLabel>
        <StatNumber>{rank.lp} LP</StatNumber>
        <StatHelpText>
          {rank.wins}W/{rank.losses}L - {winrate}% WR
        </StatHelpText>
      </Stat>
    </Box>
  );
}
