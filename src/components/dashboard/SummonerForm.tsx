import { useState, useEffect } from 'react';
import { Box, Button, FormControl, FormLabel, HStack, Input, Select, Heading, FormErrorMessage } from '@chakra-ui/react';
import { useStore } from '../../store';
import { useSetTrackedSummoner } from '../../hooks/useApiWithRetry';
import { invoke } from '@tauri-apps/api/core';

export default function SummonerForm() {
  const { gameName, tagLine, region, setSummoner, setDashboard } = useStore();
  const { setSummoner: setSummonerWithRetry, isSettingSummoner } = useSetTrackedSummoner();
  const [game, setGame] = useState(gameName);
  const [tag, setTag] = useState(tagLine);
  const [reg, setReg] = useState(region);
  const [editing, setEditing] = useState(!(gameName && tagLine));
  const [errors, setErrors] = useState<{ game?: string; tag?: string }>({});
  const regionFlags = {
    NA1: '🇺🇸',
    EUW1: '🇪🇺',
    EUN1: '🇪🇺',
    KR: '🇰🇷',
    BR1: '🇧🇷'
  };

  useEffect(() => {
    setGame(gameName);
    setTag(tagLine);
    setReg(region);
  }, [gameName, tagLine, region]);

  const handleSave = async () => {
    let newErrors: { game?: string; tag?: string } = {};
    if (!game || game.length < 3) newErrors.game = 'Game name must be at least 3 characters.';
    if (!tag || tag.length < 2) newErrors.tag = 'Tag line must be at least 2 characters.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    const success = await setSummonerWithRetry(game, tag, reg);
    if (success) {
      await setSummoner(game, tag, reg);
      try {
        const data = await invoke('refresh_dashboard');
        setDashboard(data as any);
        setEditing(false);
      } catch (error) {
        console.error('Failed to refresh dashboard after setting summoner:', error);
        setEditing(false);
      }
    }
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
        <FormControl isInvalid={!!errors.game}>
          <FormLabel>Game Name</FormLabel>
          <Input value={game} onChange={(e) => setGame(e.target.value)} />
          {errors.game && <FormErrorMessage>{errors.game}</FormErrorMessage>}
        </FormControl>
        <FormControl w="100px" isInvalid={!!errors.tag}>
          <FormLabel>Tag Line</FormLabel>
          <Input value={tag} onChange={(e) => setTag(e.target.value)} />
          {errors.tag && <FormErrorMessage>{errors.tag}</FormErrorMessage>}
        </FormControl>
        <FormControl w="120px">
          <FormLabel>Region</FormLabel>
          <Select value={reg} onChange={(e) => setReg(e.target.value)}>
            <option value="NA1">{regionFlags.NA1} NA</option>
            <option value="EUW1">{regionFlags.EUW1} EUW</option>
            <option value="EUN1">{regionFlags.EUN1} EUNE</option>
            <option value="KR">{regionFlags.KR} KR</option>
            <option value="BR1">{regionFlags.BR1} BR</option>
          </Select>
        </FormControl>
        <Button 
          colorScheme="blue" 
          onClick={handleSave}
          isLoading={isSettingSummoner}
          loadingText="Connecting..."
        >
          Save
        </Button>
      </HStack>
    </Box>
  );
}

