
import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  details: Record<string, unknown>;
  actorId?: string; // Who triggered it (User ID or 'system')
  targetId?: string; // e.g. Lock ID or Booking ID
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  action: { type: String, required: true },
  details: { type: Schema.Types.Mixed },
  actorId: { type: String },
  targetId: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

// Prevent overwrite if compiled
export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
