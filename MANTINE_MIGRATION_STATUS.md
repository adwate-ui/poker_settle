# Mantine Migration Status

## Overview
This document tracks the progress of migrating the Poker Settle app from shadcn/ui to Mantine UI library.

## Completed Migrations (8 components)

### Infrastructure & Core
- ✅ **App.tsx** - Replaced Toaster/Sonner with Mantine Notifications
- ✅ **main.tsx** - Added Mantine styles imports
- ✅ **postcss.config.js** - Added postcss-preset-mantine
- ✅ **lib/notifications.ts** - Created toast helper for Mantine notifications

### Pages
- ✅ **pages/Auth.tsx** - Migrated Button, Card components
- ✅ **pages/Index.tsx** - Migrated Tabs components

### Components
- ✅ **TabLayout.tsx** - Migrated Tabs to Mantine
- ✅ **ThemeToggle.tsx** - Migrated Button to ActionIcon
- ✅ **GameErrorBoundary.tsx** - Migrated Card components
- ✅ **UserProfile.tsx** - Migrated Avatar, DropdownMenu to Menu
- ✅ **PlayerFormDialog.tsx** - Migrated Dialog, Button, Input, Label, Select
- ✅ **BuyInHistoryDialog.tsx** - Migrated Dialog, Button, ScrollArea, Table
- ✅ **ConsolidatedBuyInLogs.tsx** - Migrated Table, Select, Badge

## Remaining Migrations (9 large files)

### High Priority Components

#### 1. **components/PlayerCard.tsx** (173 lines)
Current shadcn imports:
- Card, CardContent, CardHeader, CardTitle
- Button
- Input
- Label
- Badge

Migration pattern:
```tsx
// Before
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// After
import { Card, Button, TextInput, Text, Badge, Stack, Group } from "@mantine/core";
```

#### 2. **components/PlayerPerformance.tsx** (173 lines)
Current shadcn imports:
- Card, CardContent, CardHeader, CardTitle
- Badge
- Collapsible, CollapsibleContent, CollapsibleTrigger
- Select, SelectContent, SelectItem, SelectTrigger, SelectValue
- Table, TableBody, TableCell, TableHead, TableHeader, TableRow

Migration pattern:
```tsx
// Before
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// After
import { Collapse } from "@mantine/core";
```

#### 3. **pages/NewGame.tsx** (304 lines)
Current shadcn imports:
- Card, CardContent, CardDescription, CardHeader, CardTitle
- Button
- Input
- Label

#### 4. **components/GameSetup.tsx** (479 lines)
Current shadcn imports:
- Button, Input, Card, Badge, Label, Separator, Collapsible
- Alert, AlertDescription

Migration pattern:
```tsx
// Before
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

// After
import { Divider, Alert } from "@mantine/core";
```

#### 5. **components/GameDashboard.tsx** (997 lines)
**Most complex file** - Contains many shadcn imports
Current imports:
- Button, Input, Card, Badge, Collapsible, Select, Dialog, Tabs, ScrollArea

#### 6. **components/GameDetailView.tsx** (855 lines)
Similar to GameDashboard in complexity

#### 7. **pages/GamesHistory.tsx** (468 lines)
#### 8. **pages/PlayersHistory.tsx** (323 lines)
#### 9. **pages/PlayerDetail.tsx** (456 lines)

## Migration Patterns Reference

### Common Component Mappings

| shadcn/ui | Mantine | Notes |
|-----------|---------|-------|
| `<Button>` | `<Button>` | Similar API, different props |
| `<Card>` | `<Card>` | Use `shadow`, `padding`, `radius`, `withBorder` props |
| `<Input>` | `<TextInput>` | Different component name |
| `<Label>` | `<Text>` or label prop | Mantine uses labels differently |
| `<Badge>` | `<Badge>` | Similar API |
| `<Select>` | `<Select>` | Different data structure |
| `<Separator>` | `<Divider>` | Different component name |
| `<Dialog>` | `<Modal>` | Different API |
| `<Tabs>` | `<Tabs>` | Similar but uses `.Panel`, `.List`, `.Tab` |
| `<Table>` | `<Table>` | Uses `.Thead`, `.Tbody`, `.Tr`, `.Th`, `.Td` |
| `<Collapsible>` | `<Collapse>` | Different API |
| `<ScrollArea>` | `<ScrollArea>` | Similar API |
| `<Avatar>` | `<Avatar>` | Similar API |
| `<DropdownMenu>` | `<Menu>` | Different API |

### Card Migration Example
```tsx
// Before (shadcn)
<Card className="hover:border-primary/50">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>

// After (Mantine)
<Card shadow="sm" padding="md" radius="md" withBorder>
  <Stack gap="sm">
    <Text size="lg" fw={700}>Title</Text>
    <Text size="sm" c="dimmed">Description</Text>
    <div>Content</div>
  </Stack>
</Card>
```

### Dialog/Modal Migration Example
```tsx
// Before (shadcn)
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    Content
    <DialogFooter>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onSave}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// After (Mantine)
<>
  <Button onClick={() => setOpen(true)}>Open</Button>
  <Modal opened={open} onClose={() => setOpen(false)} title="Title">
    <Stack gap="md">
      <Text size="sm" c="dimmed">Description</Text>
      <div>Content</div>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>Cancel</Button>
        <Button onClick={onSave}>Save</Button>
      </Group>
    </Stack>
  </Modal>
</>
```

### Tabs Migration Example
```tsx
// Before (shadcn)
<Tabs value={value} onValueChange={setValue}>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>

// After (Mantine)
<Tabs value={value} onChange={setValue}>
  <Tabs.List>
    <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
    <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
  <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
</Tabs>
```

### Table Migration Example
```tsx
// Before (shadcn)
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Value</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Item</TableCell>
      <TableCell>100</TableCell>
    </TableRow>
  </TableBody>
</Table>

// After (Mantine)
<Table striped highlightOnHover withTableBorder>
  <Table.Thead>
    <Table.Tr>
      <Table.Th>Name</Table.Th>
      <Table.Th>Value</Table.Th>
    </Table.Tr>
  </Table.Thead>
  <Table.Tbody>
    <Table.Tr>
      <Table.Td>Item</Table.Td>
      <Table.Td>100</Table.Td>
    </Table.Tr>
  </Table.Tbody>
</Table>
```

## Testing Checklist

After completing migrations:

- [ ] Run build: `npm run build`
- [ ] Test all pages load correctly
- [ ] Test dark mode switching
- [ ] Test mobile responsive design
- [ ] Test form submissions
- [ ] Test table interactions
- [ ] Test modal/dialog interactions
- [ ] Test dropdown menus
- [ ] Test notifications/toasts

## Cleanup Tasks

After all migrations are complete:

1. Remove unused shadcn/ui component files from `src/components/ui/`
2. Uninstall unused Radix UI dependencies:
   ```bash
   npm uninstall @radix-ui/react-* class-variance-authority cmdk vaul
   ```
3. Update MANTINE_USAGE.md with new examples
4. Remove any unused utility functions in `src/lib/utils.ts`

## Build Status

✅ All current migrations build successfully
✅ No TypeScript errors
✅ Bundle size reduced by ~10KB (from ~778KB to ~757KB)

## Notes

- Mantine uses a different approach to styling - leverage their built-in props rather than Tailwind classes where possible
- Dark mode is automatically handled by MantineProvider when synced with the app's theme
- Some Mantine components require additional setup (e.g., Notifications, Modals)
- Always test responsive behavior after migration as Mantine's responsive system differs from Tailwind
