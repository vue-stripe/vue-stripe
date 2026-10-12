'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

// The `dark` class on <html> is the source of truth (set before hydration by the
// inline script in the root layout), so read it as an external store.
function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

const getIsDark = () => document.documentElement.classList.contains('dark')
const getServerIsDark = () => false

export function ThemeToggle() {
  const isDark = React.useSyncExternalStore(subscribeToTheme, getIsDark, getServerIsDark)

  const toggleTheme = () => {
    const newIsDark = !isDark
    document.documentElement.classList.toggle('dark', newIsDark)
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {isDark ? <Sun className="h-5 w-5 text-vue-stripe-yellow" /> : <Moon className="h-5 w-5" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
