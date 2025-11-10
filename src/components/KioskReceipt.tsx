import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';

interface OrderItem {
  name: string;
  quantity: number;
  subtotal: number;
}

interface KioskReceiptProps {
  orderId: string;
  items: OrderItem[];
  total: number;
  onNewOrder: () => void;
}

const translations = {
  en: {
    orderConfirmed: 'Order Confirmed!',
    orderNumber: 'Your order number is',
    thankYou: 'Thank you for your order',
    orderSummary: 'Order Summary',
    total: 'Total',
    startNewOrder: 'Start New Order',
  },
  es: {
    orderConfirmed: '¡Pedido confirmado!',
    orderNumber: 'Su número de pedido es',
    thankYou: 'Gracias por su pedido',
    orderSummary: 'Resumen del pedido',
    total: 'Total',
    startNewOrder: 'Nuevo pedido',
  },
};

export const KioskReceipt = ({
  orderId,
  items,
  total,
  onNewOrder,
}: KioskReceiptProps) => {
  const t = useTranslation(translations);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-2xl w-full p-12">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-success">{t.orderConfirmed}</h1>
            <p className="text-2xl text-muted-foreground">{t.orderNumber}</p>
            <div className="text-8xl font-bold text-primary py-8">#{orderId.slice(-6)}</div>
            <p className="text-2xl text-muted-foreground">{t.thankYou}</p>
          </div>

          <Separator />

          <div className="text-left space-y-4">
            <h2 className="text-2xl font-semibold">{t.orderSummary}</h2>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.name}
                  </span>
                  <span>${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>{t.total}</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <Button
            onClick={onNewOrder}
            size="lg"
            className="touch-target text-xl px-12 w-full"
          >
            {t.startNewOrder}
          </Button>
        </div>
      </Card>
    </div>
  );
};

