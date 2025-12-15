import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface CheckoutProps {
  onBack: () => void;
  onComplete: (paymentMethod: string) => void;
  isSubmitting?: boolean;
}

const translations = {
  en: {
    checkout: 'Checkout',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    card: 'Card',
    orderSummary: 'Order Summary',
    subtotal: 'Subtotal',
    tax: 'Tax',
    total: 'Total',
    completeOrder: 'Complete Order',
    back: 'Back',
  },
  es: {
    checkout: 'Pago',
    paymentMethod: 'Método de pago',
    cash: 'Efectivo',
    card: 'Tarjeta',
    orderSummary: 'Resumen del pedido',
    subtotal: 'Subtotal',
    tax: 'Impuesto',
    total: 'Total',
    completeOrder: 'Completar pedido',
    back: 'Atrás',
  },
};

export const Checkout = ({ onBack, onComplete, isSubmitting = false }: CheckoutProps) => {
  const { items, getTotal } = useCartStore();
  const t = useTranslation(translations);

  const [paymentMethod, setPaymentMethod] = useState('card');

  const subtotal = getTotal();
  const tax = subtotal * 0.0825; // 8.25% tax
  const total = subtotal + tax;

  const handleComplete = () => {
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }
    onComplete(paymentMethod);
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h1 className="text-3xl font-bold mb-6">{t.checkout}</h1>

            <div className="space-y-6">
              <div>
                <Label className="text-lg font-semibold mb-3 block">{t.paymentMethod}</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="payment-cash" className="touch-target" />
                      <Label htmlFor="payment-cash" className="cursor-pointer">
                        {t.cash}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card" id="payment-card" className="touch-target" />
                      <Label htmlFor="payment-card" className="cursor-pointer">
                        {t.card}
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">{t.orderSummary}</h2>

            <div className="space-y-4 mb-6">
              {items.map((item, index) => (
                <div key={`${item.menuItemId}-${index}`} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.name}
                  </span>
                  <span>${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between">
                <span>{t.subtotal}</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.tax}</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>{t.total}</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={handleComplete}
              className="w-full mt-6 touch-target"
              size="lg"
              disabled={items.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                t.completeOrder
              )}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

