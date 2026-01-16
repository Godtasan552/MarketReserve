import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IZone extends Document {
  name: string;
  description?: string;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const zoneSchema = new Schema<IZone>({
  name: { type: String, required: true },
  description: { type: String },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Zone || mongoose.model<IZone>('Zone', zoneSchema);
