import React, { useEffect, useState } from 'react';
import { FirstTimeTutorial } from './FirstTimeTutorial';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAuth } from '@/hooks/useAuth';

/**
 * TutorialManager automatically shows the tutorial for first-time users
 */
export const TutorialManager: React.FC = () => {
  const { user } = useAuth();
  const { preferences, loading } = useUserPreferences();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Show tutorial only if user is logged in, preferences are loaded,
    // and tutorial hasn't been completed yet
    if (user && !loading && preferences && !preferences.tutorial_completed) {
      // Small delay to let the app render first
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, loading, preferences]);

  if (!user || loading) {
    return null;
  }

  return (
    <FirstTimeTutorial
      open={showTutorial}
      onClose={() => setShowTutorial(false)}
    />
  );
};
