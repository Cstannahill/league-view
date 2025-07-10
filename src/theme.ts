import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: true,
};

// Custom color palette matching League style
const colors = {
  primary: '#0F2027',
  secondary: '#C89B3C',
  success: '#0A8754',
  danger: '#D32F2F',
  info: '#0F77B6',
};

const fonts = {
  heading: 'Inter, sans-serif',
  body: 'Inter, sans-serif',
};

const customTheme = extendTheme({ config, colors, fonts });

export default customTheme;
