import { useState, useEffect } from 'react';
import { MenuItem } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { useAccessibilityStore } from '@/store/accessibilityStore';
import { translateMultiple } from '@/lib/translate';

interface MenuListProps {
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
  selectedCategory?: string;
}

const translations = {
  en: {
    addToOrder: 'Add to Order',
  },
  es: {
    addToOrder: 'Agregar al pedido',
  },
};

export const MenuList = ({ items, onSelect, selectedCategory }: MenuListProps) => {
  const t = useTranslation(translations);
  const { language } = useAccessibilityStore();
  const [translatedItems, setTranslatedItems] = useState<Map<string, { name: string; description: string }>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const translateItems = async () => {
      if (language === 'en') {
        setTranslatedItems(new Map());
        return;
      }

      const filteredItems = selectedCategory
        ? items.filter((item) => item.category === selectedCategory && item.active)
        : items.filter((item) => item.active);

      if (filteredItems.length === 0) return;

      try {
        const names = filteredItems.map(item => item.name);
        const descriptions = filteredItems.map(item => item.description || '');

        const translatedNames = await translateMultiple(names, language, 'en');
        const translatedDescriptions = await translateMultiple(descriptions, language, 'en');

        if (cancelled) return;

        const translatedMap = new Map<string, { name: string; description: string }>();
        filteredItems.forEach((item, index) => {
          translatedMap.set(item.id, {
            name: translatedNames[index] || item.name,
            description: translatedDescriptions[index] || item.description || '',
          });
        });

        if (!cancelled) {
          setTranslatedItems(translatedMap);
        }
      } catch (error) {
        console.error('Error translating menu items:', error);
        if (!cancelled) {
          setTranslatedItems(new Map());
        }
      }
    };

    translateItems();

    return () => {
      cancelled = true;
    };
  }, [items, selectedCategory, language]);

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory && item.active)
    : items.filter((item) => item.active);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {filteredItems.map((item) => {
        const translated = translatedItems.get(item.id);
        const displayName = translated?.name || item.name;
        const displayDescription = translated?.description || item.description || '';

        return (
          <Card key={item.id} className="p-4 hover:shadow-lg transition-shadow w-full max-w-full">
            <div className="space-y-2 w-full">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold text-lg break-words flex-1 min-w-0">{displayName}</h3>
                <span className="text-lg font-bold text-primary flex-shrink-0">${item.price.toFixed(2)}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 break-words">{displayDescription}</p>
              <Button
                onClick={() => onSelect(item)}
                className="w-full touch-target"
                size="lg"
              >
                {t.addToOrder}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
