import React, { useState } from 'react';
import { Image, Box, Skeleton, Icon } from '@chakra-ui/react';
import { FaUser } from 'react-icons/fa';
import { championAssets } from '../../services/championAssetService';

interface ChampionImageProps {
  championId: number | string;
  size?: 'small' | 'medium' | 'large';
  type?: 'portrait' | 'icon' | 'splash';
  borderRadius?: string;
  alt?: string;
  fallbackIcon?: React.ElementType;
}

const sizeMap = {
  small: { w: '32px', h: '32px' },
  medium: { w: '64px', h: '64px' },
  large: { w: '128px', h: '128px' }
};

export const ChampionImage: React.FC<ChampionImageProps> = ({
  championId,
  size = 'medium',
  type = 'portrait',
  borderRadius = 'md',
  alt,
  fallbackIcon = FaUser
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const champion = typeof championId === 'number' 
    ? championAssets.getChampionById(championId)
    : championAssets.getChampionByKey(championId);

  const getImageUrl = () => {
    switch (type) {
      case 'icon':
        return championAssets.getChampionIconUrl(championId);
      case 'splash':
        return championAssets.getChampionSplashUrl(championId);
      case 'portrait':
      default:
        return championAssets.getChampionPortraitUrl(championId);
    }
  };

  const dimensions = sizeMap[size];
  const imageUrl = getImageUrl();
  const championName = champion?.name || 'Unknown Champion';
  const altText = alt || `${championName} ${type}`;

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <Box
        {...dimensions}
        borderRadius={borderRadius}
        bg="gray.600"
        display="flex"
        alignItems="center"
        justifyContent="center"
        border="2px solid"
        borderColor="gray.500"
      >
        <Icon as={fallbackIcon} color="gray.400" boxSize="50%" />
      </Box>
    );
  }

  return (
    <Box position="relative" {...dimensions}>
      {loading && (
        <Skeleton
          position="absolute"
          top={0}
          left={0}
          {...dimensions}
          borderRadius={borderRadius}
          zIndex={1}
        />
      )}
      <Image
        src={imageUrl}
        alt={altText}
        {...dimensions}
        borderRadius={borderRadius}
        objectFit="cover"
        onLoad={handleLoad}
        onError={handleError}
        opacity={loading ? 0 : 1}
        transition="opacity 0.2s"
      />
    </Box>
  );
};

export default ChampionImage;
