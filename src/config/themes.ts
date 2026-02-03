export type ThemeName = 'default' | 'one_piece' | 'bleach' | 'naruto' | 'dandadan';

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

  one_piece: {
    name: 'one_piece',
    displayName: 'One Piece',
    description: 'Adventure on the Grand Line with vibrant ocean colors',
    colors: {
      light: {
        background: '205 25% 97%',
        foreground: '215 40% 12%',
        card: '205 20% 98%',
        cardForeground: '215 40% 12%',
        popover: '205 20% 98%',
        popoverForeground: '215 40% 12%',
        primary: '215 50% 25%', // Deep Oceanic Navy
        primaryForeground: '45 30% 90%', // Antique Gold foreground
        secondary: '45 60% 50%', // Antique Gold
        secondaryForeground: '0 0% 100%',
        accent: '0 50% 45%', // Muted Crimson
        accentForeground: '0 0% 100%',
        muted: '205 20% 90%',
        mutedForeground: '205 15% 35%',
        destructive: '0 60% 45%',
        destructiveForeground: '0 0% 100%',
        border: '205 20% 88%',
        input: '205 20% 85%',
        ring: '215 50% 25%',
        pokerGreen: '215 50% 25%',
        pokerGold: '45 60% 50%',
        pokerFelt: '215 45% 20%', // Deep Sea Felt
        gradientPoker: 'linear-gradient(135deg, hsl(215, 50%, 25%) 0%, hsl(215, 60%, 15%) 100%)',
        gradientGold: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(215, 40%, 15%) 0%, hsl(215, 50%, 8%) 100%)',
      },
      dark: {
        background: '215 50% 4%', // Nearly Black Navy
        foreground: '45 20% 95%',
        card: '215 40% 8%',
        cardForeground: '45 20% 95%',
        popover: '215 40% 8%',
        popoverForeground: '45 20% 95%',
        primary: '215 50% 30%',
        primaryForeground: '45 30% 95%',
        secondary: '45 60% 55%', // Gilded Antique Gold
        secondaryForeground: '215 50% 4%',
        accent: '0 50% 50%',
        accentForeground: '215 50% 4%',
        muted: '215 30% 14%',
        mutedForeground: '215 15% 65%',
        destructive: '0 60% 55%',
        destructiveForeground: '0 0% 100%',
        border: '215 30% 18%',
        input: '215 30% 14%',
        ring: '215 50% 30%',
        pokerGreen: '215 50% 30%',
        pokerGold: '45 60% 55%',
        pokerFelt: '215 55% 15%',
        gradientPoker: 'linear-gradient(135deg, hsl(215, 50%, 30%) 0%, hsl(215, 60%, 12%) 100%)',
        gradientGold: 'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(215, 40%, 10%) 0%, hsl(215, 50% , 4%) 100%)',
      },
    },
    characters: [
      'Luffy', 'Zoro', 'Nami', 'Sanji', 'Usopp', 'Chopper', 'Robin', 'Franky', 'Brook',
      'Ace', 'Sabo', 'Law', 'Shanks', 'Mihawk', 'Crocodile', 'Doflamingo', 'Katakuri',
      'Whitebeard', 'Kaido', 'Big Mom', 'Blackbeard', 'Boa Hancock', 'Jinbei', 'Yamato', 'Buggy'
    ],
  },

  bleach: {
    name: 'bleach',
    displayName: 'Bleach',
    description: 'Soul Society style with stark contrasts and spiritual energy',
    colors: {
      light: {
        background: '0 0% 98%',
        foreground: '0 0% 8%',
        card: '0 0% 100%',
        cardForeground: '0 0% 8%',
        popover: '0 0% 100%',
        popoverForeground: '0 0% 8%',
        primary: '25 90% 50%',
        primaryForeground: '0 0% 100%',
        secondary: '0 0% 15%',
        secondaryForeground: '0 0% 98%',
        accent: '0 0% 82%',
        accentForeground: '0 0% 15%',
        muted: '0 0% 88%',
        mutedForeground: '0 0% 38%',
        destructive: '0 70% 50%',
        destructiveForeground: '0 0% 100%',
        border: '0 0% 85%',
        input: '0 0% 85%',
        ring: '25 90% 50%',
        pokerGreen: '25 90% 50%',
        pokerGold: '45 95% 58%',
        pokerFelt: '0 0% 18%',
        gradientPoker: 'linear-gradient(135deg, hsl(25, 90%, 50%) 0%, hsl(0, 0%, 15%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(45, 95%, 58%) 0%, hsl(25, 90%, 50%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(0, 0%, 22%) 0%, hsl(0, 0%, 8%) 100%)',
      },
      dark: {
        background: '0 0% 6%',
        foreground: '0 0% 96%',
        card: '0 0% 10%',
        cardForeground: '0 0% 96%',
        popover: '0 0% 10%',
        popoverForeground: '0 0% 96%',
        primary: '25 90% 55%',
        primaryForeground: '0 0% 6%',
        secondary: '0 0% 92%',
        secondaryForeground: '0 0% 6%',
        accent: '0 0% 22%',
        accentForeground: '0 0% 96%',
        muted: '0 0% 16%',
        mutedForeground: '0 0% 68%',
        destructive: '0 70% 60%',
        destructiveForeground: '0 0% 100%',
        border: '0 0% 20%',
        input: '0 0% 14%',
        ring: '25 90% 55%',
        pokerGreen: '25 90% 55%',
        pokerGold: '45 95% 62%',
        pokerFelt: '0 0% 14%',
        gradientPoker: 'linear-gradient(135deg, hsl(25, 90%, 55%) 0%, hsl(0, 0%, 16%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(45, 95%, 62%) 0%, hsl(25, 90%, 55%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(0, 0%, 14%) 0%, hsl(0, 0%, 6%) 100%)',
      },
    },
    characters: [
      'Ichigo', 'Rukia', 'Renji', 'Byakuya', 'Toshiro', 'Kenpachi', 'Yoruichi', 'Urahara',
      'Ulquiorra', 'Grimmjow', 'Aizen', 'Gin', 'Rangiku', 'Orihime', 'Chad', 'Uryu',
      'Shinji', 'Shunsui', 'Jushiro', 'Yamamoto', 'Mayuri', 'Nelliel', 'Stark', 'Barragan', 'Halibel'
    ],
  },

  naruto: {
    name: 'naruto',
    displayName: 'Naruto',
    description: 'Hidden Leaf ninja with energetic orange and blue tones',
    colors: {
      light: {
        background: '35 15% 97%',
        foreground: '35 40% 10%',
        card: '35 12% 98%',
        cardForeground: '35 40% 10%',
        popover: '35 12% 98%',
        popoverForeground: '35 40% 10%',
        primary: '25 80% 40%', // Gilded Burnt Orange
        primaryForeground: '0 0% 100%',
        secondary: '35 30% 25%', // Charcoal Stone
        secondaryForeground: '0 0% 100%',
        accent: '45 60% 50%', // Dull Gold
        accentForeground: '35 40% 10%',
        muted: '35 15% 90%',
        mutedForeground: '35 10% 45%',
        destructive: '0 60% 45%',
        destructiveForeground: '0 0% 100%',
        border: '35 15% 88%',
        input: '35 15% 85%',
        ring: '25 80% 40%',
        pokerGreen: '25 80% 40%',
        pokerGold: '45 60% 50%',
        pokerFelt: '35 25% 22%',
        gradientPoker: 'linear-gradient(135deg, hsl(25, 80%, 40%) 0%, hsl(35, 30%, 22%) 100%)',
        gradientGold: 'linear-gradient(135deg, #CC5500 0%, #A04400 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(35, 40%, 15%) 0%, hsl(35, 40%, 10%) 100%)',
      },
      dark: {
        background: '35 20% 5%', // Dark Charcoal
        foreground: '35 15% 95%',
        card: '35 25% 9%',
        cardForeground: '35 15% 95%',
        popover: '35 25% 9%',
        popoverForeground: '35 15% 95%',
        primary: '25 85% 45%', // Gilded Burnt Orange
        primaryForeground: '35 20% 5%',
        secondary: '35 25% 20%', // Charcoal
        secondaryForeground: '35 15% 95%',
        accent: '45 70% 55%', // Gilded Antique Gold
        accentForeground: '35 20% 5%',
        muted: '35 30% 13%',
        mutedForeground: '35 15% 65%',
        destructive: '0 60% 55%',
        destructiveForeground: '0 0% 100%',
        border: '35 30% 18%',
        input: '35 30% 12%',
        ring: '25 85% 45%',
        pokerGreen: '25 85% 45%',
        pokerGold: '45 70% 55%',
        pokerFelt: '35 35% 12%',
        gradientPoker: 'linear-gradient(135deg, hsl(25, 85%, 45%) 0%, hsl(35, 25%, 15%) 100%)',
        gradientGold: 'linear-gradient(135deg, #CC5500 0%, #8A3A00 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(35, 30% , 8%) 0%, hsl(35, 20% , 4%) 100%)',
      },
    },
    characters: [
      'Naruto', 'Sasuke', 'Sakura', 'Kakashi', 'Hinata', 'Shikamaru', 'Gaara', 'Rock Lee',
      'Neji', 'Itachi', 'Jiraiya', 'Tsunade', 'Orochimaru', 'Minato', 'Obito', 'Madara',
      'Pain', 'Konan', 'Killer B', 'Might Guy', 'Asuma', 'Kiba', 'Shino', 'Ino', 'Temari'
    ],
  },

  dandadan: {
    name: 'dandadan',
    displayName: 'Dandadan',
    description: 'Supernatural retro vibes with vibrant pink and cyan',
    colors: {
      light: {
        background: '280 18% 97%',
        foreground: '280 32% 10%',
        card: '280 16% 98%',
        cardForeground: '280 32% 10%',
        popover: '280 16% 98%',
        popoverForeground: '280 32% 10%',
        primary: '320 80% 58%',
        primaryForeground: '0 0% 100%',
        secondary: '180 85% 52%',
        secondaryForeground: '280 32% 10%',
        accent: '280 75% 68%',
        accentForeground: '280 32% 10%',
        muted: '280 14% 91%',
        mutedForeground: '280 10% 40%',
        destructive: '0 70% 50%',
        destructiveForeground: '0 0% 100%',
        border: '280 14% 86%',
        input: '280 14% 86%',
        ring: '320 80% 58%',
        pokerGreen: '320 80% 58%',
        pokerGold: '280 75% 68%',
        pokerFelt: '180 85% 42%',
        gradientPoker: 'linear-gradient(135deg, hsl(320, 80%, 58%) 0%, hsl(280, 75%, 58%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(280, 75%, 68%) 0%, hsl(180, 85%, 52%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(280, 32%, 20%) 0%, hsl(280, 32%, 10%) 100%)',
      },
      dark: {
        background: '280 32% 6%',
        foreground: '280 10% 96%',
        card: '280 26% 10%',
        cardForeground: '280 10% 96%',
        popover: '280 26% 10%',
        popoverForeground: '280 10% 96%',
        primary: '320 80% 62%',
        primaryForeground: '280 32% 6%',
        secondary: '180 85% 58%',
        secondaryForeground: '280 32% 6%',
        accent: '280 75% 72%',
        accentForeground: '280 32% 6%',
        muted: '280 22% 16%',
        mutedForeground: '280 8% 68%',
        destructive: '0 70% 60%',
        destructiveForeground: '0 0% 100%',
        border: '280 22% 20%',
        input: '280 22% 14%',
        ring: '320 80% 62%',
        pokerGreen: '320 80% 62%',
        pokerGold: '280 75% 72%',
        pokerFelt: '180 85% 38%',
        gradientPoker: 'linear-gradient(135deg, hsl(320, 80%, 62%) 0%, hsl(280, 75%, 62%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(280, 75%, 72%) 0%, hsl(180, 85%, 58%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(280, 32%, 12%) 0%, hsl(280, 32%, 6%) 100%)',
      },
    },
    characters: [
      'Momo', 'Okarun', 'Turbo Granny', 'Aira', 'Jiji', 'Seiko', 'Acrobatic Silky', 'Flatwoods Monster',
      'Serpo', 'Nessie', 'Dover Demon', 'Kinta', 'Vamola', 'Evil Eye', 'Count Saint-Germain',
      'Mantis Shrimp', 'Kouki', 'Rin', 'Rokuro', 'Bamora', 'Chiquitita', 'Reiko', 'Enjoji', 'Unji', 'Peeny-Weeny'
    ],
  },
};

export const getTheme = (themeName: ThemeName): Theme => {
  return themes[themeName] || themes.default;
};

export const getCharacterForPlayer = (themeName: ThemeName, playerName: string): string | null => {
  const theme = getTheme(themeName);
  if (theme.characters.length === 0) return null;

  // Use a simple hash of the player name to consistently assign the same character
  let hash = 0;
  for (let i = 0; i < playerName.length; i++) {
    hash = ((hash << 5) - hash) + playerName.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % theme.characters.length;
  return theme.characters[index];
};

/**
 * Get a unique character for a player within a specific game context.
 * Ensures no two players in the same game get the same character by assigning
 * characters sequentially based on alphabetically sorted player names.
 * 
 * @param themeName - The theme to get characters from
 * @param playerName - The name of the player to assign a character to
 * @param allPlayerNames - Array of all player names in the current context (e.g., game)
 * @returns The character name assigned to this player, or null if theme has no characters
 * 
 * @example
 * // In a game with players "Alice", "Bob", "Charlie" in One Piece theme
 * getUniqueCharacterForPlayer('one_piece', 'Alice', ['Alice', 'Bob', 'Charlie'])
 * // Returns 'Luffy' (first character in sorted order)
 */
export const getUniqueCharacterForPlayer = (
  themeName: ThemeName,
  playerName: string,
  allPlayerNames: string[]
): string | null => {
  const theme = getTheme(themeName);
  if (theme.characters.length === 0) return null;

  // Sort player names to ensure consistent assignment
  const sortedPlayers = [...allPlayerNames].sort();
  const playerIndex = sortedPlayers.indexOf(playerName);

  if (playerIndex === -1) return getCharacterForPlayer(themeName, playerName);

  // Assign characters sequentially based on sorted player order
  // Use modulo to handle cases where there are more players than characters
  const characterIndex = playerIndex % theme.characters.length;
  return theme.characters[characterIndex];
};
