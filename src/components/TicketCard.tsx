import { Order } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TicketCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: 'PREPARING' | 'READY' | 'COMPLETED') => void;
}

/**
 * Categorize priority score into meaningful labels
 * @param priority - The priority score
 * @returns Object with label and color class
 */
function getPriorityCategory(priority: number): { label: string; color: string } {
  if (priority >= 20) {
    return { label: 'Critical', color: 'bg-red-600' };
  } else if (priority >= 12) {
    return { label: 'High', color: 'bg-orange-500' };
  } else if (priority >= 6) {
    return { label: 'Medium', color: 'bg-yellow-500' };
  } else {
    return { label: 'Low', color: 'bg-green-500' };
  }
}

export const TicketCard = ({ order, onStatusChange }: TicketCardProps) => {
  const statusColors = {
    PLACED: 'bg-yellow-500',
    PREPARING: 'bg-blue-500',
    READY: 'bg-green-500',
    COMPLETED: 'bg-gray-500',
  };

  const priorityCategory = order.priority !== undefined 
    ? getPriorityCategory(order.priority) 
    : null;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-3xl font-bold text-primary">#{order.orderId.slice(-6)}</h3>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className={statusColors[order.status]}>{order.status}</Badge>
          {priorityCategory && (
            <Badge className={`${priorityCategory.color} text-white text-xs`}>
              {priorityCategory.label} Priority
            </Badge>
          )}
        </div>
      </div>

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

      {order.status === 'PLACED' && (
        <Button
          onClick={() => onStatusChange(order.orderId, 'PREPARING')}
          className="w-full touch-target"
          size="lg"
        >
          Start Preparing
        </Button>
      )}
      {order.status === 'PREPARING' && (
        <Button
          onClick={() => onStatusChange(order.orderId, 'READY')}
          variant="default"
          className="w-full touch-target bg-success hover:bg-success/90"
          size="lg"
        >
          Mark Ready
        </Button>
      )}
      {order.status === 'READY' && (
        <Button
          onClick={() => onStatusChange(order.orderId, 'COMPLETED')}
          variant="default"
          className="w-full touch-target bg-gray-600 hover:bg-gray-700"
          size="lg"
        >
          Mark Completed
        </Button>
      )}
      {order.status === 'COMPLETED' && (
        <Button
          onClick={() => onStatusChange(order.orderId, 'PREPARING')}
          variant="outline"
          className="w-full touch-target"
          size="lg"
        >
          Re-open Order
        </Button>
      )}
    </Card>
  );
};
