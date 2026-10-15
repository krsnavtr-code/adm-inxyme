import api from "./axios";

// Get all success stories with pagination, search, and filtering
export const getSuccessStories = async (params = {}) => {
  try {
    const {
      page = 1,
      limit = 100,
      category,
      status,
      search,
      featured,
    } = params;

    const response = await api.get("/success-stories", {
      params: {
        page,
        limit,
        ...(category && category !== "All Stories" && { category }),
        ...(status && { status }),
        ...(search && { search }),
        ...(featured !== undefined && { featured }),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching success stories:", error);
    throw error;
  }
};

// Get single success story by ID
export const getSuccessStoryById = async (id) => {
  try {
    const response = await api.get(`/success-stories/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching success story by ID:", error);
    throw error;
  }
};

// Admin: Create a new success story
export const createSuccessStory = async (storyData) => {
  try {
    const response = await api.post("/success-stories", storyData);
    return response.data;
  } catch (error) {
    console.error("Error creating success story:", error);
    throw error;
  }
};

// Admin: Update an existing success story
export const updateSuccessStory = async (id, storyData) => {
  try {
    const response = await api.put(`/success-stories/${id}`, storyData);
    return response.data;
  } catch (error) {
    console.error("Error updating success story:", error);
    throw error;
  }
};

// Admin: Delete a success story
export const deleteSuccessStory = async (id) => {
  try {
    const response = await api.delete(`/success-stories/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting success story:", error);
    throw error;
  }
};

// Admin: Seed or reset default success stories
export const seedSuccessStories = async (force = false) => {
  try {
    const response = await api.post(`/success-stories/seed?force=${force}`);
    return response.data;
  } catch (error) {
    console.error("Error seeding success stories:", error);
    throw error;
  }
};
