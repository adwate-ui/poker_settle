# Mantine UI Components Usage Guide

## Overview
Mantine UI is configured and available throughout the application. It integrates seamlessly with the existing theming system and supports both light and dark modes.

## Setup

### Provider Configuration
Mantine is properly configured in `src/App.tsx`:

```tsx
import { MantineProvider, createTheme } from '@mantine/core';

const mantineTheme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'inherit',
  defaultRadius: 'md',
});

// In App component
<MantineProvider theme={mantineTheme} forceColorScheme={isDark ? 'dark' : 'light'}>
  {children}
</MantineProvider>
```

### Dark Mode Synchronization
The Mantine provider automatically syncs with the app's dark mode:
- Uses a MutationObserver to watch for class changes on `document.documentElement`
- Automatically switches between 'light' and 'dark' color schemes
- Works seamlessly with the existing ThemeProvider

## Available Components

Mantine provides a comprehensive set of UI components. Here are the most commonly used:

### Layout Components
- `Stack` - Vertical layout
- `Group` - Horizontal layout
- `Grid` - Grid layout
- `Container` - Responsive container

### Data Display
- `Table` - Fully featured table component
- `Card` - Card container
- `Badge` - Status badges
- `Text` - Typography component

### Form Components
- `Button` - Button with variants
- `NumberInput` - Numeric input
- `Select` - Dropdown select
- `TextInput` - Text input
- `Checkbox` - Checkbox input

### Overlays
- `Modal` - Modal dialog
- `Drawer` - Side drawer
- `Tooltip` - Tooltip overlay

## Usage Examples

### Basic Button
```tsx
import { Button } from '@mantine/core';

<Button variant="filled" color="blue" size="md">
  Click me
</Button>
```

### Table with Styling
```tsx
import { Table, Text } from '@mantine/core';

<Table striped highlightOnHover withTableBorder>
  <Table.Thead>
    <Table.Tr>
      <Table.Th>Name</Table.Th>
      <Table.Th>Value</Table.Th>
    </Table.Tr>
  </Table.Thead>
  <Table.Tbody>
    <Table.Tr>
      <Table.Td><Text fw={600}>Item</Text></Table.Td>
      <Table.Td>100</Table.Td>
    </Table.Tr>
  </Table.Tbody>
</Table>
```

### Card with Stack Layout
```tsx
import { Card, Stack, Text, Badge } from '@mantine/core';

<Card shadow="sm" padding="md" radius="md" withBorder>
  <Stack gap="sm">
    <Text fw={700} size="lg">Title</Text>
    <Badge color="green">Status</Badge>
    <Text size="sm">Description here</Text>
  </Stack>
</Card>
```

### Modal Dialog
```tsx
import { Modal, Button } from '@mantine/core';
import { useState } from 'react';

const [opened, setOpened] = useState(false);

<Modal opened={opened} onClose={() => setOpened(false)} title="Dialog">
  Content here
</Modal>
```

## Existing Mantine Components

The following components already use Mantine:

1. **PlayerCardMantine** (`src/components/PlayerCardMantine.tsx`)
   - Displays player information with buy-ins and P&L
   - Uses: Card, Stack, Group, Text, Badge

2. **BuyInManagementTable** (`src/components/BuyInManagementTable.tsx`)
   - Manages player buy-ins
   - Uses: Table, Button, Modal, NumberInput, Select, Group, Text, Stack

3. **FinalStackManagement** (`src/components/FinalStackManagement.tsx`)
   - Manages final stack entry and calculations
   - Uses: Table, Collapse, Button, NumberInput, Group, Text, ActionIcon, Stack

## Color System Integration

As of the latest update, Mantine components are fully integrated with the app's theme system:

- **Unified Colors**: Mantine now uses the same color variables as shadcn/ui components
- **Theme Sync**: All five themes (default, One Piece, Bleach, Naruto, Dandadan) apply to Mantine components
- **Dark Mode**: Seamless dark mode support that syncs automatically
- **CSS Bridge**: A CSS bridge file (`src/styles/mantine-theme.css`) maps Mantine's color system to our app's CSS variables

See `COLOR_SCHEME_IMPLEMENTATION.md` for full details.

## Best Practices

### 1. Component Choice
- Use Mantine for data-heavy components (tables, forms)
- Use Mantine for consistent styling across similar components
- Can be used alongside existing shadcn/ui components

### 2. Styling
- Use Mantine's built-in props for styling (e.g., `fw`, `size`, `color`)
- Use semantic color names (`c="dimmed"`, `color="green"`) which automatically use theme colors
- Styles automatically adapt to light/dark mode and theme changes
- Avoid hardcoded colors; use theme-aware props instead

### 3. Responsive Design
- Mantine components are responsive by default
- Use responsive props where available
- Combine with Tailwind classes if needed

### 4. Theming
- The app uses a custom theme via CSS variables
- Mantine respects the color scheme (light/dark)
- Primary color is set to 'blue' but can be customized

## Resources

- [Mantine Documentation](https://mantine.dev/)
- [Component Library](https://mantine.dev/core/button/)
- [Theming Guide](https://mantine.dev/theming/theme-object/)
- [Dark Mode](https://mantine.dev/theming/dark-theme/)

## Migration Notes

When converting from shadcn/ui to Mantine:
- Map component APIs (some props differ)
- Test dark mode appearance
- Verify responsive behavior
- Check for any custom styling conflicts

## Import Statement
```tsx
import { Component1, Component2, ... } from '@mantine/core';
```

All Mantine core components are imported from `@mantine/core`.
