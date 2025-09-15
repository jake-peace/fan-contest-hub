import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from './ThemeContext';

export function ThemeToggle() {
    const { setTheme, actualTheme } = useTheme();

    const handleTheme = () => {
        setTheme(actualTheme === 'dark' ? 'light' : 'dark');
    }

    return (
        <Button size='icon' onClick={handleTheme} variant='outline'>
            {actualTheme === 'dark' ? (
                <Moon className="h-4 w-4" />
            ) : (
                <Sun className="h-4 w-4" />
            )}
        </Button>
    );
}