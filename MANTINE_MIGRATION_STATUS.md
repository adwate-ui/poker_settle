# Mantine Migration Status

## Overview
This document tracks the progress of migrating the Poker Settle app from shadcn/ui to Mantine UI library.

## Completed Migrations (12 components - 71% complete)

### Infrastructure & Core
- ✅ **App.tsx** - Replaced Toaster/Sonner with Mantine Notifications
- ✅ **main.tsx** - Added Mantine styles imports
- ✅ **postcss.config.js** - Added postcss-preset-mantine
- ✅ **lib/notifications.ts** - Created toast helper for Mantine notifications

### Pages
- ✅ **pages/Auth.tsx** - Migrated Button, Card components
- ✅ **pages/Index.tsx** - Migrated Tabs components
- ✅ **pages/NewGame.tsx** - Migrated Card, Button, TextInput, Label
- ✅ **pages/PlayersHistory.tsx** - Migrated Card, Badge, Button, Modal (AlertDialog)

### Components
- ✅ **TabLayout.tsx** - Migrated Tabs to Mantine
- ✅ **ThemeToggle.tsx** - Migrated Button to ActionIcon
- ✅ **GameErrorBoundary.tsx** - Migrated Card components
- ✅ **UserProfile.tsx** - Migrated Avatar, DropdownMenu to Menu
- ✅ **PlayerFormDialog.tsx** - Migrated Dialog, Button, Input, Label, Select
- ✅ **BuyInHistoryDialog.tsx** - Migrated Dialog, Button, ScrollArea, Table
- ✅ **ConsolidatedBuyInLogs.tsx** - Migrated Table, Select, Badge
- ✅ **PlayerCard.tsx** - Migrated Card, Button, TextInput, Badge
- ✅ **PlayerPerformance.tsx** - Migrated Card, Badge, Collapse, Select

## Remaining Migrations (5 large files)

### High Priority Components (Remaining)

#### 1. **components/GameSetup.tsx** (479 lines)
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

#### 2. **pages/GamesHistory.tsx** (468 lines)
Current shadcn imports:
- Card, Badge, Button, Select, AlertDialog

#### 3. **pages/PlayerDetail.tsx** (456 lines)
Current shadcn imports:
- Card, Button, Collapsible, Select, Table

#### 4. **components/GameDashboard.tsx** (997 lines)
**Most complex file** - Contains many shadcn imports
Current imports:
- Button, Input, Card, Badge, Collapsible, Select, Dialog, Tabs, ScrollArea

#### 5. **components/GameDetailView.tsx** (855 lines)
Similar to GameDashboard in complexity

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
✅ Bundle size: 730.67 KB (gzip: 203.56 KB)
✅ **71% of components migrated** (12 of 17 components)

## Notes

- Mantine uses a different approach to styling - leverage their built-in props rather than Tailwind classes where possible
- Dark mode is automatically handled by MantineProvider when synced with the app's theme
- Some Mantine components require additional setup (e.g., Notifications, Modals)
- Always test responsive behavior after migration as Mantine's responsive system differs from Tailwind
