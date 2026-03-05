import Testimonial from '../models/Testimonial.js';

// Get all testimonials
export const getAllTestimonials = async (req, res) => {
  try {
    const { featured, page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (featured === 'true') query.featured = true;
    query.verified = true; // Only show verified testimonials

    const testimonials = await Testimonial.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Testimonial.countDocuments(query);

    res.json({
      testimonials,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching testimonials', error: error.message });
  }
};

// Get testimonial by ID
export const getTestimonialById = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }
    res.json(testimonial);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching testimonial', error: error.message });
  }
};

// Create testimonial
export const createTestimonial = async (req, res) => {
  try {
    const { clientName, clientImage, eventType, rating, testimonialText, serviceType } = req.body;

    if (!clientName || !rating || !testimonialText) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const testimonial = new Testimonial({
      clientName,
      clientImage,
      eventType,
      rating,
      testimonialText,
      serviceType,
      verified: false
    });

    const savedTestimonial = await testimonial.save();
    res.status(201).json(savedTestimonial);
  } catch (error) {
    res.status(500).json({ message: 'Error creating testimonial', error: error.message });
  }
};

// Update testimonial (admin only)
export const updateTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }
    res.json(testimonial);
  } catch (error) {
    res.status(500).json({ message: 'Error updating testimonial', error: error.message });
  }
};

// Verify testimonial (admin only)
export const verifyTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id, 
      { verified: true }, 
      { new: true }
    );
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }
    res.json(testimonial);
  } catch (error) {
    res.status(500).json({ message: 'Error verifying testimonial', error: error.message });
  }
};

// Delete testimonial (admin only)
export const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }
    res.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting testimonial', error: error.message });
  }
};
