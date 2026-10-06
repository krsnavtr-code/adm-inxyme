import axios from "./axios";

// Fetch reviews with query parameters (status, courseId, rating, search, page, limit)
export const getAdminReviews = async (params = {}) => {
  try {
    const response = await axios.get("/admin/reviews", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    throw error;
  }
};

// Fetch review statistics (total, pending, approved, average rating)
export const getReviewStats = async () => {
  try {
    const response = await axios.get("/admin/reviews/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching review stats:", error);
    throw error;
  }
};

// Update review status (approve, reject, pending)
export const updateReviewStatus = async (id, statusData) => {
  try {
    const response = await axios.patch(`/admin/reviews/${id}/status`, statusData);
    return response.data;
  } catch (error) {
    console.error("Error updating review status:", error);
    throw error;
  }
};

// Delete review
export const deleteReview = async (id) => {
  try {
    const response = await axios.delete(`/admin/reviews/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
};

// Get list of published courses for share link selector
export const getReviewCourses = async () => {
  try {
    const response = await axios.get("/reviews/courses");
    return response.data;
  } catch (error) {
    console.error("Error fetching review courses:", error);
    throw error;
  }
};
