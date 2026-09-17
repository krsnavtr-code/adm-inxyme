import axios from './axios';

/**
 * Enroll in a course
 * @param {string} courseId - The ID of the course to enroll in
 * @returns {Promise<Object>} - The enrollment data
 */
export const enrollInCourse = async (courseId) => {
  try {
    const response = await axios.post(`/lms/courses/${courseId}/enroll`);
    return response.data;
  } catch (error) {
    console.error('Error enrolling in course:', error);
    throw error.response?.data || { message: 'Error enrolling in course' };
  }
};

/**
 * Get user's enrolled courses
 * @returns {Promise<Array>} - List of enrolled courses
 */
export const getMyEnrollments = async () => {
  try {
    const response = await axios.get('/enrollments/my-enrollments', {
      params: {
        status: undefined, // Get all enrollments regardless of status
        populate: 'course' // Ensure course data is populated
      }
    });
    
    // Handle different response formats
    if (response.data) {
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
    }
    
    console.warn('No valid enrollments data found in response');
    return [];
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    throw error.response?.data || { message: 'Error fetching enrollments' };
  }
};

/**
 * Get course content
 * @param {string} courseId - The ID of the course
 * @returns {Promise<Object>} - Course content and enrollment data
 */
export const getCourseContent = async (courseId) => {
  try {
    const response = await axios.get(`/lms/courses/${courseId}/content`);
    return response.data;
  } catch (error) {
    console.error('Error fetching course content:', error);
    throw error.response?.data || { message: 'Error fetching course content' };
  }
};

/**
 * Update lesson progress
 * @param {string} courseId - The ID of the course
 * @param {string} lessonId - The ID of the lesson
 * @returns {Promise<Object>} - Updated progress data
 */
export const updateLessonProgress = async (courseId, lessonId) => {
  try {
    const response = await axios.post(`/lms/courses/${courseId}/lessons/${lessonId}/progress`);
    return response.data;
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    throw error.response?.data || { message: 'Error updating lesson progress' };
  }
};

/**
 * Generate certificate for a completed course
 * @param {string} courseId - The ID of the course
 * @returns {Promise<Object>} - Certificate data
 */
export const generateCertificate = async (courseId) => {
  try {
    const response = await axios.post(`/lms/courses/${courseId}/certificate`);
    return response.data;
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw error.response?.data || { message: 'Error generating certificate' };
  }
};

/**
 * Get course progress
 * @param {string} courseId - The ID of the course
 * @returns {Promise<Object>} - Progress data
 */
export const getCourseProgress = async (courseId) => {
  try {
    const response = await axios.get(`/lms/courses/${courseId}/progress`);
    return response.data;
  } catch (error) {
    console.error('Error fetching course progress:', error);
    throw error.response?.data || { message: 'Error fetching course progress' };
  }
};
