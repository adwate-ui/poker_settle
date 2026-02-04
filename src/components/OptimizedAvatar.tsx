import { memo, useMemo } from 'react';
import { cn, stringToColor } from '@/lib/utils';

interface OptimizedAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  allPlayerNames?: string[]; // Kept for interface compatibility
}

const OptimizedAvatar = memo(({ name, size = 'md', className = '' }: OptimizedAvatarProps) => {
  const seed = name || "guest";
  const bgColor = useMemo(() => stringToColor(seed), [seed]);

  const avatarUrl = useMemo(() =>
    `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bgColor}`,
    [seed, bgColor]);

  // Size mapping
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-9 h-9 sm:w-10 sm:h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div
      className={cn(
        "relative rounded-full flex items-center justify-center overflow-hidden shadow-xl border-2 select-none bg-muted",
        sizeClasses[size],
        className
      )}
      style={{ borderColor: `#${bgColor}` }}
    >
      <img
        src={avatarUrl}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        loading="lazy"
      />
      {/* Subtle inner shadow for depth */}
      <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)] rounded-full pointer-events-none" />
    </div>
  );
});

OptimizedAvatar.displayName = 'OptimizedAvatar';

export default OptimizedAvatar;
