import api from "./axios";

/**
 * Get all sprints
 * @returns {Promise<Array>} - List of all sprints
 */
export const getAllSprints = async () => {
  try {
    const response = await api.get("/v1/sprints");
    return response.data;
  } catch (error) {
    console.error("Error fetching all sprints:", error);
    throw error;
  }
};

/**
 * Create a new sprint
 * @param {Object} sprintData - Sprint data including courseId, name, and other fields
 * @returns {Promise<Object>} - Created sprint data
 */
export const createSprint = async (sprintData) => {
  try {
    const response = await api.post("/v1/sprints", sprintData);
    return response.data;
  } catch (error) {
    console.error("Error creating sprint:", error);
    throw error;
  }
};

/**
 * Get all sprints for a course
 * @param {string} courseId - ID of the course
 * @returns {Promise<Array>} - List of sprints
 */
export const getSprintsByCourse = async (courseId) => {
  try {
    const response = await api.get(`/v1/sprints/course/${courseId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching sprints:", error);
    throw error;
  }
};

/**
 * Update a sprint
 * @param {string} sprintId - ID of the sprint to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated sprint data
 */
export const updateSprint = async (sprintId, updates) => {
  try {
    const response = await api.patch(`/v1/sprints/${sprintId}`, updates);
    return response.data;
  } catch (error) {
    console.error("Error updating sprint:", error);
    throw error;
  }
};

/**
 * Get a sprint by ID
 * @param {string} sprintId - ID of the sprint
 * @returns {Promise<Object>} - Sprint data
 */
export const getSprintById = async (sprintId) => {
  try {
    const response = await api.get(`/v1/sprints/${sprintId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching sprint by ID:", error);
    throw error;
  }
};

/**
 * Delete a sprint
 * @param {string} sprintId - ID of the sprint to delete
 * @returns {Promise<Object>} - Deletion status
 */
export const deleteSprint = async (sprintId) => {
  try {
    const response = await api.delete(`/v1/sprints/${sprintId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting sprint:", error);
    throw error;
  }
};
