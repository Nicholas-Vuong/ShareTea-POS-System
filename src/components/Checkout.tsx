import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft } from 'lucide-react';
import { useAccessibilityStore } from '@/store/accessibilityStore';

interface CheckoutProps {
  onBack: () => void;
  onComplete: (paymentMethod: string, promoCode: string | null) => void;
}

const translations = {
  en: {
    checkout: 'Checkout',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    card: 'Card',
    mobile: 'Mobile Payment',
    promoCode: 'Promo Code',
    enterPromoCode: 'Enter promo code',
    apply: 'Apply',
    remove: 'Remove',
    orderSummary: 'Order Summary',
    subtotal: 'Subtotal',
    discount: 'Discount',
    tax: 'Tax',
    total: 'Total',
    completeOrder: 'Complete Order',
    back: 'Back',
    invalidPromoCode: 'Invalid promo code',
  },
  es: {
    checkout: 'Pago',
    paymentMethod: 'Método de pago',
    cash: 'Efectivo',
    card: 'Tarjeta',
    mobile: 'Pago móvil',
    promoCode: 'Código promocional',
    enterPromoCode: 'Ingrese código promocional',
    apply: 'Aplicar',
    remove: 'Eliminar',
    orderSummary: 'Resumen del pedido',
    subtotal: 'Subtotal',
    discount: 'Descuento',
    tax: 'Impuesto',
    total: 'Total',
    completeOrder: 'Completar pedido',
    back: 'Atrás',
    invalidPromoCode: 'Código promocional inválido',
  },
};

// Simple promo code validation - can be extended with API call
const validatePromoCode = (code: string): number => {
  const promoCodes: Record<string, number> = {
    'SAVE10': 0.10, // 10% off
    'SAVE20': 0.20, // 20% off
    'WELCOME': 0.15, // 15% off
  };
  return promoCodes[code.toUpperCase()] || 0;
};

export const Checkout = ({ onBack, onComplete }: CheckoutProps) => {
  const { items, getTotal } = useCartStore();
  const { language } = useAccessibilityStore();
  const t = translations[language];

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoError, setPromoError] = useState('');

  const subtotal = getTotal();
  const discount = subtotal * discountPercent;
  const tax = (subtotal - discount) * 0.0825; // 8.25% tax
  const total = subtotal - discount + tax;

  const handleApplyPromoCode = () => {
    if (!promoCode.trim()) {
      setPromoError('');
      return;
    }

    const discount = validatePromoCode(promoCode);
    if (discount > 0) {
      setAppliedPromoCode(promoCode.toUpperCase());
      setDiscountPercent(discount);
      setPromoError('');
      setPromoCode('');
    } else {
      setPromoError(t.invalidPromoCode);
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedPromoCode(null);
    setDiscountPercent(0);
    setPromoCode('');
    setPromoError('');
  };

  const handleComplete = () => {
    onComplete(paymentMethod, appliedPromoCode);
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
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mobile" id="payment-mobile" className="touch-target" />
                      <Label htmlFor="payment-mobile" className="cursor-pointer">
                        {t.mobile}
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-lg font-semibold mb-3 block">{t.promoCode}</Label>
                {appliedPromoCode ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <span className="flex-1 font-semibold">{appliedPromoCode}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemovePromoCode}
                      className="touch-target"
                    >
                      {t.remove}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder={t.enterPromoCode}
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value);
                          setPromoError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleApplyPromoCode();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleApplyPromoCode}
                        variant="outline"
                        className="touch-target"
                      >
                        {t.apply}
                      </Button>
                    </div>
                    {promoError && (
                      <p className="text-sm text-destructive">{promoError}</p>
                    )}
                  </div>
                )}
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
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>{t.discount}</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
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
              disabled={items.length === 0}
            >
              {t.completeOrder}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

