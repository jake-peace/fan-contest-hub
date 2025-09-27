'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}

interface ThemeProviderProps {
	children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>('system');
	const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

	useEffect(() => {
		// Load theme from localStorage on mount
		const stored = localStorage.getItem('theme') as Theme | null;
		if (stored && ['light', 'dark', 'system'].includes(stored)) {
			setTheme(stored);
		}
	}, []);

	useEffect(() => {
		const updateActualTheme = () => {
			if (theme === 'system') {
				const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
				setActualTheme(systemTheme);
			} else {
				setActualTheme(theme);
			}
		};

		updateActualTheme();

		// Listen for system theme changes when in system mode
		if (theme === 'system') {
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			mediaQuery.addEventListener('change', updateActualTheme);
			return () => mediaQuery.removeEventListener('change', updateActualTheme);
		}
	}, [theme]);

	useEffect(() => {
		// Apply theme to document
		const root = document.documentElement;
		if (actualTheme === 'dark') {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}
	}, [actualTheme]);

	const handleSetTheme = (newTheme: Theme) => {
		setTheme(newTheme);
		localStorage.setItem('theme', newTheme);
	};

	const value: ThemeContextType = {
		theme,
		setTheme: handleSetTheme,
		actualTheme,
	};

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
