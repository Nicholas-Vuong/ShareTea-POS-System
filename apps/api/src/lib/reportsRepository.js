import pool from '../config/database.js'

export async function getSalesSummary ({ from, to }) {
  const params = []
  const filters = []

  if (from) {
    params.push(from)
    filters.push(`created_at >= $${params.length}`)
  }

  if (to) {
    params.push(to)
    filters.push(`created_at <= $${params.length}`)
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
  const salesQuery = `
    SELECT
      COUNT(*) AS order_count,
      COALESCE(SUM(total), 0) AS revenue,
      COALESCE(SUM(total) FILTER (WHERE status = 'PAID' OR status = 'COMPLETED'), 0) AS paid_revenue
    FROM orders
    ${whereClause}`

  const topItemsQuery = `
    SELECT mi.name, SUM(oi.quantity) AS total_sold
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    ${whereClause ? `${whereClause} AND` : 'WHERE'} o.status IN ('PAID', 'COMPLETED')
    GROUP BY mi.name
    ORDER BY total_sold DESC
    LIMIT 5`

  const [salesResult, itemsResult] = await Promise.all([
    pool.query(salesQuery, params),
    pool.query(topItemsQuery, params)
  ])

  return {
    summary: salesResult.rows[0],
    topItems: itemsResult.rows
  }
}

export async function getInventoryStatus () {
  const { rows } = await pool.query(
    `SELECT
       id,
       name,
       quantity,
       unit,
       threshold,
       (quantity <= threshold) AS needs_restock
     FROM inventory_items
     ORDER BY quantity ASC`
  )
  return rows
}
