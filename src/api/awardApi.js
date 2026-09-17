import api from './axios';

// Get all awards with pagination and filtering
export const getAwards = async (params = {}) => {
  try {
    const { page = 1, limit = 10, awardCategory, status = 'published', search } = params;
    const response = await api.get('/awards', {
      params: {
        page,
        limit,
        ...(awardCategory && { awardCategory }),
        status,
        ...(search && { search })
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching awards:', error);
    throw error;
  }
};

// Get featured award
export const getFeaturedAward = async () => {
  try {
    const response = await api.get('/awards/featured');
    return response.data;
  } catch (error) {
    console.error('Error fetching featured award:', error);
    throw error;
  }
};

// Get a single award by slug
export const getAwardBySlug = async (slug) => {
  try {
    const response = await api.get(`/awards/slug/${slug}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching award by slug:', error);
    throw error;
  }
};

// Get a single award by ID
export const getAwardById = async (id) => {
  try {
    const response = await api.get(`/awards/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching award by ID:', error);
    throw error;
  }
};

// Get awards by category
export const getAwardsByCategory = async (category, params = {}) => {
  try {
    const response = await api.get(`/awards/category/${category}`, {
      params: {
        status: 'published',
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching awards by category:', error);
    throw error;
  }
};

// Search awards
export const searchAwards = async (query, params = {}) => {
  try {
    const response = await api.get('/awards/search', {
      params: {
        q: query,
        status: 'published',
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching awards:', error);
    throw error;
  }
};

// Admin: Create a new award
export const createAward = async (awardData) => {
  try {
    const response = await api.post('/awards', awardData);
    return response.data;
  } catch (error) {
    console.error('Error creating award:', error);
    throw error;
  }
};

// Admin: Update an award
export const updateAward = async (id, awardData) => {
  try {
    const response = await api.patch(`/awards/${id}`, awardData);
    return response.data;
  } catch (error) {
    console.error('Error updating award:', error);
    throw error;
  }
};

// Admin: Delete an award
export const deleteAward = async (id) => {
  try {
    const response = await api.delete(`/awards/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting award:', error);
    throw error;
  }
};