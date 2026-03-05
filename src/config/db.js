import mongoose from 'mongoose';
// Database connection
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI );
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};
