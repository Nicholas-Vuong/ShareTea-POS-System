import React from 'react'
import { useAccessibility } from '../context/AccessibilityContext.jsx'

function AccessibilityControls () {
  const {
    fontSize,
    increaseFont,
    decreaseFont,
    resetFont,
    highContrast,
    toggleContrast,
    language,
    setLanguage
  } = useAccessibility()

  return (
    <section aria-label="Accessibility options" className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2" aria-label="Font size controls">
        <span className="text-sm">Font</span>
        <button type="button" className="rounded border px-2 py-1" onClick={decreaseFont} aria-label="Reduce font size">
          A-
        </button>
        <button type="button" className="rounded border px-2 py-1" onClick={resetFont} aria-label="Reset font size">
          A
        </button>
        <button type="button" className="rounded border px-2 py-1" onClick={increaseFont} aria-label="Increase font size">
          A+
        </button>
        <span aria-live="polite" className="text-xs text-slate-500">
          {fontSize}px
        </span>
      </div>

      <button
        type="button"
        className="rounded border px-3 py-2"
        onClick={toggleContrast}
        aria-pressed={highContrast}
      >
        {highContrast ? 'Standard Contrast' : 'High Contrast'}
      </button>

      <label className="flex items-center gap-2 text-sm">
        Language
        <select
          className="rounded border px-2 py-1"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </label>
    </section>
  )
}

export default AccessibilityControls
