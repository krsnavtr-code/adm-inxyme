import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4002/api') + '/v1/tasks';

// Add request interceptor
axios.interceptors.request.use(
  config => {
    return config;
  },
  error => {
    console.error('Request Error Interceptor:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
axios.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    console.error('Response Error Interceptor:', {
      message: error.message,
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      },
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    return Promise.reject(error);
  }
);

// Get auth token from localStorage
const getAuthToken = () => {
  try {
    // Check for token in localStorage.token (used by AuthContext)
    const token = localStorage.getItem('token');
    if (token) {
      return token;
    }
    
    // Fallback: Check for token in userInfo.token (legacy)
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        if (user?.token) {
          return user.token;
        }
      } catch (e) {
        console.error('Error parsing userInfo:', e);
      }
    }
    
    console.error('No auth token found in localStorage');
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Get auth config with error handling
const getConfig = () => {
  const token = getAuthToken();
  
  if (!token) {
    console.error('No auth token available. User might need to log in again.');
    
    // Check if we're already on the login page to avoid redirect loops
    if (!window.location.pathname.includes('/login')) {
      // Store the current URL to redirect back after login
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      // Redirect to login page
      window.location.href = '/login';
    }
    
    throw new Error('Your session has expired. Please log in again.');
  }
  
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache'
    },
    // Add timeout to prevent hanging requests
    timeout: 30000 // 30 seconds
  };
};

// Create a new task
export const createTask = async (taskData) => {
  try {
    const response = await axios.post(API_URL, taskData, getConfig());
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error.response?.data || error.message;
  }
};

// Get tasks by session ID
export const getTasksBySession = async (sessionId) => {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  try {
    const config = getConfig();
    
    // Log request details (without exposing sensitive data)
    console.debug('Fetching tasks for session:', {
      endpoint: `${API_URL}/session/${sessionId}`,
      hasAuthHeader: !!config.headers.Authorization
    });
    
    const response = await axios.get(
      `${API_URL}/session/${sessionId}`,
      config
    );
    
    return response.data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      endpoint: `${API_URL}/session/${sessionId}`,
      timestamp: new Date().toISOString()
    };
    
    console.error('Error fetching tasks:', errorDetails);
    
    // Handle specific error cases
    if (error.response) {
      // Server responded with an error status code
      if (error.response.status === 401) {
        // Clear any existing auth data
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Store the current URL to redirect back after login
        if (!window.location.pathname.includes('/login')) {
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
          window.location.href = '/login';
        }
        
        throw new Error('Your session has expired. Please log in again.');
      }
      
      // Handle other error statuses
      if (error.response.status === 404) {
        throw new Error('Session not found or you do not have access to it');
      }
      
      // Handle 500 errors
      if (error.response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      // Handle validation errors
      if (error.response.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessage = Object.values(validationErrors)
          .map(err => err.msg || err.message || err)
          .join('\n');
        throw new Error(errorMessage || 'Validation error occurred');
      }
      
      // Handle custom error message from server
      if (error.response.data?.message) {
        throw new Error(error.response.data.message);
      }
    } else if (error.request) {
      // The request was made but no response was received
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    // Default error message
    throw new Error('Failed to fetch tasks. Please try again.');
  }
};

// Get a single task by ID
export const getTask = async (taskId) => {
  try {
    const response = await axios.get(
      `${API_URL}/${taskId}`,
      getConfig()
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error.response?.data?.message || error.message || 'Failed to fetch task';
  }
};

// Update a task
export const updateTask = async (taskId, taskData) => {
  try {
    const response = await axios.put(
      `${API_URL}/${taskId}`,
      taskData,
      getConfig()
    );
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error.response?.data?.message || error.message || 'Failed to update task';
  }
};

// Delete a task
export const deleteTask = async (taskId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/${taskId}`,
      getConfig()
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error.response?.data?.message || error.message || 'Failed to delete task';
  }
};

// Submit task answers
export const submitTaskAnswers = async ({ taskId, sessionId, answers, score, timeSpent }) => {
  try {    
    const config = getConfig();
    
    const response = await axios.post(
      `${API_URL}/${taskId}/submit`,
      { 
        sessionId,
        answers,
        score,
        timeSpent,
        submittedAt: new Date().toISOString()
      },
      config
    );
    
    return response.data;
  } catch (error) {
    console.error('Error submitting task answers:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers ? Object.keys(error.config.headers) : undefined
      }
    });
    throw error.response?.data?.message || error.message || 'Failed to submit answers';
  }
};

// Reorder tasks
export const reorderTasks = async (tasks) => {
  try {
    const response = await axios.put(
      `${API_URL}/reorder`,
      { tasks },
      getConfig()
    );
    return response.data;
  } catch (error) {
    console.error('Error reordering tasks:', error);
    throw error.response?.data?.message || error.message || 'Failed to reorder tasks';
  }
};
