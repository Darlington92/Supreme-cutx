import { Router } from 'express'
import mongoose from 'mongoose'
import ServiceType from '../models/ServiceType.js'
import AuditLog from '../models/AuditLog.js'

const router = Router()
const adminOnly = (request, response, next) => request.authRole === 'admin'
  ? next() : response.status(403).json({ error: 'Admin access required' })

router.get('/', async (request, response, next) => {
  try {
    const filter = request.query.includeDeleted === 'true' && request.authRole === 'admin'
      ? {} : { active: true, deletedAt: null }
    return response.json({ serviceTypes: await ServiceType.find(filter).sort({ name: 1 }) })
  } catch (error) { return next(error) }
})

router.post('/', adminOnly, async (request, response, next) => {
  try {
    const name = typeof request.body?.name === 'string' ? request.body.name.trim() : ''
    if (!name) return response.status(400).json({ error: 'Service type name is required' })
    const serviceType = await ServiceType.create({ name })
    await AuditLog.create({ action: 'create', entity: 'serviceType', entityId: serviceType._id, actorId: request.staffId, actorRole: request.authRole, details: { name } })
    return response.status(201).json({ serviceType })
  } catch (error) {
    if (error?.code === 11000) return response.status(409).json({ error: 'Service type already exists' })
    return next(error)
  }
})

router.patch('/:id', adminOnly, async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid service type id' })
    const name = typeof request.body?.name === 'string' ? request.body.name.trim() : undefined
    const active = typeof request.body?.active === 'boolean' ? request.body.active : undefined
    if (!name && active === undefined) return response.status(400).json({ error: 'A name or active status is required' })
    const update = {}
    if (name) update.name = name
    if (active !== undefined) { update.active = active; if (active) update.deletedAt = null }
    const serviceType = await ServiceType.findOneAndUpdate({ _id: request.params.id, deletedAt: null }, { $set: update }, { new: true, runValidators: true })
    if (!serviceType) return response.status(404).json({ error: 'Service type not found' })
    await AuditLog.create({ action: 'update', entity: 'serviceType', entityId: serviceType._id, actorId: request.staffId, actorRole: request.authRole, details: update })
    return response.json({ serviceType })
  } catch (error) { return next(error) }
})

router.delete('/:id', adminOnly, async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid service type id' })
    const serviceType = await ServiceType.findOneAndUpdate({ _id: request.params.id, deletedAt: null }, { $set: { active: false, deletedAt: new Date(), deletedBy: request.staffId } }, { new: true })
    if (!serviceType) return response.status(404).json({ error: 'Service type not found' })
    await AuditLog.create({ action: 'delete', entity: 'serviceType', entityId: serviceType._id, actorId: request.staffId, actorRole: request.authRole })
    return response.json({ deleted: true, id: request.params.id })
  } catch (error) { return next(error) }
})

export default router
