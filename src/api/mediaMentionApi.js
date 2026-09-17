import api from './axios';

// Get all media mentions with pagination and filtering
export const getMediaMentions = async (params = {}) => {
  try {
    const { page = 1, limit = 10, newsType, status = 'published', search } = params;
    const response = await api.get('/media-mentions', {
      params: {
        page,
        limit,
        ...(newsType && { newsType }),
        status,
        ...(search && { search })
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching media mentions:', error);
    throw error;
  }
};

// Get featured media mention
export const getFeaturedMediaMention = async () => {
  try {
    const response = await api.get('/media-mentions/featured');
    return response.data;
  } catch (error) {
    console.error('Error fetching featured media mention:', error);
    throw error;
  }
};

// Get a single media mention by slug
export const getMediaMentionBySlug = async (slug) => {
  try {
    const response = await api.get(`/media-mentions/slug/${slug}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching media mention by slug:', error);
    throw error;
  }
};

// Get a single media mention by ID
export const getMediaMentionById = async (id) => {
  try {
    const response = await api.get(`/media-mentions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching media mention by ID:', error);
    throw error;
  }
};

// Get media mentions by type
export const getMediaMentionsByType = async (type, params = {}) => {
  try {
    const response = await api.get(`/media-mentions/type/${type}`, {
      params: {
        status: 'published',
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching media mentions by type:', error);
    throw error;
  }
};

// Search media mentions
export const searchMediaMentions = async (query, params = {}) => {
  try {
    const response = await api.get('/media-mentions/search', {
      params: {
        q: query,
        status: 'published',
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching media mentions:', error);
    throw error;
  }
};

// Admin: Create a new media mention
export const createMediaMention = async (mentionData) => {
  try {
    const response = await api.post('/media-mentions', mentionData);
    return response.data;
  } catch (error) {
    console.error('Error creating media mention:', error);
    throw error;
  }
};

// Admin: Update a media mention
export const updateMediaMention = async (id, mentionData) => {
  try {
    const response = await api.patch(`/media-mentions/${id}`, mentionData);
    return response.data;
  } catch (error) {
    console.error('Error updating media mention:', error);
    throw error;
  }
};

// Admin: Delete a media mention
export const deleteMediaMention = async (id) => {
  try {
    const response = await api.delete(`/media-mentions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting media mention:', error);
    throw error;
  }
};
