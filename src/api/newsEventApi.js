import api from "./axios";

// Get all news and events with pagination, search, and filtering
export const getNewsEvents = async (params = {}) => {
  try {
    const {
      page = 1,
      limit = 100,
      category,
      type,
      status,
      search,
      featured,
    } = params;

    const response = await api.get("/news-events", {
      params: {
        page,
        limit,
        ...(category && category !== "all" && { category }),
        ...(type && { type }),
        ...(status && { status }),
        ...(search && { search }),
        ...(featured !== undefined && { featured }),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching news/events:", error);
    throw error;
  }
};

// Get single news/event by ID
export const getNewsEventById = async (id) => {
  try {
    const response = await api.get(`/news-events/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching news/event by ID:", error);
    throw error;
  }
};

// Admin: Create news/event
export const createNewsEvent = async (eventData) => {
  try {
    const response = await api.post("/news-events", eventData);
    return response.data;
  } catch (error) {
    console.error("Error creating news/event:", error);
    throw error;
  }
};

// Admin: Update news/event
export const updateNewsEvent = async (id, eventData) => {
  try {
    const response = await api.put(`/news-events/${id}`, eventData);
    return response.data;
  } catch (error) {
    console.error("Error updating news/event:", error);
    throw error;
  }
};

// Admin: Delete news/event
export const deleteNewsEvent = async (id) => {
  try {
    const response = await api.delete(`/news-events/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting news/event:", error);
    throw error;
  }
};

// Admin: Seed default news/events
export const seedNewsEvents = async (force = false) => {
  try {
    const response = await api.post(`/news-events/seed?force=${force}`);
    return response.data;
  } catch (error) {
    console.error("Error seeding news/events:", error);
    throw error;
  }
};
