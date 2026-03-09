import {
  MD3DarkTheme,
  MD3LightTheme,
  type MD3Theme,
} from 'react-native-paper';

/**
 * Material Design 3 theming with a single brand colour palette applied to both
 * light and dark schemes. Screens read colours from `theme.colors` via
 * `useTheme()` so dark mode is automatic and there are no hard-coded hex values.
 */
const brand = {
  primary: '#2E7D32', // rural green — evokes fields/agriculture
  secondary: '#00695C',
  tertiary: '#F9A825',
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: brand.primary,
    secondary: brand.secondary,
    tertiary: brand.tertiary,
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#7CCB80',
    secondary: '#4DB6AC',
    tertiary: '#FFD54F',
  },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
