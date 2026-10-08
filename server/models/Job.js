import mongoose from 'mongoose'

const jobSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
      index: true,
    },
    serviceType: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    // Mongoose creates this timestamp on the server; clients cannot provide it.
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'voided'],
      default: 'pending',
      index: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    voidReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
  },
  { timestamps: true },
)

jobSchema.index({ staffId: 1, createdAt: -1 })
jobSchema.index({ status: 1, createdAt: -1 })

export const Job = mongoose.model('Job', jobSchema)
