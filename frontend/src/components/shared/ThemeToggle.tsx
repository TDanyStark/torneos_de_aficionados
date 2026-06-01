import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { resolveIsDark, useThemeStore } from '@/stores/themeStore'

export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode)
  const toggle = useThemeStore((s) => s.toggle)
  const isDark = resolveIsDark(mode)

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Cambiar tema"
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  )
}
