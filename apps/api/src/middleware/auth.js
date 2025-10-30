import { verifyToken } from '../lib/token.js'
import { findUserById } from '../lib/userRepository.js'

export async function authenticate (req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    const user = await findUserById(payload.sub)

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role_name
    }
    next()
  } catch (err) {
    console.error('[auth] Authentication failed', err.message)
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function authorizeRoles (...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}
