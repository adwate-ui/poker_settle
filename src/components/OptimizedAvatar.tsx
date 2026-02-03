import { memo, useMemo } from 'react';
import { characterImages } from '@/config/characterImages';
import { cn } from '@/lib/utils';

interface OptimizedAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  allPlayerNames?: string[]; // Kept for interface compatibility
}

const LUXURY_PALETTE = [
  'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', // Obsidian
  'linear-gradient(135deg, #2C0B0E 0%, #1A0505 100%)', // Deep Burgundy
  'linear-gradient(135deg, #0D261A 0%, #05120B 100%)', // Racing Green
  'linear-gradient(135deg, #0F172A 0%, #020617 100%)', // Royal Navy
  'linear-gradient(135deg, #2E1065 0%, #160635 100%)', // Royal Purple
  'linear-gradient(135deg, #422006 0%, #1F0F02 100%)', // Leather
];

const OptimizedAvatar = memo(({ name, size = 'md', className = '' }: OptimizedAvatarProps) => {
  // 1. Check for specific character artwork first
  const characterImage = useMemo(() => {
    // Exact match
    if (characterImages[name]) return characterImages[name];

    // Case insensitive match
    const lowerName = name.toLowerCase();
    const key = Object.keys(characterImages).find(k => k.toLowerCase() === lowerName);
    return key ? characterImages[key] : null;
  }, [name]);

  // 2. Generate deterministic luxury background if no image
  const backgroundStyle = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % LUXURY_PALETTE.length;
    return LUXURY_PALETTE[index];
  }, [name]);

  // 3. Size mapping
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-9 h-9 sm:w-10 sm:h-10 text-xs',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-24 h-24 text-3xl',
  };

  const initials = useMemo(() => {
    return name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [name]);

  const containerClasses = cn(
    "relative rounded-full flex items-center justify-center overflow-hidden shadow-xl ring-2 ring-white/10 select-none",
    sizeClasses[size],
    className
  );

  // Render Image (Tier 1)
  if (characterImage) {
    return (
      <div className={containerClasses}>
        <img
          src={characterImage}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          loading="lazy"
        />
        {/* Subtle inner shadow for depth */}
        <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] rounded-full pointer-events-none" />
      </div>
    );
  }

  // Render Luxury Monogram (Tier 2)
  return (
    <div
      className={containerClasses}
      style={{ background: backgroundStyle }}
    >
      {/* Texture Overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Gold Initials */}
      <span className="font-luxury font-bold bg-gradient-to-br from-gold-200 via-gold-400 to-gold-600 bg-clip-text text-transparent drop-shadow-sm z-10 transform translate-y-[1px]">
        {initials}
      </span>

      {/* Gloss Effect */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
    </div>
  );
});

OptimizedAvatar.displayName = 'OptimizedAvatar';

export default OptimizedAvatar;
