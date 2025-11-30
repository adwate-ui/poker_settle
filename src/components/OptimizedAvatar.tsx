import { memo, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { getCharacterForPlayer } from '@/config/themes';
import { getCharacterImage } from '@/config/characterImages';

interface OptimizedAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const OptimizedAvatar = memo(({ name, size = 'md', className = '' }: OptimizedAvatarProps) => {
  const { currentTheme } = useTheme();
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  
  // Try to get character avatar based on theme
  const characterName = getCharacterForPlayer(currentTheme, name);
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
