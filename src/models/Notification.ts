import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: 'booking_created' | 'payment_uploaded' | 'booking_approved' | 'booking_rejected' | 'booking_cancelled' | 'booking_expiring' | 'system';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

// Performance index
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// Check if model exists to prevent overwrite error during hot reload
export default mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
