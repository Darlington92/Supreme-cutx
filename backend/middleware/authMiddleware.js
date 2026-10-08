import jwt from 'jsonwebtoken'
import Staff from '../models/Staff.js'
import Admin from '../models/Admin.js'

export default async function authMiddleware(request, response, next) {
  const authorization = request.get('Authorization')
  const [scheme, token] = authorization?.split(' ') ?? []

  if (scheme !== 'Bearer' || !token) {
    return response.status(401).json({ error: 'Authentication required' })
  }

  if (!process.env.JWT_SECRET) {
    return next(new Error('JWT_SECRET is required'))
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (!payload.id || typeof payload.id !== 'string') {
      return response.status(401).json({ error: 'Invalid token' })
    }

    // Downstream protected handlers use this server-verified id, never a client body value.
    request.authRole = payload.role ?? 'staff'
    const account = request.authRole === 'admin'
      ? await Admin.findOne({ _id: payload.id, active: true })
      : await Staff.findOne({ _id: payload.id, active: true, deletedAt: null })
    if (!account) return response.status(401).json({ error: 'Account is inactive' })
    request.staffId = payload.id
    return next()
  } catch {
    return response.status(401).json({ error: 'Invalid or expired token' })
  }
}
