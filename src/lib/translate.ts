/**
 * Google Translate utility
 * Translates text using Google Translate API
 * Uses free endpoint for translation (can be configured with API key if needed)
 */

// Google Translate supported language codes
export type LanguageCode = 
  | 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ko' | 'pt' | 'it' | 'ru'
  | 'ar' | 'hi' | 'th' | 'vi' | 'id' | 'tr' | 'pl' | 'nl' | 'sv' | 'da'
  | 'fi' | 'no' | 'cs' | 'hu' | 'ro' | 'el' | 'he' | 'uk' | 'bg' | 'hr'
  | 'sk' | 'sl' | 'sr' | 'mk' | 'sq' | 'et' | 'lv' | 'lt' | 'is' | 'ga'
  | 'mt' | 'cy' | 'ca' | 'eu' | 'gl' | 'af' | 'sw' | 'zu' | 'xh' | 'yo'
  | 'ig' | 'ha' | 'am' | 'ti' | 'om' | 'so' | 'mg' | 'ny' | 'sn' | 'st'
  | 'tn' | 've' | 'ts' | 'ss' | 'nr' | 'nso' | 'zu' | 'xh' | 'af' | 'sw'
  | 'bn' | 'gu' | 'pa' | 'ta' | 'te' | 'kn' | 'ml' | 'si' | 'my' | 'km'
  | 'lo' | 'ka' | 'hy' | 'az' | 'kk' | 'ky' | 'uz' | 'mn' | 'ne' | 'si'
  | 'my' | 'km' | 'lo' | 'ka' | 'hy' | 'az' | 'kk' | 'ky' | 'uz' | 'mn'
  | 'ms' | 'tl' | 'haw' | 'co' | 'eo' | 'fy' | 'gd' | 'ht' | 'hmn' | 'lb'
  | 'mi' | 'sm' | 'su' | 'tg' | 'tt' | 'ug' | 'yi';

// Language information for display
export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

// Comprehensive list of Google Translate supported languages
export const GOOGLE_TRANSLATE_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文 (简体)' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbek' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
  { code: 'my', name: 'Myanmar (Burmese)', nativeName: 'မြန်မာ' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ' },
];

interface TranslationCache {
  [key: string]: string;
}

// Cache to avoid repeated API calls for the same text
const translationCache: Map<string, TranslationCache> = new Map();

/**
 * Translate text using Google Translate
 * @param text - Text to translate
 * @param targetLang - Target language code (default: 'es' for Spanish)
 * @param sourceLang - Source language code (default: 'en' for English)
 * @returns Translated text
 */
export async function translateText(
  text: string,
  targetLang: LanguageCode = 'es',
  sourceLang: LanguageCode = 'en'
): Promise<string> {
  // Return original text if target language is same as source
  if (targetLang === sourceLang) {
    return text;
  }

  // Check cache first
  const cacheKey = `${sourceLang}-${targetLang}`;
  if (!translationCache.has(cacheKey)) {
    translationCache.set(cacheKey, {});
  }
  const cache = translationCache.get(cacheKey)!;
  
  if (cache[text]) {
    return cache[text];
  }

  try {
    // Use Google Translate free API endpoint
    // Note: For production, consider using official Google Translate API with backend proxy
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('Translation API failed, returning original text');
      return text;
    }

    const data = await response.json();
    
    // Extract translated text from response
    // Response format: [[["translated text", "original text", null, null, 0]], null, "en"]
    let translatedText = text;
    if (Array.isArray(data) && Array.isArray(data[0]) && data[0].length > 0) {
      const translatedParts: string[] = [];
      for (const item of data[0]) {
        if (Array.isArray(item) && item[0] && typeof item[0] === 'string') {
          translatedParts.push(item[0]);
        }
      }
      translatedText = translatedParts.join(' ') || text;
    }

    // Cache the translation
    cache[text] = translatedText;
    return translatedText;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('Translation request timed out, returning original text');
    } else {
      console.error('Translation error:', error);
    }
    return text; // Return original text on error
  }
}

/**
 * Translate multiple texts in batches to avoid overwhelming the API
 * @param texts - Array of texts to translate
 * @param targetLang - Target language code
 * @param sourceLang - Source language code
 * @returns Array of translated texts
 */
export async function translateMultiple(
  texts: string[],
  targetLang: LanguageCode = 'es',
  sourceLang: LanguageCode = 'en'
): Promise<string[]> {
  // Return early if no texts or same language
  if (texts.length === 0 || targetLang === sourceLang) {
    return texts;
  }

  // Filter out empty strings and duplicates
  const uniqueTexts = Array.from(new Set(texts.filter(t => t && t.trim())));
  
  if (uniqueTexts.length === 0) {
    return texts;
  }

  // Batch translations to avoid too many parallel requests
  const BATCH_SIZE = 5; // Process 5 translations at a time
  const translationMap = new Map<string, string>();

  try {
    for (let i = 0; i < uniqueTexts.length; i += BATCH_SIZE) {
      const batch = uniqueTexts.slice(i, i + BATCH_SIZE);
      
      // Translate batch with error handling for each item
      const batchPromises = batch.map(async (text) => {
        try {
          const translated = await translateText(text, targetLang, sourceLang);
          return { text, translated };
        } catch (error) {
          console.warn(`Failed to translate "${text}":`, error);
          return { text, translated: text }; // Fallback to original
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ text, translated }) => {
        translationMap.set(text, translated);
      });

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < uniqueTexts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    console.error('Error in batch translation:', error);
    // Continue with what we have
  }

  // Return translations in original order
  return texts.map(text => {
    if (!text || !text.trim()) return text;
    return translationMap.get(text.trim()) || text;
  });
}

/**
 * Clear translation cache
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

