export type ThemeName = 'default';

export interface ThemeColors {
  // Main colors
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;

  // Poker specific
  pokerGreen: string;
  pokerGold: string;
  pokerFelt: string;

  // Custom gradients
  gradientPoker: string;
  gradientGold: string;
  gradientDark: string;
}

export interface Theme {
  name: ThemeName;
  displayName: string;
  description: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  characters: string[]; // Character names for avatar assignment
}

export const themes: Record<ThemeName, Theme> = {
  default: {
    name: 'default',
    displayName: 'Default',
    description: 'Material Design poker theme with green felt and gold accents',
    colors: {
      light: {
        background: '0 0% 100%',
        foreground: '158 10% 15%',
        card: '0 0% 100%',
        cardForeground: '158 10% 15%',
        popover: '0 0% 100%',
        popoverForeground: '158 10% 15%',
        primary: '158 64% 42%',
        primaryForeground: '0 0% 100%',
        secondary: '45 100% 51%',
        secondaryForeground: '158 10% 15%',
        accent: '45 95% 92%',
        accentForeground: '158 10% 15%',
        muted: '158 10% 95%',
        mutedForeground: '158 8% 45%',
        destructive: '0 70% 50%',
        destructiveForeground: '0 0% 100%',
        border: '158 15% 88%',
        input: '158 15% 88%',
        ring: '158 64% 42%',
        pokerGreen: '158 64% 42%',
        pokerGold: '45 100% 51%',
        pokerFelt: '158 50% 30%',
        gradientPoker: 'linear-gradient(135deg, hsl(158, 64%, 42%) 0%, hsl(158, 50%, 30%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(45, 100%, 51%) 0%, hsl(45, 100%, 45%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(158, 10%, 20%) 0%, hsl(158, 10%, 15%) 100%)',
      },
      dark: {
        background: '158 15% 8%',
        foreground: '158 8% 95%',
        card: '158 12% 12%',
        cardForeground: '158 8% 95%',
        popover: '158 12% 12%',
        popoverForeground: '158 8% 95%',
        primary: '158 64% 52%',
        primaryForeground: '158 15% 8%',
        secondary: '45 100% 60%',
        secondaryForeground: '158 15% 8%',
        accent: '45 80% 25%',
        accentForeground: '158 8% 95%',
        muted: '158 12% 18%',
        mutedForeground: '158 8% 65%',
        destructive: '0 70% 60%',
        destructiveForeground: '0 0% 100%',
        border: '158 12% 22%',
        input: '158 12% 16%',
        ring: '158 64% 52%',
        pokerGreen: '158 64% 52%',
        pokerGold: '45 100% 60%',
        pokerFelt: '158 50% 22%',
        gradientPoker: 'linear-gradient(135deg, hsl(158, 64%, 52%) 0%, hsl(158, 50%, 28%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(45, 100%, 60%) 0%, hsl(45, 100%, 52%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(158, 15%, 12%) 0%, hsl(158, 15%, 8%) 100%)',
      },
    },
    characters: [], // Uses default dicebear avatars
  },
};

export const getTheme = (themeName: ThemeName): Theme => {
  return themes[themeName] || themes.default;
};

export const getCharacterForPlayer = (_themeName: ThemeName, _playerName: string): string | null => {
  return null;
};

/**
 * Get a unique character for a player within a specific game context.
 * Note: Character assignment removed with anime themes.
 */
export const getUniqueCharacterForPlayer = (
  _themeName: ThemeName,
  _playerName: string,
  _allPlayerNames: string[]
): string | null => {
  return null;
};
