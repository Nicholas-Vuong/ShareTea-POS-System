import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import passport, { configurePassport } from './config/passport.js'
import { connectWithRetry, healthCheck } from './config/database.js'
import authRouter from './routes/auth.js'
import menuRouter from './routes/menu.js'
import ordersRouter from './routes/orders.js'
import inventoryRouter from './routes/inventory.js'
import reportsRouter from './routes/reports.js'
import weatherRouter from './routes/weather.js'
import recommendationsRouter from './routes/recommendations.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL?.split(',') ?? ['http://localhost:5173'],
  credentials: true
}))
app.use(express.json())
app.use(morgan('dev'))

configurePassport()
app.use(passport.initialize())

app.get('/health', async (req, res) => {
  const dbHealth = await healthCheck()
  res.json({
    status: 'ok',
    database: dbHealth
  })
})

app.use('/auth', authRouter)
app.use('/menu', menuRouter)
app.use('/orders', ordersRouter)
app.use('/inventory', inventoryRouter)
app.use('/reports', reportsRouter)
app.use('/weather', weatherRouter)
app.use('/api/recommendations', recommendationsRouter)

app.use(notFoundHandler)
app.use(errorHandler)

if (process.env.NODE_ENV !== 'test') {
  connectWithRetry()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`API server listening on :${PORT}`)
      })
    })
    .catch((err) => {
      console.error('Failed to connect to database', err)
      process.exit(1)
    })
}

export default app
