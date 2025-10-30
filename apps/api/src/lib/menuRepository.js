import pool from '../config/database.js'

export async function getMenuItems ({ category, available }) {
  const filters = []
  const values = []

  if (category) {
    values.push(category)
    filters.push(`category = $${values.length}`)
  }

  if (available !== undefined) {
    values.push(available)
    filters.push(`is_available = $${values.length}`)
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''
  const query = `SELECT * FROM menu_items ${whereClause} ORDER BY category, name`
  const { rows } = await pool.query(query, values)
  return rows
}

export async function getMenuItemById (id) {
  const { rows } = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id])
  return rows[0] ?? null
}

export async function createMenuItem (data) {
  const { name, description, price, category, is_available: isAvailable, image_url: imageUrl } = data
  const { rows } = await pool.query(
    `INSERT INTO menu_items (name, description, price, category, is_available, image_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, description, price, category, isAvailable ?? true, imageUrl]
  )
  return rows[0]
}

export async function updateMenuItem (id, data) {
  const fields = []
  const values = []

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    values.push(value)
    fields.push(`${camelToSnake(key)} = $${values.length}`)
  }

  if (fields.length === 0) {
    return getMenuItemById(id)
  }

  values.push(id)
  const query = `UPDATE menu_items SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`
  const { rows } = await pool.query(query, values)
  return rows[0]
}

export async function deleteMenuItem (id) {
  await pool.query('DELETE FROM menu_items WHERE id = $1', [id])
}

function camelToSnake (value) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}
