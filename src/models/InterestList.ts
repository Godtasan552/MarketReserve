import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface IInterestList extends Document {
  user: Types.ObjectId;
  lock: Types.ObjectId;
  notified: boolean;
  createdAt: Date;
}

const interestListSchema = new Schema<IInterestList>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  lock: { type: Schema.Types.ObjectId, ref: 'Lock', required: true, index: true },
  notified: { type: Boolean, default: false }
}, { timestamps: { createdAt: true, updatedAt: false } });

// Prevent duplicate interest per lock/user
interestListSchema.index({ lock: 1, user: 1 }, { unique: true });

export default mongoose.models.InterestList || mongoose.model<IInterestList>('InterestList', interestListSchema);
