import mongoose from 'mongoose';

const cateringSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: true
  },
  description: String,
  serviceType: {
    type: String,
    enum: ['PlatedDinner', 'Buffet', 'CocktailReception', 'Custom'],
    required: true
  },
  basePrice: Number,
  pricePerPerson: Number,
  minimumGuests: Number,
  menuItems: [{
    itemName: String,
    description: String,
    category: String,
    image: String
  }],
  inclusions: [String],
  setupIncluded: Boolean,
  decorIncluded: Boolean,
  staffIncluded: Boolean,
  images: [String],
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Catering', cateringSchema);
