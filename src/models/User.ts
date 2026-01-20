import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IUser {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'user' | 'staff' | 'admin' | 'superadmin';
  isActive: boolean;
  isBlacklisted: boolean;
  emailVerified: boolean;
  queueDropCount: number;
  lastQueueDropAt?: Date;
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

type UserModel = Model<IUser, object, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  name: { type: String, required: true },
  phone: { type: String },
  role: { 
    type: String, 
    enum: ['user', 'staff', 'admin', 'superadmin'], 
    default: 'user' 
  },
  isActive: { type: Boolean, default: true },
  isBlacklisted: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  queueDropCount: { type: Number, default: 0 },
  lastQueueDropAt: { type: Date },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  }
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model<IUser, UserModel>('User', userSchema);
