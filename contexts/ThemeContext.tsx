
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Palette {
  name: string;
  base: string;
  text: string;
  subtle: string;
  accent: string;
  isDark: boolean;
  genre?: string;
  fontFamily?: string;
  headerFont?: string;
  logoStyle?: 'serif' | 'brutalist';
  logoItalic?: boolean;
}

export const PALETTES: Record<string, Palette> = {
  'The Journal': { 
    name: 'The Journal', genre: 'Parchment & Stone', base: '#FDFBF7', text: '#1C1917', subtle: '#78716C', accent: '#44403C', isDark: false,
    fontFamily: 'sans', headerFont: '"Space Grotesk", sans-serif', logoStyle: 'serif', logoItalic: true
  },
  'Editorial ’94': { 
    name: 'Editorial ’94', genre: 'Blush & Bordeaux', base: '#FFF5F5', text: '#7F1D1D', subtle: '#B91C1C', accent: '#EF4444', isDark: false,
    fontFamily: 'serif', headerFont: '"Cormorant Garamond", serif', logoStyle: 'serif', logoItalic: true
  },
  'The Atelier': {
    name: 'The Atelier', genre: 'Moss & Plum Debris', base: '#F5F7F1', text: '#300C2E', subtle: '#6E7A62', accent: '#5B2154', isDark: false,
    fontFamily: 'serif', headerFont: '"Cormorant Garamond", serif', logoStyle: 'serif', logoItalic: false
  },
  'Cinémathèque': { 
    name: 'Cinémathèque', genre: 'Kodak Red & Yellow', base: '#080808', text: '#FDE047', subtle: '#71717A', accent: '#EF4444', isDark: true,
    fontFamily: 'serif', headerFont: '"Cormorant Garamond", serif', logoStyle: 'serif', logoItalic: false
  },
  'Concrete Gallery': { 
    name: 'Concrete Gallery', genre: 'Brutalist Mint', base: '#1A1A1A', text: '#99F6E4', subtle: '#71717A', accent: '#2DD4BF', isDark: true,
    fontFamily: 'mono', headerFont: '"Space Mono", monospace', logoStyle: 'brutalist', logoItalic: false
  },
  'Haute Void': { 
    name: 'Haute Void', genre: 'High-Fashion Silence', base: '#000000', text: '#FFFFFF', subtle: '#A8A29E', accent: '#D4D4D4', isDark: true,
    fontFamily: 'mono', headerFont: '"Space Mono", monospace', logoStyle: 'brutalist', logoItalic: false
  }
};

const ThemeContext = createContext<any>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPalette, setCurrentPalette] = useState<Palette>(() => {
    const saved = localStorage.getItem('mimi_manifest_palette');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        // Clean migration: map old keys if necessary or return valid palette
        const nameMap: Record<string, string> = {
            'Lifestyle': 'The Journal',
            '90s Editorial': 'Editorial ’94',
            'Velvet': 'The Atelier',
            'Cinematic': 'Cinémathèque',
            'Brutalist': 'Concrete Gallery',
            'Avant-Garde': 'Haute Void'
        };
        const mappedName = nameMap[p.name] || p.name;
        return PALETTES[mappedName] || p;
      } catch (e) {
        return PALETTES['The Journal'];
      }
    }
    return PALETTES['The Journal'];
  });

  useEffect(() => {
    const root = document.documentElement;
    const p = currentPalette;
    
    root.style.setProperty('--nous-base', p.base);
    root.style.setProperty('--nous-text', p.text);
    root.style.setProperty('--nous-subtle', p.subtle);
    root.style.setProperty('--nous-accent', p.accent);
    root.style.setProperty('--nous-font-header', p.headerFont || '"Cormorant Garamond", serif');

    document.body.style.backgroundColor = p.base;
    document.body.style.color = p.text;

    if (p.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    if (p.name.includes("Manifest")) {
      localStorage.setItem('mimi_manifest_palette', JSON.stringify(p));
    }
  }, [currentPalette]);

  const applyPalette = (name: string) => {
    if (PALETTES[name]) {
        setCurrentPalette(PALETTES[name]);
    } else {
        // Check if it was a manifested palette in storage
        const saved = localStorage.getItem('mimi_manifest_palette');
        if (saved) {
            try {
                const p = JSON.parse(saved);
                if (p.name === name) setCurrentPalette(p);
            } catch(e) {}
        }
    }
  };

  const manifestPalette = (palette: Palette) => {
    // Explicitly cast finalPalette to Palette to ensure logoStyle is typed correctly as 'serif' | 'brutalist'
    const finalPalette: Palette = {
      ...palette,
      fontFamily: 'serif',
      headerFont: '"Cormorant Garamond", serif',
      logoStyle: 'serif'
    };
    setCurrentPalette(finalPalette);
    localStorage.setItem('mimi_manifest_palette', JSON.stringify(finalPalette));
  };

  return (
    <ThemeContext.Provider value={{ currentPalette, applyPalette, manifestPalette }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
