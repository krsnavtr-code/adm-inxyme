import axios from "axios";
import api from "./axios";

// Create a new classroom session
export const createClassroomSession = async (sessionData) => {
  try {
    const response = await api.post("/classroom/sessions", sessionData);
    return response.data;
  } catch (error) {
    console.error("Error creating classroom session:", error);
    throw error;
  }
};

// Get classroom sessions for a batch
export const getBatchClassroomSessions = async (batchId) => {
  try {
    const response = await api.get(`/classroom/sessions/batch/${batchId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching batch classroom sessions:", error);
    throw error;
  }
};

// Get a specific classroom session
export const getClassroomSession = async (sessionId) => {
  try {
    const response = await api.get(`/classroom/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching classroom session:", error);
    throw error;
  }
};

// Start a classroom session
export const startClassroomSession = async (sessionId) => {
  try {
    const response = await api.post(`/classroom/sessions/${sessionId}/start`);
    return response.data;
  } catch (error) {
    console.error("Error starting classroom session:", error);
    throw error;
  }
};

// End a classroom session
export const endClassroomSession = async (sessionId) => {
  try {
    const response = await api.post(`/classroom/sessions/${sessionId}/end`);
    return response.data;
  } catch (error) {
    console.error("Error ending classroom session:", error);
    throw error;
  }
};

// Join a classroom session
export const joinClassroomSession = async (sessionId) => {
  try {
    const response = await api.post(`/classroom/sessions/${sessionId}/join`);
    return response.data;
  } catch (error) {
    console.error("Error joining classroom session:", error);
    throw error;
  }
};

// Leave a classroom session
export const leaveClassroomSession = async (sessionId) => {
  try {
    const response = await api.post(`/classroom/sessions/${sessionId}/leave`);
    return response.data;
  } catch (error) {
    console.error("Error leaving classroom session:", error);
    throw error;
  }
};

// Join classroom by invite code
export const joinClassroomByInviteCode = async (inviteCode) => {
  try {
    const response = await api.post(`/classroom/join/${inviteCode}`);
    return response.data;
  } catch (error) {
    console.error("Error joining classroom by invite code:", error);
    throw error;
  }
};

// Get active classroom session for a batch
export const getActiveClassroomSession = async (batchId) => {
  try {
    const response = await api.get(
      `/classroom/sessions/batch/${batchId}/active`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching active classroom session:", error);
    throw error;
  }
};

// Add chat message to session
export const addChatMessage = async (sessionId, message) => {
  try {
    const response = await api.post(`/classroom/sessions/${sessionId}/chat`, {
      message,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding chat message:", error);
    throw error;
  }
};

// Delete a classroom session
export const deleteClassroomSession = async (sessionId) => {
  try {
    const response = await api.delete(`/classroom/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting classroom session:", error);
    throw error;
  }
};
