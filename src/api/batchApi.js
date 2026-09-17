import axios from "./axios";

// Get all batches with optional filters
export const getBatches = async (queryParams = "") => {
  try {
    const params =
      typeof queryParams === "string"
        ? new URLSearchParams(queryParams)
        : new URLSearchParams();

    const response = await axios.get(`/batches?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching batches:", error);
    throw error;
  }
};

// Get single batch by ID
export const getBatchById = async (id) => {
  try {
    const response = await axios.get(`/batches/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching batch:", error);
    throw error;
  }
};

// Get batches by course
export const getBatchesByCourse = async (courseId, status = "") => {
  try {
    const params = status ? `?status=${status}` : "";
    const response = await axios.get(`/batches/course/${courseId}${params}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching batches by course:", error);
    throw error;
  }
};

// Get batches by teacher
export const getBatchesByTeacher = async (teacherId, status = "") => {
  try {
    const params = status ? `?status=${status}` : "";
    const response = await axios.get(`/batches/teacher/${teacherId}${params}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching batches by teacher:", error);
    throw error;
  }
};

// Create a new batch (admin only)
export const createBatch = async (batchData) => {
  try {
    const response = await axios.post("/batches", batchData);
    return response.data;
  } catch (error) {
    console.error("Error creating batch:", error);
    throw error;
  }
};

// Update a batch (admin only)
export const updateBatch = async (id, batchData) => {
  try {
    const response = await axios.put(`/batches/${id}`, batchData);
    return response.data;
  } catch (error) {
    console.error("Error updating batch:", error);
    throw error;
  }
};

// Delete a batch (admin only)
export const deleteBatch = async (id) => {
  try {
    const response = await axios.delete(`/batches/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting batch:", error);
    throw error;
  }
};

// Update batch enrollment count (admin only)
export const updateBatchEnrollment = async (id, action) => {
  try {
    const response = await axios.patch(`/batches/${id}/enrollment`, { action });
    return response.data;
  } catch (error) {
    console.error("Error updating batch enrollment:", error);
    throw error;
  }
};

// Enroll in a batch (automatically enrolls in the associated course)
export const enrollInBatch = async (batchId, userId) => {
  try {
    const response = await axios.post("/enrollments/batch", {
      batchId,
      userId,
    });
    return response.data;
  } catch (error) {
    console.error("Error enrolling in batch:", error);
    throw error;
  }
};
