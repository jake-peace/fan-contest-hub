import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from './ThemeContext';

export function ThemeToggle() {
    const { setTheme, actualTheme } = useTheme();

    const handleTheme = () => {
        setTheme(actualTheme === 'dark' ? 'light' : 'dark');
    }

    return (
        <Button size='icon' onClick={handleTheme} variant='ghost'>
            {actualTheme === 'dark' ? (
                <Moon className="h-4 w-4" />
            ) : (
                <Sun className="h-4 w-4" />
            )}
        </Button>
        // <DropdownMenu>
        //     <DropdownMenuTrigger asChild>
        //         <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
        //             {actualTheme === 'dark' ? (
        //                 <Moon className="h-4 w-4" />
        //             ) : (
        //                 <Sun className="h-4 w-4" />
        //             )}
        //             <span className="sr-only">Toggle theme</span>
        //         </Button>
        //     </DropdownMenuTrigger>
        //     <DropdownMenuContent align="end">
        //         <DropdownMenuItem
        //             onClick={() => setTheme('light')}
        //             className="cursor-pointer"
        //         >
        //             <Sun className="mr-2 h-4 w-4" />
        //             <span>Light</span>
        //             {theme === 'light' && <span className="ml-auto">✓</span>}
        //         </DropdownMenuItem>
        //         <DropdownMenuItem
        //             onClick={() => setTheme('dark')}
        //             className="cursor-pointer"
        //         >
        //             <Moon className="mr-2 h-4 w-4" />
        //             <span>Dark</span>
        //             {theme === 'dark' && <span className="ml-auto">✓</span>}
        //         </DropdownMenuItem>
        //         <DropdownMenuItem
        //             onClick={() => setTheme('system')}
        //             className="cursor-pointer"
        //         >
        //             <Monitor className="mr-2 h-4 w-4" />
        //             <span>System</span>
        //             {theme === 'system' && <span className="ml-auto">✓</span>}
        //         </DropdownMenuItem>
        //     </DropdownMenuContent>
        // </DropdownMenu>
    );
}