import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQueue extends Document {
  user: Types.ObjectId;
  lock: Types.ObjectId;
  createdAt: Date;
}

const queueSchema = new Schema<IQueue>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  lock: { type: Schema.Types.ObjectId, ref: 'Lock', required: true, index: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

// Ensure user can only join queue once per lock
queueSchema.index({ lock: 1, user: 1 }, { unique: true });
// Ensure we can efficiently find the queue order for a lock
queueSchema.index({ lock: 1, createdAt: 1 });

export default mongoose.models.Queue || mongoose.model<IQueue>('Queue', queueSchema);
