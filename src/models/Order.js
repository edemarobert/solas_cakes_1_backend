import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    cakeId: mongoose.Schema.Types.ObjectId,
    name: String,
    quantity: Number,
    customizations: {
      flavor: String,
      filling: String,
      size: String,
      inscriptionText: String,
      inspirationPhotos: [String],
      message: String,
      priceAdjustment: Number
    },
    price: Number
  }],
  eventDate: Date,
  eventType: String,
  guestCount: Number,
  deliveryAddress: {
    type: String,
    required: true
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  deliveryType: {
    type: String,
    enum: ['delivery', 'pickup'],
    required: true
  },
  specialRequests: String,
  subtotal: Number,
  deliveryFee: Number,
  tax: Number,
  total: Number,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: String,
  transactionId: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Order', orderSchema);
