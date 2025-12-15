import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Printer } from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  options: {
    size: string;
    sugar: number;
    ice: string;
    toppings: string[];
  };
}

interface CashierReceiptProps {
  orderId: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  onNewOrder: () => void;
}

export const CashierReceipt = ({
  orderId,
  orderDate,
  items,
  subtotal,
  tax,
  total,
  paymentMethod,
  onNewOrder,
}: CashierReceiptProps) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 print:shadow-none">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-primary mb-2">Sharetea</h1>
              <p className="text-muted-foreground">Receipt</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order #</span>
                <span className="font-semibold">#{orderId.slice(-6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{new Date(orderDate).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="capitalize">{paymentMethod}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Items</h2>
              {items.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-semibold">${item.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground pl-4">
                    <div>
                      {item.options.size} • {item.options.sugar}% sugar • {item.options.ice}
                      {item.options.temperature && ` • ${item.options.temperature}`}
                    </div>
                    {item.options.toppings.length > 0 && (
                      <div>+ {item.options.toppings.join(', ')}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <Separator />

            <div className="text-center text-muted-foreground text-sm">
              <p>Thank you for your order!</p>
              <p className="mt-2">Order #{orderId.slice(-6)}</p>
            </div>

            <div className="flex gap-3 print:hidden">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex-1 touch-target"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
              <Button
                onClick={onNewOrder}
                className="flex-1 touch-target"
              >
                New Order
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

