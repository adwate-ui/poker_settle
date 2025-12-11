export type ThemeName = 'default' | 'one_piece' | 'bleach' | 'naruto' | 'dandadan';

export interface ThemeColors {
  // Main colors
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  
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
    description: 'Classic poker theme with green felt and gold accents',
    colors: {
      light: {
        background: '0 0% 100%',
        foreground: '240 10% 3.9%',
        primary: '142 76% 36%',
        primaryForeground: '355.7 100% 97.3%',
        secondary: '240 4.8% 95.9%',
        secondaryForeground: '240 5.9% 10%',
        accent: '240 4.8% 95.9%',
        accentForeground: '240 5.9% 10%',
        muted: '240 4.8% 95.9%',
        mutedForeground: '240 3.8% 46.1%',
        pokerGreen: '142 76% 36%',
        pokerGold: '43 96% 56%',
        pokerFelt: '142 50% 25%',
        gradientPoker: 'linear-gradient(135deg, hsl(142, 76%, 36%) 0%, hsl(142, 50%, 25%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(43, 96%, 56%) 0%, hsl(43, 86%, 46%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(240, 10%, 10%) 0%, hsl(240, 10%, 3.9%) 100%)',
      },
      dark: {
        background: '240 10% 3.9%',
        foreground: '0 0% 98%',
        primary: '142 76% 36%',
        primaryForeground: '355.7 100% 97.3%',
        secondary: '240 3.7% 15.9%',
        secondaryForeground: '0 0% 98%',
        accent: '240 3.7% 15.9%',
        accentForeground: '0 0% 98%',
        muted: '240 3.7% 15.9%',
        mutedForeground: '240 5% 64.9%',
        pokerGreen: '142 76% 36%',
        pokerGold: '43 96% 56%',
        pokerFelt: '142 50% 18%',
        gradientPoker: 'linear-gradient(135deg, hsl(142, 76%, 36%) 0%, hsl(142, 50%, 18%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(43, 96%, 56%) 0%, hsl(43, 86%, 46%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(240, 10%, 10%) 0%, hsl(240, 10%, 3.9%) 100%)',
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
        background: '200 25% 97%',
        foreground: '210 50% 12%',
        primary: '200 85% 42%',
        primaryForeground: '0 0% 100%',
        secondary: '30 85% 52%',
        secondaryForeground: '0 0% 100%',
        accent: '0 80% 58%',
        accentForeground: '0 0% 100%',
        muted: '200 20% 90%',
        mutedForeground: '200 15% 35%',
        pokerGreen: '200 85% 42%',
        pokerGold: '30 85% 52%',
        pokerFelt: '200 55% 32%',
        gradientPoker: 'linear-gradient(135deg, hsl(200, 85%, 42%) 0%, hsl(210, 80%, 32%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(30, 85%, 52%) 0%, hsl(35, 80%, 48%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(210, 50%, 20%) 0%, hsl(210, 50%, 12%) 100%)',
      },
      dark: {
        background: '210 50% 6%',
        foreground: '200 15% 96%',
        primary: '200 85% 50%',
        primaryForeground: '210 50% 6%',
        secondary: '30 85% 58%',
        secondaryForeground: '210 50% 6%',
        accent: '0 80% 62%',
        accentForeground: '210 50% 6%',
        muted: '210 30% 16%',
        mutedForeground: '200 15% 68%',
        pokerGreen: '200 85% 50%',
        pokerGold: '30 85% 58%',
        pokerFelt: '200 55% 22%',
        gradientPoker: 'linear-gradient(135deg, hsl(200, 85%, 50%) 0%, hsl(210, 80%, 28%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(30, 85%, 58%) 0%, hsl(35, 80%, 52%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(210, 50%, 12%) 0%, hsl(210, 50%, 6%) 100%)',
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
        primary: '25 90% 50%',
        primaryForeground: '0 0% 100%',
        secondary: '0 0% 15%',
        secondaryForeground: '0 0% 98%',
        accent: '0 0% 82%',
        accentForeground: '0 0% 15%',
        muted: '0 0% 88%',
        mutedForeground: '0 0% 38%',
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
        primary: '25 90% 55%',
        primaryForeground: '0 0% 6%',
        secondary: '0 0% 92%',
        secondaryForeground: '0 0% 6%',
        accent: '0 0% 22%',
        accentForeground: '0 0% 96%',
        muted: '0 0% 16%',
        mutedForeground: '0 0% 68%',
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
        background: '210 20% 97%',
        foreground: '220 35% 12%',
        primary: '25 95% 52%',
        primaryForeground: '0 0% 100%',
        secondary: '210 80% 52%',
        secondaryForeground: '0 0% 100%',
        accent: '55 90% 58%',
        accentForeground: '220 35% 12%',
        muted: '210 18% 90%',
        mutedForeground: '220 12% 38%',
        pokerGreen: '25 95% 52%',
        pokerGold: '55 90% 58%',
        pokerFelt: '210 80% 42%',
        gradientPoker: 'linear-gradient(135deg, hsl(25, 95%, 52%) 0%, hsl(210, 80%, 42%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(55, 90%, 58%) 0%, hsl(25, 95%, 52%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(220, 35%, 22%) 0%, hsl(220, 35%, 12%) 100%)',
      },
      dark: {
        background: '220 35% 7%',
        foreground: '210 12% 96%',
        primary: '25 95% 58%',
        primaryForeground: '220 35% 7%',
        secondary: '210 80% 58%',
        secondaryForeground: '220 35% 7%',
        accent: '55 90% 62%',
        accentForeground: '220 35% 7%',
        muted: '220 22% 17%',
        mutedForeground: '220 10% 68%',
        pokerGreen: '25 95% 58%',
        pokerGold: '55 90% 62%',
        pokerFelt: '210 80% 32%',
        gradientPoker: 'linear-gradient(135deg, hsl(25, 95%, 58%) 0%, hsl(210, 80%, 32%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(55, 90%, 62%) 0%, hsl(25, 95%, 58%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(220, 35%, 14%) 0%, hsl(220, 35%, 7%) 100%)',
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
        primary: '320 80% 58%',
        primaryForeground: '0 0% 100%',
        secondary: '180 85% 52%',
        secondaryForeground: '280 32% 10%',
        accent: '280 75% 68%',
        accentForeground: '280 32% 10%',
        muted: '280 14% 91%',
        mutedForeground: '280 10% 40%',
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
        primary: '320 80% 62%',
        primaryForeground: '280 32% 6%',
        secondary: '180 85% 58%',
        secondaryForeground: '280 32% 6%',
        accent: '280 75% 72%',
        accentForeground: '280 32% 6%',
        muted: '280 22% 16%',
        mutedForeground: '280 8% 68%',
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
