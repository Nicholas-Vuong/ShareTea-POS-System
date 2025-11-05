import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  active: boolean;
}

export interface LowStockItem {
  inventoryId: string;
  name: string;
  onHandQuantity: number;
  reorderPoint: number;
}

export interface InventoryItem {
  inventoryId: string;
  sku: string;
  name: string;
  unit: string;
  onHandQuantity: number;
  servingsPerUnit: number;
  reorderPoint: number;
  costPerUnit: number;
  lastReceivedAt: string | null;
}

export interface Employee {
  userId: string;
  username: string;
  fullName: string;
  role: string;
  email: string | null;
  createdAt: string;
}

export interface SalesReport {
  date: string;
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface SalesData {
  dailySales: Array<{ date: string; sales: number }>;
  topItems: Array<{ name: string; quantity: number; revenue: number }>;
  categorySales: Array<{ category: string; sales: number }>;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  options: {
    size: string;
    sugar: number;
    ice: string;
    toppings: string[];
  };
}

export interface CreateOrderRequest {
  source: 'kiosk' | 'cashier';
  items: OrderItem[];
  paymentMethod?: string;
  promoCode?: string | null;
  discount?: number;
}

export interface Order {
  orderId: string;
  status: 'PLACED' | 'PREPARING' | 'READY' | 'COMPLETED';
  createdAt: string;
  items: Array<{
    name: string;
    options: {
      size: string;
      sugar: number;
      ice: string;
      toppings: string[];
    };
  }>;
}

export const api = {
  async getMenu(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('active', true)
      .order('category', { ascending: true });

    if (error) throw new Error(`Failed to fetch menu: ${error.message}`);

    // Transform database schema to frontend interface
    return (data || []).map((item) => ({
      id: item.menu_item_id.toString(),
      name: item.name,
      category: item.category || 'Uncategorized',
      price: parseFloat(item.default_price.toString()),
      description: item.description || '',
      active: item.active,
    }));
  },

  async getLowStock(): Promise<LowStockItem[]> {
    // Try the view first if it exists
    const { data: viewData, error: viewError } = await supabase
      .from('low_stock_items')
      .select('*');
    
    if (!viewError && viewData) {
      return (viewData || []).map((item: any) => ({
        inventoryId: (item.inventory_id || item.inventory_item_id).toString(),
        name: item.name,
        onHandQuantity: parseFloat((item.on_hand_quantity || 0).toString()),
        reorderPoint: parseFloat((item.reorder_point || 0).toString()),
      }));
    }

    // Fallback: Query all inventory items and filter in JavaScript
    // (Note: This is less efficient but works if the view doesn't exist)
    const { data: allItems, error } = await supabase
      .from('inventory_items')
      .select('inventory_item_id, name, on_hand_quantity, reorder_point');

    if (error) {
      throw new Error(`Failed to fetch low stock items: ${error.message}`);
    }

    // Filter items where on_hand_quantity <= reorder_point
    const lowStockItems = (allItems || []).filter(
      (item) => parseFloat(item.on_hand_quantity.toString()) <= parseFloat(item.reorder_point.toString())
    );

    return lowStockItems.map((item) => ({
      inventoryId: item.inventory_item_id.toString(),
      name: item.name,
      onHandQuantity: parseFloat(item.on_hand_quantity.toString()),
      reorderPoint: parseFloat(item.reorder_point.toString()),
    }));
  },

  async createOrder(order: CreateOrderRequest): Promise<Order> {
    // Start a transaction by creating the order first
    // Note: source column may not exist, so we'll try without it first
    const orderInsert: any = {
      status: 'PLACED',
      subtotal: 0,
      discounts: 0,
      tax: 0,
      total: 0,
    };
    
    // Try to add source if column exists (will be handled by database)
    try {
      orderInsert.source = order.source;
    } catch (e) {
      // Column doesn't exist, that's okay
    }

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(orderInsert)
      .select()
      .single();

    if (orderError || !orderData) {
      throw new Error(`Failed to create order: ${orderError?.message || 'Unknown error'}`);
    }

    // Calculate totals and create order items
    let subtotal = 0;
    const orderItems = [];

    for (const item of order.items) {
      // Get menu item to get price
      const { data: menuItem, error: menuError } = await supabase
        .from('menu_items')
        .select('default_price')
        .eq('menu_item_id', parseInt(item.menuItemId))
        .single();

      if (menuError || !menuItem) {
        throw new Error(`Menu item not found: ${item.menuItemId}`);
      }

      const unitPrice = parseFloat(menuItem.default_price.toString());
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderData.order_id,
          menu_item_id: parseInt(item.menuItemId),
          quantity: item.quantity,
          unit_price: unitPrice,
          subtotal: itemSubtotal,
          options: {
            size: item.options.size,
            sugar: item.options.sugar,
            ice: item.options.ice,
            toppings: item.options.toppings,
          },
        });

      if (itemError) {
        throw new Error(`Failed to create order item: ${itemError.message}`);
      }

      orderItems.push({
        name: '', // Will be populated from menu_items join in getKitchenQueue
        options: item.options,
      });
    }

    // Calculate discount if promo code provided
    const discount = order.discount || 0;
    const discountedSubtotal = subtotal - discount;
    
    // Update order with totals
    const tax = discountedSubtotal * 0.0825; // 8.25% tax (adjust as needed)
    const total = discountedSubtotal + tax;

    const updateData: any = {
      subtotal,
      discounts: discount,
      tax,
      total,
    };

    // Add payment method if provided
    if (order.paymentMethod) {
      updateData.payment_method = order.paymentMethod;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('order_id', orderData.order_id);

    if (updateError) {
      throw new Error(`Failed to update order totals: ${updateError.message}`);
    }

    // Fetch menu item names for response
    const menuItemIds = order.items.map((item) => parseInt(item.menuItemId));
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('menu_item_id, name')
      .in('menu_item_id', menuItemIds);

    const menuItemMap = new Map(menuItems?.map((mi) => [mi.menu_item_id, mi.name]) || []);

    return {
      orderId: orderData.order_id.toString(),
      status: orderData.status as Order['status'],
      createdAt: orderData.order_time,
      items: order.items.map((item, index) => ({
        name: menuItemMap.get(parseInt(item.menuItemId)) || 'Unknown Item',
        options: item.options,
      })),
    };
  },

  async getKitchenQueue(): Promise<Order[]> {
    // Query orders with their items
    // Try with source column first, fallback without if it doesn't exist
    let selectQuery = `
      order_id,
      status,
      order_time,
      source,
      order_items (
        menu_item_id,
        quantity,
        options,
        menu_items (
          name
        )
      )
    `;

    let { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(selectQuery)
      .in('status', ['PLACED', 'PREPARING', 'READY'])
      .order('order_time', { ascending: true });

    // If source column doesn't exist, retry without it
    if (ordersError && ordersError.message.includes('source')) {
      selectQuery = `
        order_id,
        status,
        order_time,
        order_items (
          menu_item_id,
          quantity,
          options,
          menu_items (
            name
          )
        )
      `;
      
      const retry = await supabase
        .from('orders')
        .select(selectQuery)
        .in('status', ['PLACED', 'PREPARING', 'READY'])
        .order('order_time', { ascending: true });
      
      orders = retry.data;
      ordersError = retry.error;
    }

    if (ordersError) throw new Error(`Failed to fetch kitchen queue: ${ordersError.message}`);

    return (orders || []).map((order: any) => ({
      orderId: order.order_id.toString(),
      status: order.status as Order['status'],
      createdAt: order.order_time,
      items: (order.order_items || []).map((oi: any) => ({
        name: oi.menu_items?.name || 'Unknown Item',
        options: oi.options || {},
      })),
    }));
  },

  async updateOrderStatus(orderId: string, status: 'PREPARING' | 'READY' | 'COMPLETED'): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('order_id', parseInt(orderId));

    if (error) throw new Error(`Failed to update order status: ${error.message}`);
  },

  async getCurrentUser(): Promise<{ userId: string; role: 'manager' | 'cashier' | 'barista' | 'customer' }> {
    throw new Error('Authentication not yet implemented. Please use login.');
  },

  async signUp(
    username: string,
    password: string,
    fullName: string,
    role: 'Manager' | 'Cashier' | 'Barista' | 'Customer',
    email: string
  ): Promise<{ userId: string; role: string; email?: string }> {
    // Check if username already exists (case-insensitive)
    // Fetch all users and compare case-insensitively
    const { data: allUsers } = await supabase
      .from('users')
      .select('user_id, username');

    if (allUsers) {
      const usernameLower = username.toLowerCase();
      const existingUser = allUsers.find(
        (u) => u.username.toLowerCase() === usernameLower
      );
      if (existingUser) {
        throw new Error('Username already exists');
      }
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Get role_id for the selected role
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('role_id')
      .eq('role_name', role)
      .single();

    if (roleError || !roleData) {
      throw new Error(`Invalid role: ${role}`);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        username,
        password_hash: passwordHash,
        full_name: fullName,
        role_id: roleData.role_id,
        email: email,
      })
      .select('user_id, role_id, email, roles(role_name)')
      .single();

    if (userError || !user) {
      throw new Error(`Failed to create account: ${userError?.message || 'Unknown error'}`);
    }

    const roleName = (user.roles as any)?.role_name || role;

    return {
      userId: user.user_id.toString(),
      role: roleName.toLowerCase(),
      email: user.email || undefined,
    };
  },

  async login(identifier: string, password: string): Promise<{ userId: string; role: 'manager' | 'cashier' | 'barista' | 'customer'; email?: string }> {
    // Determine if identifier is an email (contains @) or username
    const isEmail = identifier.includes('@');
    
    let user;
    let userError;

    // Try to fetch user by username or email
    if (isEmail) {
      // Try email first
      const emailResult = await supabase
        .from('users')
        .select('user_id, role_id, email, password_hash, roles(role_name)')
        .eq('email', identifier)
        .single();
      
      user = emailResult.data;
      userError = emailResult.error;
      
      // If email lookup fails, try username as fallback (case-insensitive)
      if (userError || !user) {
        // Fetch all users and find by case-insensitive username match
        const allUsersResult = await supabase
          .from('users')
          .select('user_id, role_id, email, password_hash, roles(role_name), username');
        
        if (allUsersResult.data) {
          const identifierLower = identifier.toLowerCase();
          const matchedUser = allUsersResult.data.find(
            (u) => u.username.toLowerCase() === identifierLower
          );
          if (matchedUser) {
            user = matchedUser;
            userError = null;
          }
        }
      }
    } else {
      // Try username first (case-insensitive)
      // Fetch all users and find by case-insensitive username match
      const allUsersResult = await supabase
        .from('users')
        .select('user_id, role_id, email, password_hash, roles(role_name), username');
      
      if (allUsersResult.data) {
        const identifierLower = identifier.toLowerCase();
        const matchedUser = allUsersResult.data.find(
          (u) => u.username.toLowerCase() === identifierLower
        );
        if (matchedUser) {
          user = matchedUser;
          userError = null;
        } else {
          userError = { message: 'User not found' };
        }
      } else {
        userError = allUsersResult.error;
      }
      
      // If username lookup fails, try email as fallback
      if (userError || !user) {
        const emailResult = await supabase
          .from('users')
          .select('user_id, role_id, email, password_hash, roles(role_name)')
          .eq('email', identifier)
          .single();
        
        user = emailResult.data;
        userError = emailResult.error;
      }
    }

    if (userError || !user) {
      throw new Error('Invalid username/email or password');
    }

    // Check if user has a password hash
    if (!user.password_hash) {
      throw new Error('Account not set up with password. Please contact administrator.');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid username/email or password');
    }

    // Map role_name to lowercase role
    const roleName = (user.roles as any)?.role_name?.toLowerCase() || '';
    let role: 'manager' | 'cashier' | 'barista' | 'customer' = 'customer';
    
    if (roleName.includes('manager')) {
      role = 'manager';
    } else if (roleName.includes('cashier')) {
      role = 'cashier';
    } else if (roleName.includes('barista')) {
      role = 'barista';
    } else if (roleName.includes('customer')) {
      role = 'customer';
    }

    return {
      userId: user.user_id.toString(),
      role,
      email: user.email || undefined,
    };
  },

  async getAllRoles(): Promise<Array<{ roleId: number; roleName: string }>> {
    const { data: roles, error } = await supabase
      .from('roles')
      .select('role_id, role_name')
      .order('role_id');

    if (error) throw new Error(`Failed to fetch roles: ${error.message}`);

    return (roles || []).map((role: any) => ({
      roleId: role.role_id,
      roleName: role.role_name,
    }));
  },

  async getAllUsers(): Promise<Array<{ userId: string; username: string; role: string }>> {
    // Helper function to get all users for demo login
    const { data: users, error } = await supabase
      .from('users')
      .select('user_id, username, roles(role_name)')
      .limit(50);

    if (error) throw new Error(`Failed to fetch users: ${error.message}`);

    return (users || []).map((user: any) => ({
      userId: user.user_id.toString(),
      username: user.username,
      role: (user.roles as any)?.role_name || 'Unknown',
    }));
  },

  async checkUsernameExists(username: string): Promise<boolean> {
    // Check if username exists (case-insensitive)
    // Fetch users and compare case-insensitively
    const { data: allUsers } = await supabase
      .from('users')
      .select('user_id, username');

    if (!allUsers) {
      return false;
    }

    const usernameLower = username.toLowerCase();
    return allUsers.some((u) => u.username.toLowerCase() === usernameLower);
  },

  // Manager API functions
  async getAllMenuItems(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw new Error(`Failed to fetch menu items: ${error.message}`);

    return (data || []).map((item) => ({
      id: item.menu_item_id.toString(),
      name: item.name,
      category: item.category || 'Uncategorized',
      price: parseFloat(item.default_price.toString()),
      description: item.description || '',
      active: item.active,
    }));
  },

  async updateMenuItem(
    id: string,
    updates: Partial<{ name: string; category: string; price: number; description: string; active: boolean }>
  ): Promise<void> {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.price !== undefined) updateData.default_price = updates.price;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.active !== undefined) updateData.active = updates.active;

    const { error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('menu_item_id', parseInt(id));

    if (error) throw new Error(`Failed to update menu item: ${error.message}`);
  },

  async createMenuItem(item: {
    name: string;
    category: string;
    price: number;
    description: string;
    active?: boolean;
  }): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        name: item.name,
        category: item.category,
        default_price: item.price,
        description: item.description,
        active: item.active !== undefined ? item.active : true,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create menu item: ${error.message}`);

    return {
      id: data.menu_item_id.toString(),
      name: data.name,
      category: data.category || 'Uncategorized',
      price: parseFloat(data.default_price.toString()),
      description: data.description || '',
      active: data.active,
    };
  },

  async deleteMenuItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('menu_item_id', parseInt(id));

    if (error) throw new Error(`Failed to delete menu item: ${error.message}`);
  },

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(`Failed to fetch inventory items: ${error.message}`);

    return (data || []).map((item) => ({
      inventoryId: item.inventory_item_id.toString(),
      sku: item.sku || '',
      name: item.name,
      unit: item.unit || 'each',
      onHandQuantity: parseFloat(item.on_hand_quantity.toString()),
      servingsPerUnit: parseFloat((item.servings_per_unit || 1).toString()),
      reorderPoint: parseFloat((item.reorder_point || 0).toString()),
      costPerUnit: parseFloat((item.cost_per_unit || 0).toString()),
      lastReceivedAt: item.last_received_at || null,
    }));
  },

  async updateInventoryItem(
    id: string,
    updates: Partial<{
      name: string;
      sku: string;
      unit: string;
      onHandQuantity: number;
      reorderPoint: number;
      costPerUnit: number;
    }>
  ): Promise<void> {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.sku !== undefined) updateData.sku = updates.sku;
    if (updates.unit !== undefined) updateData.unit = updates.unit;
    if (updates.onHandQuantity !== undefined) updateData.on_hand_quantity = updates.onHandQuantity;
    if (updates.reorderPoint !== undefined) updateData.reorder_point = updates.reorderPoint;
    if (updates.costPerUnit !== undefined) updateData.cost_per_unit = updates.costPerUnit;

    const { error } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('inventory_item_id', parseInt(id));

    if (error) throw new Error(`Failed to update inventory item: ${error.message}`);
  },

  async getEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, username, full_name, email, created_at, roles(role_name)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch employees: ${error.message}`);

    return (data || []).map((user: any) => ({
      userId: user.user_id.toString(),
      username: user.username,
      fullName: user.full_name,
      role: (user.roles as any)?.role_name || 'Unknown',
      email: user.email || null,
      createdAt: user.created_at,
    }));
  },

  async updateEmployee(
    id: string,
    updates: Partial<{ username: string; fullName: string; email: string; role: string }>
  ): Promise<void> {
    const updateData: any = {};
    if (updates.username !== undefined) updateData.username = updates.username;
    if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
    if (updates.email !== undefined) updateData.email = updates.email;

    // Handle role update
    if (updates.role !== undefined) {
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('role_id')
        .eq('role_name', updates.role)
        .single();

      if (roleError || !roleData) {
        throw new Error(`Invalid role: ${updates.role}`);
      }

      updateData.role_id = roleData.role_id;
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', parseInt(id));

    if (error) throw new Error(`Failed to update employee: ${error.message}`);
  },

  async getSalesReports(startDate?: string, endDate?: string): Promise<SalesReport[]> {
    let query = supabase
      .from('orders')
      .select('order_time, total, order_id')
      .eq('status', 'COMPLETED')
      .order('order_time', { ascending: false });

    if (startDate) {
      query = query.gte('order_time', startDate);
    }
    if (endDate) {
      query = query.lte('order_time', endDate);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch sales reports: ${error.message}`);

    // Group by date
    const dateMap = new Map<string, { total: number; count: number }>();
    (data || []).forEach((order: any) => {
      const date = order.order_time.split('T')[0];
      const existing = dateMap.get(date) || { total: 0, count: 0 };
      dateMap.set(date, {
        total: existing.total + parseFloat(order.total.toString()),
        count: existing.count + 1,
      });
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        totalSales: data.total,
        orderCount: data.count,
        averageOrderValue: data.total / data.count,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  async getSalesData(days: number = 30): Promise<SalesData> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get completed orders with items
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        order_time,
        total,
        order_items (
          quantity,
          unit_price,
          menu_items (
            name,
            category
          )
        )
      `)
      .eq('status', 'COMPLETED')
      .gte('order_time', startDateStr)
      .order('order_time', { ascending: true });

    if (ordersError) throw new Error(`Failed to fetch sales data: ${ordersError.message}`);

    // Process data
    const dailySalesMap = new Map<string, number>();
    const itemMap = new Map<string, { quantity: number; revenue: number }>();
    const categoryMap = new Map<string, number>();

    (orders || []).forEach((order: any) => {
      const date = order.order_time.split('T')[0];
      dailySalesMap.set(date, (dailySalesMap.get(date) || 0) + parseFloat(order.total.toString()));

      (order.order_items || []).forEach((oi: any) => {
        const menuItem = oi.menu_items;
        if (menuItem) {
          const itemName = menuItem.name;
          const category = menuItem.category || 'Uncategorized';
          const quantity = oi.quantity || 0;
          const revenue = parseFloat((oi.unit_price || 0).toString()) * quantity;

          // Track items
          const existingItem = itemMap.get(itemName) || { quantity: 0, revenue: 0 };
          itemMap.set(itemName, {
            quantity: existingItem.quantity + quantity,
            revenue: existingItem.revenue + revenue,
          });

          // Track categories
          categoryMap.set(category, (categoryMap.get(category) || 0) + revenue);
        }
      });
    });

    // Convert to arrays and sort
    const dailySales = Array.from(dailySalesMap.entries())
      .map(([date, sales]) => ({ date, sales }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topItems = Array.from(itemMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const categorySales = Array.from(categoryMap.entries())
      .map(([category, sales]) => ({ category, sales }))
      .sort((a, b) => b.sales - a.sales);

    return { dailySales, topItems, categorySales };
  },
};

