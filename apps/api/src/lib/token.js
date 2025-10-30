import jwt from 'jsonwebtoken'

const EXPIRY = '12h'

export function generateToken (user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set')
  }

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role_name ?? user.role
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: EXPIRY })
}

export function verifyToken (token) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set')
  }

  return jwt.verify(token, process.env.JWT_SECRET)
}
