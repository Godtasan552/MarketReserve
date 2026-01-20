import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILock extends Document {
  lockNumber: string;
  zone: Types.ObjectId;
  size: {
    width: number;
    length: number;
    unit: 'm' | 'sqm';
  };
  pricing: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  description?: string;
  images: string[];
  status: 'available' | 'booked' | 'rented' | 'maintenance' | 'reserved';
  features: string[];
  isActive: boolean;
  reservedTo?: Types.ObjectId;
  reservationExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const lockSchema = new Schema<ILock>({
  lockNumber: { type: String, required: true, unique: true },
  zone: { type: Schema.Types.ObjectId, ref: 'Zone', required: true },
  size: {
    width: { type: Number, required: true },
    length: { type: Number, required: true },
    unit: { type: String, enum: ['m', 'sqm'], default: 'm' }
  },
  pricing: {
    daily: { type: Number, required: true },
    weekly: { type: Number },
    monthly: { type: Number }
  },
  description: { type: String },
  images: [{ type: String }],
  status: { 
    type: String, 
    enum: ['available', 'booked', 'rented', 'maintenance', 'reserved'], 
    default: 'available' 
  },
  reservedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  reservationExpiresAt: { type: Date },
  features: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Lock || mongoose.model<ILock>('Lock', lockSchema);
