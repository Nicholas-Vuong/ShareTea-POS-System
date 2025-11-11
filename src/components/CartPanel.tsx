import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAccessibilityStore } from '@/store/accessibilityStore';
import { translateText, translateMultiple } from '@/lib/translate';

interface CartPanelProps {
  onCheckout: () => void;
}

const translations = {
  en: {
    cart: 'Cart',
    empty: 'Your cart is empty',
    remove: 'Remove',
    subtotal: 'Subtotal',
    checkout: 'Checkout',
    quantity: 'Qty',
    sugar: 'sugar',
  },
  es: {
    cart: 'Carrito',
    empty: 'Tu carrito está vacío',
    remove: 'Eliminar',
    subtotal: 'Subtotal',
    checkout: 'Pagar',
    quantity: 'Cant',
    sugar: 'azúcar',
  },
};

export const CartPanel = ({ onCheckout }: CartPanelProps) => {
  const { items, removeItemByIndex, getTotal } = useCartStore();
  const t = useTranslation(translations);
  const { language } = useAccessibilityStore();
  const [translatedOptions, setTranslatedOptions] = useState<Map<string, { size: string; ice: string; toppings: Map<string, string> }>>(new Map());

  // Translate size and ice options for all items
  useEffect(() => {
    let cancelled = false;

    const translateOptions = async () => {
      if (language === 'en' || items.length === 0) {
        setTranslatedOptions(new Map());
        return;
      }

      try {
        const uniqueSizes = Array.from(new Set(items.map(item => item.options.size)));
        const uniqueIce = Array.from(new Set(items.map(item => item.options.ice)));
        const allToppings = Array.from(new Set(items.flatMap(item => item.options.toppings)));

        const translatedSizes = await translateMultiple(uniqueSizes, language, 'en');
        const translatedIce = await translateMultiple(uniqueIce, language, 'en');
        const translatedToppings = allToppings.length > 0 
          ? await translateMultiple(allToppings, language, 'en')
          : [];

        if (cancelled) return;

        const sizeMap = new Map<string, string>();
        uniqueSizes.forEach((size, index) => {
          sizeMap.set(size, translatedSizes[index] || size);
        });

        const iceMap = new Map<string, string>();
        uniqueIce.forEach((ice, index) => {
          iceMap.set(ice, translatedIce[index] || ice);
        });

        const toppingMap = new Map<string, string>();
        allToppings.forEach((topping, index) => {
          toppingMap.set(topping, translatedToppings[index] || topping);
        });

        const optionsMap = new Map<string, { size: string; ice: string; toppings: Map<string, string> }>();
        items.forEach((item) => {
          optionsMap.set(`${item.menuItemId}-${JSON.stringify(item.options)}`, {
            size: sizeMap.get(item.options.size) || item.options.size,
            ice: iceMap.get(item.options.ice) || item.options.ice,
            toppings: toppingMap,
          });
        });

        if (!cancelled) {
          setTranslatedOptions(optionsMap);
        }
      } catch (error) {
        console.error('Error translating options:', error);
        if (!cancelled) {
          setTranslatedOptions(new Map());
        }
      }
    };

    translateOptions();

    return () => {
      cancelled = true;
    };
  }, [items, language]);

  return (
    <Card className="p-4 h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4">{t.cart}</h2>
      
      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{t.empty}</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {items.map((item, index) => {
              const optionKey = `${item.menuItemId}-${JSON.stringify(item.options)}`;
              const translated = translatedOptions.get(optionKey);
              const displaySize = translated?.size || item.options.size;
              const displayIce = translated?.ice || item.options.ice;
              const displayToppings = item.options.toppings.map(topping => 
                translated?.toppings.get(topping) || topping
              );

              return (
                <div key={`${item.menuItemId}-${index}`} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {displaySize} • {item.options.sugar}% {t.sugar} • {displayIce}
                      </p>
                      {displayToppings.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          + {displayToppings.join(', ')}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItemByIndex(index)}
                      className="text-destructive"
                      aria-label={t.remove}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t.quantity}: {item.quantity}</span>
                    <span className="font-bold">${item.subtotal.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold">{t.subtotal}</span>
              <span className="font-bold text-2xl">${getTotal().toFixed(2)}</span>
            </div>
            <Button
              onClick={onCheckout}
              className="w-full touch-target"
              size="lg"
              disabled={items.length === 0}
            >
              {t.checkout}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};
