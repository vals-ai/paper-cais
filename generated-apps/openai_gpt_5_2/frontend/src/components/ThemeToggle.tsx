import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { Button } from './ui/button'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
