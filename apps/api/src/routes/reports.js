import express from 'express'
import { authenticate, authorizeRoles } from '../middleware/auth.js'
import { getSalesSummary, getInventoryStatus } from '../lib/reportsRepository.js'

const router = express.Router()

router.get('/sales', authenticate, authorizeRoles('Manager'), async (req, res, next) => {
  try {
    const { from, to } = req.query
    const report = await getSalesSummary({ from, to })
    res.json(report)
  } catch (err) {
    next(err)
  }
})

router.get('/inventory', authenticate, authorizeRoles('Manager'), async (req, res, next) => {
  try {
    const report = await getInventoryStatus()
    res.json(report)
  } catch (err) {
    next(err)
  }
})

export default router
