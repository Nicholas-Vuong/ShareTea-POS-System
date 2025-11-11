import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AccessibilityState {
  highContrast: boolean;
  textScale: 100 | 125 | 150;
  language: 'en' | 'es';
  toggleHighContrast: () => void;
  setTextScale: (scale: 100 | 125 | 150) => void;
  setLanguage: (language: 'en' | 'es') => void;
}

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set) => ({
      highContrast: false,
      textScale: 100,
      language: 'en',
      toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
      setTextScale: (scale) => set({ textScale: scale }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'accessibility-settings',
    }
  )
);
