import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LanguageCode } from '@/lib/translate';

interface AccessibilityState {
  highContrast: boolean;
  textScale: 100 | 125 | 150;
  language: LanguageCode;
  toggleHighContrast: () => void;
  setTextScale: (scale: 100 | 125 | 150) => void;
  setLanguage: (language: LanguageCode) => void;
}

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set) => ({
      highContrast: false,
      textScale: 100,
      language: 'en' as LanguageCode,
      toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
      setTextScale: (scale) => set({ textScale: scale }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'accessibility-settings',
    }
  )
);
