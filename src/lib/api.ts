/**
 * API client for Sharetea POS system
 * Handles all database interactions via Supabase
 * Includes authentication, orders, menu, inventory, and reporting functionality
 */
import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

/**
 * Menu item interface representing a product available for purchase
 */
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
  customerId?: string;
}

export interface Order {
  orderId: string;
  status: 'PLACED' | 'PREPARING' | 'READY' | 'COMPLETED';
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    options: {
      size: string;
      sugar: number;
      ice: string;
      toppings: string[];
    };
  }>;
  estimatedPrepTime?: number;
  priority?: number;
}

/**
 * Main API object containing all API methods
 * All methods handle database schema transformations and error handling
 */
export const api = {
  /**
   * Fetches all active menu items from the database
   * Filters to only active items and transforms database schema to frontend format
   * @returns Array of active menu items sorted by category
   */
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

  /**
   * Fetches inventory items that are at or below their reorder point
   * Attempts to use database view first for efficiency, falls back to manual filtering
   * @returns Array of low stock items with inventory details
   */
  async getLowStock(): Promise<LowStockItem[]> {
    // Try the view first if it exists (more efficient database-level filtering)
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

  /**
   * Creates a new order in the database
   * Handles order creation, item insertion, price calculation, and totals computation
   * Supports both kiosk and cashier order sources with fallback for schema compatibility
   * @param order - Order request with items, source, payment method, and optional customer ID
   * @returns Created order with populated item names
   * @throws Error if order creation fails or items are invalid
   */
  async createOrder(order: CreateOrderRequest): Promise<Order> {
    // Validate that we have items before proceeding
    if (!order.items || order.items.length === 0) {
      throw new Error('Cannot create order with no items');
    }

    // Start a transaction by creating the order first
    // Note: source column may not exist in all database schemas
    const orderInsert: any = {
      status: 'PLACED',
      subtotal: 0,
      discounts: 0,
      tax: 0,
      total: 0,
    };

    // Add customer_id if provided
    if (order.customerId) {
      orderInsert.customer_id = parseInt(order.customerId);
    }

    // Try to insert with source first, if it fails, retry without it
    let orderData;
    let orderError;
    
    // First attempt: try with source
    const orderInsertWithSource = { ...orderInsert, source: order.source };
    const resultWithSource = await supabase
      .from('orders')
      .insert(orderInsertWithSource)
      .select()
      .single();
    
    orderData = resultWithSource.data;
    orderError = resultWithSource.error;

    // If source column doesn't exist, retry without it
    if (orderError && (orderError.message.includes('source') || orderError.message.includes('column'))) {
      const resultWithoutSource = await supabase
        .from('orders')
        .insert(orderInsert)
        .select()
        .single();
      
      orderData = resultWithoutSource.data;
      orderError = resultWithoutSource.error;
    }

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
        quantity: item.quantity,
        options: item.options,
      })),
    };
  },

  /**
   * Fetches orders that are in progress (PLACED, PREPARING, or READY status)
   * Used by kitchen staff to see what needs to be prepared
   * Includes nested order items with menu item names via database joins
   * @returns Array of in-progress orders sorted by order time (oldest first)
   */
  async getKitchenQueue(): Promise<Order[]> {
    // Query orders with their items using Supabase nested select
    // Try with source column first, fallback without if it doesn't exist (schema compatibility)
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
        quantity: oi.quantity || 1,
        options: oi.options || {},
      })),
    }));
  },

  /**
   * Updates the status of an order
   * Allows all status transitions including re-opening completed orders
   * Status flow: PLACED → PREPARING → READY → COMPLETED → PREPARING (re-open)
   * @param orderId - ID of the order to update
   * @param status - New status for the order
   * @throws Error if update fails
   */
  async updateOrderStatus(orderId: string, status: 'PREPARING' | 'READY' | 'COMPLETED'): Promise<void> {
    // Allow COMPLETED → PREPARING transition for re-opening orders
    // All transitions are allowed: PLACED → PREPARING → READY → COMPLETED → PREPARING (re-open)
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('order_id', parseInt(orderId));

    if (error) throw new Error(`Failed to update order status: ${error.message}`);
  },

  /**
   * Fetches all orders including completed ones for kitchen view
   * Allows kitchen staff to see and re-open completed orders if needed
   * Filters out orders with no items as a safety check
   * @returns Array of orders including completed ones, sorted by most recent first
   */
  async getKitchenQueueWithCompleted(): Promise<Order[]> {
    // Query orders including COMPLETED status for re-opening capability
    // Try with source column first, fallback without if it doesn't exist (schema compatibility)
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
      .in('status', ['PLACED', 'PREPARING', 'READY', 'COMPLETED'])
      .order('order_time', { ascending: false });

    // If source column doesn't exist, retry without it
    if (ordersError && (ordersError.message.includes('source') || ordersError.message.includes('column'))) {
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
        .in('status', ['PLACED', 'PREPARING', 'READY', 'COMPLETED'])
        .order('order_time', { ascending: false });
      
      orders = retry.data;
      ordersError = retry.error;
    }

    if (ordersError) {
      console.error('Error fetching kitchen queue:', ordersError);
      throw new Error(`Failed to fetch kitchen queue: ${ordersError.message}`);
    }

    if (!orders) {
      console.warn('No orders returned from kitchen queue query');
      return [];
    }

    const mappedOrders = orders.map((order: any) => ({
      orderId: order.order_id.toString(),
      status: order.status as Order['status'],
      createdAt: order.order_time || new Date().toISOString(),
      items: (order.order_items || []).map((oi: any) => ({
        name: oi.menu_items?.name || 'Unknown Item',
        quantity: oi.quantity || 1,
        options: oi.options || {},
      })),
    }));

    // Filter out orders with no items (shouldn't happen, but safety check)
    return mappedOrders.filter(order => order.items.length > 0);
  },

  /**
   * Fetches all orders for a specific customer
   * Includes error handling for individual order mapping failures
   * Returns orders sorted by most recent first
   * @param userId - Customer user ID
   * @returns Array of customer orders with full item details
   * @throws Error if user ID is invalid or query fails
   */
  async getCustomerOrders(userId: string): Promise<Order[]> {
    try {
      // Validate and convert user ID to number
      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum)) {
        throw new Error(`Invalid user ID: ${userId}`);
      }

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          order_id,
          status,
          order_time,
          total,
          order_items (
            menu_item_id,
            quantity,
            options,
            menu_items (
              name
            )
          )
        `)
        .eq('customer_id', userIdNum)
        .order('order_time', { ascending: false });

      if (ordersError) {
        console.error('Supabase error fetching customer orders:', ordersError);
        throw new Error(`Failed to fetch customer orders: ${ordersError.message}`);
      }

      if (!orders) {
        console.warn('No orders returned from query (null/undefined)');
        return [];
      }

      // Map orders and handle any issues with individual orders
      const mappedOrders = (orders || []).map((order: any) => {
        try {
          return {
            orderId: order.order_id?.toString() || 'unknown',
            status: (order.status || 'UNKNOWN') as Order['status'],
            createdAt: order.order_time || new Date().toISOString(),
            items: (order.order_items || []).map((oi: any) => ({
              name: oi.menu_items?.name || 'Unknown Item',
              quantity: oi.quantity || 1,
              options: oi.options || {},
            })),
          };
        } catch (orderError) {
          console.error('Error mapping order:', order, orderError);
          // Return a minimal valid order object
          return {
            orderId: order.order_id?.toString() || 'unknown',
            status: 'UNKNOWN' as Order['status'],
            createdAt: order.order_time || new Date().toISOString(),
            items: [],
          };
        }
      });

      return mappedOrders;
    } catch (error: any) {
      console.error('Error in getCustomerOrders:', error);
      throw error;
    }
  },

  /**
   * Fetches the current status of a specific order
   * Used for order tracking and status updates
   * @param orderId - ID of the order to fetch
   * @returns Order object or null if not found
   * @throws Error if query fails
   */
  async getRecentOrderStatus(orderId: string): Promise<Order | null> {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
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
      `)
      .eq('order_id', parseInt(orderId))
      .single();

    if (error) throw new Error(`Failed to fetch order status: ${error.message}`);
    if (!order) return null;

    return {
      orderId: order.order_id.toString(),
      status: order.status as Order['status'],
      createdAt: order.order_time,
      items: (order.order_items || []).map((oi: any) => ({
        name: oi.menu_items?.name || 'Unknown Item',
        quantity: oi.quantity || 1,
        options: oi.options || {},
      })),
    };
  },

  /**
   * Finds an existing customer by email or creates a new customer account
   * Used when cashier creates orders for customers who may not have accounts
   * Creates customer with placeholder password that can be reset later
   * @param email - Customer email address (optional)
   * @param fullName - Customer's full name
   * @param phone - Customer phone number (optional, currently unused)
   * @returns Customer user ID if email provided, undefined for one-time orders
   * @throws Error if customer creation fails or role not found
   */
  async findOrCreateCustomer(
    email: string | undefined,
    fullName: string,
    phone?: string
  ): Promise<string | undefined> {
    // If no email provided, return undefined (one-time order without account)
    if (!email || !email.trim()) {
      return undefined;
    }

    // First, try to find existing customer by email
    const trimmedEmail = email.trim().toLowerCase();
    
    const { data: existingUser, error: lookupError } = await supabase
      .from('users')
      .select('user_id, role_id, roles(role_name)')
      .eq('email', trimmedEmail)
      .maybeSingle();

    // If customer exists and has customer role, return their ID
    if (existingUser && !lookupError) {
      const roleName = (existingUser.roles as any)?.role_name?.toLowerCase() || '';
      if (roleName === 'customer') {
        return existingUser.user_id.toString();
      }
      // If user exists but is not a customer, we can't use them
      // We'll create a new customer account
    }

    // Customer doesn't exist, create new one
    // Get Customer role_id
    const { data: allRoles, error: rolesError } = await supabase
      .from('roles')
      .select('role_id, role_name');

    if (rolesError || !allRoles) {
      throw new Error(`Failed to fetch roles: ${rolesError?.message || 'Unknown error'}`);
    }

    const customerRole = allRoles.find(
      (r) => r.role_name.toLowerCase() === 'customer'
    );

    if (!customerRole) {
      throw new Error('Customer role not found');
    }

    // Generate a username from email (before @)
    const usernameBase = trimmedEmail.split('@')[0];
    let username = usernameBase;
    let counter = 1;

    // Check if username exists and find available one
    const { data: allUsers } = await supabase
      .from('users')
      .select('username');

    if (allUsers) {
      const existingUsernames = new Set(allUsers.map(u => u.username.toLowerCase()));
      while (existingUsernames.has(username.toLowerCase())) {
        username = `${usernameBase}${counter}`;
        counter++;
      }
    }

    // Create customer user with a placeholder password hash
    // Cashier-created customers can set their own password later if needed
    // Generate a random password hash that won't be used for login
    const placeholderPassword = `cashier_created_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const salt = await bcrypt.genSalt(10);
    const placeholderHash = await bcrypt.hash(placeholderPassword, salt);

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        username,
        password_hash: placeholderHash, // Placeholder hash - customer can reset password later
        full_name: fullName,
        role_id: customerRole.role_id,
        email: trimmedEmail,
      })
      .select('user_id')
      .single();

    if (createError || !newUser) {
      throw new Error(`Failed to create customer: ${createError?.message || 'Unknown error'}`);
    }

    return newUser.user_id.toString();
  },

  /**
   * Fetches orders that are in progress or recently completed for a customer
   * Used for customer order tracking to show active and recent orders
   * Combines in-progress orders with recently completed orders within time window
   * @param userId - Customer user ID
   * @param timeWindowMinutes - Number of minutes to look back for completed orders (default: 5)
   * @returns Array of orders sorted by most recent first
   * @throws Error if queries fail
   */
  async getOrdersInProgressOrRecent(userId: string, timeWindowMinutes: number = 5): Promise<Order[]> {
    // Calculate cutoff time for recently completed orders
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);
    const cutoffTimeStr = cutoffTime.toISOString();

    // Fetch orders in progress (PLACED, PREPARING, READY) or recently completed
    // Use separate queries and combine results for better database compatibility
    const [inProgressResult, recentCompletedResult] = await Promise.all([
      supabase
        .from('orders')
        .select(`
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
        `)
        .eq('customer_id', parseInt(userId))
        .in('status', ['PLACED', 'PREPARING', 'READY']),
      supabase
        .from('orders')
        .select(`
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
        `)
        .eq('customer_id', parseInt(userId))
        .eq('status', 'COMPLETED')
        .gte('order_time', cutoffTimeStr),
    ]);

    if (inProgressResult.error) throw new Error(`Failed to fetch orders: ${inProgressResult.error.message}`);
    if (recentCompletedResult.error) throw new Error(`Failed to fetch orders: ${recentCompletedResult.error.message}`);

    const allOrders = [...(inProgressResult.data || []), ...(recentCompletedResult.data || [])];
    
    // Sort by order_time descending (most recent first)
    allOrders.sort((a: any, b: any) => 
      new Date(b.order_time).getTime() - new Date(a.order_time).getTime()
    );

    return allOrders.map((order: any) => ({
      orderId: order.order_id.toString(),
      status: order.status as Order['status'],
      createdAt: order.order_time,
      items: (order.order_items || []).map((oi: any) => ({
        name: oi.menu_items?.name || 'Unknown Item',
        quantity: oi.quantity || 1,
        options: oi.options || {},
      })),
    }));
  },

  async getCurrentUser(): Promise<{ userId: string; role: 'manager' | 'cashier' | 'barista' | 'customer' }> {
    throw new Error('Authentication not yet implemented. Please use login.');
  },

  /**
   * Creates a new user account with the specified role
   * Validates username and email uniqueness (case-insensitive)
   * Hashes password using bcrypt before storage
   * @param username - Unique username (case-insensitive check)
   * @param password - Plain text password (will be hashed)
   * @param fullName - User's full name
   * @param role - User role (Manager, Cashier, Barista, or Customer)
   * @param email - Optional email address
   * @returns User ID, role, and optional email
   * @throws Error if username/email exists, role invalid, or creation fails
   */
  async signUp(
    username: string,
    password: string,
    fullName: string,
    role: 'Manager' | 'Cashier' | 'Barista' | 'Customer',
    email?: string
  ): Promise<{ userId: string; role: string; email?: string }> {
    // Check if username already exists (case-insensitive)
    // Fetch all users and compare case-insensitively (Supabase doesn't support case-insensitive queries directly)
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

    // Check if email already exists (only when provided)
    const trimmedEmail = email?.trim();
    if (trimmedEmail) {
      const { data: existingEmail } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', trimmedEmail)
        .single();

      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Get role_id for the selected role (case-insensitive matching)
    const { data: allRoles, error: rolesError } = await supabase
      .from('roles')
      .select('role_id, role_name');

    if (rolesError || !allRoles) {
      throw new Error(`Failed to fetch roles: ${rolesError?.message || 'Unknown error'}`);
    }

    const roleLower = role.toLowerCase();
    const roleData = allRoles.find(
      (r) => r.role_name.toLowerCase() === roleLower
    );

    if (!roleData) {
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
        email: trimmedEmail || null,
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

  /**
   * Authenticates a user by username or email with password
   * Supports login with either username or email address
   * Performs case-insensitive username matching
   * Verifies password using bcrypt comparison
   * @param identifier - Username or email address
   * @param password - Plain text password to verify
   * @returns User ID, role, and optional email if authentication succeeds
   * @throws Error if credentials are invalid or account has no password
   */
  async login(identifier: string, password: string): Promise<{ userId: string; role: 'manager' | 'cashier' | 'barista' | 'customer'; email?: string }> {
    // Determine if identifier is an email (contains @) or username
    // This affects which lookup strategy to use first
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

  // ==================== Manager API Functions ====================
  
  /**
   * Fetches all menu items (including inactive ones) for manager view
   * Used for menu management where all items need to be visible
   * @returns Array of all menu items sorted by category
   * @throws Error if query fails
   */
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

  /**
   * Updates a menu item with new values
   * Only updates fields that are provided (partial update)
   * Maps frontend field names to database column names
   * @param id - Menu item ID to update
   * @param updates - Partial object with fields to update
   * @throws Error if update fails
   */
  async updateMenuItem(
    id: string,
    updates: Partial<{ name: string; category: string; price: number; description: string; active: boolean }>
  ): Promise<void> {
    // Build update object, only including provided fields
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

  /**
   * Updates the USDA Food Data Central ID for a menu item
   * Used to cache USDA FDC ID after successful nutrition lookup
   * @param menuItemId - Menu item ID to update
   * @param fdcId - USDA FDC ID or null to clear
   * @throws Error if update fails
   */
  async updateMenuItemFdcId(menuItemId: string, fdcId: number | null): Promise<void> {
    const { error } = await supabase
      .from('menu_items')
      .update({ usda_fdc_id: fdcId })
      .eq('menu_item_id', parseInt(menuItemId));

    if (error) throw new Error(`Failed to update menu item USDA FDC ID: ${error.message}`);
  },

  /**
   * Creates a new menu item in the database
   * Sets active to true by default if not specified
   * @param item - Menu item data to create
   * @returns Created menu item with transformed schema
   * @throws Error if creation fails
   */
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

  /**
   * Deletes a menu item from the database
   * Note: This is a hard delete - consider soft delete (setting active=false) instead
   * @param id - Menu item ID to delete
   * @throws Error if deletion fails
   */
  async deleteMenuItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('menu_item_id', parseInt(id));

    if (error) throw new Error(`Failed to delete menu item: ${error.message}`);
  },

  /**
   * Fetches all inventory items for manager view
   * Includes all inventory details needed for management
   * @returns Array of inventory items sorted by name
   * @throws Error if query fails
   */
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

  /**
   * Updates an inventory item with new values
   * Only updates fields that are provided (partial update)
   * Maps frontend field names to database column names
   * @param id - Inventory item ID to update
   * @param updates - Partial object with fields to update
   * @throws Error if update fails
   */
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
    // Build update object, only including provided fields
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

  /**
   * Fetches all employees (users with non-customer roles)
   * Includes role information via database join
   * @returns Array of employees sorted by creation date (newest first)
   * @throws Error if query fails
   */
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

  /**
   * Updates an employee's information
   * Handles role updates by looking up role_id from role name
   * Maps frontend field names to database column names
   * @param id - Employee user ID to update
   * @param updates - Partial object with fields to update
   * @throws Error if update fails or role is invalid
   */
  async updateEmployee(
    id: string,
    updates: Partial<{ username: string; fullName: string; email: string; role: string }>
  ): Promise<void> {
    // Build update object, only including provided fields
    const updateData: any = {};
    if (updates.username !== undefined) updateData.username = updates.username;
    if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
    if (updates.email !== undefined) updateData.email = updates.email;

    // Handle role update - need to convert role name to role_id
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

  /**
   * Generates sales reports grouped by date
   * Aggregates completed orders by date with totals, counts, and averages
   * @param startDate - Optional start date filter (ISO string)
   * @param endDate - Optional end date filter (ISO string)
   * @returns Array of daily sales reports sorted by date (most recent first)
   * @throws Error if query fails
   */
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

  /**
   * Generates comprehensive sales analytics data
   * Calculates daily sales, top-selling items, and category sales
   * Used for manager dashboard and reporting
   * @param days - Number of days to look back (default: 30)
   * @returns Sales data with daily trends, top items, and category breakdowns
   * @throws Error if query fails
   */
  async getSalesData(days: number = 30): Promise<SalesData> {
    // Calculate start date based on days parameter
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get completed orders with nested order items and menu item details
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

    // Process data into maps for efficient aggregation
    const dailySalesMap = new Map<string, number>(); // Date -> total sales
    const itemMap = new Map<string, { quantity: number; revenue: number }>(); // Item name -> aggregated data
    const categoryMap = new Map<string, number>(); // Category -> total revenue

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

    // Convert maps to arrays and sort for final output
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
