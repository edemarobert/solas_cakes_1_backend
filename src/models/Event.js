import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    enum: ['Wedding', 'Corporate', 'Birthday', 'Anniversary', 'Other'],
    required: true
  },
  date: Date,
  venue: String,
  venuCity: String,
  guestCount: Number,
  budget: Number,
  timeline: String,
  clientName: String,
  clientEmail: String,
  clientPhone: String,
  portfolioImages: [String],
  description: String,
  challenges: String,
  solutions: String,
  testimonial: String,
  published: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Event', eventSchema);
