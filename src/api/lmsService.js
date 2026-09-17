import axios from 'axios';

const API_BASE_URL = '/api/lms'; // Update this with your actual API base URL

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // or your token storage key
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized error
      // Redirect to login or refresh token
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const lmsService = {
  // Get user's enrolled courses
  getEnrolledCourses: async () => {
    try {
      const response = await api.get('/enrolled-courses');
      return response.data;
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      throw error;
    }
  },

  // Get recommended courses
  getRecommendedCourses: async () => {
    try {
      const response = await api.get('/recommended-courses');
      return response.data;
    } catch (error) {
      console.error('Error fetching recommended courses:', error);
      throw error;
    }
  },

  // Get learning statistics
  getLearningStats: async () => {
    try {
      const response = await api.get('/learning-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching learning stats:', error);
      throw error;
    }
  },

  // Update course progress
  updateCourseProgress: async (courseId, data) => {
    try {
      const response = await api.put(`/courses/${courseId}/progress`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating course progress:', error);
      throw error;
    }
  }
};

export default lmsService;
