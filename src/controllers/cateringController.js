import Catering from '../models/Catering.js';

// Get all catering services
export const getAllCatering = async (req, res) => {
  try {
    const { featured, page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (featured === 'true') query.featured = true;

    const services = await Catering.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Catering.countDocuments(query);

    res.json({
      services,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching catering services', error: error.message });
  }
};

// Get catering service by ID
export const getCateringById = async (req, res) => {
  try {
    const service = await Catering.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Catering service not found' });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching catering service', error: error.message });
  }
};

// Create catering service (admin only)
export const createCatering = async (req, res) => {
  try {
    const { serviceName, description, serviceType, basePrice, pricePerPerson, minimumGuests, menuItems, inclusions, setupIncluded, decorIncluded, staffIncluded, images } = req.body;

    const service = new Catering({
      serviceName,
      description,
      serviceType,
      basePrice,
      pricePerPerson,
      minimumGuests,
      menuItems,
      inclusions,
      setupIncluded,
      decorIncluded,
      staffIncluded,
      images
    });

    const savedService = await service.save();
    res.status(201).json(savedService);
  } catch (error) {
    res.status(500).json({ message: 'Error creating catering service', error: error.message });
  }
};

// Update catering service (admin only)
export const updateCatering = async (req, res) => {
  try {
    const service = await Catering.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) {
      return res.status(404).json({ message: 'Catering service not found' });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error updating catering service', error: error.message });
  }
};

// Delete catering service (admin only)
export const deleteCatering = async (req, res) => {
  try {
    const service = await Catering.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Catering service not found' });
    }
    res.json({ message: 'Catering service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting catering service', error: error.message });
  }
};
