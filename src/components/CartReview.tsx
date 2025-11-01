import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Plus, Minus, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAccessibilityStore } from '@/store/accessibilityStore';

interface CartReviewProps {
  onBack: () => void;
  onProceed: () => void;
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
  },
};

export const CartReview = ({ onBack, onProceed }: CartReviewProps) => {
  const { items, removeItemByIndex, updateQuantity, getTotal } = useCartStore();
  const { language } = useAccessibilityStore();
  const t = translations[language];

  const handleQuantityChange = (index: number, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity > 0) {
      const item = items[index];
      updateQuantity(item.menuItemId, newQuantity, item.options);
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
                {items.map((item, index) => (
                  <div key={`${item.menuItemId}-${index}`} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
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
                        className="text-destructive touch-target"
                        aria-label={t.remove}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuantityChange(index, item.quantity, 1)}
                            className="h-8 w-8 touch-target"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <span className="font-bold text-lg">${item.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
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

