import { useState } from 'react';
import { Box, Button, FormControl, FormLabel, HStack, Input, Select } from '@chakra-ui/react';
import { useStore } from '../../store';
import { invoke } from '@tauri-apps/api/core';

export default function SummonerForm() {
  const { summonerName, region, setSummoner, setDashboard } = useStore();
  const [name, setName] = useState(summonerName);
  const [reg, setReg] = useState(region);

  const handleSave = async () => {
    await setSummoner(name, reg);
    const data = await invoke('refresh_dashboard');
    setDashboard(data as any);
  };

  return (
    <Box mb={4}>
      <HStack alignItems="flex-end" spacing={2}>
        <FormControl>
          <FormLabel>Summoner Name</FormLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
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

