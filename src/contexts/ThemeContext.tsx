import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    const root = window.document.documentElement;

    if (savedTheme) {
      setThemeState(savedTheme);
      root.classList.remove('light', 'dark');
      root.classList.add(savedTheme);
    } else if (root.classList.contains('dark')) {
      setThemeState('dark');
    } else {
      setThemeState('light');
    }
  }, []);

  const setTheme = (mode: ThemeMode) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(mode);
    setThemeState(mode);
    localStorage.setItem('theme', mode);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
