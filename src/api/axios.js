import axios from "axios";
import { toast } from "react-hot-toast";

// Create axios instance with base URL and headers
// console.log("axios baseURL:", import.meta.env.VITE_API_BASE_URL);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://www.eklabya.com/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
  timeout: 10000, // 10 seconds timeout
});

// Track if a token refresh is in progress
let isRefreshing = false;
let refreshSubscribers = [];

// Queue for requests that need to wait for token refresh
const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

// Request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Skip adding auth header for public endpoints
    const publicEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/refresh-token",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/categories", // Add public endpoints that don't require auth
      "/redirects/check", // Public redirect check endpoint
    ];

    // Don't modify the config for public endpoints
    if (publicEndpoints.some((endpoint) => config.url.endsWith(endpoint))) {
      return config;
    }

    try {
      // Ensure headers exist
      config.headers = config.headers || {};

      // Only add auth token for non-public endpoints
      const token = localStorage.getItem("token");

      if (token) {
        // Clean and validate the token
        const cleanedToken = token.trim();

        if (!cleanedToken) {
          console.error("Empty token found in localStorage");
          localStorage.removeItem("token");
          return Promise.reject(new Error("Invalid token"));
        }

        // Ensure the token starts with 'Bearer ' if it doesn't already
        if (!cleanedToken.startsWith("Bearer ")) {
          config.headers.Authorization = `Bearer ${cleanedToken}`;
        } else {
          config.headers.Authorization = cleanedToken;
        }

        // console.log('Added Authorization header to request');
      } else {
        console.warn(
          "No authentication token found for protected endpoint:",
          config.url,
        );
        // Don't reject here, let the server handle the missing token
      }
    } catch (error) {
      console.error("Error processing token:", error);
      localStorage.removeItem("token");
      return Promise.reject(new Error("Invalid token format"));
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    // You can modify successful responses here if needed
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is not a 401 or it's a retry request, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If we're already refreshing the token, add the request to the queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        addRefreshSubscriber((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    // If the error is 401 and we haven't tried to refresh the token yet
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // If this is a refresh token request or login/register, don't try to refresh again
      if (
        originalRequest.url.includes("/auth/refresh-token") ||
        originalRequest.url.includes("/auth/login") ||
        originalRequest.url.includes("/auth/register")
      ) {
        // console.log('Auth endpoint detected, not attempting refresh');
        // Clear tokens and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }

        return Promise.reject(error);
      }

      // Mark this request as retried to prevent infinite loops
      originalRequest._retry = true;

      try {
        // console.log('Attempting to refresh token...');
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          console.error("No refresh token available");
          throw new Error("No refresh token available");
        }

        // console.log('Current refresh token:', refreshToken.substring(0, 20) + '...');

        // Request new access token using refresh token
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || "https://www.eklabya.com/api"}/auth/refresh-token`,
          { refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          },
        );

        // console.log('Refresh token response:', {
        //   status: response.status,
        //   hasToken: !!(response.data && response.data.token),
        //   hasRefreshToken: !!(response.data && response.data.refreshToken)
        // });

        if (!response.data || !response.data.token) {
          throw new Error("No token received in refresh response");
        }

        const {
          token: newToken,
          refreshToken: newRefreshToken,
          user,
        } = response.data;

        // Store the new tokens
        localStorage.setItem("token", newToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        }

        // console.log('New token stored, updating request headers');

        // Update the Authorization header for future requests
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

        // Update the original request with the new token
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

        // console.log('Retrying original request:', originalRequest.url);

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);

        // Clear all auth data
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }

        return Promise.reject({
          ...refreshError,
          message: "Session expired. Please log in again.",
          isAuthError: true,
        });
      }
    }

    // Handle other error statuses
    if (error.response) {
      const { status, data } = error.response;
      const isPublicRoute = [
        "/login",
        "/signup",
        "/",
        "/about",
        "/contact",
      ].some((route) => window.location.pathname.startsWith(route));

      if (status === 401 && !isPublicRoute) {
        // Don't show toast here as it might be a background request
        // Let the AuthContext handle the redirect
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        if (!window.location.pathname.includes("/login")) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
      } else if (status === 403) {
        // Handle forbidden access
        toast.error("You do not have permission to perform this action.");
      } else if (status === 404) {
        // Handle not found
        toast.error("The requested resource was not found.");
      } else if (status === 500) {
        // Handle server error
        toast.error("An unexpected error occurred. Please try again later.");
      } else if (data && data.message) {
        // Show server error message if available
        toast.error(data.message);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request);
      if (!window.navigator.onLine) {
        toast.error("You are offline. Please check your internet connection.");
      } else {
        toast.error("Unable to connect to the server. Please try again later.");
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Request error:", error.message);
      toast.error("An error occurred. Please try again.");
    }

    return Promise.reject(error);
  },
);

// Export the api instance as both default and named export
export default api;
export { api };
