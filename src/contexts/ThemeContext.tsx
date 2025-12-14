import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeName, themes, Theme } from '@/config/themes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ThemeContextType {
  currentTheme: ThemeName;
  theme: Theme;
  setTheme: (theme: ThemeName) => Promise<void>;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { user } = useAuth();
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('default');
  const [loading, setLoading] = useState(true);

  // Load theme from database
  useEffect(() => {
    const loadTheme = async () => {
      if (!user) {
        setCurrentTheme('default');
        applyThemeColors('default');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('theme')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        const themeName = (data?.theme as ThemeName) || 'default';
        setCurrentTheme(themeName);
        applyThemeColors(themeName);
      } catch (error) {
        console.error('Error loading theme:', error);
        setCurrentTheme('default');
        applyThemeColors('default');
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, [user]);

  const setTheme = async (themeName: ThemeName) => {
    if (!user) {
      console.error('User must be logged in to change theme');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ theme: themeName })
        .eq('id', user.id);

      if (error) throw error;

      setCurrentTheme(themeName);
      applyThemeColors(themeName);
    } catch (error) {
      console.error('Error updating theme:', error);
      throw error;
    }
  };

  const applyThemeColors = (themeName: ThemeName) => {
    const theme = themes[themeName];
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    const colors = isDark ? theme.colors.dark : theme.colors.light;

    // Apply all shadcn/Tailwind CSS variables
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);
    root.style.setProperty('--card', colors.card);
    root.style.setProperty('--card-foreground', colors.cardForeground);
    root.style.setProperty('--popover', colors.popover);
    root.style.setProperty('--popover-foreground', colors.popoverForeground);
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--secondary-foreground', colors.secondaryForeground);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--accent-foreground', colors.accentForeground);
    root.style.setProperty('--muted', colors.muted);
    root.style.setProperty('--muted-foreground', colors.mutedForeground);
    root.style.setProperty('--destructive', colors.destructive);
    root.style.setProperty('--destructive-foreground', colors.destructiveForeground);
    root.style.setProperty('--border', colors.border);
    root.style.setProperty('--input', colors.input);
    root.style.setProperty('--ring', colors.ring);
    root.style.setProperty('--poker-green', colors.pokerGreen);
    root.style.setProperty('--poker-gold', colors.pokerGold);
    root.style.setProperty('--poker-felt', colors.pokerFelt);
    root.style.setProperty('--gradient-poker', colors.gradientPoker);
    root.style.setProperty('--gradient-gold', colors.gradientGold);
    root.style.setProperty('--gradient-dark', colors.gradientDark);

    // Apply Mantine-specific color variables for better integration
    // These will be used by the CSS in mantine-theme.css
    root.style.setProperty('--mantine-color-body', `hsl(${colors.background})`);
    root.style.setProperty('--mantine-color-text', `hsl(${colors.foreground})`);
    root.style.setProperty('--mantine-color-primary-filled', `hsl(${colors.primary})`);
    root.style.setProperty('--mantine-color-primary-filled-hover', `hsl(${colors.primary} / 0.9)`);
    root.style.setProperty('--mantine-color-primary-light', `hsl(${colors.primary} / ${isDark ? '0.2' : '0.15'})`);
    root.style.setProperty('--mantine-color-primary-light-hover', `hsl(${colors.primary} / ${isDark ? '0.25' : '0.2'})`);
  };

  // Re-apply theme colors when light/dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      applyThemeColors(currentTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [currentTheme]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        theme: themes[currentTheme],
        setTheme,
        loading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
