import pool from '../config/database.js'

export async function listInventory () {
  const { rows } = await pool.query('SELECT * FROM inventory_items ORDER BY name')
  return rows
}

export async function getInventoryItem (id) {
  const { rows } = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [id])
  return rows[0] ?? null
}

export async function createInventoryItem (data) {
  const { name, description, quantity, unit, threshold } = data
  const { rows } = await pool.query(
    `INSERT INTO inventory_items (name, description, quantity, unit, threshold)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, description, quantity ?? 0, unit, threshold ?? 0]
  )
  return rows[0]
}

export async function updateInventoryItem (id, data) {
  const assignments = []
  const values = []

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    assignments.push(`${camelToSnake(key)} = $${assignments.length + 1}`)
    values.push(value)
  }

  if (assignments.length === 0) {
    return getInventoryItem(id)
  }

  values.push(id)
  const { rows } = await pool.query(
    `UPDATE inventory_items
     SET ${assignments.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING *`,
    values
  )
  return rows[0]
}

function camelToSnake (value) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}
