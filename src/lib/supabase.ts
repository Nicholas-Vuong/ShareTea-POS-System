import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
  },
});

// Database types matching your schema
export interface Database {
  public: {
    Tables: {
      menu_items: {
        Row: {
          menu_item_id: number;
          name: string;
          category: string | null;
          active: boolean;
          default_price: number;
          description: string | null;
          usda_fdc_id: number | null;
          created_at: string;
        };
        Insert: {
          menu_item_id?: number;
          name: string;
          category?: string | null;
          active?: boolean;
          default_price: number;
          description?: string | null;
          usda_fdc_id?: number | null;
          created_at?: string;
        };
        Update: {
          menu_item_id?: number;
          name?: string;
          category?: string | null;
          active?: boolean;
          default_price?: number;
          description?: string | null;
          usda_fdc_id?: number | null;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          order_id: number;
          customer_id: number | null;
          created_by: number | null;
          order_time: string;
          status: 'PLACED' | 'PREPARING' | 'READY' | 'COMPLETED';
          subtotal: number;
          discounts: number;
          tax: number;
          total: number;
          payment_method: string | null;
          note: string | null;
          source: 'kiosk' | 'cashier' | null;
        };
        Insert: {
          order_id?: number;
          customer_id?: number | null;
          created_by?: number | null;
          order_time?: string;
          status?: 'PLACED' | 'PREPARING' | 'READY' | 'COMPLETED';
          subtotal?: number;
          discounts?: number;
          tax?: number;
          total?: number;
          payment_method?: string | null;
          note?: string | null;
          source?: 'kiosk' | 'cashier' | null;
        };
        Update: {
          order_id?: number;
          customer_id?: number | null;
          created_by?: number | null;
          order_time?: string;
          status?: 'PLACED' | 'PREPARING' | 'READY' | 'COMPLETED';
          subtotal?: number;
          discounts?: number;
          tax?: number;
          total?: number;
          payment_method?: string | null;
          note?: string | null;
          source?: 'kiosk' | 'cashier' | null;
        };
      };
      order_items: {
        Row: {
          order_item_id: number;
          order_id: number;
          menu_item_id: number;
          quantity: number;
          unit_price: number;
          subtotal: number;
          options: Record<string, any>;
          prepared_by: number | null;
          prepared_at: string | null;
          created_at: string;
        };
        Insert: {
          order_item_id?: number;
          order_id: number;
          menu_item_id: number;
          quantity: number;
          unit_price: number;
          subtotal: number;
          options?: Record<string, any>;
          prepared_by?: number | null;
          prepared_at?: string | null;
          created_at?: string;
        };
        Update: {
          order_item_id?: number;
          order_id?: number;
          menu_item_id?: number;
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
          options?: Record<string, any>;
          prepared_by?: number | null;
          prepared_at?: string | null;
          created_at?: string;
        };
      };
      users: {
        Row: {
          user_id: number;
          username: string;
          full_name: string;
          role_id: number;
          email: string | null;
          created_at: string;
        };
        Insert: {
          user_id?: number;
          username: string;
          full_name: string;
          role_id: number;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: number;
          username?: string;
          full_name?: string;
          role_id?: number;
          email?: string | null;
          created_at?: string;
        };
      };
      inventory_items: {
        Row: {
          inventory_item_id: number;
          sku: string | null;
          name: string;
          unit: string;
          on_hand_quantity: number;
          servings_per_unit: number;
          reorder_point: number;
          cost_per_unit: number;
          last_received_at: string | null;
          created_at: string;
        };
        Insert: {
          inventory_item_id?: number;
          sku?: string | null;
          name: string;
          unit: string;
          on_hand_quantity?: number;
          servings_per_unit?: number;
          reorder_point?: number;
          cost_per_unit?: number;
          last_received_at?: string | null;
          created_at?: string;
        };
        Update: {
          inventory_item_id?: number;
          sku?: string | null;
          name?: string;
          unit?: string;
          on_hand_quantity?: number;
          servings_per_unit?: number;
          reorder_point?: number;
          cost_per_unit?: number;
          last_received_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      low_stock_items: {
        Row: {
          inventory_id: number;
          name: string;
          on_hand_quantity: number;
          reorder_point: number;
        };
      };
      kitchen_queue: {
        Row: {
          order_id: number;
          status: string;
          created_at: string;
          source: string | null;
          items: Array<{
            name: string;
            options: Record<string, any>;
          }>;
        };
      };
    };
  };
}



