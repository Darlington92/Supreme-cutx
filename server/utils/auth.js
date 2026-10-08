import jwt from 'jsonwebtoken'

export function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required')
  }

  return process.env.JWT_SECRET
}

export function createToken({ subject, role }) {
  return jwt.sign({ role }, getJwtSecret(), {
    subject: subject.toString(),
    expiresIn: '8h',
  })
}

export function normalizePhone(phone) {
  return phone.trim().toLowerCase()
}
