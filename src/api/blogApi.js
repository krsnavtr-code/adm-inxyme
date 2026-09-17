import api from './axios';

// Get all blog posts with pagination and filtering
export const getBlogPosts = async (params = {}) => {
  try {
    const { page = 1, limit = 10, category, status = 'published' } = params;
    const response = await api.get('/blog/posts', {
      params: {
        page,
        limit,
        ...(category && { category }),
        status
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    throw error;
  }
};

// Get a single blog post by slug
export const getBlogPostBySlug = async (slug) => {
  try {
    const response = await api.get(`/blog/posts/${slug}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    throw error;
  }
};

// Get a single blog post by ID
export const getBlogPostById = async (id) => {
  try {
    const response = await api.get(`/blog/posts/id/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching blog post by ID:', error);
    throw error;
  }
};

// Get posts by category
export const getPostsByCategory = async (category, params = {}) => {
  try {
    const response = await api.get(`/blog/categories/${category}`, {
      params: {
        status: 'published',
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    throw error;
  }
};

// Search blog posts
export const searchBlogPosts = async (query, params = {}) => {
  try {
    const response = await api.get('/blog/search', {
      params: {
        q: query,
        status: 'published',
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching blog posts:', error);
    throw error;
  }
};

// Admin: Create a new blog post
export const createBlogPost = async (postData) => {
  try {
    const response = await api.post('/blog/posts', postData);
    return response.data;
  } catch (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }
};

// Admin: Update a blog post
export const updateBlogPost = async (id, postData) => {
  try {
    const response = await api.patch(`/blog/posts/${id}`, postData);
    return response.data;
  } catch (error) {
    console.error('Error updating blog post:', error);
    throw error;
  }
};

// Admin: Delete a blog post
export const deleteBlogPost = async (id) => {
  try {
    const response = await api.delete(`/blog/posts/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting blog post:', error);
    throw error;
  }
};

// Get all blog categories
export const getBlogCategories = async () => {
  try {
    const response = await api.get('/blog/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    throw error;
  }
};
