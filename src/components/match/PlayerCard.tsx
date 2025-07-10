import { Box, HStack, Tag, Text } from '@chakra-ui/react';

interface Props {
  player: any;
  ranked: any[];
  traits: string[];
}

export default function PlayerCard({ player, ranked, traits }: Props) {
  const entry = ranked && ranked[0];
  return (
    <Box borderWidth="1px" p={2}>
      <Text fontWeight="bold">{player.summonerName}</Text>
      {entry && <Text>{entry.tier} {entry.rank}</Text>}
      {traits && (
        <HStack mt={1} spacing={1} wrap="wrap">
          {traits.map((t, i) => (
            <Tag key={i} size="sm">{t}</Tag>
          ))}
        </HStack>
      )}
    </Box>
  );
}
