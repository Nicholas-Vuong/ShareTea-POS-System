import { jest } from '@jest/globals'
import request from 'supertest'

process.env.NODE_ENV = 'test'

const connectMock = jest.fn().mockResolvedValue(true)
const healthMock = jest.fn().mockResolvedValue({ status: 'ok' })

jest.unstable_mockModule('../config/database.js', () => ({
  default: { query: jest.fn() },
  connectWithRetry: connectMock,
  healthCheck: healthMock
}))

jest.unstable_mockModule('../config/passport.js', () => ({
  default: { initialize: () => (req, res, next) => next() },
  configurePassport: jest.fn()
}))

const createOrder = jest.fn()
const listOrders = jest.fn()
const getOrderById = jest.fn()
const updateOrderStatus = jest.fn()
const getKitchenOrders = jest.fn()

jest.unstable_mockModule('../lib/ordersRepository.js', () => ({
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
  getKitchenOrders
}))

jest.unstable_mockModule('../middleware/auth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 99, role: 'Customer' }
    next()
  },
  authorizeRoles: () => (req, res, next) => {
    req.user = req.user ?? { id: 99, role: 'Manager' }
    next()
  }
}))

const app = (await import('../server.js')).default

describe('Orders routes', () => {
  beforeEach(() => {
    createOrder.mockReset()
    listOrders.mockReset()
    getOrderById.mockReset()
    updateOrderStatus.mockReset()
    getKitchenOrders.mockReset()
  })

  it('creates an order', async () => {
    createOrder.mockResolvedValue({
      id: 1,
      status: 'PENDING',
      total: 9.5
    })

    const response = await request(app)
      .post('/orders')
      .send({
        items: [{ menuItemId: 5, quantity: 2 }]
      })

    expect(response.status).toBe(201)
    expect(createOrder).toHaveBeenCalledWith({
      userId: 99,
      items: [{ menuItemId: 5, quantity: 2 }],
      notes: undefined
    })
  })

  it('lists orders for authenticated user', async () => {
    listOrders.mockResolvedValue([{ id: 1 }, { id: 2 }])
    const response = await request(app).get('/orders')
    expect(response.status).toBe(200)
    expect(listOrders).toHaveBeenCalledWith({ role: 'Customer', userId: 99 })
    expect(response.body).toHaveLength(2)
  })
})
