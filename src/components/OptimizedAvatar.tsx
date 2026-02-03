import { memo, useState, useEffect } from 'react';

interface OptimizedAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  allPlayerNames?: string[];
}

const OptimizedAvatar = memo(({ name, size = 'md', className = '' }: OptimizedAvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
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

  useEffect(() => {
    // If we're on mobile, we might prefer initials to save bandwidth/processing
    // but the requirement is to use caching. We'll disable remote fetch on mobile initially 
    // for performance as per existing logic, but allow cached versions.

    const seed = encodeURIComponent(name);
    const cacheKey = `avatar_cache_${seed}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      setAvatarSrc(cached);
    } else if (!isMobile) {
      // Use smaller size for dicebear avatars to reduce load time
      const dicebearSize = size === 'sm' ? 40 : size === 'md' ? 48 : 64;
      const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&size=${dicebearSize}&backgroundColor=transparent`;

      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.text();
        })
        .then(svg => {
          // Convert SVG string to Data URI
          const base64 = btoa(unescape(encodeURIComponent(svg)));
          const dataUri = `data:image/svg+xml;base64,${base64}`;
          try {
            localStorage.setItem(cacheKey, dataUri);
          } catch (e) {
            console.warn('LocalStorage limit reached - avatar not cached', e);
          }
          setAvatarSrc(dataUri);
        })
        .catch(err => {
          console.error('Error fetching avatar:', err);
          setImageError(true);
        });
    }
  }, [name, isMobile, size]);

  const sizeClasses = {
    sm: 'w-9 h-9 sm:w-10 sm:h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  // Get initials for fallback
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Show initials while loading, if error, or on mobile with no cache
  if (imageError || (isMobile && !avatarSrc) || !avatarSrc) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={avatarSrc}
      alt={name}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      onError={() => setImageError(true)}
      loading="lazy"
      decoding="async"
    />
  );
});

OptimizedAvatar.displayName = 'OptimizedAvatar';

export default OptimizedAvatar;
