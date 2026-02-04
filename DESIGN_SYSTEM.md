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

---

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

## 📚 Resources

- **Button Component:** `src/components/ui/button.tsx`
- **Badge Component:** `src/components/ui/badge.tsx`
- **Global Styles:** `src/index.css`
- **Tailwind Config:** `tailwind.config.ts`
- **Color System:** `src/index.css` (CSS custom properties)

---

**Maintained by:** Claude Code
**Questions?** Refer to component source files or this design system doc
