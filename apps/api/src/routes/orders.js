import express from 'express'
import { authenticate, authorizeRoles } from '../middleware/auth.js'
import {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
  getKitchenOrders
} from '../lib/ordersRepository.js'

const router = express.Router()

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { items, notes } = req.body
    const order = await createOrder({
      userId: req.user.id,
      items,
      notes
    })
    res.status(201).json(order)
  } catch (err) {
    next(err)
  }
})

router.get('/', authenticate, async (req, res, next) => {
  try {
    const orders = await listOrders({
      role: req.user.role,
      userId: req.user.id
    })
    res.json(orders)
  } catch (err) {
    next(err)
  }
})

router.get('/kitchen', authenticate, authorizeRoles('Manager', 'Cashier'), async (req, res, next) => {
  try {
    const orders = await getKitchenOrders()
    res.json(orders)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    if (req.user.role === 'Customer' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only view your orders' })
    }
    res.json(order)
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/status', authenticate, authorizeRoles('Manager', 'Cashier'), async (req, res, next) => {
  try {
    const { status } = req.body
    const updated = await updateOrderStatus(req.params.id, status)
    if (!updated) {
      return res.status(404).json({ error: 'Order not found' })
    }
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

export default router
