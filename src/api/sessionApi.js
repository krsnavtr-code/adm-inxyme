import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4002';
const API_URL = `${API_BASE_URL}/api`;

// Create a new session
export const createSession = async (sessionData) => {
  try {
    const response = await axios.post(`${API_URL}/sessions`, sessionData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all sessions for a sprint
export const getSessionsBySprint = async (sprintId) => {
  try {
    const response = await axios.get(`${API_URL}/sessions/sprint/${sprintId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get a single session by ID
export const getSession = async (sessionId) => {
  try {
    const response = await axios.get(`${API_URL}/sessions/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update a session
export const updateSession = async (sessionId, sessionData) => {
  try {
    const response = await axios.patch(
      `${API_URL}/sessions/${sessionId}`,
      sessionData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete a session
export const deleteSession = async (sessionId) => {
  try {
    const response = await axios.delete(`${API_URL}/sessions/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Reorder sessions
export const reorderSessions = async (sprintId, sessions) => {
  try {
    const response = await axios.patch(
      `${API_URL}/sessions/reorder`,
      { sprintId, sessions },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
