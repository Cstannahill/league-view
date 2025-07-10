import { Box, Text, Stat, StatLabel, StatNumber, StatHelpText, CircularProgress, CircularProgressLabel, HStack } from '@chakra-ui/react';
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
      <HStack>
        <CircularProgress value={parseFloat(winrate)} size="60px" color="green.400">
          <CircularProgressLabel>{winrate}%</CircularProgressLabel>
        </CircularProgress>
        <Stat ml={2}>
          <StatLabel>
            {rank.tier} {rank.rank}
          </StatLabel>
          <StatNumber>{rank.lp} LP</StatNumber>
          <StatHelpText>
            {rank.wins}W/{rank.losses}L
          </StatHelpText>
        </Stat>
      </HStack>
    </Box>
  );
}
