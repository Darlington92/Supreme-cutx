import mongoose from 'mongoose'

const serviceTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    active: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
)

serviceTypeSchema.index({ name: 1 }, { unique: true })

export default mongoose.model('ServiceType', serviceTypeSchema)
