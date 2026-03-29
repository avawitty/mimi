
// @ts-nocheck
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Palette {
  name: string;
  base: string;
  text: string;
  subtle: string;
  accent: string;
  border?: string; // Added border spec
  isDark: boolean;
  genre?: string;
  fontFamily?: string;
  headerFont?: string;
  logoStyle?: 'serif' | 'brutalist' | 'minimalist';
  logoItalic?: boolean;
}

export const PALETTES: Record<string, Palette> = {
  "Bright Mode": { 
    name: 'Bright Mode', 
    genre: 'High Contrast', 
    base: '#FFFFFF', 
    text: '#000000', 
    subtle: '#666666', 
    accent: '#000000', 
    border: '#E5E5E5', 
    isDark: false,
    fontFamily: 'sans', 
    headerFont: '"Cormorant Garamond", serif', 
    logoStyle: 'serif', 
    logoItalic: true
  },
  "Dark Mode": { 
    name: 'Dark Mode', 
    genre: 'High Contrast', 
    base: '#000000', 
    text: '#FFFFFF', 
    subtle: '#A3A3A3', 
    accent: '#FFFFFF', 
    border: '#262626', 
    isDark: true,
    fontFamily: 'sans', 
    headerFont: '"Cormorant Garamond", serif', 
    logoStyle: 'serif', 
    logoItalic: true
  },
  "The Journal": { 
    name: 'The Journal', 
    genre: 'Archival Grid', 
    base: '#F9F7F2', 
    text: '#1A1A1A', 
    subtle: '#555555', 
    accent: '#111111', 
    border: '#C8C6BC', // The signature landing page border color
    isDark: false,
    fontFamily: 'sans', 
    headerFont: '"Cormorant Garamond", serif', 
    logoStyle: 'serif', 
    logoItalic: true
  },
  "Editorial '94": { 
    name: "Editorial '94", genre: 'Blush & Bordeaux', base: '#FFF5F5', text: '#7F1D1D', subtle: '#B91C1C', accent: '#EF4444', border: '#FECACA', isDark: false,
    fontFamily: 'serif', headerFont: '"Cormorant Garamond", serif', logoStyle: 'serif', logoItalic: true
  },
  "The Atelier": {
    name: 'The Atelier', genre: 'Moss & Plum Debris', base: '#F5F7F1', text: '#300C2E', subtle: '#6E7A62', accent: '#5B2154', border: '#E2E8F0', isDark: false,
    fontFamily: 'serif', headerFont: '"Cormorant Garamond", serif', logoStyle: 'serif', logoItalic: false
  },
  "Cinémathèque": { 
    name: 'Cinémathèque', genre: 'Silver Seed & Scotopic Grain', base: '#050505', text: '#EFE9E1', subtle: '#71717A', accent: '#EFE9E1', border: '#27272A', isDark: true,
    fontFamily: 'serif', headerFont: '"Cormorant Garamond", serif', logoStyle: 'serif', logoItalic: true
  },
  "Concrete Gallery": { 
    name: 'Concrete Gallery', genre: 'Brutalist Mint', base: '#1A1A1A', text: '#99F6E4', subtle: '#71717A', accent: '#2DD4BF', border: '#333333', isDark: true,
    fontFamily: 'mono', headerFont: '"Space Mono", monospace', logoStyle: 'brutalist', logoItalic: false
  },
  "Haute Void": { 
    name: 'Haute Void', genre: 'High-Fashion Silence', base: '#000000', text: '#D4D4D4', subtle: '#525252', accent: '#FFFFFF', border: '#262626', isDark: true,
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
        // Ensure legacy palettes migrate to new border spec
        return { ...PALETTES['The Journal'], ...p };
      } catch (e) {
        return PALETTES['The Journal'];
      }
    }
    return PALETTES['The Journal'];
  });

  useEffect(() => {
    const root = document.documentElement;
    const p = currentPalette || PALETTES['The Journal'];
    
    // PRIMARY AXIS OVERRIDE LOGIC
    root.style.setProperty('--nous-base', p.base); // Background
    root.style.setProperty('--nous-text', p.text); // Foreground / Typography Contrast
    root.style.setProperty('--nous-subtle', p.subtle); // Debris / Low Signal
    root.style.setProperty('--nous-accent', p.accent); // The Interactive Axis / Primary Accent
    root.style.setProperty('--nous-border', p.border || p.subtle); // New Border Variable
    root.style.setProperty('--nous-font-header', p.headerFont || '"Cormorant Garamond", serif');

    document.body.style.backgroundColor = p.base;
    document.body.style.color = p.text;

    if (p.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('mimi_manifest_palette', JSON.stringify(p));
  }, [currentPalette]);

  const applyPalette = (name: string, customAccent?: string, customText?: string) => {
    let basePalette = PALETTES[name] || PALETTES['The Journal'];
    const finalPalette = { 
      ...basePalette,
      accent: customAccent || basePalette.accent,
      text: customText || basePalette.text
    };
    setCurrentPalette(finalPalette);
  };

  const manifestPalette = (palette: Palette) => {
    setCurrentPalette(palette);
    localStorage.setItem('mimi_manifest_palette', JSON.stringify(palette));
  };

  const toggleMode = () => {
    if (currentPalette?.isDark) {
      applyPalette("Bright Mode");
    } else {
      applyPalette("Dark Mode");
    }
  };

  return (
    <ThemeContext.Provider value={{ currentPalette, applyPalette, manifestPalette, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
