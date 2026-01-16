import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: 'booking_confirmed' | 'payment_approved' | 'expiry_warning' | 'renewal_reminder' | 'lock_available';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  sentVia: string[];
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { 
    type: String, 
    enum: ['booking_confirmed', 'payment_approved', 'expiry_warning', 'renewal_reminder', 'lock_available'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  read: { type: Boolean, default: false },
  sentVia: [{ type: String }] // e.g. ['email', 'push', 'sms']
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
