import 'dotenv/config'
import bcrypt from 'bcrypt'
import { connectDatabase } from '../config/db.js'
import { Admin } from '../models/Admin.js'

const password = process.env.ADMIN_PASSWORD

if (!password || password.length < 8) {
  throw new Error('ADMIN_PASSWORD must be set and contain at least 8 characters')
}

await connectDatabase()

const passwordHash = await bcrypt.hash(password, 12)
await Admin.findOneAndUpdate(
  { accountKey: 'cashier' },
  { $set: { passwordHash, active: true } },
  { upsert: true, new: true, setDefaultsOnInsert: true },
)

console.log('Cashier admin password hash saved')
process.exit(0)
