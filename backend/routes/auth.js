import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'
import Staff from '../models/Staff.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = Router()
const saltRounds = 10
const invalidCredentialsMessage = 'Invalid credentials'

function issueToken(staff) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required')
  }

  return jwt.sign({ id: staff._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: '8h',
  })
}

function issueAdminToken(admin) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required')
  }

  return jwt.sign(
    { id: admin._id.toString(), role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' },
  )
}

function readString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

router.post('/signup', async (request, response, next) => {
  try {
    const body = request.body ?? {}
    const name = readString(body.name)
    const username = readString(body.username).toLowerCase()
    const password = typeof body.password === 'string' ? body.password : ''

    if (!name || username.length < 3 || password.length < 8) {
      return response.status(400).json({
        error: 'Name, username of at least 3 characters, and a password of at least 8 characters are required',
      })
    }

    const existingStaff = await Staff.findOne({ username }).select('_id active deletedAt')
    if (existingStaff && (existingStaff.active === false || existingStaff.deletedAt)) {
      await Staff.updateOne(
        { _id: existingStaff._id, username },
        { $set: { username: `archived-${existingStaff._id.toString()}-${Date.now()}` } },
      )
    } else if (existingStaff) {
      return response.status(400).json({ error: 'Username is already registered' })
    }

    const passwordHash = await bcrypt.hash(password, saltRounds)
    const staff = await Staff.create({ name, username, passwordHash })

    return response.status(201).json({
      token: issueToken(staff),
      staff: { id: staff._id.toString(), name: staff.name, username: staff.username },
    })
  } catch (error) {
    if (error?.code === 11000) {
      if (error.keyPattern?.username) {
        return response.status(400).json({ error: 'Username is already registered' })
      }
      return next(error)
    }
    return next(error)
  }
})

router.post('/login', async (request, response, next) => {
  try {
    const body = request.body ?? {}
    const username = readString(body.username).toLowerCase()
    const password = typeof body.password === 'string' ? body.password : ''
    const staff = await Staff.findOne({ username }).select('+passwordHash')

    // Keep the response identical for an unknown username, wrong password, and inactive account.
    const passwordMatches = staff
      ? await bcrypt.compare(password, staff.passwordHash)
      : false

    if (!staff || !passwordMatches || !staff.active) {
      return response.status(401).json({ error: invalidCredentialsMessage })
    }

    return response.json({
      token: issueToken(staff),
      staff: { id: staff._id.toString(), name: staff.name, username: staff.username },
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/admin-status', async (_request, response, next) => {
  try {
    const configured = Boolean(await Admin.exists({ active: true }))
    return response.json({ configured })
  } catch (error) {
    return next(error)
  }
})

router.post('/admin-signup', async (request, response, next) => {
  try {
    const body = request.body ?? {}
    const username = readString(body.username).toLowerCase()
    const password = typeof body.password === 'string' ? body.password : ''
    if (username.length < 3 || password.length < 8) {
      return response.status(400).json({
        error: 'A username of at least 3 characters and a password of at least 8 characters are required',
      })
    }

    const existingAdmin = await Admin.exists({})
    if (existingAdmin) {
      return response.status(409).json({
        error: 'Cashier account is already set up. Please sign in.',
      })
    }

    const passwordHash = await bcrypt.hash(password, saltRounds)
    const admin = await Admin.create({ username, accountKey: `cashier-${username}`, passwordHash })
    return response.status(201).json({
      token: issueAdminToken(admin),
      admin: { id: admin._id.toString(), username: admin.username, role: 'admin' },
    })
  } catch (error) {
    if (error?.code === 11000) {
      return response.status(409).json({
        error: 'Cashier account is already set up. Please sign in.',
      })
    }
    return next(error)
  }
})

router.post('/admin-login', async (request, response, next) => {
  try {
    const username = readString(request.body?.username).toLowerCase()
    const password = typeof request.body?.password === 'string'
      ? request.body.password
      : ''
    const admin = await Admin.findOne({ username }).select('+passwordHash')
    const passwordMatches = admin
      ? await bcrypt.compare(password, admin.passwordHash)
      : false

    if (!admin || !passwordMatches || !admin.active) {
      return response.status(401).json({ error: 'Invalid cashier username or password' })
    }

    return response.json({
      token: issueAdminToken(admin),
      admin: { id: admin._id.toString(), username: admin.username, role: 'admin' },
    })
  } catch (error) {
    return next(error)
  }
})

router.post('/admin-users', authMiddleware, async (request, response, next) => {
  if (request.authRole !== 'admin') return response.status(403).json({ error: 'Admin access required' })
  try {
    const username = readString(request.body?.username).toLowerCase()
    const password = typeof request.body?.password === 'string' ? request.body.password : ''
    if (username.length < 3 || password.length < 8) {
      return response.status(400).json({ error: 'Username must be at least 3 characters and password at least 8 characters' })
    }
    if (await Admin.exists({ username })) return response.status(409).json({ error: 'Username is already registered' })
    const admin = await Admin.create({
      username,
      accountKey: `cashier-${username}`,
      passwordHash: await bcrypt.hash(password, saltRounds),
    })
    return response.status(201).json({ admin: { id: admin._id.toString(), username: admin.username, role: 'admin' } })
  } catch (error) {
    if (error?.code === 11000) return response.status(409).json({ error: 'Username is already registered' })
    return next(error)
  }
})

export default router
