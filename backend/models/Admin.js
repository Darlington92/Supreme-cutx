import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 50,
    },
    accountKey: {
      type: String,
      default: 'cashier',
      unique: true,
      immutable: true,
    },
    // Only a bcrypt hash is stored. Raw cashier passwords are never persisted.
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

export default mongoose.model('Admin', adminSchema)
