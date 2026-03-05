import Order from '../models/Order.js';

// Generate unique order number
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Create new order
export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id; // Get from authenticated user
    const { items, eventDate, eventType, guestCount, deliveryAddress, deliveryDate, deliveryType, specialRequests, paymentMethod } = req.body;

    console.log('Creating order for user:', userId);

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' });
    }

    if (!deliveryAddress || !deliveryDate || !deliveryType) {
      return res.status(400).json({ message: 'Missing required delivery information' });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = deliveryType === 'delivery' ? 10000 : 0; // 10k UGX delivery fee
    const total = subtotal + deliveryFee; // No tax for now

    const order = new Order({
      orderNumber: generateOrderNumber(),
      userId,
      items,
      eventDate: eventDate || deliveryDate,
      eventType: eventType || 'Custom Order',
      guestCount: guestCount || items.reduce((sum, item) => sum + item.quantity, 0),
      deliveryAddress,
      deliveryDate,
      deliveryType,
      specialRequests,
      subtotal,
      deliveryFee,
      tax: 0, // No tax
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'bank_transfer' || paymentMethod === 'cash' ? 'pending' : 'pending'
    });

    const savedOrder = await order.save();
    
    if (!savedOrder) {
      return res.status(500).json({ message: 'Failed to save order' });
    }

    console.log('Order created successfully:', savedOrder._id);
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'firstName lastName email phone');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

// Get order by order number (for tracking)
export const getOrderByNumber = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber }).populate('userId', 'firstName lastName email phone');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Update order status (admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    if (!['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        notes,
        updatedAt: new Date() 
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order', error: error.message });
  }
};

// Update payment status (admin only)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentMethod, transactionId } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        paymentStatus, 
        paymentMethod, 
        transactionId 
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error updating payment', error: error.message });
  }
};

// Get all orders (admin only)
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('userId', 'firstName lastName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (['delivered', 'preparing'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot cancel order in this status' });
    }

    order.status = 'cancelled';
    order.updatedAt = new Date();
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling order', error: error.message });
  }
};
