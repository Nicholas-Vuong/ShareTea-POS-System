import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AccessibilityContext = createContext(null)
const STORAGE_KEY = 'sharetea.accessibility'

const defaultState = {
  fontSize: 16,
  highContrast: false,
  language: 'en'
}

export function AccessibilityProvider ({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? { ...defaultState, ...JSON.parse(stored) } : defaultState
    } catch {
      return defaultState
    }
  })

  useEffect(() => {
    document.documentElement.style.setProperty('--font-size', `${settings.fontSize}px`)
    document.body.classList.toggle('high-contrast', settings.highContrast)
    document.documentElement.setAttribute('lang', settings.language)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const value = useMemo(() => ({
    ...settings,
    increaseFont: () => setSettings((prev) => ({ ...prev, fontSize: Math.min(prev.fontSize + 2, 24) })),
    decreaseFont: () => setSettings((prev) => ({ ...prev, fontSize: Math.max(prev.fontSize - 2, 12) })),
    resetFont: () => setSettings((prev) => ({ ...prev, fontSize: defaultState.fontSize })),
    toggleContrast: () => setSettings((prev) => ({ ...prev, highContrast: !prev.highContrast })),
    setLanguage: (language) => setSettings((prev) => ({ ...prev, language }))
  }), [settings])

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility () {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}
