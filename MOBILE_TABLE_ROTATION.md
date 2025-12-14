# Mobile Poker Table Rotation Implementation

## Overview
The poker table view has been optimized for mobile devices by rotating it 90 degrees in portrait mode. This improves the layout by better utilizing the vertical screen space and reducing whitespace.

## Implementation Details

### PokerTableView Component Changes

#### Table Rotation (Mobile)
- **Desktop (≥640px)**: Table displays in landscape orientation (no rotation)
- **Mobile (<640px)**: Table rotates 90 degrees clockwise for portrait mode
- Applied via Tailwind classes: `rotate-90 sm:rotate-0`

#### Table Scaling
- **Desktop**: Full size (`sm:scale-100`)
- **Mobile**: Scaled to 85% (`scale-[0.85]`) to fit better with rotation

#### Player Elements
- **Desktop**: No rotation (`sm:rotate-0`)
- **Mobile**: Counter-rotated -90 degrees (`-rotate-90`) to keep text and avatars upright
- This ensures player names, avatars, and information remain readable after table rotation

### Technical Implementation

```tsx
// Table container with rotation
<div className="absolute inset-0 flex items-center justify-center sm:rotate-0 rotate-90 sm:scale-100 scale-[0.85]">
  <div className="relative w-full h-full">
    {/* Table SVG */}
  </div>
</div>

// Player elements with counter-rotation
<div className="... sm:rotate-0 -rotate-90">
  {/* Player avatar, name, cards, etc. */}
</div>
```

### Breakpoints
- Mobile breakpoint: `<640px` (Tailwind's `sm:` breakpoint)
- Uses Tailwind's responsive modifiers for automatic adaptation

## Benefits

1. **Better Space Utilization**: Portrait mobile screens get more vertical space for the table
2. **Reduced Whitespace**: The table fits better in portrait orientation
3. **Improved UX**: Players can see the table more clearly on mobile devices
4. **Maintains Readability**: Player information stays upright despite table rotation

## Testing

To test the mobile rotation:
1. Open the app in a browser
2. Use browser DevTools to emulate a mobile device (width < 640px)
3. Navigate to any view with the poker table (e.g., Game Dashboard, Hand Tracking)
4. Observe the table rotated 90 degrees with upright player elements

Alternatively, test on an actual mobile device in portrait mode.

## Future Enhancements

Potential improvements for consideration:
- Fine-tune chip stack positioning for mobile view
- Adjust community card sizing for better visibility on mobile
- Optimize touch interactions for rotated table
