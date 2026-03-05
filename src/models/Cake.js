import mongoose from 'mongoose';

const cakeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['Wedding', 'Birthday', 'Corporate', 'Anniversary', 'Custom'],
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  servings: {
    type: Number,
    default: 1
  },
  sizes: [{
    name: String,
    servings: Number,
    priceAdjustment: {
      type: Number,
      default: 0
    }
  }],
  flavors: [String],
  fillings: [String],
  images: [String],
  featured: {
    type: Boolean,
    default: false
  },
  customizable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number,
    default: 0
  },
  dietary: String,
  available: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0
  },
  reviews: [{
    userId: mongoose.Schema.Types.ObjectId,
    rating: Number,
    comment: String,
    createdAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Cake', cakeSchema);
