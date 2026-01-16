import mongoose, { Schema, Model, Document, Types } from 'mongoose';

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
  images: string[];
  status: 'available' | 'booked' | 'rented' | 'maintenance';
  features: string[];
  isActive: boolean;
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
  images: [{ type: String }],
  status: { 
    type: String, 
    enum: ['available', 'booked', 'rented', 'maintenance'], 
    default: 'available' 
  },
  features: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Lock || mongoose.model<ILock>('Lock', lockSchema);
