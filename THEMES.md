# Theme System Documentation

## Overview

The Poker Settle app features an anime-based theme system that allows users to customize both the color scheme and player avatars based on popular anime series.

## Available Themes

### 1. Default Theme
- **Description**: Classic poker theme with green felt and gold accents
- **Characters**: Uses Dicebear avatars (no anime characters)
- **Colors**: Traditional poker green and gold

### 2. One Piece Theme
- **Description**: Adventure on the Grand Line with vibrant ocean colors
- **Characters**: 25 One Piece characters including:
  - Luffy, Zoro, Nami, Sanji, Usopp, Chopper, Robin, Franky, Brook
  - Ace, Sabo, Law, Shanks, Mihawk, Crocodile, Doflamingo, Katakuri
  - Whitebeard, Kaido, Big Mom, Blackbeard, Boa Hancock, Jinbei, Yamato, Buggy
- **Colors**: Ocean blues and vibrant oranges

### 3. Bleach Theme
- **Description**: Soul Society style with stark contrasts and spiritual energy
- **Characters**: 25 Bleach characters including:
  - Ichigo, Rukia, Renji, Byakuya, Toshiro, Kenpachi, Yoruichi, Urahara
  - Ulquiorra, Grimmjow, Aizen, Gin, Rangiku, Orihime, Chad, Uryu
  - Shinji, Shunsui, Jushiro, Yamamoto, Mayuri, Nelliel, Stark, Barragan, Halibel
- **Colors**: Black, white, and orange spiritual energy

### 4. Naruto Theme
- **Description**: Hidden Leaf ninja with energetic orange and blue tones
- **Characters**: 25 Naruto characters including:
  - Naruto, Sasuke, Sakura, Kakashi, Hinata, Shikamaru, Gaara, Rock Lee
  - Neji, Itachi, Jiraiya, Tsunade, Orochimaru, Minato, Obito, Madara
  - Pain, Konan, Killer B, Might Guy, Asuma, Kiba, Shino, Ino, Temari
- **Colors**: Orange and blue ninja tones

### 5. Dandadan Theme
- **Description**: Supernatural retro vibes with vibrant pink and cyan
- **Characters**: 25 Dandadan characters including:
  - Momo, Okarun, Turbo Granny, Aira, Jiji, Seiko, Acrobatic Silky
  - Flatwoods Monster, Serpo, Nessie, Dover Demon, Kinta, Vamola
  - Evil Eye, Count Saint-Germain, Mantis Shrimp, and more
- **Colors**: Vibrant pink and cyan supernatural tones

## How It Works

### Character Assignment

Characters are assigned to players using a hash-based algorithm that ensures:
1. **Consistency**: Each player always gets the same character for a given theme
2. **No Repetition**: Different players get different characters (up to 25 players per theme)
3. **Automatic Assignment**: Characters are automatically assigned when a theme is selected

The assignment algorithm:
```typescript
// From src/config/themes.ts
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
```

### Theme Switching

Users can switch themes from the Profile page:
1. Navigate to Profile → Theme tab
2. Select a theme from the available options
3. The color scheme and all player avatars update immediately
4. The theme preference is saved to the user's profile

### Color Customization

Each theme defines colors for both light and dark modes:
- Background and foreground colors
- Primary, secondary, and accent colors
- Poker-specific colors (felt, chips, etc.)
- Gradient definitions

Colors are applied via CSS custom properties and automatically switch based on the light/dark mode preference.

## Implementation Details

### File Structure

```
src/
├── config/
│   ├── themes.ts              # Theme definitions and character lists
│   └── characterImages.ts     # Character image imports and mappings
├── assets/
│   └── characters/
│       ├── one_piece/         # 25 One Piece character images
│       ├── bleach/            # 25 Bleach character images
│       ├── naruto/            # 25 Naruto character images
│       └── dandadan/          # 25 Dandadan character images
├── contexts/
│   └── ThemeContext.tsx       # Theme state management
└── components/
    ├── OptimizedAvatar.tsx    # Avatar component with theme support
    └── ThemeToggle.tsx        # Light/dark mode toggle
```

### Adding New Players

When a new player is added:
1. They are automatically assigned a character from the current theme
2. The character assignment is deterministic based on their name
3. No manual character selection is required

### Adding a New Theme

To add a new theme:

1. Add character images to `src/assets/characters/new_theme/`
2. Update `src/config/themes.ts`:
   ```typescript
   export type ThemeName = 'default' | 'one_piece' | 'bleach' | 'naruto' | 'dandadan' | 'new_theme';
   
   export const themes: Record<ThemeName, Theme> = {
     // ... existing themes
     new_theme: {
       name: 'new_theme',
       displayName: 'New Theme',
       description: 'Description of the new theme',
       colors: {
         light: { /* light mode colors */ },
         dark: { /* dark mode colors */ }
       },
       characters: ['Character1', 'Character2', /* ... */]
     }
   };
   ```

3. Update `src/config/characterImages.ts`:
   ```typescript
   import char1 from '@/assets/characters/new_theme/character_01.png';
   // ... import all characters
   
   export const characterImages: Record<string, string> = {
     // ... existing mappings
     'Character1': char1,
     // ... add all character mappings
   };
   ```

4. Update database schema if needed (theme column in profiles table)

## Technical Notes

- Character images are bundled with the application
- Images are lazy-loaded for performance
- Fallback to initials if image fails to load
- Theme changes persist across sessions via database storage
- Color transitions are smooth via CSS transitions

## Future Enhancements

Potential improvements:
- Allow users to select specific characters for their players
- Add more anime themes
- Support custom user-uploaded character images
- Theme preview before applying
- Per-game theme overrides
