import pool from '../config/database.js'

const ORDER_STATUSES = ['PENDING', 'PREPARING', 'READY', 'PAID', 'COMPLETED', 'CANCELLED']

export async function createOrder ({ userId, items, notes }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Order requires at least one item')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const menuIds = items.map((item) => item.menuItemId)
    const { rows: menuItems } = await client.query(
      'SELECT id, price, is_available FROM menu_items WHERE id = ANY($1)',
      [menuIds]
    )

    if (menuItems.length !== items.length) {
      throw new Error('One or more menu items not found')
    }

    const menuMap = new Map(menuItems.map((item) => [item.id, item]))
    let total = 0

    for (const item of items) {
      const menuItem = menuMap.get(item.menuItemId)
      if (!menuItem) {
        throw new Error('Menu item missing')
      }
      if (!menuItem.is_available) {
        throw new Error(`Menu item ${menuItem.id} is not available`)
      }
      total += Number(menuItem.price) * item.quantity
    }

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (user_id, status, total, notes)
       VALUES ($1, 'PENDING', $2, $3)
       RETURNING *`,
      [userId, total, notes ?? null]
    )
    const order = orderRows[0]

    const values = []
    const placeholders = []
    items.forEach((item, index) => {
      const unitPrice = menuMap.get(item.menuItemId).price
      values.push(order.id, item.menuItemId, item.quantity, unitPrice)
      const baseIndex = index * 4
      placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`)
    })

    await client.query(
      `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price)
       VALUES ${placeholders.join(', ')}`,
      values
    )

    await client.query('COMMIT')
    return getOrderById(order.id)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function listOrders ({ role, userId }) {
  const params = []
  let whereClause = ''

  if (role === 'Customer') {
    params.push(userId)
    whereClause = 'WHERE o.user_id = $1'
  }

  const { rows } = await pool.query(
    `SELECT o.*, u.email as customer_email
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     ${whereClause}
     ORDER BY o.created_at DESC
     LIMIT 100`,
    params
  )
  return rows
}

export async function getOrderById (id) {
  const { rows } = await pool.query(
    `SELECT o.*, u.email as customer_email, u.full_name as customer_name
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     WHERE o.id = $1`,
    [id]
  )
  const order = rows[0]
  if (!order) {
    return null
  }

  const { rows: items } = await pool.query(
    `SELECT oi.*, mi.name AS menu_item_name
     FROM order_items oi
     LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
     WHERE oi.order_id = $1`,
    [id]
  )

  return { ...order, items }
}

export async function updateOrderStatus (id, status) {
  if (!ORDER_STATUSES.includes(status)) {
    throw new Error('Invalid status')
  }
  const { rows } = await pool.query(
    `UPDATE orders
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  )
  return rows[0] ?? null
}

export async function getKitchenOrders () {
  const { rows } = await pool.query(
    `SELECT o.*, u.full_name AS customer_name
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     WHERE o.status IN ('PREPARING', 'PAID')
     ORDER BY o.created_at ASC`
  )
  return rows
}
