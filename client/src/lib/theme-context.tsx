import { createContext, useContext, useState, useEffect } from 'react';

interface ThemeColors {
  header: {
    background: string;
    text: string;
    border: string;
  };
  body: {
    background: string;
    text: string;
    mutedText: string;
  };
  card: {
    background: string;
    border: string;
    text: string;
  };
  button: {
    primary: string;
    secondary: string;
    text: string;
    border: string;
  };
  playlist: {
    background: string;
    hover: string;
    border: string;
    text: string;
  };
}

interface ThemeContextType {
  colors: ThemeColors;
  updateColors: (newColors: Partial<ThemeColors>) => void;
}

const defaultColors: ThemeColors = {
  header: {
    background: '#000000',
    text: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.2)'
  },
  body: {
    background: '#18181B',
    text: '#FFFFFF',
    mutedText: '#A1A1AA'
  },
  card: {
    background: '#27272A',
    border: '#3F3F46',
    text: '#FFFFFF'
  },
  button: {
    primary: '#3B82F6',
    secondary: '#4B5563',
    text: '#FFFFFF',
    border: '#6B7280'
  },
  playlist: {
    background: 'rgba(39, 39, 42, 0.8)',
    hover: 'rgba(63, 63, 70, 0.8)',
    border: '#3F3F46',
    text: '#E4E4E7'
  }
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
    Object.entries(colors).forEach(([section, values]) => {
      Object.entries(values as Record<string, string>).forEach(([key, value]) => {
        document.documentElement.style.setProperty(
          `--${section}-${key}`,
          value
        );
      });
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
