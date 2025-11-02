import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { useAccessibilityStore } from '@/store/accessibilityStore';

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
  },
  es: {
    cart: 'Carrito',
    empty: 'Tu carrito está vacío',
    remove: 'Eliminar',
    subtotal: 'Subtotal',
    checkout: 'Pagar',
  },
};

export const CartPanel = ({ onCheckout }: CartPanelProps) => {
  const { items, removeItemByIndex, getTotal } = useCartStore();
  const { language } = useAccessibilityStore();
  const t = translations[language];

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
            {items.map((item, index) => (
              <div key={`${item.menuItemId}-${index}`} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.options.size} • {item.options.sugar}% sugar • {item.options.ice}
                    </p>
                    {item.options.toppings.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        + {item.options.toppings.join(', ')}
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
                  <span className="text-sm">Qty: {item.quantity}</span>
                  <span className="font-bold">${item.subtotal.toFixed(2)}</span>
                </div>
              </div>
            ))}
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

