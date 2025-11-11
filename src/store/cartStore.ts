import { create } from 'zustand';

export interface CartItemOptions {
  size: 'Small' | 'Medium' | 'Large';
  sugar: number;
  ice: 'No Ice' | 'Less Ice' | 'Normal' | 'Extra Ice';
  toppings: string[];
}

export interface CartItem {
  menuItemId: string;
  name: string;
  quantity: number;
  options: CartItemOptions;
  price: number;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (menuItemId: string, quantity: number, options?: CartItemOptions) => void;
  removeItem: (menuItemId: string, options?: CartItemOptions) => void;
  removeItemByIndex: (index: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      const existingIndex = state.items.findIndex(
        (i) => i.menuItemId === item.menuItemId && 
        JSON.stringify(i.options) === JSON.stringify(item.options)
      );
      
      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex].quantity += item.quantity;
        newItems[existingIndex].subtotal = newItems[existingIndex].quantity * newItems[existingIndex].price;
        return { items: newItems };
      }
      
      return { items: [...state.items, item] };
    }),
  updateQuantity: (menuItemId, quantity, options) =>
    set((state) => ({
      items: state.items.map((item) => {
        if (item.menuItemId === menuItemId) {
          if (options) {
            // Match by both menuItemId and options
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
  removeItem: (menuItemId, options) =>
    set((state) => ({
      items: state.items.filter((item) => {
        if (item.menuItemId !== menuItemId) return true;
        if (options) {
          return JSON.stringify(item.options) !== JSON.stringify(options);
        }
        return false;
      }),
    })),
  removeItemByIndex: (index) =>
    set((state) => ({
      items: state.items.filter((_, i) => i !== index),
    })),
  clearCart: () => set({ items: [] }),
  getTotal: () => {
    const state = get();
    return state.items.reduce((sum, item) => sum + item.subtotal, 0);
  },
}));
