/**
 * React hook for translating hardcoded translation objects
 * Uses Google Translate API to translate text on-the-fly for languages not in the hardcoded translations
 * Caches translations to avoid repeated API calls
 * 
 * Supports two modes:
 * 1. Hardcoded translations: If translation exists in the object, uses it directly
 * 2. Dynamic translation: If translation doesn't exist, uses Google Translate API
 */
import { useState, useEffect } from 'react';
import { useAccessibilityStore } from '@/store/accessibilityStore';
import { translateMultiple, LanguageCode } from '@/lib/translate';

/**
 * Hook to translate hardcoded translation objects using Google Translate
 * @param translations - Object with language keys and translation objects (e.g., { en: {...}, es: {...} })
 * @returns Translated object matching current language from accessibility store
 */
export function useTranslation<T extends Record<string, Record<string, string>>>(
  translations: T
): T[keyof T] {
  const { language } = useAccessibilityStore();
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Get base English translations (or first available language as fallback)
  const baseTranslations = translations['en'] || translations[Object.keys(translations)[0] as keyof T];

  // Effect to translate texts when language changes
  useEffect(() => {
    let cancelled = false; // Flag to prevent state updates after unmount

    const translateAllText = async () => {
      // If language is English or already in translations, use it directly (no API call needed)
      if (language === 'en' || translations[language as keyof T]) {
        setTranslatedTexts({});
        return;
      }

      setIsTranslating(true);
      try {
        // Get all English text values to translate
        const textsToTranslate = Object.values(baseTranslations);
        // Translate all texts in batch
        const translatedValues = await translateMultiple(
          textsToTranslate,
          language as LanguageCode,
          'en'
        );

        if (cancelled) return; // Component unmounted, don't update state

        // Reconstruct translated object with same keys as original
        const translated: Record<string, string> = {};
        Object.keys(baseTranslations).forEach((key, index) => {
          translated[key] = translatedValues[index] || baseTranslations[key]; // Fallback to original if translation fails
        });

        if (!cancelled) {
          setTranslatedTexts(translated);
        }
      } catch (error) {
        console.error('Translation error:', error);
        if (!cancelled) {
          setTranslatedTexts({}); // Clear on error
        }
      } finally {
        if (!cancelled) {
          setIsTranslating(false);
        }
      }
    };

    translateAllText();

    // Cleanup: cancel translation if component unmounts
    return () => {
      cancelled = true;
    };
  }, [language, translations, baseTranslations]);

  // Return appropriate translation object based on availability
  // Priority: hardcoded translations > dynamically translated > English fallback
  if (language === 'en' || translations[language as keyof T]) {
    // Use hardcoded translation if available
    return (translations[language as keyof T] || baseTranslations) as T[keyof T];
  }

  // Return dynamically translated texts if available
  if (Object.keys(translatedTexts).length > 0) {
    return translatedTexts as T[keyof T];
  }

  // Fallback to English (or first available language)
  return baseTranslations as T[keyof T];
}

