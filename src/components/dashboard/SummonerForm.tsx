import { useState, useEffect } from 'react';
import { Box, Button, FormControl, FormLabel, HStack, Input, Select, Heading } from '@chakra-ui/react';
import { useStore } from '../../store';
import { invoke } from '@tauri-apps/api/core';

export default function SummonerForm() {
  const { gameName, tagLine, region, setSummoner, setDashboard } = useStore();
  const [game, setGame] = useState(gameName);
  const [tag, setTag] = useState(tagLine);
  const [reg, setReg] = useState(region);
  const [editing, setEditing] = useState(!(gameName && tagLine));

  useEffect(() => {
    setGame(gameName);
    setTag(tagLine);
    setReg(region);
  }, [gameName, tagLine, region]);

  const handleSave = async () => {
    await setSummoner(game, tag, reg);
    const data = await invoke('refresh_dashboard');
    setDashboard(data as any);
    setEditing(false);
  };

  if (!editing) {
    return (
      <HStack mb={4} justifyContent="space-between">
        <Heading size="md">
          {gameName}#{tagLine} - {region}
        </Heading>
        <Button size="sm" onClick={() => setEditing(true)}>
          Change
        </Button>
      </HStack>
    );
  }

  return (
    <Box mb={4}>
      <HStack alignItems="flex-end" spacing={2}>
        <FormControl>
          <FormLabel>Game Name</FormLabel>
          <Input value={game} onChange={(e) => setGame(e.target.value)} />
        </FormControl>
        <FormControl w="100px">
          <FormLabel>Tag Line</FormLabel>
          <Input value={tag} onChange={(e) => setTag(e.target.value)} />
        </FormControl>
        <FormControl w="120px">
          <FormLabel>Region</FormLabel>
          <Select value={reg} onChange={(e) => setReg(e.target.value)}>
            <option value="NA1">NA</option>
            <option value="EUW1">EUW</option>
            <option value="EUN1">EUNE</option>
            <option value="KR">KR</option>
            <option value="BR1">BR</option>
          </Select>
        </FormControl>
        <Button colorScheme="blue" onClick={handleSave}>
          Save
        </Button>
      </HStack>
    </Box>
  );
}

