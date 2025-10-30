import express from 'express'
import passport from 'passport'
import bcrypt from 'bcryptjs'
import { generateToken, verifyToken } from '../lib/token.js'
import { findUserByEmail, findUserById } from '../lib/userRepository.js'

const router = express.Router()
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'

router.get('/google', passport.authenticate('google', {
  session: false,
  scope: ['profile', 'email']
}))

router.get('/google/callback', passport.authenticate('google', { session: false }), async (req, res, next) => {
  try {
    const token = generateToken({
      id: req.user.id,
      email: req.user.email,
      role_name: req.user.role_name
    })
    const redirectUrl = new URL('/auth/callback', FRONTEND_URL)
    redirectUrl.searchParams.set('token', token)
    res.redirect(redirectUrl.toString())
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const user = await findUserByEmail(email)
  if (!user?.password_hash) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash)
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = generateToken(user)
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role_name,
      name: user.full_name
    }
  })
})

router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(400).json({ error: 'Missing token' })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    const user = await findUserById(payload.sub)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({
      id: user.id,
      email: user.email,
      role: user.role_name,
      name: user.full_name
    })
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
})

export default router
