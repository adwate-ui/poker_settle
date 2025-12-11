import { memo, useState } from 'react';
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
  
  const avatarUrl = characterImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
  
  if (imageError) {
    const initials = name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
      
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
      src={avatarUrl}
      alt={name}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
});

OptimizedAvatar.displayName = 'OptimizedAvatar';

export default OptimizedAvatar;
