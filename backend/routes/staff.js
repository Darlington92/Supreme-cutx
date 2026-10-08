import { Router } from 'express'
import mongoose from 'mongoose'
import Staff from '../models/Staff.js'
import bcrypt from 'bcrypt'
import AuditLog from '../models/AuditLog.js'

const router = Router()

router.get('/', async (request, response, next) => {
  if (request.authRole !== 'admin') return response.status(403).json({ error: 'Admin access required' })
  try {
    const staff = await Staff.find({ deletedAt: null }).select('name username active disabledAt').sort({ name: 1 })
    return response.json({ staff })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:id', async (request, response, next) => {
  if (request.authRole !== 'admin') return response.status(403).json({ error: 'Admin access required' })
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid barber account id' })
    const deleted = await Staff.findOneAndUpdate(
      { _id: request.params.id, deletedAt: null },
      { $set: { active: false, deletedAt: new Date(), deletedBy: request.staffId, username: `archived-${request.params.id}` } },
      { new: true },
    )
    if (!deleted) return response.status(404).json({ error: 'Barber account not found' })
    await AuditLog.create({ action: 'delete', entity: 'staff', entityId: deleted._id, actorId: request.staffId, actorRole: request.authRole })
    return response.json({ deleted: true, id: request.params.id })
  } catch (error) {
    return next(error)
  }
})

async function setActive(request, response, next, active) {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid barber account id' })
    const staff = await Staff.findOneAndUpdate(
      { _id: request.params.id, deletedAt: null },
      { $set: { active, disabledAt: active ? null : new Date(), disabledBy: active ? null : request.staffId } },
      { new: true },
    ).select('name username active disabledAt')
    if (!staff) return response.status(404).json({ error: 'Barber account not found' })
    await AuditLog.create({ action: active ? 'reactivate' : 'disable', entity: 'staff', entityId: staff._id, actorId: request.staffId, actorRole: request.authRole })
    return response.json({ staff })
  } catch (error) { return next(error) }
}

router.patch('/:id/disable', async (request, response, next) => {
  if (request.authRole !== 'admin') return response.status(403).json({ error: 'Admin access required' })
  return setActive(request, response, next, false)
})

router.patch('/:id/reactivate', async (request, response, next) => {
  if (request.authRole !== 'admin') return response.status(403).json({ error: 'Admin access required' })
  return setActive(request, response, next, true)
})

router.post('/:id/reset-password', async (request, response, next) => {
  if (request.authRole !== 'admin') return response.status(403).json({ error: 'Admin access required' })
  try {
    const password = typeof request.body?.password === 'string' ? request.body.password : ''
    if (password.length < 8) return response.status(400).json({ error: 'Password must be at least 8 characters' })
    const staff = await Staff.findOneAndUpdate({ _id: request.params.id, deletedAt: null }, { $set: { passwordHash: await bcrypt.hash(password, 10) } }, { new: true })
    if (!staff) return response.status(404).json({ error: 'Barber account not found' })
    await AuditLog.create({ action: 'reset-password', entity: 'staff', entityId: staff._id, actorId: request.staffId, actorRole: request.authRole })
    return response.json({ reset: true, id: staff._id })
  } catch (error) { return next(error) }
})

export default router
