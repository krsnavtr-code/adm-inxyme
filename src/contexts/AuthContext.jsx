import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { message } from "antd";
import api from "../api/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is authenticated on app load
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        // Check if we're on the client side before accessing localStorage
        if (typeof window === "undefined") {
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("token");
        const refreshToken = localStorage.getItem("refreshToken");
        const userStr = localStorage.getItem("user");

        // If no tokens, clear everything and return
        if (!token) {
          if (isMounted) {
            setCurrentUser(null);
            setLoading(false);
          }
          // Clear any partial data
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
          }
          return;
        }

        // Try to restore user from localStorage first (for faster load)
        if (userStr && isMounted) {
          try {
            const userData = JSON.parse(userStr);
            setCurrentUser(userData);
            setLoading(false);

            // Set the auth header for future requests
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

            // Verify with backend in background (non-blocking)
            verifyWithBackend(token, refreshToken, isMounted).catch((err) => {
              console.error("Background auth verification failed:", err);
              // Don't log out user on background verification failure
              // Let the axios interceptor handle token refresh on actual API calls
            });
            return;
          } catch (parseError) {
            console.error(
              "Failed to parse user from localStorage:",
              parseError,
            );
            // Continue with backend verification
          }
        }

        // Set the auth header for the initial request
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Verify with backend
        await verifyWithBackend(token, refreshToken, isMounted);
      } catch (error) {
        console.error("Unexpected error during auth check:", error);
        if (isMounted) {
          setCurrentUser(null);
          setLoading(false);
        }
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
        }

        // Only redirect if not already on login page
        if (!location.pathname.includes("/login")) {
          navigate("/login", { replace: true });
        }
      }
    };

    const verifyWithBackend = async (token, refreshToken, isMounted) => {
      try {
        // Get fresh user data
        const response = await api.get("/auth/profile");

        if (response.data && response.data.user && isMounted) {
          // Store the updated user data
          const userData = {
            _id: response.data.user._id,
            fullname: response.data.user.fullname,
            email: response.data.user.email,
            role: response.data.user.role,
            isApproved: response.data.user.isApproved,
            isActive: response.data.user.isActive !== false,
            phone: response.data.user.phone || "",
            address: response.data.user.address || "",
            adminRoleId: response.data.user.adminRoleId,
            adminPermissions: response.data.user.adminPermissions || {},
            discount: response.data.user.discount || 0,
          };

          localStorage.setItem("user", JSON.stringify(userData));
          setCurrentUser(userData);

          // Handle redirects based on user status using React Router
          if (!userData.isActive) {
            if (location.pathname !== "/suspended") {
              navigate("/suspended", { replace: true });
            }
          } else if (location.pathname === "/suspended") {
            navigate("/", { replace: true });
          }

          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Auth verification failed:", error);

        // If we get a 401, the interceptor will handle token refresh
        if (error.response?.status === 401) {
          try {
            // Try to refresh the token
            const refreshResponse = await api.post("/auth/refresh-token", {
              refreshToken: localStorage.getItem("refreshToken"),
            });

            if (refreshResponse.data.token) {
              const {
                token: newToken,
                refreshToken: newRefreshToken,
                user,
              } = refreshResponse.data;

              // Update tokens in localStorage
              if (typeof window !== "undefined") {
                localStorage.setItem("token", newToken);
                if (newRefreshToken) {
                  localStorage.setItem("refreshToken", newRefreshToken);
                }
              }

              // Update the authorization header
              api.defaults.headers.common["Authorization"] =
                `Bearer ${newToken}`;

              // Update user data
              const userData = {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
                isActive: user.isActive !== false, // Default to true if not specified
                isApproved: user.isApproved,
                phone: user.phone || "",
                address: user.address || "",
                adminRoleId: user.adminRoleId,
                adminPermissions: user.adminPermissions || {},
                discount: user.discount || 0,
              };

              if (typeof window !== "undefined") {
                localStorage.setItem("user", JSON.stringify(userData));
              }

              if (isMounted) {
                setCurrentUser(userData);
                setLoading(false);
              }
              return;
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            // Only clear auth data on refresh failure if it's a real auth error
            if (
              refreshError.response?.status === 401 ||
              refreshError.message?.includes("token")
            ) {
              if (typeof window !== "undefined") {
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");
              }

              if (isMounted) {
                setCurrentUser(null);
                setLoading(false);

                // Only redirect if not already on login page
                if (!location.pathname.includes("/login")) {
                  navigate("/login", { replace: true });
                }
              }
            } else {
              // For network errors, don't log out - let user stay logged in
              console.warn(
                "Network error during token refresh, keeping user logged in",
              );
              if (isMounted) {
                setLoading(false);
              }
            }
            return;
          }
        } else {
          console.error("Network or server error during auth check:", error);
          // For network errors, don't log out the user - keep them logged in
          // The axios interceptor will handle token refresh on actual API calls
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    checkAuth();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });

      // Check if login requires OTP (admin user)
      if (response.data && response.data.success && response.data.requiresOTP) {
        return response.data;
      }

      if (
        response.data &&
        response.data.success &&
        response.data.token &&
        response.data.refreshToken
      ) {
        const { token, refreshToken, user } = response.data;

        // Store tokens
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
          localStorage.setItem("refreshToken", refreshToken);
        }

        if (!user) {
          throw new Error("User data not found in response");
        }

        // Store user data
        const userData = {
          _id: user._id,
          fullname: user.fullname || "",
          email: user.email || "",
          role: user.role || "user",
          isApproved: user.isApproved, // Use the value directly from the server
          isActive: user.isActive !== false, // Default to true if not specified
          phone: user.phone || "",
          address: user.address || "",
          adminRoleId: user.adminRoleId,
          adminPermissions: user.adminPermissions || {},
          discount: user.discount || 0,
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(userData));
        }
        setCurrentUser(userData);

        // Set the auth header for future requests
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Show success message
        message.success("Login successful!");

        // Redirect to dashboard or the originally requested page
        const searchParams = new URLSearchParams(location.search);
        const redirectTo = searchParams.get("redirect") || "/dashboard";
        navigate(redirectTo, { replace: true });

        return { success: true };
      }

      console.error("Login failed: No token in response");
      return {
        success: false,
        message: "Invalid response from server. Please try again.",
      };
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Login failed. Please try again.";

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);

        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Request:", error.request);
        errorMessage =
          "No response from server. Please check your internet connection.";
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error:", error.message);
        errorMessage = error.message || errorMessage;
      }

      message.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      message.success("Registration successful! Please login.");
      return response.data;
    } catch (error) {
      console.error("Registration failed:", error);
      message.error(error.response?.data?.message || "Registration failed");
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    try {
      // Clear all auth-related data from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }

      // Clear auth header
      delete api.defaults.headers.common["Authorization"];

      // Reset user state
      setCurrentUser(null);

      // Redirect to login
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if there's an error, still try to clear state and redirect
      setCurrentUser(null);
      navigate("/login", { replace: true });
    }
    message.success("Logged out successfully");
  };

  // Update user function
  const updateUser = (userData) => {
    setCurrentUser((prev) => {
      const updatedUser = {
        ...prev,
        ...userData,
      };

      // Also update localStorage to persist the changes
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      return updatedUser;
    });
  };

  // Set user from tokens (for OTP verification)
  const setUserFromTokens = (token, refreshToken, user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
    }

    const userData = {
      _id: user._id,
      fullname: user.fullname || "",
      email: user.email || "",
      role: user.role || "user",
      isApproved: user.isApproved,
      isActive: user.isActive !== false,
      phone: user.phone || "",
      address: user.address || "",
      adminRoleId: user.adminRoleId,
      adminPermissions: user.adminPermissions || {},
      discount: user.discount || 0,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(userData));
    }
    setCurrentUser(userData);

    // Set the auth header for future requests
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isApproved: currentUser?.isApproved || false,
    isAdmin: currentUser?.role === "admin",
    loading,
    login,
    register,
    logout,
    updateUser,
    setUserFromTokens,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
