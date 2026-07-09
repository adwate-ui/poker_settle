import { memo, useMemo, useState, useEffect } from 'react';
import { cn, stringToColor } from '@/lib/utils';

interface OptimizedAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  allPlayerNames?: string[]; // Kept for interface compatibility
}

const initialTextSizeClasses = {
  xs: 'text-2xs',
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-4xl',
};

const OptimizedAvatar = memo(({ name, size = 'md', className = '' }: OptimizedAvatarProps) => {
  const seed = name || "guest";
  const bgColor = useMemo(() => stringToColor(seed), [seed]);
  const [imgFailed, setImgFailed] = useState(false);

  const avatarUrl = useMemo(() =>
    `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bgColor}`,
    [seed, bgColor]);

  useEffect(() => setImgFailed(false), [avatarUrl]);

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
      {imgFailed ? (
        <span
          className={cn("font-luxury font-semibold uppercase", initialTextSizeClasses[size])}
          style={{ color: `#${bgColor}` }}
          aria-hidden="true"
        >
          {(name || "?").charAt(0)}
        </span>
      ) : (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      )}
      {/* Subtle inner shadow for depth */}
      <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)] rounded-full pointer-events-none" />
    </div>
  );
});

OptimizedAvatar.displayName = 'OptimizedAvatar';

export default OptimizedAvatar;
