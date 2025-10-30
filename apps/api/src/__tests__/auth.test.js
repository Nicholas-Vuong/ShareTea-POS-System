import { jest } from '@jest/globals'
import bcrypt from 'bcryptjs'
import request from 'supertest'

process.env.NODE_ENV = 'test'

const passwordHash = await bcrypt.hash('secret123', 10)

const queryMock = jest.fn()
const connectMock = jest.fn().mockResolvedValue(true)
const healthMock = jest.fn().mockResolvedValue({ status: 'ok' })

jest.unstable_mockModule('../config/database.js', () => ({
  default: { query: queryMock },
  connectWithRetry: connectMock,
  healthCheck: healthMock
}))

const findUserByEmail = jest.fn()
const findUserById = jest.fn()

jest.unstable_mockModule('../lib/userRepository.js', () => ({
  findUserByEmail,
  findUserById
}))

jest.unstable_mockModule('../config/passport.js', () => ({
  default: { initialize: () => (req, res, next) => next() },
  configurePassport: jest.fn()
}))

const app = (await import('../server.js')).default

describe('Auth routes', () => {
  beforeEach(() => {
    findUserByEmail.mockReset()
    findUserById.mockReset()
  })

  it('rejects login without credentials', async () => {
    const response = await request(app).post('/auth/login').send({})
    expect(response.status).toBe(400)
    expect(response.body.error).toMatch(/required/i)
  })

  it('allows login with valid credentials', async () => {
    findUserByEmail.mockResolvedValue({
      id: 1,
      email: 'maria@example.com',
      password_hash: passwordHash,
      role_name: 'Customer',
      full_name: 'Maria'
    })

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'maria@example.com', password: 'secret123' })

    expect(response.status).toBe(200)
    expect(response.body.token).toBeTruthy()
    expect(response.body.user.email).toBe('maria@example.com')
    expect(response.body.user.role).toBe('Customer')
  })

  it('rejects invalid credentials', async () => {
    findUserByEmail.mockResolvedValue({
      id: 2,
      email: 'wrong@example.com',
      password_hash: passwordHash,
      role_name: 'Customer'
    })

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'wrong@example.com', password: 'not-right' })

    expect(response.status).toBe(401)
    expect(response.body.error).toMatch(/invalid/i)
  })
})
