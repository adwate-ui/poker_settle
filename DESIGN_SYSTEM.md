# Poker Settlement App - Design System

**Last Updated:** 2026-02-04
**Version:** 1.0

---

## 📐 Button System

### Button Variants

All buttons use the standardized `Button` component from `src/components/ui/button.tsx`.

#### Standard UI Actions
- **`default`** - Primary actions (gold/primary color with shadow)
- **`destructive`** - Dangerous/delete actions (red)
- **`outline`** - Secondary actions with border
- **`secondary`** - Alternative secondary style
- **`ghost`** - Minimal hover effect
- **`link`** - Text link style

#### Premium/Luxury Actions
- **`luxury`** - High-end premium actions with gold border and luxury font
  - Use for: Premium features, special game actions
  - Style: Gold border, uppercase tracking, luxury font

#### Feedback Actions
- **`success`** - Confirmation/positive actions (emerald green)
  - Use for: Confirm, Complete, Save success states
  - Examples: "Confirm & Complete", "Save", "Next Street"

- **`warning`** - Important/cautionary actions (orange)
  - Use for: Raise, Important decisions
  - Examples: "Raise", "Override"

#### Game-Specific Actions
- **`game-fold`** - Fold action (red with border)
- **`game-check`** - Check action (poker green)
- **`game-call`** - Call action (blue)
- **`game-raise`** - Raise action (gold)

### Button Sizes

- **`default`** - h-12, standard padding (most common)
- **`sm`** - h-9, compact buttons
- **`lg`** - h-14, large prominent actions
- **`icon`** - h-12 w-12, square icon button
- **`icon-sm`** - h-8 w-8, small icon button
- **`game-action`** - h-14 full width for game buttons

### Button Usage Guidelines

```tsx
// ✅ GOOD - Using semantic variants
<Button variant="success">Confirm & Complete</Button>
<Button variant="warning">Raise</Button>
<Button variant="luxury">Premium Feature</Button>
<Button variant="ghost" size="icon-sm" aria-label="Delete">
  <Trash2 className="h-4 w-4" />
</Button>

// ❌ BAD - Custom inline styles
<Button className="bg-green-600">Confirm</Button>
<Button className="h-8 w-8">...</Button>
```

---

## 🎨 Badge System

### Badge Variants

All badges use the standardized `Badge` component from `src/components/ui/badge.tsx`.

- **`default`** - Primary badge (gold)
- **`secondary`** - Secondary badge
- **`destructive`** - Error/danger badge
- **`outline`** - Outlined badge
- **`stats`** - Statistics display (subtle background)
- **`profit`** - Profit indicator (emerald green)
- **`loss`** - Loss indicator (rose red)
- **`luxury`** - Premium badge with luxury font

### Badge Usage

```tsx
// ✅ GOOD
<Badge variant="profit">{formatProfitLoss(amount)}</Badge>
<Badge variant="stats">{gameCount} Games</Badge>

// ❌ BAD
<Badge className="bg-green-500/10 text-green-400">+₹1,000</Badge>
```

---

## 🎨 Color System

### Primary Colors (CSS Variables)

All colors use CSS custom properties from `src/index.css`:

- `--primary` - Gold accent (45° hue)
- `--foreground` - Text color
- `--background` - Background color
- `--card` - Card background
- `--border` - Border color
- `--destructive` - Error/danger color
- `--muted` - Muted text/backgrounds
- `--accent` - Accent backgrounds

### Semantic Color Classes

- `bg-primary` / `text-primary` - Primary gold
- `bg-destructive` / `text-destructive` - Errors/danger
- `bg-money-green` / `text-money-green` - Profit
- `bg-money-red` / `text-money-red` - Loss
- `bg-poker-green` - Poker table felt green
- `bg-chip-blue` - Poker chip blue

### Color Usage Guidelines

```tsx
// ✅ GOOD - Using semantic colors
<div className="bg-primary/10 border-primary/20 text-primary">...</div>
<Badge variant="profit">+₹1,000</Badge>

// ❌ BAD - Hardcoded colors
<div className="bg-green-500/10 text-green-400">...</div>
<div className="bg-amber-600">...</div>
```

### Semantic State Colors (New)

Use these semantic tokens for consistent state feedback across the app:

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| `state-success` | `--state-success` | Positive states, profits, confirmations |
| `state-error` | `--state-error` | Errors, losses, destructive actions |
| `state-warning` | `--state-warning` | Cautions, alerts, important decisions |
| `state-info` | `--state-info` | Informational, help, neutral highlights |
| `state-neutral` | `--state-neutral` | Neutral states, inactive, disabled |

```tsx
// ✅ GOOD - Using semantic state colors
<div className="bg-state-success/10 text-state-success">Profit!</div>
<div className="bg-state-error/10 text-state-error">Loss</div>
<div className="bg-state-info/10 text-state-info">Info</div>

// ❌ BAD - Hardcoded colors
<div className="bg-green-500/10 text-green-400">Profit!</div>
<div className="bg-red-500/10 text-red-400">Loss</div>
```

---

## 📱 Responsive Design

### Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `xs` | 475px | Extra small mobile |
| `sm` | 640px | Small mobile |
| `md` | 768px | **Mobile/Desktop boundary** |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1400px | Extra large |

### Responsive Hooks

```tsx
import { useIsMobile, useBreakpoint, useMinBreakpoint } from '@/hooks/useIsMobile';

// Check if mobile (<768px)
const isMobile = useIsMobile();

// Get current breakpoint name
const breakpoint = useBreakpoint(); // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

// Check if viewport >= specific breakpoint
const isDesktop = useMinBreakpoint('lg');
```

### Responsive Layout Components

```tsx
import { MobileOnly, DesktopOnly, ResponsiveStack, ResponsiveGrid, Container } 
  from '@/components/ui/responsive-layout';

// Conditional rendering
<MobileOnly>Mobile-only content</MobileOnly>
<DesktopOnly>Desktop-only content</DesktopOnly>

// Responsive layouts
<ResponsiveStack gap={4}>Column on mobile, row on desktop</ResponsiveStack>
<ResponsiveGrid mobileColumns={1} desktopColumns={3}>Grid items</ResponsiveGrid>
<Container size="lg" padded>Centered content</Container>
```

## 📏 Spacing System

Use Tailwind's standard spacing scale (multiples of 0.25rem):

- **Gaps:** `gap-1`, `gap-2`, `gap-3`, `gap-4`, `gap-6`, `gap-8`
- **Padding:** `p-2`, `p-4`, `p-6`, `p-8`, `px-4`, `py-2`
- **Margins:** `m-2`, `m-4`, `mt-4`, `mb-6`

### Common Spacing Patterns

- **Card padding:** `p-4` (mobile), `p-6` (desktop)
- **Section gaps:** `gap-4` (tight), `gap-6` (normal), `gap-8` (loose)
- **Button groups:** `gap-2` or `gap-3`
- **Form fields:** `space-y-4`

```tsx
// ✅ GOOD
<div className="flex gap-4 p-6">...</div>

// ❌ BAD
<div className="flex gap-[18px] p-[24px]">...</div>
```

---

## 📝 Typography System

### Font Families

- **`font-luxury`** - Playfair Display (headings, premium text)
- **`font-heading`** - Cinzel (major headings)
- **`font-body`** - Inter (body text)
- **`font-numbers`** - Inter with tabular numbers

### Font Size Scale

- **`text-tiny`** - 0.5625rem (9px) - micro labels
- **`text-3xs`** - 0.625rem (10px) - labels
- **`text-2xs`** - 0.6875rem (11px) - small labels
- **`text-xs`** - 0.75rem (12px) - compact text
- **`text-sm`** - 0.875rem (14px) - body text
- **`text-base`** - 1rem (16px) - default
- **`text-lg`** - 1.125rem (18px) - emphasis
- **`text-xl`** - 1.25rem (20px) - headings
- **`text-2xl`** - 1.5rem (24px) - major headings
- **`text-3xl`** - 1.875rem (30px) - hero text

### Typography Patterns

```tsx
// Luxury Heading
<h1 className="font-luxury text-2xl font-bold uppercase tracking-wider">

// Body Text
<p className="font-body text-sm text-muted-foreground">

// Numbers/Stats
<span className="font-numbers text-base">

// Labels
<label className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground">
```

---

## 🔧 Focus States

All interactive elements have enhanced focus indicators (added in Phase 2.2):

```css
*:focus-visible {
  outline: none;
  ring: 2px solid var(--primary);
  ring-offset: 2px;
}
```

Keyboard navigation shows a 2px gold ring around focused elements.

---

## ♿ Accessibility Standards

### Icon-Only Buttons

All icon-only buttons MUST have `aria-label`:

```tsx
// ✅ GOOD
<Button variant="ghost" size="icon" aria-label="Delete">
  <Trash2 className="h-4 w-4" />
</Button>

// ❌ BAD
<Button variant="ghost" size="icon">
  <Trash2 className="h-4 w-4" />
</Button>
```

### Dynamic Content

Toast notifications use `aria-live` regions (handled automatically by Radix UI / Sonner).

---

## 📱 Responsive Design

### Breakpoints

- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (md/lg)
- **Desktop:** > 1024px (xl)

### Responsive Patterns

```tsx
// Mobile-first approach
<div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
<Button className="h-12 sm:h-14 text-sm sm:text-base">
<Card className="p-4 sm:p-6">
```

---

## 🎯 Component Composition

### Card Pattern

```tsx
<Card className="glass-panel">
  <CardHeader className="pb-4">
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Form Pattern

```tsx
<div className="space-y-4">
  <div className="space-y-2">
    <Label>Field Name</Label>
    <Input type="text" />
    {error && <p className="text-destructive text-xs">{error}</p>}
    {isValid && <Check className="text-green-500" />}
  </div>
</div>
```

---

## 🚀 Best Practices

### DO ✅
- Use semantic button variants (`success`, `warning`, `luxury`)
- Use standard size variants (`sm`, `default`, `lg`, `icon`, `icon-sm`)
- Use CSS custom properties for colors
- Use Tailwind spacing scale
- Add `aria-label` to all icon-only buttons
- Use `font-luxury` for premium/heading text
- Use `font-numbers` for numerical displays

### DON'T ❌
- Don't use hardcoded colors (`bg-green-600`, `bg-orange-500`)
- Don't use arbitrary values for spacing (`gap-[18px]`, `p-[24px]`)
- Don't create custom button sizes inline (`h-13`, `h-15`)
- Don't omit `aria-label` on icon buttons
- Don't mix different units (use rem/Tailwind scale consistently)

---

## 📋 Checklist for New Components

Before committing a new component:

- [ ] Uses semantic button/badge variants (no hardcoded colors)
- [ ] Uses standard size variants (no custom h-* for buttons)
- [ ] Uses Tailwind spacing scale (no arbitrary values)
- [ ] All icon-only buttons have `aria-label`
- [ ] Uses `font-luxury` / `font-numbers` appropriately
- [ ] Responsive on mobile (320px - 640px)
- [ ] Focus states are visible
- [ ] Colors use CSS custom properties

---

## 🔄 Migration from Old Patterns

### Buttons

```tsx
// OLD ❌
<Button className="bg-green-600">Confirm</Button>
<Button className="bg-orange-600">Raise</Button>
<Button className="h-8 w-8"><Icon /></Button>

// NEW ✅
<Button variant="success">Confirm</Button>
<Button variant="warning">Raise</Button>
<Button size="icon-sm" aria-label="Action"><Icon /></Button>
```

### Colors

```tsx
// OLD ❌
<div className="bg-green-500/10 text-green-400">Profit</div>

// NEW ✅
<Badge variant="profit">Profit</Badge>
// OR
<div className="bg-money-green/10 text-money-green">Profit</div>
```

---

## � Element Standards (Mobile vs Desktop)

### Core Sizing

| Element | Mobile (<768px) | Desktop (≥768px) | Notes |
|---------|-----------------|------------------|-------|
| Button height | `h-12` (48px) | `h-10` (40px) | Touch-friendly on mobile |
| Input height | `h-12` (48px) | `h-10` (40px) | 44px min for accessibility |
| Icon button | `h-12 w-12` | `h-10 w-10` | Use `icon` / `icon-sm` sizes |
| Touch target | 44×44px min | 32×32px min | Critical for mobile UX |
| Card padding | `p-4` | `p-6` | Less padding on mobile |
| Section gap | `gap-4` | `gap-6` | Tighter on mobile |

### Layout Patterns

```tsx
// ✅ Page Container - Responsive padding
<div className="px-4 md:px-6 lg:px-8">

// ✅ Section Spacing - Tighter on mobile
<div className="space-y-4 md:space-y-6">

// ✅ Grid - Stack on mobile, multi-column on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ✅ Card Layout - Full width mobile, side-by-side desktop
<div className="flex flex-col md:flex-row gap-4">
```

### Dialog/Modal Standards

| Property | Mobile | Desktop |
|----------|--------|---------|
| Width | `w-[95vw]` | `max-w-lg` (512px) |
| Position | Centered (or bottom sheet) | Centered |
| Max height | `max-h-[85vh]` | `max-h-[85vh]` |
| Header | Center-aligned | Left-aligned |
| Footer | Column layout | Row layout |

```tsx
// Footer pattern - reverses on desktop
<DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
  <Button variant="outline">Cancel</Button>
  <Button>Confirm</Button>
</DialogFooter>
```

### Form Patterns

| Aspect | Mobile | Desktop |
|--------|--------|---------|
| Field layout | Single column | Two columns possible |
| Label position | Above input | Above input |
| Button width | Full width | Auto/fixed width |
| Error messages | Below input | Below input |

```tsx
// ✅ Form Field - Full width button on mobile
<div className="space-y-4">
  <div className="space-y-2">
    <Label>Field Name</Label>
    <Input placeholder="Enter value" />
  </div>
  <Button className="w-full md:w-auto">Submit</Button>
</div>

// ✅ Two-column form on desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div><Label>First Name</Label><Input /></div>
  <div><Label>Last Name</Label><Input /></div>
</div>
```

### Navigation Patterns

| Pattern | Mobile | Desktop |
|---------|--------|---------|
| Primary nav | Bottom tabs / Hamburger | Sidebar / Top nav |
| Section nav | Swipeable tabs | Horizontal tabs |
| Actions | FAB / Bottom sheet | Inline buttons |
| Filters | Full-screen drawer | Sidebar / Popover |

```tsx
// ✅ Tab layout - Scrollable on mobile
<TabsList className="w-full overflow-x-auto md:overflow-visible">
  <TabsTrigger>Tab 1</TabsTrigger>
  <TabsTrigger>Tab 2</TabsTrigger>
  <TabsTrigger>Tab 3</TabsTrigger>
</TabsList>
```

### Table/Data Display

| Pattern | Mobile | Desktop |
|---------|--------|---------|
| Tables | Card list / Accordion | Standard table |
| Data grids | Stack vertically | Grid layout |
| Pagination | Infinite scroll | Page numbers |
| Actions | Swipe or long-press | Inline/row actions |

```tsx
// ✅ Responsive table approach
<MobileOnly>
  <div className="space-y-2">
    {items.map(item => <ItemCard key={item.id} item={item} />)}
  </div>
</MobileOnly>
<DesktopOnly>
  <Table>
    <TableHeader>...</TableHeader>
    <TableBody>...</TableBody>
  </Table>
</DesktopOnly>
```

### Typography Scaling

| Element | Mobile | Desktop |
|---------|--------|---------|
| Page title | `text-2xl` | `text-3xl md:text-4xl` |
| Section title | `text-xl` | `text-2xl` |
| Body text | `text-sm` | `text-sm` or `text-base` |
| Labels | `text-xs` | `text-xs` or `text-sm` |

```tsx
// ✅ Responsive heading
<h1 className="text-2xl md:text-4xl font-luxury">Page Title</h1>
<h2 className="text-lg md:text-2xl font-medium">Section</h2>
```

### Touch & Interaction

**Mobile-First Considerations:**
- Minimum 44×44px touch targets (WCAG 2.5.5)
- Adequate spacing between interactive elements (`gap-2` minimum)
- Swipe gestures for common actions (delete, archive)
- Bottom-positioned primary actions (thumb zone)
- Avoid hover-dependent interactions

```tsx
// ✅ Touch-friendly icon button
<Button size="icon" className="h-12 w-12 md:h-10 md:w-10">
  <Icon className="h-5 w-5" />
</Button>

// ✅ Action row with adequate spacing
<div className="flex gap-3">
  <Button size="icon">...</Button>
  <Button size="icon">...</Button>
</div>
```

---

## �📚 Resources

- **Button Component:** `src/components/ui/button.tsx`
- **Badge Component:** `src/components/ui/badge.tsx`
- **Global Styles:** `src/index.css`
- **Tailwind Config:** `tailwind.config.ts`
- **Color System:** `src/index.css` (CSS custom properties)

---

**Maintained by:** Claude Code
**Questions?** Refer to component source files or this design system doc
