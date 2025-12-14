import { Button } from '@/components/ui/button';
import { useAccessibilityStore } from '@/store/accessibilityStore';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Contrast, ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export const AccessibilityToolbar = () => {
  const { highContrast, textScale, toggleHighContrast, setTextScale } = useAccessibilityStore();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load collapsed state from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('accessibility-toolbar-collapsed');
      return stored === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    // Apply text scale to document root
    const rootFontSize = textScale === 100 ? '16px' : textScale === 125 ? '20px' : '24px';
    document.documentElement.style.fontSize = rootFontSize;
    document.documentElement.setAttribute('data-text-scale', String(textScale));
  }, [textScale]);

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessibility-toolbar-collapsed', String(newCollapsed));
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 rounded-lg bg-card p-2 shadow-lg border border-border transition-all duration-300 accessibility-toolbar max-w-fit">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCollapse}
        aria-label={isCollapsed ? 'Expand accessibility toolbar' : 'Collapse accessibility toolbar'}
        className="self-end touch-target h-6 w-6"
      >
        {isCollapsed ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      {!isCollapsed && (
        <div className="flex gap-2">
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

          <LanguageSelector />
        </div>
      )}
    </div>
  );
};
