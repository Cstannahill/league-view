import { Box, Text, Stat, StatLabel, StatNumber, StatHelpText, CircularProgress, CircularProgressLabel, HStack, Icon } from '@chakra-ui/react';
import { FaShieldAlt, FaTrophy, FaStar } from 'react-icons/fa';
import { RankInfo } from '../../store';

interface Props {
  rank: RankInfo | null | undefined;
}

export default function RankCard({ rank }: Props) {
  if (!rank) {
    return (
      <Box borderWidth="1px" p={2} borderRadius="md" bg="gray.800">
        <Text>No ranked data</Text>
      </Box>
    );
  }

  const winrate = (rank.winrate * 100).toFixed(1);
  const tierColors = {
    IRON: 'gray.700',
    BRONZE: 'orange.100',
    SILVER: 'gray.200',
    GOLD: 'yellow.100',
    PLATINUM: 'cyan.100',
    DIAMOND: 'blue.100',
    MASTER: 'purple.100',
    GRANDMASTER: 'red.100',
    CHALLENGER: 'teal.100'
  } as const;
  const tierIcons = {
    IRON: FaShieldAlt,
    BRONZE: FaShieldAlt,
    SILVER: FaShieldAlt,
    GOLD: FaTrophy,
    PLATINUM: FaTrophy,
    DIAMOND: FaTrophy,
    MASTER: FaStar,
    GRANDMASTER: FaStar,
    CHALLENGER: FaStar
  } as const;
  const bgColor = tierColors[rank.tier as keyof typeof tierColors] || 'gray.900';
  const TierIcon = tierIcons[rank.tier as keyof typeof tierIcons] || FaStar;

  return (
    <Box borderWidth="1px" p={2} borderRadius="md" bg={bgColor} transition="background 0.3s">
      <HStack>
        <CircularProgress value={parseFloat(winrate)} size="60px" color="green.400" thickness="8px" isIndeterminate={false} capIsRound>
          <CircularProgressLabel>
            <Icon as={TierIcon} color="gray.600" boxSize={5} mr={1} />
            {winrate}%
          </CircularProgressLabel>
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
