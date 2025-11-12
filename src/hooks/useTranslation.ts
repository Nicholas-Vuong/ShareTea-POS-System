import { useState, useEffect } from 'react';
import { useAccessibilityStore } from '@/store/accessibilityStore';
import { translateMultiple, LanguageCode } from '@/lib/translate';

/**
 * Hook to translate hardcoded translation objects using Google Translate
 * @param translations - Object with language keys and translation objects
 * @returns Translated object matching current language
 */
export function useTranslation<T extends Record<string, Record<string, string>>>(
  translations: T
): T[keyof T] {
  const { language } = useAccessibilityStore();
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Get base English translations
  const baseTranslations = translations['en'] || translations[Object.keys(translations)[0] as keyof T];

  useEffect(() => {
    let cancelled = false;

    const translateAllText = async () => {
      // If language is English or already in translations, use it directly
      if (language === 'en' || translations[language as keyof T]) {
        setTranslatedTexts({});
        return;
      }

      setIsTranslating(true);
      try {
        // Get all English text values
        const textsToTranslate = Object.values(baseTranslations);
        const translatedValues = await translateMultiple(
          textsToTranslate,
          language as LanguageCode,
          'en'
        );

        if (cancelled) return;

        // Create translated object
        const translated: Record<string, string> = {};
        Object.keys(baseTranslations).forEach((key, index) => {
          translated[key] = translatedValues[index] || baseTranslations[key];
        });

        if (!cancelled) {
          setTranslatedTexts(translated);
        }
      } catch (error) {
        console.error('Translation error:', error);
        if (!cancelled) {
          setTranslatedTexts({});
        }
      } finally {
        if (!cancelled) {
          setIsTranslating(false);
        }
      }
    };

    translateAllText();

    return () => {
      cancelled = true;
    };
  }, [language, translations, baseTranslations]);

  // Return appropriate translation object
  if (language === 'en' || translations[language as keyof T]) {
    return translations[language as keyof T] || baseTranslations;
  }

  // Return translated texts if available, otherwise fallback to English
  if (Object.keys(translatedTexts).length > 0) {
    return translatedTexts as T[keyof T];
  }

  return baseTranslations;
}

