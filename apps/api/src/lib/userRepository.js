import pool from '../config/database.js'

const DEFAULT_ROLE = 'Customer'

export async function findUserByEmail (email) {
  const { rows } = await pool.query(
    `SELECT u.*, r.name AS role_name
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE LOWER(u.email) = LOWER($1)`,
    [email]
  )
  return rows[0] ?? null
}

export async function findUserById (id) {
  const { rows } = await pool.query(
    `SELECT u.*, r.name AS role_name
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1`,
    [id]
  )
  return rows[0] ?? null
}

async function ensureDefaultRole () {
  const { rows } = await pool.query(
    'SELECT id FROM roles WHERE name = $1',
    [DEFAULT_ROLE]
  )

  if (rows[0]) {
    return rows[0].id
  }

  const insert = await pool.query(
    'INSERT INTO roles (name) VALUES ($1) RETURNING id',
    [DEFAULT_ROLE]
  )
  return insert.rows[0].id
}

export async function findOrCreateGoogleUser ({ email, name, googleId }) {
  if (!email) {
    throw new Error('Email is required')
  }

  const existing = await findUserByEmail(email)
  if (existing) {
    const { rows } = await pool.query(
      `UPDATE users
       SET last_login_at = NOW(), google_id = COALESCE($2, google_id)
       WHERE id = $1
       RETURNING *`,
      [existing.id, googleId]
    )
    return findUserById(existing.id)
  }

  const roleId = await ensureDefaultRole()
  const { rows } = await pool.query(
    `INSERT INTO users (email, full_name, google_id, role_id, last_login_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [email.toLowerCase(), name ?? '', googleId, roleId]
  )
  return findUserById(rows[0].id)
}
