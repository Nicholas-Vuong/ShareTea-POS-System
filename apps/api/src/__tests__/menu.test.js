import { jest } from '@jest/globals'
import request from 'supertest'

process.env.NODE_ENV = 'test'

const queryMock = jest.fn()
const connectMock = jest.fn().mockResolvedValue(true)
const healthMock = jest.fn().mockResolvedValue({ status: 'ok' })

jest.unstable_mockModule('../config/database.js', () => ({
  default: { query: queryMock },
  connectWithRetry: connectMock,
  healthCheck: healthMock
}))

const app = (await import('../server.js')).default

describe('Menu routes', () => {
  beforeEach(() => {
    queryMock.mockReset()
  })

  it('returns menu items', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Classic Milk Tea', category: 'Milk Tea', price: 4.5, is_available: true }]
    })

    const response = await request(app).get('/menu')
    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0].name).toBe('Classic Milk Tea')
  })
})
