/**
 * Shopping cart store
 * Manages cart items, quantities, and calculations
 * Handles item addition, removal, quantity updates, and total calculations
 * 
 * Items are matched by menuItemId AND options (same item with different customizations are separate)
 * Uses Zustand for state management
 */
import { create } from 'zustand';

/**
 * Customization options for a cart item
 */
export interface CartItemOptions {
  size: 'Small' | 'Medium' | 'Large';
  sugar: number;
  ice: 'No Ice' | 'Less Ice' | 'Normal' | 'Extra Ice';
  toppings: string[];
}

/**
 * Cart item interface
 * Represents a single item in the shopping cart with its customizations
 */
export interface CartItem {
  menuItemId: string;
  name: string;
  quantity: number;
  options: CartItemOptions;
  price: number;
  subtotal: number;
}

/**
 * Cart state interface
 * Defines all cart operations and state
 */
interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (menuItemId: string, quantity: number, options?: CartItemOptions) => void;
  updateItemByIndex: (index: number, updatedItem: CartItem) => void;
  removeItem: (menuItemId: string, options?: CartItemOptions) => void;
  removeItemByIndex: (index: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

/**
 * Cart store implementation
 * Items are matched by both menuItemId and options JSON string
 * This means the same item with different customizations are treated as separate items
 */
export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  /**
   * Adds an item to the cart
   * If an identical item (same ID and options) exists, increases its quantity
   * Otherwise, adds as a new item
   */
  addItem: (item) =>
    set((state) => {
      // Find existing item with same ID and exact same options
      const existingIndex = state.items.findIndex(
        (i) => i.menuItemId === item.menuItemId && 
        JSON.stringify(i.options) === JSON.stringify(item.options)
      );
      
      // If found, increment quantity and recalculate subtotal
      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex].quantity += item.quantity;
        newItems[existingIndex].subtotal = newItems[existingIndex].quantity * newItems[existingIndex].price;
        return { items: newItems };
      }
      
      // Otherwise, add as new item
      return { items: [...state.items, item] };
    }),
  /**
   * Updates the quantity of a cart item
   * Matches by menuItemId and optionally by options
   * If options not provided, updates first match (backward compatibility)
   */
  updateQuantity: (menuItemId, quantity, options) =>
    set((state) => ({
      items: state.items.map((item) => {
        if (item.menuItemId === menuItemId) {
          if (options) {
            // Match by both menuItemId and options (exact match)
            if (JSON.stringify(item.options) === JSON.stringify(options)) {
              return { ...item, quantity, subtotal: quantity * item.price };
            }
          } else {
            // If no options provided, update first match (backward compatibility)
            return { ...item, quantity, subtotal: quantity * item.price };
          }
        }
        return item;
      }),
    })),
  /**
   * Updates a cart item by its index
   * Useful for editing items in place
   */
  updateItemByIndex: (index, updatedItem) =>
    set((state) => {
      if (index < 0 || index >= state.items.length) {
        return state;
      }
      const items = [...state.items];
      items[index] = updatedItem;
      return { items };
    }),
  /**
   * Removes an item from the cart
   * Matches by menuItemId and optionally by options
   * If options not provided, removes first match
   */
  removeItem: (menuItemId, options) =>
    set((state) => ({
      items: state.items.filter((item) => {
        if (item.menuItemId !== menuItemId) return true;
        if (options) {
          // Only remove if options match exactly
          return JSON.stringify(item.options) !== JSON.stringify(options);
        }
        return false;
      }),
    })),
  /**
   * Removes an item from the cart by its index
   * Direct removal without matching logic
   */
  removeItemByIndex: (index) =>
    set((state) => ({
      items: state.items.filter((_, i) => i !== index),
    })),
  /**
   * Clears all items from the cart
   */
  clearCart: () => set({ items: [] }),
  /**
   * Calculates the total price of all items in the cart
   * Sums up all item subtotals
   * @returns Total cart value
   */
  getTotal: () => {
    const state = get();
    return state.items.reduce((sum, item) => sum + item.subtotal, 0);
  },
}));
