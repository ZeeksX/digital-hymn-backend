import mongoose from 'mongoose';
import { env } from './env';

export async function connectDatabase(uri?: string): Promise<typeof mongoose> {
  const mongoUri = uri || env.MONGODB_URI;

  mongoose.connection.on('connected', () => {
    if (env.NODE_ENV !== 'test') {
      console.log('MongoDB connected successfully.');
    }
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    if (env.NODE_ENV !== 'test') {
      console.warn('MongoDB disconnected.');
    }
  });

  return mongoose.connect(mongoUri, {
    autoIndex: true, // Builds indexes
  });
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
