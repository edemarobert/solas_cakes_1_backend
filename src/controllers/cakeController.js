import Cake from '../models/Cake.js';

// Get all cakes with optional filters
export const getAllCakes = async (req, res) => {
  try {
    const { category, featured, available, page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (category) query.category = category;
    if (featured === 'true') query.featured = true;
    if (available === 'false') query.available = false;

    const cakes = await Cake.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Cake.countDocuments(query);

    res.json({
      cakes,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cakes', error: error.message });
  }
};

// Get single cake by ID
export const getCakeById = async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    if (!cake) {
      return res.status(404).json({ message: 'Cake not found' });
    }
    res.json(cake);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cake', error: error.message });
  }
};

// Get cakes by category
export const getCakesByCategory = async (req, res) => {
  try {
    const cakes = await Cake.find({ category: req.params.category });
    res.json(cakes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cakes by category', error: error.message });
  }
};

// Create new cake (admin only)
export const createCake = async (req, res) => {
  try {
    const { name, description, category, basePrice, servings, flavors, fillings, images, featured, sizes, customizable, preparationTime, dietary } = req.body;

    if (!name || !category || !basePrice) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const cake = new Cake({
      name,
      description,
      category,
      basePrice,
      servings,
      sizes,
      flavors,
      fillings,
      images,
      featured,
      customizable,
      preparationTime,
      dietary
    });

    const savedCake = await cake.save();
    res.status(201).json(savedCake);
  } catch (error) {
    res.status(500).json({ message: 'Error creating cake', error: error.message });
  }
};

// Update cake (admin only)
export const updateCake = async (req, res) => {
  try {
    const updates = req.body;
    const cake = await Cake.findByIdAndUpdate(req.params.id, updates, { new: true });
    
    if (!cake) {
      return res.status(404).json({ message: 'Cake not found' });
    }

    res.json(cake);
  } catch (error) {
    res.status(500).json({ message: 'Error updating cake', error: error.message });
  }
};

// Delete cake (admin only)
export const deleteCake = async (req, res) => {
  try {
    const cake = await Cake.findByIdAndDelete(req.params.id);
    
    if (!cake) {
      return res.status(404).json({ message: 'Cake not found' });
    }

    res.json({ message: 'Cake deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting cake', error: error.message });
  }
};

// Add review to cake
export const addReview = async (req, res) => {
  try {
    const { userId, rating, comment } = req.body;
    const cake = await Cake.findById(req.params.id);

    if (!cake) {
      return res.status(404).json({ message: 'Cake not found' });
    }

    cake.reviews.push({
      userId,
      rating,
      comment,
      createdAt: new Date()
    });

    // Update average rating
    const avgRating = cake.reviews.reduce((sum, r) => sum + r.rating, 0) / cake.reviews.length;
    cake.rating = avgRating;

    await cake.save();
    res.json(cake);
  } catch (error) {
    res.status(500).json({ message: 'Error adding review', error: error.message });
  }
};
