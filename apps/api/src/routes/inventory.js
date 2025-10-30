import express from 'express'
import { authenticate, authorizeRoles } from '../middleware/auth.js'
import {
  listInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem
} from '../lib/inventoryRepository.js'

const router = express.Router()

router.get('/', authenticate, authorizeRoles('Manager'), async (req, res, next) => {
  try {
    const items = await listInventory()
    res.json(items)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', authenticate, authorizeRoles('Manager'), async (req, res, next) => {
  try {
    const item = await getInventoryItem(req.params.id)
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }
    res.json(item)
  } catch (err) {
    next(err)
  }
})

router.post('/', authenticate, authorizeRoles('Manager'), async (req, res, next) => {
  try {
    const item = await createInventoryItem(req.body)
    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', authenticate, authorizeRoles('Manager'), async (req, res, next) => {
  try {
    const item = await updateInventoryItem(req.params.id, req.body)
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }
    res.json(item)
  } catch (err) {
    next(err)
  }
})

export default router
