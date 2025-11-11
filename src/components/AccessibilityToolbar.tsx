import { Button } from '@/components/ui/button';
import { useAccessibilityStore } from '@/store/accessibilityStore';
import { Contrast, Type, Languages } from 'lucide-react';
import { useEffect } from 'react';

export const AccessibilityToolbar = () => {
  const { highContrast, textScale, language, toggleHighContrast, setTextScale, setLanguage } = useAccessibilityStore();

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.style.fontSize = textScale === 100 ? '16px' : textScale === 125 ? '20px' : '24px';
  }, [textScale]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-2 rounded-lg bg-card p-2 shadow-lg border border-border">
      <Button
        variant={highContrast ? 'default' : 'outline'}
        size="icon"
        onClick={toggleHighContrast}
        aria-label="Toggle high contrast mode"
        className="touch-target"
      >
        <Contrast className="h-5 w-5" />
      </Button>
      
      <div className="flex gap-1">
        <Button
          variant={textScale === 100 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTextScale(100)}
          aria-label="Normal text size"
          className="touch-target"
        >
          A
        </Button>
        <Button
          variant={textScale === 125 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTextScale(125)}
          aria-label="Large text size"
          className="touch-target text-lg"
        >
          A
        </Button>
        <Button
          variant={textScale === 150 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTextScale(150)}
          aria-label="Extra large text size"
          className="touch-target text-xl"
        >
          A
        </Button>
      </div>

      <Button
        variant={language === 'es' ? 'default' : 'outline'}
        size="icon"
        onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
        aria-label="Toggle language"
        className="touch-target"
      >
        <Languages className="h-5 w-5" />
        <span className="sr-only">{language === 'en' ? 'Switch to Spanish' : 'Switch to English'}</span>
      </Button>
    </div>
  );
};
