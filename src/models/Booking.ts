import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface IBooking extends Document {
  user: Types.ObjectId;
  lock: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  rentalType: 'daily' | 'weekly' | 'monthly';
  totalAmount: number;
  status: 'pending_payment' | 'pending_verification' | 'active' | 'expired' | 'cancelled';
  paymentDeadline: Date;
  payment?: Types.ObjectId;
  isRenewal: boolean;
  previousBooking?: Types.ObjectId;
  cancelledAt?: Date;
  cancellationReason?: string;
  renewalNotificationSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lock: { type: Schema.Types.ObjectId, ref: 'Lock', required: true },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true, index: true },
  rentalType: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly'], 
    required: true 
  },
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending_payment', 'pending_verification', 'active', 'expired', 'cancelled'],
    default: 'pending_payment',
    index: true
  },
  paymentDeadline: { type: Date, index: true },
  payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
  isRenewal: { type: Boolean, default: false },
  previousBooking: { type: Schema.Types.ObjectId, ref: 'Booking' },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  renewalNotificationSent: { type: Boolean, default: false }
}, { timestamps: true });

// Compound indexes
bookingSchema.index({ lock: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ user: 1, status: 1 });

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);
