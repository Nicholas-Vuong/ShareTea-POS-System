import { useState } from 'react';
import { Order } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleOrderCardProps {
  order: Order;
  onStatusChange?: (orderId: string, status: 'PREPARING' | 'READY' | 'COMPLETED') => void;
}

export const CollapsibleOrderCard = ({ order, onStatusChange }: CollapsibleOrderCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColors = {
    PLACED: 'bg-yellow-500',
    PREPARING: 'bg-blue-500',
    READY: 'bg-green-500',
    COMPLETED: 'bg-gray-500',
  };

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const orderDate = new Date(order.createdAt);

  return (
    <Card className="p-3 space-y-2">
      {/* Collapsed Header */}
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-xl font-bold text-primary">#{order.orderId.slice(-6)}</div>
          <Badge className={statusColors[order.status]}>{order.status}</Badge>
          <div className="text-sm text-muted-foreground flex-shrink-0">
            {orderDate.toLocaleDateString()} {orderDate.toLocaleTimeString()}
          </div>
          <div className="text-sm text-muted-foreground flex-shrink-0">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-3 pt-2 border-t">
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="border-l-4 border-primary pl-3 py-2">
                <p className="font-semibold text-lg">
                  {item.quantity}x {item.name}
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Size: {item.options.size}</p>
                  <p>Sugar: {item.options.sugar}%</p>
                  <p>Ice: {item.options.ice}</p>
                  {item.options.temperature && <p>Temperature: {item.options.temperature}</p>}
                  {item.options.toppings && item.options.toppings.length > 0 && (
                    <p className="font-medium">+ {item.options.toppings.join(', ')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {order.status === 'COMPLETED' && onStatusChange && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(order.orderId, 'PREPARING');
              }}
              variant="outline"
              className="w-full touch-target"
              size="lg"
            >
              Re-open Order
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

