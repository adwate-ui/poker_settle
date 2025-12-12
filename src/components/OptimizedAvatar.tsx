import { memo, useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { getCharacterForPlayer, getUniqueCharacterForPlayer } from '@/config/themes';
import { getCharacterImage } from '@/config/characterImages';

interface OptimizedAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  allPlayerNames?: string[]; // Optional: list of all player names in the current context (e.g., game)
}

const OptimizedAvatar = memo(({ name, size = 'md', className = '', allPlayerNames }: OptimizedAvatarProps) => {
  const { currentTheme } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const sizeClasses = {
    sm: 'w-9 h-9 sm:w-10 sm:h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  
  // Helper function to get character name based on context
  const getCharacterName = (): string | null => {
    if (currentTheme === 'default') return null;
    
    // If we have all player names, use unique assignment
    if (allPlayerNames && allPlayerNames.length > 0) {
      return getUniqueCharacterForPlayer(currentTheme, name, allPlayerNames);
    }
    
    // Otherwise, use hash-based assignment
    return getCharacterForPlayer(currentTheme, name);
  };
  
  const characterName = getCharacterName();
  const characterImage = characterName ? getCharacterImage(characterName) : null;
  
  // Use smaller size for dicebear avatars to reduce load time
  const dicebearSize = size === 'sm' ? 40 : size === 'md' ? 48 : 64;
  const avatarUrl = characterImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&size=${dicebearSize}&backgroundColor=transparent`;
  
  // Get initials for fallback
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  // On mobile, use initials by default for faster rendering
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // If error or on mobile with dicebear (external API), show initials
  if (imageError || (isMobile && !characterImage)) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold ${className}`}
      >
        {initials}
      </div>
    );
  }
  
  return (
    <>
      {/* Show initials while loading */}
      {!imageLoaded && (
        <div 
          className={`${sizeClasses[size]} rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold ${className}`}
        >
          {initials}
        </div>
      )}
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ${className} ${!imageLoaded ? 'hidden' : ''}`}
        onError={() => setImageError(true)}
        onLoad={() => setImageLoaded(true)}
        loading="lazy"
        decoding="async"
      />
    </>
  );
});

OptimizedAvatar.displayName = 'OptimizedAvatar';

export default OptimizedAvatar;
