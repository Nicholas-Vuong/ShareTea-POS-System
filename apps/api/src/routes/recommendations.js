import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { getWeatherByCity } from '../services/weatherService.js'
import { getMenuRecommendations } from '../services/openaiService.js'

const router = express.Router()

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { city } = req.query
    const weather = await getWeatherByCity(city)
    const recommendations = await getMenuRecommendations(weather)
    res.json({ weather, recommendations })
  } catch (err) {
    next(err)
  }
})

export default router
