import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  booking: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  slipImage: string;
  slipHash?: string;
  ocrResult?: {
    amount?: number;
    date?: Date;
    time?: string;
    referenceNumber?: string;
    confidence?: number;
  };
  ocrEdited?: boolean;
  status: 'pending' | 'approved' | 'rejected';
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  slipImage: { type: String, required: true },
  slipHash: { type: String, index: true },
  ocrResult: {
    amount: Number,
    date: Date,
    time: String,
    referenceNumber: String,
    confidence: Number
  },
  ocrEdited: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending',
    index: true 
  },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  rejectionReason: { type: String },
  receiptUrl: { type: String }
}, { timestamps: true });

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', paymentSchema);
