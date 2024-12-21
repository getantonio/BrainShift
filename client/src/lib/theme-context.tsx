import { createContext, useContext, useState, useEffect } from 'react';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  updateColors: (newColors: Partial<ThemeColors>) => void;
}

const defaultColors: ThemeColors = {
  primary: '#FFFFFF',
  secondary: '#CCCCCC',
  accent: '#999999',
  background: '#000000',
  foreground: '#FFFFFF'
};

const ThemeContext = createContext<ThemeContextType>({
  colors: defaultColors,
  updateColors: () => {}
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColors] = useState<ThemeColors>(() => {
    const saved = localStorage.getItem('theme-colors');
    return saved ? JSON.parse(saved) : defaultColors;
  });

  useEffect(() => {
    localStorage.setItem('theme-colors', JSON.stringify(colors));
    
    // Update CSS variables
    Object.entries(colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--color-${key}`, value);
    });
  }, [colors]);

  const updateColors = (newColors: Partial<ThemeColors>) => {
    setColors(current => ({
      ...current,
      ...newColors
    }));
  };

  return (
    <ThemeContext.Provider value={{ colors, updateColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
