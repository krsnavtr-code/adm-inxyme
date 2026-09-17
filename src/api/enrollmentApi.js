import axios from './axios';

/**
 * Enroll the current user in a course
 * @param {string} courseId - The ID of the course to enroll in
 * @returns {Promise<{success: boolean, data?: Object, message?: string, error?: Object}>}
 */
export const enrollInCourse = async (courseId) => {
  try {
    if (!courseId) {
      console.error('Course ID is required');
      return {
        success: false,
        message: 'Course ID is required for enrollment.'
      };
    }

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user?.id) {
      console.error('Authentication required');
      return {
        success: false,
        message: 'Authentication required. Please log in again.',
        shouldLogout: true
      };
    }
    
    const response = await axios.post('/api/enrollments', { 
      courseId: courseId,
      status: 'pending' // Changed to pending to require admin approval
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-client-ip': localStorage.getItem('clientIp') || '',
        'x-user-agent': navigator.userAgent
      },
      timeout: 15000, // 15 seconds timeout
      validateStatus: (status) => status < 500 // Don't throw for 4xx errors
    });
    
    // Return standardized success response
    return {
      success: true,
      data: response.data,
      message: response.data.message || 'Successfully enrolled in the course.'
    };
    
  } catch (error) {
    console.error('Enrollment error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      response: error.response?.data,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        message: 'Request timed out. Please check your connection and try again.',
        error: { code: 'timeout' }
      };
    }
    
    if (!navigator.onLine) {
      return {
        success: false,
        message: 'You are offline. Please check your internet connection and try again.',
        error: { code: 'offline' }
      };
    }
    
    // Handle HTTP error responses
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - token expired or invalid
        return {
          success: false,
          message: 'Your session has expired. Please log in again.',
          error: data,
          shouldLogout: true
        };
      }
      
      if (status === 400 && data?.message?.includes('already enrolled')) {
        // User is already enrolled in the course
        return {
          success: false,
          message: data.message || 'You are already enrolled in this course.',
          error: data,
          code: 'already_enrolled'
        };
      }
      
      // Return the server's error message if available
      return {
        success: false,
        message: data?.message || 'Failed to enroll in the course. Please try again.',
        error: data,
        status
      };
    }
    
    // For all other errors
    return {
      success: false,
      message: error.message || 'An unexpected error occurred. Please try again later.',
      error: { message: error.message }
    };
  }
};

/**
 * Get all enrollments for the current user
 * @param {string} userId - The ID of the user to get enrollments for
 * @param {Object} [options] - Optional parameters
 * @param {string} [options.status] - Filter enrollments by status (e.g., 'active', 'completed', 'pending')
 * @param {number} [options.limit=100] - Maximum number of enrollments to return
 * @param {number} [options.page=1] - Page number for pagination
 * @returns {Promise<{success: boolean, enrollments?: Array, meta?: Object, message?: string, error?: Object}>}
 */
export const getUserEnrollments = async (userId, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('Authentication required');
      return {
        success: false,
        message: 'Authentication required. Please log in again.',
        shouldLogout: true
      };
    }

    // Set default values
    const { 
      status = 'active', // Default to active enrollments
      limit = 100, // Increased limit to get all enrollments
      page = 1 
    } = options;

    // Build request data without userId since it comes from the JWT token
    const requestData = {
      status,
      limit,
      page
    };

    const response = await axios.get('/enrollments/my-enrollments', {
      params: requestData,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 seconds timeout
    });

    // Check if the response has the expected data structure
    if (!response.data || !response.data.success) {
      console.error('Unexpected response format:', response.data);
      return {
        success: false,
        message: response.data?.message || 'Unexpected response format',
        data: [],
        meta: {}
      };
    }
    
    // Return standardized success response with data and metadata
    return {
      success: true,
      data: response.data.data || [],
      meta: response.data.meta || {},
      message: 'Enrollments fetched successfully.'
    };
    
  } catch (error) {
    console.error('Error fetching enrollments:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Handle HTTP error responses
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle unauthorized access
      if (status === 401) {
        // Clear user data and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('Users');
        localStorage.removeItem('user');
        window.location.href = '/login';
        
        return {
          success: false,
          message: 'Your session has expired. Please log in again.',
          error: data,
          shouldLogout: true
        };
      }
      
      // Return the server's error message if available
      return {
        success: false,
        message: data?.message || 'Failed to fetch enrollments. Please try again.',
        error: data,
        status
      };
    }
    
    // For all other errors
    return {
      success: false,
      message: error.message || 'An unexpected error occurred while fetching enrollments.',
      error: { 
        message: error.message,
        code: error.code
      }
    };
  }
};

/**
 * Update the status of an enrollment (admin only)
 * @param {string} enrollmentId - The ID of the enrollment to update
 * @param {string} status - The new status (e.g., 'approved', 'rejected', 'completed')
 * @param {string} [notes] - Optional notes about the status update
 * @returns {Promise<{success: boolean, data?: Object, message?: string, error?: Object}>}
 */
export const updateEnrollmentStatus = async (enrollmentId, status, notes = '') => {
  try {
    if (!enrollmentId) {
      console.error('Enrollment ID is required');
      return {
        success: false,
        message: 'Enrollment ID is required to update status.'
      };
    }

    if (!status) {
      console.error('Status is required');
      return {
        success: false,
        message: 'Status is required to update enrollment.'
      };
    }

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user?.id) {
      console.error('Authentication required');
      return {
        success: false,
        message: 'Authentication required. Please log in again.',
        shouldLogout: true
      };
    }
    
    const response = await axios.put(
      `/enrollments/${enrollmentId}/status`,
      { status, notes },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-client-ip': localStorage.getItem('clientIp') || '',
          'x-user-agent': navigator.userAgent
        },
        timeout: 10000 // 10 seconds timeout
      }
    );
    
    return {
      success: true,
      data: response.data,
      message: response.data?.message || 'Enrollment status updated successfully.'
    };
    
  } catch (error) {
    console.error('Error updating enrollment status:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        message: 'Request timed out. Please check your connection and try again.',
        error: { code: 'timeout' }
      };
    }
    
    if (!navigator.onLine) {
      return {
        success: false,
        message: 'You are offline. Please check your internet connection and try again.',
        error: { code: 'offline' }
      };
    }
    
    // Handle HTTP error responses
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        return {
          success: false,
          message: 'Your session has expired. Please log in again.',
          error: data,
          shouldLogout: true
        };
      }
      
      if (status === 403) {
        // Forbidden - user doesn't have permission
        return {
          success: false,
          message: 'You do not have permission to update this enrollment.',
          error: data,
          code: 'forbidden'
        };
      }
      
      if (status === 404) {
        // Enrollment not found
        return {
          success: false,
          message: 'Enrollment not found. It may have been deleted.',
          error: data,
          code: 'not_found'
        };
      }
      
      // Return the server's error message if available
      return {
        success: false,
        message: data?.message || 'Failed to update enrollment status. Please try again.',
        error: data,
        status
      };
    }
    
    // For all other errors
    return {
      success: false,
      message: error.message || 'An unexpected error occurred while updating enrollment status.',
      error: { 
        message: error.message,
        code: error.code
      }
    };
  }
};
