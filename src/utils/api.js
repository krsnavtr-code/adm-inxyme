import axios from "axios";
import { toast } from "react-hot-toast";

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://www.eklabya.com/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data,
      config: error.config,
    });

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Only handle if not already on the login page and not a public route
      const isPublicRoute = [
        "/login",
        "/signup",
        "/",
        "/about",
        "/contact",
      ].some((route) => window.location.pathname.startsWith(route));

      if (!isPublicRoute) {
        // Clear all auth data
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("Users");

        // Show error message if there is one
        if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Your session has expired. Please log in again.");
        }

        // Only redirect if not already on a public route
        if (!isPublicRoute) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
      }
    } else if (error.response?.status === 403) {
      // Handle forbidden access
      toast.error("Access denied.");
    } else if (error.response?.status === 404) {
      // Handle not found
      toast.error("Resource not found.");
    } else if (error.response?.status >= 500) {
      // Handle server errors
      toast.error("Server error. Please try again later.");
    } else if (error.response?.data?.message) {
      // Show error message from server if available
      toast.error(error.response.data.message);
    } else if (error.message === "Network Error") {
      toast.error(
        "Unable to connect to the server. Please check your internet connection.",
      );
    } else if (error.response?.status !== 401) {
      // Don't show generic error for 401
      // Generic error message for other errors
      toast.error("An unexpected error occurred. Please try again.");
    }

    return Promise.reject(error);
  },
);

export default api;
