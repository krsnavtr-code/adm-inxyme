import api from './axios';

// Get all categories for user panel
export const getCategoriesForUser = async () => {
  try {
    const response = await api.get('/categories', {
      params: {
        status: 'active',
        fields: '_id,name,slug,description,image',
        sort: 'name',
        limit: 100
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching categories for user panel:', error);
    throw error;
  }
};

// Get all categories with pagination and filtering
export const getCategories = async (params = {}) => {
  try {
    // Default parameters
    const defaultParams = {
      limit: 25, // Default to 25 items per page
      page: 1,   // Default to first page
      sort: 'name',
      fields: '_id,name,slug,description,image,courseCount,showOnHome,isActive,createdAt',
    };
    
    // Merge default params with provided params
    const requestParams = { 
      ...defaultParams, 
      ...params,
      // Only include status in params if it's explicitly set
      ...(params.status && { status: params.status })
    };
    
    // Remove undefined values
    Object.keys(requestParams).forEach(key => {
      if (requestParams[key] === undefined || requestParams[key] === '') {
        delete requestParams[key];
      }
    });
    
    // console.log('Fetching categories with params:', requestParams);
    const response = await api.get('/categories', { params: requestParams });
    
    // Return the backend response directly
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Get a single category by ID
export const getCategoryById = async (id) => {
  try {
    const response = await api.get(`/categories/${id}`);
    // The backend returns { success: true, data: { ...category } }
    if (response.data && response.data.success && response.data.data) {
      return response.data.data; // Return just the category data
    }
    throw new Error('Invalid response format from server');
  } catch (error) {
    console.error(`Error fetching category with ID ${id}:`, error);
    throw error;
  }
};

// Create a new category
export const createCategory = async (formData) => {
  try {
    // console.log('createCategory called with data:', formData);
    
    // Get the current token
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Prepare headers
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    // Check if we're sending FormData (for file upload) or regular JSON
    const isFormData = formData instanceof FormData;
    
    // Don't set Content-Type for FormData, let the browser set it with the correct boundary
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Log FormData contents for debugging
    if (isFormData) {
      const formDataObj = {};
      formData.forEach((value, key) => {
        formDataObj[key] = value;
      });
      // console.log('FormData contents:', formDataObj);
    }
    
    const config = { headers };
    // console.log('Sending request with config:', config);
    
    const response = await api.post('/categories', formData, config);
    // console.log('Category created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      
      // If there are validation errors, include them in the error
      if (error.response.data && error.response.data.errors) {
        error.message = error.response.data.message || 'Validation failed';
        error.validationErrors = error.response.data.errors;
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    throw error;
  }
};

// Update an existing category
export const updateCategory = async (id, formData) => {
  try {
    // console.log('Sending update request to /categories/' + id);
    
    // Prepare config
    const config = {
      headers: {}
    };
    
    // If we have FormData, let the browser set the Content-Type with boundary
    // Otherwise, explicitly set it to application/json
    if (!(formData instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    // Get the current token
    const token = localStorage.getItem('token');
    if (token) {
      // Clean the token
      const cleanedToken = token.trim();
      if (cleanedToken) {
        // Ensure the token has the Bearer prefix
        config.headers.Authorization = cleanedToken.startsWith('Bearer ') 
          ? cleanedToken 
          : `Bearer ${cleanedToken}`;
      }
    }
    
    // Convert FormData to plain object for logging
    if (formData instanceof FormData) {
      const formDataObj = {};
      formData.forEach((value, key) => {
        formDataObj[key] = value;
      });
      // console.log('FormData contents:', formDataObj);
    } else {
      // console.log('Request data:', formData);
    }
    
    // Log the final headers being sent
    // console.log('Request headers:', config.headers);
    
    // Make the request
    const response = await api.put(`/categories/${id}`, formData, config);
    
    // console.log('Update successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Update failed:', error);
    console.error(`Error updating category with ID ${id}:`, error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    throw error;
  }
};

// Delete a category
export const deleteCategory = async (id) => {
  try {
    // Get the current token
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Prepare headers with authorization
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const response = await api.delete(`/categories/${id}`, config);
    return response.data;
  } catch (error) {
    console.error(`Error deleting category with ID ${id}:`, error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    throw error;
  }
};
