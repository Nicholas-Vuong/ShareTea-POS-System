#!/usr/bin/env node
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import pool from '../src/config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..', '..', '..')

async function runSqlFile (relativePath) {
  const fullPath = path.resolve(rootDir, relativePath)
  const sql = await fs.readFile(fullPath, 'utf-8')
  await pool.query(sql)
  console.info(`[migrate] Executed ${relativePath}`)
}

export async function migrate () {
  try {
    await runSqlFile('database/schema.sql')
    await runSqlFile('database/seed.sql')
    console.info('[migrate] Migration complete')
    await pool.end()
    process.exit(0)
  } catch (err) {
    console.error('[migrate] Migration failed', err)
    await pool.end()
    process.exit(1)
  }
}

if (process.argv[1] === __filename) {
  migrate()
}
