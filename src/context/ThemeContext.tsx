import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark';
export type ColorTheme = 'emerald' | 'ocean' | 'sunset' | 'forest' | 'deep-ocean';

interface ThemeContextType {
    mode: ThemeMode;
    colorTheme: ColorTheme;
    toggleMode: () => void;
    setMode: (mode: ThemeMode) => void;
    setColorTheme: (theme: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem('theme-mode');
        return (saved as ThemeMode) || 'light';
    });

    const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
        const saved = localStorage.getItem('color-theme');
        return (saved as ColorTheme) || 'emerald';
    });

    useEffect(() => {
        localStorage.setItem('theme-mode', mode);
        if (mode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [mode]);

    useEffect(() => {
        localStorage.setItem('color-theme', colorTheme);
        document.documentElement.setAttribute('data-theme', colorTheme);
    }, [colorTheme]);

    const toggleMode = () => setModeState(prev => prev === 'light' ? 'dark' : 'light');
    const setMode = (newMode: ThemeMode) => setModeState(newMode);
    const setColorTheme = (theme: ColorTheme) => setColorThemeState(theme);

    return (
        <ThemeContext.Provider value={{ mode, colorTheme, toggleMode, setMode, setColorTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
