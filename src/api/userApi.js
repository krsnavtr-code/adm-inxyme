import api from "./axios";

/**
 * User API Service
 * Handles all user-related API calls
 */
const userApi = {
  // Get all users with optional filters
  getUsers: async (filters = {}) => {
    try {
      const response = await api.get("/users", { params: filters });
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      });
      throw error;
    }
  },

  // Get single user by ID
  getById: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      throw error;
    }
  },

  // Create a new user
  create: async (userData) => {
    try {
      const response = await api.post("/users", userData);
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  // Update an existing user
  update: async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  },

  // Update user profile (phone, address)
  updateProfile: async (profileData) => {
    try {
      // Use the correct endpoint /auth/profile (baseURL already includes /api)
      const response = await api.put("/auth/profile", profileData);

      // Check for success response
      if (response.data && response.data.success) {
        // Update the user data in localStorage if available
        if (response.data.user) {
          const currentUser = JSON.parse(localStorage.getItem("Users") || "{}");
          localStorage.setItem(
            "Users",
            JSON.stringify({
              ...currentUser,
              ...response.data.user,
            }),
          );
        }
        return response.data;
      }

      throw new Error(response.data?.message || "Failed to update profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.response?.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("Users");
        window.location.href = "/login";
      }
      throw error.response?.data || error;
    }
  },

  // Delete a user
  delete: async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  },

  // Change user password
  changePassword: async (userId, currentPassword, newPassword) => {
    try {
      const response = await api.put(
        "/auth/change-password",
        { currentPassword, newPassword },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true, // Important for sending cookies if using them
        },
      );

      // Update the token in localStorage if a new one was returned
      if (response.data?.token) {
        localStorage.setItem("token", response.data.token);
      }

      return {
        success: true,
        message: response.data?.message || "Password changed successfully",
        data: response.data?.data,
      };
    } catch (error) {
      console.error("Error changing password:", error);

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const { status, data } = error.response;

        if (status === 401) {
          // Clear invalid token and redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return {
            success: false,
            message: "Session expired. Please log in again.",
            error: "Authentication required",
          };
        }

        return {
          success: false,
          message: data?.message || "Failed to change password",
          error: data?.error || "Unknown error occurred",
        };
      } else if (error.request) {
        // The request was made but no response was received
        return {
          success: false,
          message: "No response from server. Please check your connection.",
          error: "Network error",
        };
      } else {
        // Something happened in setting up the request
        return {
          success: false,
          message: "Error setting up the request",
          error: error.message,
        };
      }
    }
  },

  // Change another user's password (Admin only)
  changePasswordAdmin: async (userId, newPassword) => {
    try {
      const response = await api.put(
        `/users/${userId}/password`,
        { newPassword },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error changing user password (admin):", error);
      throw error.response?.data || error;
    }
  },

  // Update user status (active/inactive)
  updateStatus: async (userId, isActive) => {
    try {
      const response = await api.put(`/users/${userId}/status`, { isActive });
      return response.data;
    } catch (error) {
      console.error(`Error updating status for user ${userId}:`, error);
      throw error;
    }
  },

  // Update user LMS approval status
  updateLMSStatus: async (userId, isApproved) => {
    try {
      const response = await api.put(`/users/${userId}/lms-status`, {
        isApproved,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating user LMS status:", error);
      throw error;
    }
  },

  // Update user discount percentage
  updateDiscount: async (userId, discount) => {
    try {
      const response = await api.put(`/users/${userId}/discount`, { discount });
      return response.data;
    } catch (error) {
      console.error("Error updating user discount:", error);
      throw error;
    }
  },

  // Admin enrolls a user in a course
  adminEnrollUser: async (userId, courseId, status = "active") => {
    try {
      const response = await api.post("/enrollments/admin-enroll", {
        userId,
        courseId,
        status,
      });
      return response.data;
    } catch (error) {
      console.error("Error enrolling user in course:", error);
      throw error.response?.data || error;
    }
  },

  // Forgot password - send reset email
  forgotPassword: async (email) => {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      console.error("Error sending forgot password email:", error);
      throw error.response?.data || error;
    }
  },

  // Reset password - submit new password
  resetPassword: async (token, email, password) => {
    try {
      const response = await api.post("/auth/reset-password", {
        token,
        email,
        password,
      });
      return response.data;
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error.response?.data || error;
    }
  },

  // Verify admin login OTP
  verifyAdminOTP: async (email, otp) => {
    try {
      const response = await api.post("/auth/verify-admin-otp", {
        email,
        otp,
      });
      return response.data;
    } catch (error) {
      console.error("Error verifying admin OTP:", error);
      throw error.response?.data || error;
    }
  },
};

export default userApi;

// For debugging: Log the current API configuration
// export const logApiConfig = () => {
//   console.log('Current API Configuration:', {
//     baseURL: api.defaults.baseURL,
//     withCredentials: api.defaults.withCredentials,
//     headers: api.defaults.headers
//   });
// };

// Test API connection
export const testApiConnection = async () => {
  try {
    // Test with a more appropriate endpoint
    const response = await api.get("/courses");
    return true;
  } catch (error) {
    console.error("API connection test failed:", {
      message: error.message,
      config: {
        url: error.config?.baseURL + error.config?.url,
        method: error.config?.method,
      },
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
    });
    return false;
  }
};
