import mongoose from 'mongoose';

// Import all models to ensure they are registered with Mongoose
import '@/models/User';
import '@/models/Zone';
import '@/models/Lock';
import '@/models/Booking';
import '@/models/Payment';
import '@/models/Notification';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('MONGODB_URI or MONGO_URI is not defined in environment variables');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    if (!MONGODB_URI) {
      throw new Error('Mongo connection string is missing inside connectDB');
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
