import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAccessibilityStore } from '@/store/accessibilityStore';
import { GOOGLE_TRANSLATE_LANGUAGES, LanguageCode } from '@/lib/translate';
import { Languages, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LanguageSelector = () => {
  const { language, setLanguage } = useAccessibilityStore();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentLanguage = GOOGLE_TRANSLATE_LANGUAGES.find(lang => lang.code === language) || GOOGLE_TRANSLATE_LANGUAGES[0];

  // Filter languages based on search query
  const filteredLanguages = GOOGLE_TRANSLATE_LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLanguageSelect = (langCode: LanguageCode) => {
    setLanguage(langCode);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={language !== 'en' ? 'default' : 'outline'}
          size="icon"
          aria-label="Select language"
          className="touch-target"
        >
          <Languages className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search languages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            Current: <span className="text-foreground">{currentLanguage.name}</span>
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="p-2">
            {filteredLanguages.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No languages found
              </div>
            ) : (
              <div className="space-y-1">
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground outline-none",
                      language === lang.code && "bg-accent text-accent-foreground font-medium"
                    )}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{lang.name}</span>
                      <span className="text-xs text-muted-foreground">{lang.nativeName}</span>
                    </div>
                    {language === lang.code && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

