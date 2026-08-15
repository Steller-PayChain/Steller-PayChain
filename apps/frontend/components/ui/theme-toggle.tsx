'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

/**
 * ThemeToggle — switches between light and dark mode.
 *
 * Uses a `mounted` guard so the button only renders after hydration,
 * preventing a server/client mismatch when `theme` is `undefined` on
 * the first render pass.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Only render the toggle after the component has mounted on the client,
  // so `theme` is no longer undefined and matches what next-themes reads
  // from localStorage / the OS preference.
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Render a placeholder with the same dimensions to avoid layout shift
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme" disabled>
        <Sun className="w-4 h-4 opacity-0" />
      </Button>
    )
  }

  const isDark = theme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-300 rotate-0" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300 rotate-0" />
      )}
    </Button>
  )
}
