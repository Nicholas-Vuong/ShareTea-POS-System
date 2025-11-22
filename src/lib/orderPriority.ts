import { Order, OrderItem, MenuItem } from './api';

/**
 * Calculate preparation time for a single item based on its complexity
 * @param item - The order item with quantity and options
 * @param menuItem - The menu item to get category/type information
 * @returns Estimated preparation time in minutes
 */
export function calculateItemPrepTime(item: OrderItem, menuItem: MenuItem): number {
  // Base time per item type/category
  // Drinks typically take less time than food items
  const baseTimeByCategory: Record<string, number> = {
    'Drinks': 2,
    'Beverages': 2,
    'Tea': 2,
    'Coffee': 2.5,
    'Food': 4,
    'Snacks': 3,
    'Desserts': 3.5,
  };

  // Default base time if category not found
  const baseTime = baseTimeByCategory[menuItem.category] || 3;

  // Add time for complexity
  // Each topping adds 0.5 minutes
  const toppingTime = (item.options.toppings?.length || 0) * 0.5;
  
  // Customizations add 0.3 minutes (size changes, sugar/ice adjustments)
  const customizationTime = 0.3;

  // Total time per item
  const timePerItem = baseTime + toppingTime + customizationTime;

  // Multiply by quantity
  return timePerItem * item.quantity;
}

/**
 * Calculate total preparation time for an entire order
 * @param order - The order with items
 * @param menuItems - Map of menu items by ID for lookup
 * @returns Estimated total preparation time in minutes
 */
export function calculateOrderPrepTime(
  order: Order,
  menuItems: Map<string, MenuItem>
): number {
  let totalTime = 0;

  for (const item of order.items) {
    // Find the menu item - we need to match by name or have menu item ID
    // For now, we'll use a simple approach: find by name
    let menuItem: MenuItem | undefined;
    
    // Try to find menu item by name
    for (const [id, mi] of menuItems.entries()) {
      if (mi.name === item.name) {
        menuItem = mi;
        break;
      }
    }

    // If not found, use a default menu item with the item's name
    if (!menuItem) {
      menuItem = {
        id: '',
        name: item.name,
        category: 'Drinks', // Default category
        price: 0,
        description: '',
        active: true,
      };
    }

    const orderItem: OrderItem = {
      menuItemId: menuItem.id,
      quantity: item.quantity,
      options: item.options,
    };

    totalTime += calculateItemPrepTime(orderItem, menuItem);
  }

  // Add buffer time: +1 minute per additional item beyond the first
  if (order.items.length > 1) {
    totalTime += (order.items.length - 1) * 1;
  }

  return totalTime;
}

/**
 * Calculate priority score for an order
 * Higher score = higher priority (should be prepared first)
 * Priority = (order age in minutes) + (estimated prep time in minutes)
 * @param order - The order to calculate priority for
 * @param menuItems - Map of menu items by ID for lookup
 * @returns Priority score (higher = more urgent)
 */
export function calculateOrderPriority(
  order: Order,
  menuItems: Map<string, MenuItem>
): number {
  // Calculate order age in minutes
  const orderTime = new Date(order.createdAt);
  const now = new Date();
  const ageInMinutes = Math.max(0, (now.getTime() - orderTime.getTime()) / (1000 * 60));

  // Calculate estimated prep time
  const estimatedPrepTime = calculateOrderPrepTime(order, menuItems);

  // Priority score = age + prep time
  // Older orders with longer prep times get higher priority
  return ageInMinutes + estimatedPrepTime;
}

/**
 * Sort orders by priority (highest priority first)
 * @param orders - Array of orders to sort
 * @param menuItems - Map of menu items by ID for lookup
 * @returns Sorted array of orders with priority scores
 */
export function sortOrdersByPriority(
  orders: Order[],
  menuItems: Map<string, MenuItem>
): Order[] {
  // Calculate priority for each order
  const ordersWithPriority = orders.map((order) => ({
    order,
    priority: calculateOrderPriority(order, menuItems),
    estimatedPrepTime: calculateOrderPrepTime(order, menuItems),
  }));

  // Sort by priority (highest first)
  ordersWithPriority.sort((a, b) => b.priority - a.priority);

  // Return orders with priority and estimated prep time attached
  return ordersWithPriority.map(({ order, priority, estimatedPrepTime }) => ({
    ...order,
    priority,
    estimatedPrepTime,
  }));
}

