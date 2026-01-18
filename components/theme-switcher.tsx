'use client'

/**
 * ThemeSwitcher - Toggle between multiple color themes
 * 
 * Supports: Light, Dark, Tokyo Night, Monokai, Catppuccin, Nord, Gruvbox, Dracula
 * Uses next-themes to manage theme state with localStorage persistence
 */

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun, Monitor, Palette, JapaneseYen, Coffee, Snowflake, TreePine, Skull, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const THEMES = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Drak', icon: Moon },
  { value: 'tokyo-night', label: 'Tokyo Night', icon: JapaneseYen },
  { value: 'monokai', label: 'Monokai', icon: Code },
  { value: 'catppuccin', label: 'Catppuccin', icon: Coffee },
  { value: 'nord', label: 'Nord', icon: Snowflake },
  { value: 'gruvbox', label: 'Gruvbox', icon: TreePine },
  { value: 'dracula', label: 'Dracula', icon: Skull },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-[140px] h-9">
        <Palette className="h-4 w-4 mr-2" />
        <span>Tema</span>
      </Button>
    )
  }

  const currentTheme = THEMES.find((t) => t.value === theme) || THEMES[0]
  const Icon = currentTheme.icon

  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger className="w-[140px] h-9">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {THEMES.map((t) => {
          const ThemeIcon = t.icon
          return (
            <SelectItem key={t.value} value={t.value}>
              <div className="flex items-center gap-2">
                <ThemeIcon className="h-4 w-4" />
                <span>{t.label}</span>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

/**
 * Simple toggle button version (cycles through themes)
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
        <Palette className="h-4 w-4" />
      </Button>
    )
  }

  const cycleTheme = () => {
    const themeOrder = ['light', 'dark', 'tokyo-night', 'monokai', 'catppuccin', 'nord', 'gruvbox', 'dracula']
    const currentIndex = themeOrder.indexOf(theme || 'light')
    const nextIndex = (currentIndex + 1) % themeOrder.length
    setTheme(themeOrder[nextIndex])
  }

  const getIcon = () => {
    if (theme === 'light') return <Sun className="h-4 w-4" />
    if (theme === 'dark') return <Moon className="h-4 w-4" />
    return <Palette className="h-4 w-4" />
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 w-9 p-0"
      onClick={cycleTheme}
    >
      {getIcon()}
      <span className="sr-only">Alternar tema</span>
    </Button>
  )
}
