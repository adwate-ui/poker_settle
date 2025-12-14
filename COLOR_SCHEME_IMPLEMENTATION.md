# Color Scheme Implementation - Unified Mantine and shadcn/ui

## Overview

This document describes the comprehensive solution implemented to ensure consistent color schemes across both Mantine and shadcn/ui (Radix UI) components throughout the Poker Settle application.

## Problem Statement

The application uses two UI component libraries:
- **shadcn/ui** (built on Radix UI primitives) - Uses Tailwind CSS and CSS variables
- **Mantine UI** - Has its own color system and CSS variables

Previously, these two systems were not properly synchronized, leading to:
- Inconsistent colors between Mantine and shadcn components
- Theme changes not properly applying to all components
- Mantine components not respecting the active theme (default, One Piece, Bleach, Naruto, Dandadan)

## Solution Architecture

### 1. Extended Theme Definition

**File:** `src/config/themes.ts`

Extended the `ThemeColors` interface to include all necessary CSS variables:

```typescript
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
```

All five themes (default, One Piece, Bleach, Naruto, Dandadan) now define complete color sets for both light and dark modes.

### 2. CSS Bridge for Mantine

**File:** `src/styles/mantine-theme.css`

Created a comprehensive CSS bridge that maps Mantine's color variables to our application's CSS variables:

- **Primary colors** - Maps to app's primary color (green in default theme)
- **Gray scale** - Maps to app's muted colors for consistent neutrals
- **Component-specific overrides** - Ensures buttons, badges, cards, inputs, etc. all use theme colors
- **Dark mode support** - Automatically adjusts based on `.dark` class

Key features:
```css
:root {
  --mantine-color-primary-filled: hsl(var(--primary));
  --mantine-color-body: hsl(var(--background));
  --mantine-color-text: hsl(var(--foreground));
  /* ... many more mappings ... */
}

/* Component-specific overrides */
.mantine-Card-root {
  border-color: hsl(var(--border)) !important;
}
```

### 3. Enhanced Theme Context

**File:** `src/contexts/ThemeContext.tsx`

Updated the `applyThemeColors` function to apply all CSS variables when themes change:

```typescript
const applyThemeColors = (themeName: ThemeName) => {
  const theme = themes[themeName];
  const root = document.documentElement;
  const isDark = root.classList.contains('dark');
  const colors = isDark ? theme.colors.dark : theme.colors.light;

  // Apply all shadcn/Tailwind CSS variables
  root.style.setProperty('--background', colors.background);
  root.style.setProperty('--foreground', colors.foreground);
  // ... 30+ color variables ...
  
  // Apply Mantine-specific variables
  root.style.setProperty('--mantine-color-body', `hsl(${colors.background})`);
  root.style.setProperty('--mantine-color-text', `hsl(${colors.foreground})`);
  // ... Mantine overrides ...
};
```

### 4. Mantine Provider Configuration

**File:** `src/App.tsx`

Configured Mantine theme to sync with dark mode and use our color system:

```typescript
const mantineTheme = createTheme({
  primaryColor: 'green',
  fontFamily: 'inherit',
  defaultRadius: 'md',
  colors: {
    green: [
      'var(--mantine-color-primary-0)',
      'var(--mantine-color-primary-1)',
      // ... color scale using CSS variables ...
    ],
  },
  other: {
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    // ... pass-through variables ...
  },
});
```

Dark mode synchronization:
```typescript
const [isDark, setIsDark] = useState(
  document.documentElement.classList.contains('dark')
);

useEffect(() => {
  const observer = new MutationObserver(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  
  return () => observer.disconnect();
}, []);

<MantineProvider theme={mantineTheme} forceColorScheme={isDark ? 'dark' : 'light'}>
```

### 5. CSS Import Order

**File:** `src/main.tsx`

Ensured correct CSS loading order:

```typescript
import "./index.css";                    // 1. Base Tailwind styles
import '@mantine/core/styles.css';       // 2. Mantine base styles
import '@mantine/notifications/styles.css'; // 3. Mantine notifications
import './styles/mantine-theme.css';     // 4. Our CSS bridge (overrides)
```

## How It Works

### Theme Application Flow

1. User selects a theme (or app loads with saved theme)
2. `ThemeContext.setTheme()` is called
3. Theme colors are applied to CSS variables via `applyThemeColors()`
4. Both shadcn and Mantine components read from these CSS variables
5. Changes are instant and consistent across both systems

### Dark Mode Flow

1. User toggles dark mode (via ThemeToggle component)
2. `.dark` class is added/removed from `document.documentElement`
3. MutationObserver in both App.tsx and ThemeContext.tsx detect the change
4. `applyThemeColors()` re-applies colors using dark theme values
5. Mantine's `forceColorScheme` prop updates
6. All components update automatically

### Component Color Usage

Components can use colors in multiple ways, all of which now respect the theme:

**Mantine components:**
```tsx
<Button color="green">Primary Action</Button>  // Uses theme primary
<Text c="dimmed">Helper text</Text>            // Uses muted-foreground
<Badge color="gray">Status</Badge>             // Uses muted colors
```

**shadcn components:**
```tsx
<Button variant="default">Action</Button>      // Uses primary colors
<Card className="border-border">Content</Card> // Uses border color
```

**CSS variables:**
```tsx
<div style={{ borderColor: 'hsl(var(--border))' }}>
  Content
</div>
```

## Benefits

1. **Consistency** - All components use the same color scheme
2. **Maintainability** - Colors defined once in theme configuration
3. **Flexibility** - Easy to add new themes or modify existing ones
4. **Dark Mode** - Seamless dark mode support for all components
5. **Performance** - CSS variables enable instant theme switching without re-renders

## Testing

To verify the implementation:

1. **Light/Dark Mode Toggle**
   - Navigate to any page
   - Toggle dark mode
   - Verify all components update consistently

2. **Theme Switching**
   - Go to Profile → Theme tab
   - Switch between themes (One Piece, Bleach, Naruto, Dandadan)
   - Check that colors update across:
     - Mantine cards and badges
     - shadcn buttons and dialogs
     - Table borders and backgrounds
     - Text colors (primary, muted, dimmed)

3. **Component Consistency**
   - View pages with both Mantine and shadcn components:
     - GameDashboard (uses both)
     - PlayerDetail (heavy Mantine usage)
     - HandReplay (heavy shadcn usage)
   - Verify visual consistency

## Files Modified

- `src/config/themes.ts` - Extended theme definitions
- `src/contexts/ThemeContext.tsx` - Enhanced color application
- `src/App.tsx` - Mantine theme configuration
- `src/main.tsx` - CSS import order
- `src/styles/mantine-theme.css` - New CSS bridge file
- `src/components/GameErrorBoundary.tsx` - Use theme colors

## Future Enhancements

1. **Color Contrast Validation** - Add WCAG contrast checking
2. **Theme Preview** - Show theme preview before applying
3. **Custom Themes** - Allow users to create custom color schemes
4. **Component Showcase** - Create a page showing all themed components

## Troubleshooting

### Colors not updating

1. Check browser console for CSS errors
2. Verify CSS variables are being set in DevTools
3. Ensure `mantine-theme.css` is loaded after Mantine's base styles

### Inconsistent colors

1. Check if component is using hardcoded colors
2. Verify component is using theme-aware color props
3. Check if `!important` is needed in CSS overrides

### Dark mode not working

1. Verify `.dark` class is on `document.documentElement`
2. Check MutationObserver is running
3. Ensure `forceColorScheme` prop is updating

## Additional Notes

- The solution is built to be framework-agnostic and maintainable
- All color changes should be made in `src/config/themes.ts`
- The CSS bridge (`mantine-theme.css`) rarely needs modification
- New Mantine components automatically inherit the theme
- Performance impact is negligible (CSS variables are native)
