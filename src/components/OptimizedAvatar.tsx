import { memo, useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

// Global cache to track loaded image URLs for sync decoding
const loadedImageCache = new Set<string>();

interface OptimizedAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  allPlayerNames?: string[]; // Optional: list of all player names in the current context (e.g., game)
}

const OptimizedAvatar = memo(({ name, size = 'md', className = '', allPlayerNames }: OptimizedAvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sizeClasses = {
    sm: 'w-9 h-9 sm:w-10 sm:h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  // Use smaller size for dicebear avatars to reduce load time
  const dicebearSize = size === 'sm' ? 40 : size === 'md' ? 48 : 64;
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&size=${dicebearSize}&backgroundColor=transparent`;

  // Check if image is already cached globally
  const isCached = loadedImageCache.has(avatarUrl);

  // Get initials for fallback
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Handle successful image load
  const handleLoad = () => {
    loadedImageCache.add(avatarUrl);
    setImageLoaded(true);
  };

  // If error or on mobile with dicebear (external API), show initials
  if (imageError || isMobile) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold ${className}`}
      >
        {initials}
      </div>
    );
  }

  // Show initials while loading, then switch to image
  if (!imageLoaded && !isCached) {
    return (
      <>
        <div
          className={`${sizeClasses[size]} rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold ${className}`}
        >
          {initials}
        </div>
        <img
          src={avatarUrl}
          alt={name}
          className="hidden"
          onError={() => setImageError(true)}
          onLoad={handleLoad}
          loading="lazy"
          decoding="async"
        />
      </>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={name}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      onError={() => setImageError(true)}
      onLoad={handleLoad}
      loading="lazy"
      decoding={isCached ? "sync" : "async"}
    />
  );
});

OptimizedAvatar.displayName = 'OptimizedAvatar';

export default OptimizedAvatar;
