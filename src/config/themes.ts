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
        background: '200 30% 96%',
        foreground: '210 40% 15%',
        primary: '200 90% 45%',
        primaryForeground: '0 0% 100%',
        secondary: '30 90% 55%',
        secondaryForeground: '0 0% 100%',
        accent: '0 85% 60%',
        accentForeground: '0 0% 100%',
        muted: '200 15% 92%',
        mutedForeground: '200 10% 40%',
        pokerGreen: '200 90% 45%',
        pokerGold: '30 90% 55%',
        pokerFelt: '200 60% 35%',
        gradientPoker: 'linear-gradient(135deg, hsl(200, 90%, 45%) 0%, hsl(210, 85%, 35%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(30, 90%, 55%) 0%, hsl(35, 85%, 50%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(210, 40%, 25%) 0%, hsl(210, 40%, 15%) 100%)',
      },
      dark: {
        background: '210 40% 8%',
        foreground: '200 20% 95%',
        primary: '200 90% 50%',
        primaryForeground: '0 0% 100%',
        secondary: '30 90% 60%',
        secondaryForeground: '0 0% 100%',
        accent: '0 85% 65%',
        accentForeground: '0 0% 100%',
        muted: '210 25% 18%',
        mutedForeground: '200 15% 65%',
        pokerGreen: '200 90% 50%',
        pokerGold: '30 90% 60%',
        pokerFelt: '200 60% 25%',
        gradientPoker: 'linear-gradient(135deg, hsl(200, 90%, 50%) 0%, hsl(210, 85%, 30%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(30, 90%, 60%) 0%, hsl(35, 85%, 55%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(210, 40%, 15%) 0%, hsl(210, 40%, 8%) 100%)',
      },
    },
    characters: ['OnePiece01', 'OnePiece02', 'OnePiece03', 'OnePiece04', 'OnePiece05', 'OnePiece06', 'OnePiece07', 'OnePiece08', 'OnePiece09', 'OnePiece10', 'OnePiece11', 'OnePiece12', 'OnePiece13', 'OnePiece14', 'OnePiece15', 'OnePiece16', 'OnePiece17', 'OnePiece18', 'OnePiece19', 'OnePiece20', 'OnePiece21', 'OnePiece22', 'OnePiece23', 'OnePiece24', 'OnePiece25'],
  },
  
  bleach: {
    name: 'bleach',
    displayName: 'Bleach',
    description: 'Soul Society style with stark contrasts and spiritual energy',
    colors: {
      light: {
        background: '0 0% 98%',
        foreground: '0 0% 5%',
        primary: '25 95% 53%',
        primaryForeground: '0 0% 100%',
        secondary: '0 0% 10%',
        secondaryForeground: '0 0% 98%',
        accent: '0 0% 85%',
        accentForeground: '0 0% 10%',
        muted: '0 0% 90%',
        mutedForeground: '0 0% 40%',
        pokerGreen: '25 95% 53%',
        pokerGold: '45 100% 60%',
        pokerFelt: '0 0% 15%',
        gradientPoker: 'linear-gradient(135deg, hsl(25, 95%, 53%) 0%, hsl(0, 0%, 10%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(45, 100%, 60%) 0%, hsl(25, 95%, 53%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(0, 0%, 20%) 0%, hsl(0, 0%, 5%) 100%)',
      },
      dark: {
        background: '0 0% 5%',
        foreground: '0 0% 98%',
        primary: '25 95% 58%',
        primaryForeground: '0 0% 5%',
        secondary: '0 0% 95%',
        secondaryForeground: '0 0% 5%',
        accent: '0 0% 20%',
        accentForeground: '0 0% 98%',
        muted: '0 0% 15%',
        mutedForeground: '0 0% 65%',
        pokerGreen: '25 95% 58%',
        pokerGold: '45 100% 65%',
        pokerFelt: '0 0% 12%',
        gradientPoker: 'linear-gradient(135deg, hsl(25, 95%, 58%) 0%, hsl(0, 0%, 15%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(45, 100%, 65%) 0%, hsl(25, 95%, 58%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(0, 0%, 12%) 0%, hsl(0, 0%, 5%) 100%)',
      },
    },
    characters: ['Bleach01', 'Bleach02', 'Bleach03', 'Bleach04', 'Bleach05', 'Bleach06', 'Bleach07', 'Bleach08', 'Bleach09', 'Bleach10', 'Bleach11', 'Bleach12', 'Bleach13', 'Bleach14', 'Bleach15', 'Bleach16', 'Bleach17', 'Bleach18', 'Bleach19', 'Bleach20', 'Bleach21', 'Bleach22', 'Bleach23', 'Bleach24', 'Bleach25'],
  },
  
  naruto: {
    name: 'naruto',
    displayName: 'Naruto',
    description: 'Hidden Leaf ninja with energetic orange and blue tones',
    colors: {
      light: {
        background: '210 25% 97%',
        foreground: '220 30% 15%',
        primary: '25 100% 55%',
        primaryForeground: '0 0% 100%',
        secondary: '210 85% 55%',
        secondaryForeground: '0 0% 100%',
        accent: '55 95% 60%',
        accentForeground: '220 30% 15%',
        muted: '210 20% 92%',
        mutedForeground: '220 15% 40%',
        pokerGreen: '25 100% 55%',
        pokerGold: '55 95% 60%',
        pokerFelt: '210 85% 45%',
        gradientPoker: 'linear-gradient(135deg, hsl(25, 100%, 55%) 0%, hsl(210, 85%, 45%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(55, 95%, 60%) 0%, hsl(25, 100%, 55%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(220, 30%, 25%) 0%, hsl(220, 30%, 15%) 100%)',
      },
      dark: {
        background: '220 30% 8%',
        foreground: '210 15% 95%',
        primary: '25 100% 60%',
        primaryForeground: '0 0% 100%',
        secondary: '210 85% 60%',
        secondaryForeground: '0 0% 100%',
        accent: '55 95% 65%',
        accentForeground: '220 30% 8%',
        muted: '220 20% 18%',
        mutedForeground: '220 10% 65%',
        pokerGreen: '25 100% 60%',
        pokerGold: '55 95% 65%',
        pokerFelt: '210 85% 35%',
        gradientPoker: 'linear-gradient(135deg, hsl(25, 100%, 60%) 0%, hsl(210, 85%, 35%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(55, 95%, 65%) 0%, hsl(25, 100%, 60%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(220, 30%, 15%) 0%, hsl(220, 30%, 8%) 100%)',
      },
    },
    characters: ['Naruto01', 'Naruto02', 'Naruto03', 'Naruto04', 'Naruto05', 'Naruto06', 'Naruto07', 'Naruto08', 'Naruto09', 'Naruto10', 'Naruto11', 'Naruto12', 'Naruto13', 'Naruto14', 'Naruto15', 'Naruto16', 'Naruto17', 'Naruto18', 'Naruto19', 'Naruto20', 'Naruto21', 'Naruto22', 'Naruto23', 'Naruto24', 'Naruto25'],
  },
  
  dandadan: {
    name: 'dandadan',
    displayName: 'Dandadan',
    description: 'Supernatural retro vibes with vibrant pink and cyan',
    colors: {
      light: {
        background: '280 20% 97%',
        foreground: '280 30% 12%',
        primary: '320 85% 60%',
        primaryForeground: '0 0% 100%',
        secondary: '180 90% 55%',
        secondaryForeground: '280 30% 12%',
        accent: '280 80% 70%',
        accentForeground: '280 30% 12%',
        muted: '280 15% 93%',
        mutedForeground: '280 10% 42%',
        pokerGreen: '320 85% 60%',
        pokerGold: '280 80% 70%',
        pokerFelt: '180 90% 45%',
        gradientPoker: 'linear-gradient(135deg, hsl(320, 85%, 60%) 0%, hsl(280, 80%, 60%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(280, 80%, 70%) 0%, hsl(180, 90%, 55%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(280, 30%, 22%) 0%, hsl(280, 30%, 12%) 100%)',
      },
      dark: {
        background: '280 30% 7%',
        foreground: '280 10% 96%',
        primary: '320 85% 65%',
        primaryForeground: '0 0% 100%',
        secondary: '180 90% 60%',
        secondaryForeground: '280 30% 7%',
        accent: '280 80% 75%',
        accentForeground: '280 30% 7%',
        muted: '280 20% 17%',
        mutedForeground: '280 8% 66%',
        pokerGreen: '320 85% 65%',
        pokerGold: '280 80% 75%',
        pokerFelt: '180 90% 40%',
        gradientPoker: 'linear-gradient(135deg, hsl(320, 85%, 65%) 0%, hsl(280, 80%, 65%) 100%)',
        gradientGold: 'linear-gradient(135deg, hsl(280, 80%, 75%) 0%, hsl(180, 90%, 60%) 100%)',
        gradientDark: 'linear-gradient(180deg, hsl(280, 30%, 14%) 0%, hsl(280, 30%, 7%) 100%)',
      },
    },
    characters: ['Dandadan01', 'Dandadan02', 'Dandadan03', 'Dandadan04', 'Dandadan05', 'Dandadan06', 'Dandadan07', 'Dandadan08', 'Dandadan09', 'Dandadan10', 'Dandadan11', 'Dandadan12', 'Dandadan13', 'Dandadan14', 'Dandadan15', 'Dandadan16', 'Dandadan17', 'Dandadan18', 'Dandadan19', 'Dandadan20', 'Dandadan21', 'Dandadan22', 'Dandadan23', 'Dandadan24', 'Dandadan25'],
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
