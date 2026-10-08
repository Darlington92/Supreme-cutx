import { Router } from 'express'
import bcrypt from 'bcrypt'
import { Admin } from '../models/Admin.js'
import { Staff } from '../models/Staff.js'
import { createToken, normalizePhone } from '../utils/auth.js'

const router = Router()
const passwordRounds = 12

function readCredentials(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const phone = typeof body.phone === 'string' ? normalizePhone(body.phone) : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!phone || password.length < 8) {
    return { error: 'A phone number and password of at least 8 characters are required' }
  }

  return { name, phone, password }
}

router.post('/signup', async (request, response, next) => {
  try {
    const credentials = readCredentials(request.body)

    if (credentials.error || !credentials.name) {
      return response.status(400).json({
        error: credentials.error ?? 'Name is required',
      })
    }

    const existingStaff = await Staff.exists({ phone: credentials.phone })
    if (existingStaff) {
      return response.status(409).json({ error: 'Phone is already registered' })
    }

    // Only the bcrypt hash is persisted. The raw password is never sent to MongoDB.
    const passwordHash = await bcrypt.hash(credentials.password, passwordRounds)
    const staff = await Staff.create({
      name: credentials.name,
      phone: credentials.phone,
      passwordHash,
    })

    const token = createToken({ subject: staff._id, role: staff.role })
    return response.status(201).json({
      token,
      user: {
        id: staff._id,
        name: staff.name,
        phone: staff.phone,
        role: staff.role,
      },
    })
  } catch (error) {
    if (error?.code === 11000) {
      return response.status(409).json({ error: 'Phone is already registered' })
    }
    return next(error)
  }
})

router.post('/login', async (request, response, next) => {
  try {
    const credentials = readCredentials(request.body)
    if (credentials.error) {
      return response.status(400).json({ error: credentials.error })
    }

    const staff = await Staff.findOne({ phone: credentials.phone }).select('+passwordHash')
    const passwordMatches = staff
      ? await bcrypt.compare(credentials.password, staff.passwordHash)
      : false

    if (!staff || !passwordMatches || !staff.active) {
      return response.status(401).json({ error: 'Invalid phone or password' })
    }

    const token = createToken({ subject: staff._id, role: staff.role })
    return response.json({
      token,
      user: {
        id: staff._id,
        name: staff.name,
        phone: staff.phone,
        role: staff.role,
      },
    })
  } catch (error) {
    return next(error)
  }
})

router.post('/admin-login', async (request, response, next) => {
  try {
    const password = typeof request.body.password === 'string' ? request.body.password : ''
    if (!password) {
      return response.status(400).json({ error: 'Password is required' })
    }

    const admin = await Admin.findOne({ accountKey: 'cashier' }).select('+passwordHash')
    const passwordMatches = admin
      ? await bcrypt.compare(password, admin.passwordHash)
      : false

    if (!admin || !passwordMatches || !admin.active) {
      return response.status(401).json({ error: 'Invalid cashier password' })
    }

    const token = createToken({ subject: admin._id, role: 'admin' })
    return response.json({
      token,
      user: {
        id: admin._id,
        role: 'admin',
      },
    })
  } catch (error) {
    return next(error)
  }
})

export default router
