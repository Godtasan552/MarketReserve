import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface IRefund extends Document {
  booking: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefund>({
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'processed'], 
    default: 'pending' 
  },
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date }
}, { timestamps: true });

export default mongoose.models.Refund || mongoose.model<IRefund>('Refund', refundSchema);
