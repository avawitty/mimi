
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Palette {
  name: string;
  genre: string;
  base: string;
  text: string;
  subtle: string;
  accent: string;
  isDark: boolean;
  fontFamily: 'serif' | 'sans' | 'mono' | 'editorial' | 'indie';
  headerFont: string;
  letterSpacing: string;
  lineHeight: string;
}

export const PALETTES: Record<string, Palette> = {
  Void: { 
    name: 'Void', 
    genre: 'Avant-Garde', 
    base: '#000000', 
    text: '#FFFFFF', 
    subtle: '#57534E', 
    accent: '#A8A29E', 
    isDark: true,
    fontFamily: 'mono',
    headerFont: '"JetBrains Mono", monospace',
    letterSpacing: '-0.05em',
    lineHeight: '1'
  },
  Stone: { 
    name: 'Stone', 
    genre: 'Lifestyle', 
    base: '#FDFBF7', 
    text: '#1C1917', 
    subtle: '#333333', // Mode Mode Decree: Darker charcoal for legibility
    accent: '#44403C', 
    isDark: false,
    fontFamily: 'sans',
    headerFont: '"Inter", sans-serif',
    letterSpacing: '0.02em',
    lineHeight: '1.5'
  },
  Blush: { 
    name: 'Blush', 
    genre: 'High Fashion', 
    base: '#F2E8E5', 
    text: '#333333', // Mode Mode Decree: Charcoal Gray for the Sovereign Edit
    subtle: '#4A4A4A', // Mode Mode Decree: Darker subtle text for legibility
    accent: '#3D1C1C', 
    isDark: false,
    fontFamily: 'editorial',
    headerFont: '"Cormorant Garamond", serif',
    letterSpacing: '0.05em',
    lineHeight: '1.2'
  },
  Moss: { 
    name: 'Moss', 
    genre: 'Indie', 
    base: '#1C1D1A', 
    text: '#E2E8CE', 
    subtle: '#4F5B4E', 
    accent: '#78716C', 
    isDark: true,
    fontFamily: 'indie',
    headerFont: '"Cormorant Garamond", serif',
    letterSpacing: '-0.02em',
    lineHeight: '1.1'
  },
  Blood: { 
    name: 'Blood', 
    genre: 'Tabloid', 
    base: '#2D0606', 
    text: '#FFFAF5', 
    subtle: '#B91C1C', 
    accent: '#D1D5DB', 
    isDark: true,
    fontFamily: 'sans',
    headerFont: '"Inter", sans-serif',
    letterSpacing: '0.08em',
    lineHeight: '0.9'
  },
};

interface ThemeContextType {
  theme: 'light' | 'dark';
  currentPalette: Palette;
  toggleTheme: () => void;
  applyPalette: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPalette, setCurrentPalette] = useState<Palette>(() => {
    const saved = localStorage.getItem('mimi_palette_name');
    return (saved && PALETTES[saved]) ? PALETTES[saved] : PALETTES.Stone;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(currentPalette.isDark ? 'dark' : 'light');

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--nous-base', currentPalette.base);
    root.style.setProperty('--nous-text', currentPalette.text);
    root.style.setProperty('--nous-subtle', currentPalette.subtle);
    root.style.setProperty('--nous-accent', currentPalette.accent);
    
    const fontMapping = {
      serif: '"Cormorant Garamond", serif',
      editorial: '"Cormorant Garamond", serif',
      indie: '"Cormorant Garamond", serif',
      sans: '"Inter", sans-serif',
      mono: '"JetBrains Mono", monospace'
    };
    
    root.style.setProperty('--nous-font-primary', fontMapping[currentPalette.fontFamily]);
    root.style.setProperty('--nous-font-header', currentPalette.headerFont);
    root.style.setProperty('--nous-letter-spacing', currentPalette.letterSpacing);
    root.style.setProperty('--nous-line-height', currentPalette.lineHeight);

    if (currentPalette.name === 'Blush') {
      root.style.setProperty('--nous-font-weight', '300');
      root.style.setProperty('--nous-font-style', 'italic');
    } else if (currentPalette.name === 'Moss') {
      root.style.setProperty('--nous-font-weight', '700');
      root.style.setProperty('--nous-font-style', 'normal');
    } else {
      root.style.setProperty('--nous-font-weight', '400');
      root.style.setProperty('--nous-font-style', 'normal');
    }

    const body = document.body;
    if (currentPalette.isDark) {
      body.classList.add('dark');
      body.classList.remove('light');
      setTheme('dark');
      root.classList.add('dark');
    } else {
      body.classList.add('light');
      body.classList.remove('dark');
      setTheme('light');
      root.classList.remove('dark');
    }

    localStorage.setItem('mimi_palette_name', currentPalette.name);
  }, [currentPalette]);

  const toggleTheme = () => {
    const nextPaletteName = currentPalette.isDark ? 'Stone' : 'Void';
    applyPalette(nextPaletteName);
  };

  const applyPalette = (name: string) => {
    if (PALETTES[name]) {
      const palette = PALETTES[name];
      setCurrentPalette(palette);
      setTheme(palette.isDark ? 'dark' : 'light');
      localStorage.setItem('mimi_palette_name', name);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, currentPalette, toggleTheme, applyPalette }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
