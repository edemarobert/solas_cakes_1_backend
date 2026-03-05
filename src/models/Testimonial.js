import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true
  },
  clientImage: String,
  eventType: String,
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  testimonialText: {
    type: String,
    required: true
  },
  serviceType: String,
  verified: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Testimonial', testimonialSchema);
