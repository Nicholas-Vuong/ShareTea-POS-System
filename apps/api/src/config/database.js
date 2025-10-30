import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const RETRY_ATTEMPTS = 5
const RETRY_DELAY_MS = 2000

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('[database] DATABASE_URL missing, Postgres connection will fail.')
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function connectWithRetry (attempt = 1) {
  try {
    await pool.query('SELECT 1')
    console.info('[database] Connection established')
    return true
  } catch (err) {
    console.error(`[database] Connection attempt ${attempt} failed`, err.message)
    if (attempt >= RETRY_ATTEMPTS) {
      throw err
    }
    await wait(RETRY_DELAY_MS)
    return connectWithRetry(attempt + 1)
  }
}

export async function healthCheck () {
  try {
    await pool.query('SELECT 1')
    return { status: 'ok' }
  } catch (err) {
    return { status: 'error', error: err.message }
  }
}

export default pool
