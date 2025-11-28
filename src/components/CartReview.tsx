import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Plus, Minus, ArrowLeft, ArrowRight, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';
import { useAccessibilityStore } from '@/store/accessibilityStore';
import { translateMultiple } from '@/lib/translate';

interface CartReviewProps {
  onBack: () => void;
  onProceed: () => void;
  onEditItem?: (index: number) => void;
}

const translations = {
  en: {
    reviewOrder: 'Review Your Order',
    cart: 'Cart',
    empty: 'Your cart is empty',
    remove: 'Remove',
    subtotal: 'Subtotal',
    proceedToCheckout: 'Proceed to Checkout',
    back: 'Back',
    quantity: 'Quantity',
    edit: 'Edit',
    sugar: 'sugar',
  },
  es: {
    reviewOrder: 'Revisar su pedido',
    cart: 'Carrito',
    empty: 'Tu carrito está vacío',
    remove: 'Eliminar',
    subtotal: 'Subtotal',
    proceedToCheckout: 'Continuar al pago',
    back: 'Atrás',
    quantity: 'Cantidad',
    edit: 'Editar',
    sugar: 'azúcar',
  },
};

export const CartReview = ({ onBack, onProceed, onEditItem }: CartReviewProps) => {
  const { items, removeItemByIndex, updateQuantity, getTotal } = useCartStore();
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

  const handleQuantityChange = (index: number, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity > 0 && newQuantity <= 99) {
      const item = items[index];
      updateQuantity(item.menuItemId, newQuantity, item.options);
    }
  };

  const handleQuantityInputChange = (index: number, value: string) => {
    const item = items[index];
    if (!item) return;
    
    // Allow empty input while typing
    if (value === '') {
      return;
    }
    
    const numValue = parseInt(value, 10);
    
    // Validate: must be a number between 1 and 99
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 99) {
      updateQuantity(item.menuItemId, numValue, item.options);
    }
  };

  const handleQuantityInputBlur = (index: number, value: string) => {
    const item = items[index];
    if (!item) return;
    
    // If input is empty or invalid, restore to current quantity
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1 || numValue > 99) {
      // Restore to current quantity
      const input = document.getElementById(`quantity-input-${index}`) as HTMLInputElement;
      if (input) {
        input.value = item.quantity.toString();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" onClick={onBack} className="touch-target">
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t.back}
          </Button>
        </div>

        <Card className="p-6">
          <h1 className="text-3xl font-bold mb-6">{t.reviewOrder}</h1>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-lg mb-4">{t.empty}</p>
              <Button onClick={onBack} className="touch-target">
                {t.back}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {items.map((item, index) => {
                  const optionKey = `${item.menuItemId}-${JSON.stringify(item.options)}`;
                  const translated = translatedOptions.get(optionKey);
                  const displaySize = translated?.size || item.options.size;
                  const displayIce = translated?.ice || item.options.ice;
                  const displayToppings = item.options.toppings.map(topping => 
                    translated?.toppings.get(topping) || topping
                  );

                  return (
                    <div key={`${item.menuItemId}-${index}`} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {displaySize} • {item.options.sugar}% {t.sugar} • {displayIce}
                            {item.options.temperature && ` • ${item.options.temperature}`}
                          </p>
                          {displayToppings.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              + {displayToppings.join(', ')}
                            </p>
                          )}
                        </div>
                      <div className="flex gap-2">
                        {onEditItem && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditItem(index)}
                            className="touch-target flex items-center gap-1"
                            aria-label={t.edit}
                          >
                            <Pencil className="h-4 w-4" />
                            {t.edit}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItemByIndex(index)}
                          className="text-destructive touch-target"
                          aria-label={t.remove}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{t.quantity}:</span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuantityChange(index, item.quantity, -1)}
                            className="h-8 w-8 touch-target"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            id={`quantity-input-${index}`}
                            type="number"
                            min="1"
                            max="99"
                            value={item.quantity}
                            onChange={(e) => handleQuantityInputChange(index, e.target.value)}
                            onBlur={(e) => handleQuantityInputBlur(index, e.target.value)}
                            className="w-16 text-center font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            aria-label={`${t.quantity} for ${item.name}`}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuantityChange(index, item.quantity, 1)}
                            className="h-8 w-8 touch-target"
                            disabled={item.quantity >= 99}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <span className="font-bold text-lg">${item.subtotal.toFixed(2)}</span>
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
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onBack}
                    className="flex-1 touch-target"
                    size="lg"
                  >
                    {t.back}
                  </Button>
                  <Button
                    onClick={onProceed}
                    className="flex-1 touch-target"
                    size="lg"
                  >
                    {t.proceedToCheckout}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

