import express from 'express'
import { getWeatherByCity } from '../services/weatherService.js'

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const { city } = req.query
    const weather = await getWeatherByCity(city)
    res.json(weather)
  } catch (err) {
    next(err)
  }
})

export default router
