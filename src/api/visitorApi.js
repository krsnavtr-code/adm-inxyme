import api from "./axios";

/**
 * Fetch all visitors with pagination and filters
 */
export const getVisitors = async (params = {}) => {
  try {
    const response = await api.get("/visitors", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching visitors:", error);
    throw error;
  }
};
