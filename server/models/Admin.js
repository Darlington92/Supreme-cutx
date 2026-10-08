import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema(
  {
    // A single shared admin document is sufficient for the current shop size.
    accountKey: {
      type: String,
      required: true,
      unique: true,
      default: 'cashier',
      immutable: true,
    },
    // Passwords must be bcrypt hashes. Raw passwords are never stored here.
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

export const Admin = mongoose.model('Admin', adminSchema)
