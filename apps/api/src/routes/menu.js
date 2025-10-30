import express from 'express'
import { authenticate, authorizeRoles } from '../middleware/auth.js'
import {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} from '../lib/menuRepository.js'

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const { category, available } = req.query
    const items = await getMenuItems({
      category,
      available: available !== undefined ? available === 'true' : undefined
    })
    res.json(items)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const item = await getMenuItemById(req.params.id)
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' })
    }
    res.json(item)
  } catch (err) {
    next(err)
  }
})

router.post('/', authenticate, authorizeRoles('Manager'), async (req, res, next) => {
  try {
    const item = await createMenuItem(req.body)
    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', authenticate, authorizeRoles('Manager'), async (req, res, next) => {
  try {
    const item = await updateMenuItem(req.params.id, req.body)
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' })
    }
    res.json(item)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', authenticate, authorizeRoles('Manager'), async (req, res, next) => {
  try {
    await deleteMenuItem(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

export default router
