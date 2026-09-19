// contactApi.js - API functions for contact-related operations
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
  withCredentials: true, // Important for cookies/sessions
});

// Request interceptor for adding auth token and logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("No token found in localStorage");
    }

    // Log request details in development
    if (import.meta.env.DEV || true) {
      // Force logging in all environments for now
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor for handling errors and logging
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`[${response.status}] ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    const errorResponse = {
      config: error.config,
      status: error.response?.status,
      data: error.response?.data,
    };

    // Log detailed error information
    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      stack: import.meta.env.DEV ? error.stack : undefined,
    });

    // Handle specific error statuses
    if (error.response) {
      // Server responded with error status (4xx, 5xx)
      const { status, data } = error.response;

      // Handle common error statuses
      if (status === 401) {
        // For contacts API, we'll handle 401 in the component
        if (!error.config.url.includes("/contacts")) {
          // Only redirect for non-contacts API calls
          if (typeof window !== "undefined") {
            window.location.href =
              "/login?redirect=" + encodeURIComponent(window.location.pathname);
          }
        } else {
          errorResponse.shouldLogout = true;
          errorResponse.message =
            "Your session has expired. Please log in again.";
        }
      } else if (status === 403) {
        // Forbidden - show access denied
        errorResponse.message =
          data.message || "You do not have permission to perform this action.";
      } else if (status === 404) {
        // Not found
        errorResponse.message =
          data.message || "The requested resource was not found.";
      } else if (status === 422) {
        // Validation error
        errorResponse.message = data.message || "Validation failed.";
        errorResponse.errors = data.errors || {};
      } else if (status >= 500) {
        // Server error
        errorResponse.message =
          data.message || "A server error occurred. Please try again later.";
      }
    } else if (error.request) {
      // No response received
      errorResponse.message =
        "No response from server. Please check your connection and try again.";
    } else {
      // Request setup error
      errorResponse.message =
        error.message || "An error occurred while processing your request.";
    }

    return Promise.reject(errorResponse);
  },
);

/**
 * Submit a contact form with comprehensive error handling
 * @param {Object} formData - The contact form data
 * @param {string} formData.name - User's name (required)
 * @param {string} formData.email - User's email (required)
 * @param {string} [formData.phone] - User's phone number (optional)
 * @param {string} formData.message - The message (required, 10-2000 chars)
 * @param {string} [formData.courseId] - Optional course ID
 * @param {string} [formData.courseTitle] - Optional course title
 * @param {string} [formData.subject] - Optional subject (max 200 chars)
 * @returns {Promise<{success: boolean, data?: Object, message: string, errors?: Object}>} The API response
 */
const submitContactForm = async (formData) => {
  try {
    // Client-side validation
    const errors = {};

    if (!formData.name?.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email?.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (formData.phone && !/^[\d\s\-+()]*$/.test(formData.phone)) {
      errors.phone = "Please enter a valid phone number";
    }

    if (formData.message?.trim()) {
      if (formData.message.trim().length < 10) {
        errors.message = "Message must be at least 10 characters if provided";
      } else if (formData.message.trim().length > 2000) {
        errors.message = "Message cannot exceed 2000 characters";
      }
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "Validation failed",
        errors,
      };
    }

    // Prepare request data according to backend validation rules
    const requestData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      message: formData.message.trim(),
      ...(formData.phone &&
        formData.phone.trim() !== "" && { phone: formData.phone.trim() }),
      ...(formData.courseId && { courseId: formData.courseId }),
      ...(formData.courseTitle &&
        formData.courseTitle.trim() !== "" && {
        courseTitle: formData.courseTitle.trim(),
      }),
      ...(formData.subject &&
        formData.subject.trim() !== "" && {
        subject: formData.subject.trim(),
      }),
    };

    // Add retry logic for rate limiting
    const maxRetries = 2;
    let lastError;
    let lastResponse;
    let retryAfter = 5; // Default retry after 5 seconds

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add an increasing delay between retries (exponential backoff)
        if (attempt > 0) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        // Make the API call with the correct endpoint
        const response = await api.post("/api/contacts", requestData);
        lastResponse = response;

        // If we get here, the request was successful

        return {
          success: response.data?.success || true,
          data: response.data?.data || response.data,
          message:
            response.data?.message ||
            "Your message has been sent successfully!",
        };
      } catch (error) {
        lastError = error;

        // If this is a 429 error, provide more specific feedback
        const errStatus = error.status || error.response?.status;
        const errData = error.data || error.response?.data;

        if (errStatus === 429) {
          retryAfter =
            error.response?.headers?.["retry-after"] ||
            error.headers?.["retry-after"] ||
            60; // Default to 60 seconds
          retryAfter =
            typeof retryAfter === "string"
              ? parseInt(retryAfter, 10)
              : retryAfter;

          console.warn(
            `Rate limited. Retry after ${retryAfter} seconds. Attempt ${attempt + 1}/${maxRetries + 1}`,
          );

          // If this is the last attempt, return a user-friendly error
          if (attempt === maxRetries) {
            const minutes = Math.ceil(retryAfter / 60);
            const timeMessage =
              minutes > 1 ? `${minutes} minutes` : `${retryAfter} seconds`;

            return {
              success: false,
              message:
                errData?.message ||
                `Too many requests. Please wait ${timeMessage} before trying again.`,
              error: "RATE_LIMIT_EXCEEDED",
              retryAfter: retryAfter,
              status: 429,
            };
          }

          // Wait for the retry-after period before the next attempt
          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter * 1000 + 1000),
          );
          continue;
        }

        // For other errors, log and rethrow
        console.error(`API Error (attempt ${attempt + 1}/${maxRetries + 1}):`, {
          message: error.message,
          status: errStatus,
          data: errData,
          code: error.code,
        });

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }

    // If we get here, all retries failed
    if (lastResponse) {
      // If we have a response, use it
      return {
        success: lastResponse.data?.success || false,
        data: lastResponse.data,
        message: lastResponse.data?.message || "Failed to process your request",
        status: lastResponse.status,
        error: lastResponse.data?.error || "REQUEST_FAILED",
      };
    }

    // If we have a rate limit error, provide a user-friendly message
    const lastErrStatus = lastError?.status || lastError?.response?.status;
    const lastErrData = lastError?.data || lastError?.response?.data;
    if (lastErrStatus === 429) {
      const retryAfter =
        lastError.response?.headers?.["retry-after"] ||
        lastError.headers?.["retry-after"] ||
        60;
      const minutes = Math.ceil(retryAfter / 60);
      const timeMessage =
        minutes > 1 ? `${minutes} minutes` : `${retryAfter} seconds`;

      throw new Error(
        lastErrData?.message ||
        `Too many requests. Please wait ${timeMessage} before trying again.`,
      );
    }

    // For other errors, provide a generic message
    const errorMessage =
      lastError?.message ||
      "An error occurred while submitting the form. Please try again later.";
    throw new Error(errorMessage);
  } catch (error) {
    const errStatus = error.status || error.response?.status;
    const errData = error.data || error.response?.data;
    console.error("Error in submitContactForm:", {
      message: error.message,
      response: errData,
      status: errStatus,
    });

    // Handle validation errors
    if ((errStatus === 400 || errStatus === 422) && errData?.errors) {
      const validationErrors = errData.errors;
      const errorMessage = Object.values(validationErrors)
        .map((err) => (Array.isArray(err) ? err.join(" ") : err))
        .join("\n");
      throw new Error(
        errorMessage || "Validation failed. Please check your input.",
      );
    }

    // Handle rate limiting
    if (errStatus === 429) {
      throw new Error(
        errData?.message || "Too many requests. Please try again later.",
      );
    }

    // Handle other errors
    throw new Error(
      errData?.message ||
      error.message ||
      "Failed to submit the contact form. Please try again later.",
    );
  }
};

/**
 * Update contact status (admin only)
 * @param {string} id - Contact ID
 * @param {string} status - New status
 * @param {string} token - Auth token
 * @returns {Promise<Object>} - Updated contact data
 */
const updateContactStatus = async (id, status, token) => {
  try {
    const response = await api.patch(
      `/api/contacts/${id}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    return {
      success: true,
      data: response.data,
      message: "Contact status updated successfully",
    };
  } catch (error) {
    console.error("Error updating contact status:", error);

    if (error.response?.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error("Failed to update contact status. Please try again later.");
  }
};

/**
 * Fetch contacts with optional pagination and filtering
 * @param {Object} [options] - Query options
 * @param {string} [options.status] - Filter by status (e.g., 'new', 'contacted')
 * @param {string} [options.search] - Search term for name, email, or message
 * @param {string} [options.sort] - Sort field and direction (e.g., 'submittedAt:desc')
 * @param {number} [options.page=1] - Page number for pagination
 * @param {number} [options.limit=10] - Number of items per page
 * @returns {Promise<{success: boolean, data: Array, meta: Object, message?: string, error?: Object}>}
 */
const getContacts = async (options = {}) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        success: false,
        message: "Authentication required. Please log in again.",
        shouldLogout: true,
        data: [],
        meta: {},
      };
    }

    // Get token from localStorage
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      console.error("No authentication token found");
      return {
        success: false,
        message: "Authentication required. Please log in again.",
        shouldLogout: true,
        data: [],
        meta: {},
      };
    }

    // Build query parameters
    const params = new URLSearchParams();
    if (options.status) params.append("status", options.status);
    if (options.search) params.append("search", options.search);
    if (options.sort) params.append("sort", options.sort);
    if (options.page) params.append("page", options.page.toString());
    if (options.limit) params.append("limit", options.limit.toString());
    if (options.date) params.append("date", options.date);
    if (options.course) params.append("course", options.course);

    const response = await api.get(`/api/contacts?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      data: response.data.data || [],
      meta: response.data.meta || {},
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching contacts:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Your session has expired. Please log in again.",
        shouldLogout: true,
        data: [],
        meta: {},
      };
    }

    // Return a structured error response
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to fetch contacts. Please try again later.",
      error: error.response?.data || { message: error.message },
      data: [],
      meta: {},
    };
  }
};

/**
 * Fetch secret contacts data (Full_Name, email, phone, courses only)
 * @param {string} [secretKey] - Secret key for authentication
 * @param {Object} [options] - Query options (limit, page, startDate, endDate, status, raw)
 * @returns {Promise<{success: boolean, count?: number, data: Array<{Full_Name: string, email: string, phone: string, courses: string}>}>}
 */
const getSecretContactData = async (
  secretKey = "eklabya_contact_secret_key_2026",
  options = {},
) => {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.append("limit", options.limit.toString());
    if (options.page) params.append("page", options.page.toString());
    if (options.startDate) params.append("startDate", options.startDate);
    if (options.endDate) params.append("endDate", options.endDate);
    if (options.status) params.append("status", options.status);
    if (options.raw) params.append("raw", options.raw.toString());

    const key =
      secretKey ||
      import.meta.env.VITE_CONTACT_SECRET_KEY ||
      "eklabya_contact_secret_key_2026";
    const queryString = params.toString() ? `?${params.toString()}` : "";

    const response = await api.get(`/api/contact-data${queryString}`, {
      headers: {
        "x-secret-key": key,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching secret contact data:", error);
    throw error;
  }
};

export {
  submitContactForm,
  updateContactStatus,
  getContacts,
  getSecretContactData,
};
