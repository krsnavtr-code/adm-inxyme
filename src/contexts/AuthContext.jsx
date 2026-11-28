import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { message } from "antd";
import api from "../api/axios";
import {
  ACCOUNT_INACTIVE_EVENT,
  clearAuthStorage,
  forceLogoutInactiveAccount,
  getLastAccountVerifiedAt,
  isInactiveAccountError,
  resetAccountVerifiedStamp,
  stampAccountVerified,
} from "../utils/authSession";

const AuthContext = createContext();

const CLICK_REVERIFY_INTERVAL_MS = 2000;

const buildNormalizedUser = (user) => ({
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
});

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const verifyInFlightRef = useRef(null);
  const isMountedRef = useRef(true);
  const lastVerifiedPathRef = useRef(location.pathname);

  useEffect(() => {
    isMountedRef.current = true;
    const handleInactiveEvent = () => {
      delete api.defaults.headers.common["Authorization"];
      if (isMountedRef.current) {
        setCurrentUser(null);
        setLoading(false);
      }
    };
    window.addEventListener(ACCOUNT_INACTIVE_EVENT, handleInactiveEvent);
    return () => {
      isMountedRef.current = false;
      window.removeEventListener(ACCOUNT_INACTIVE_EVENT, handleInactiveEvent);
    };
  }, []);

  const verifyActiveAccountStatus = useCallback(async ({ force = false } = {}) => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("token");
    if (!token) return false;
    if (window.location.pathname.includes("/login")) return false;

    if (!force && Date.now() - getLastAccountVerifiedAt() < CLICK_REVERIFY_INTERVAL_MS) {
      return true;
    }

    if (verifyInFlightRef.current) {
      return verifyInFlightRef.current;
    }

    const requestPromise = (async () => {
      try {
        api.defaults.headers.common["Authorization"] = token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`;

        const response = await api.get("/auth/profile");
        const freshUser = response.data?.user;

        if (!freshUser) return false;

        if (freshUser.isActive === false) {
          forceLogoutInactiveAccount(
            "Your account has been deactivated. Please contact the administrator.",
          );
          if (isMountedRef.current) {
            setCurrentUser(null);
            setLoading(false);
          }
          return false;
        }

        stampAccountVerified();
        const userData = buildNormalizedUser(freshUser);
        localStorage.setItem("user", JSON.stringify(userData));

        if (isMountedRef.current) {
          setCurrentUser(userData);
          setLoading(false);
        }
        return true;
      } catch (error) {
        if (isInactiveAccountError(error)) {
          forceLogoutInactiveAccount(error.response?.data?.message);
          if (isMountedRef.current) {
            setCurrentUser(null);
            setLoading(false);
          }
          return false;
        }
        if (error.response?.status === 401 || error?.isAuthError) {
          clearAuthStorage();
          resetAccountVerifiedStamp();
          if (isMountedRef.current) {
            setCurrentUser(null);
            setLoading(false);
          }
          if (!window.location.pathname.includes("/login")) {
            navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`, {
              replace: true,
            });
          }
          return false;
        }
        // Preserve session only on transient network failure
        console.warn("Live account status verification warning:", error?.message || error);
        if (isMountedRef.current) {
          setLoading(false);
        }
        return true;
      } finally {
        verifyInFlightRef.current = null;
      }
    })();

    verifyInFlightRef.current = requestPromise;
    return requestPromise;
  }, [navigate]);

  // Initial authentication bootstrap
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (typeof window === "undefined") {
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (!token) {
          clearAuthStorage();
          if (isMountedRef.current) {
            setCurrentUser(null);
            setLoading(false);
          }
          return;
        }

        api.defaults.headers.common["Authorization"] = token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`;

        if (userStr) {
          try {
            const cachedUser = JSON.parse(userStr);
            if (cachedUser?.isActive === false) {
              forceLogoutInactiveAccount();
              return;
            }
            if (isMountedRef.current) {
              setCurrentUser(cachedUser);
              setLoading(false);
            }
          } catch (parseError) {
            console.error("Failed to parse user from localStorage:", parseError);
          }
        }

        await verifyActiveAccountStatus({ force: true });
      } catch (error) {
        console.error("Unexpected error during auth check:", error);
        clearAuthStorage();
        if (isMountedRef.current) {
          setCurrentUser(null);
          setLoading(false);
        }
        if (!location.pathname.includes("/login")) {
          navigate("/login", { replace: true });
        }
      }
    };

    checkAuth();
  }, [verifyActiveAccountStatus]);

  // Re-verify live account status on every admin route transition
  useEffect(() => {
    if (!currentUser || location.pathname.includes("/login")) {
      lastVerifiedPathRef.current = location.pathname;
      return;
    }
    if (lastVerifiedPathRef.current === location.pathname) return;
    lastVerifiedPathRef.current = location.pathname;
    verifyActiveAccountStatus({ force: true });
  }, [location.pathname, currentUser?._id, verifyActiveAccountStatus]);

  // Re-verify active status on every click step & tab focus when inside admin panel
  useEffect(() => {
    if (typeof window === "undefined" || !currentUser || location.pathname.includes("/login")) {
      return;
    }

    const handleClickCheck = () => {
      verifyActiveAccountStatus({ force: false });
    };

    const handleFocusOrVisibility = () => {
      if (document.visibilityState === "visible") {
        verifyActiveAccountStatus({ force: false });
      }
    };

    document.addEventListener("click", handleClickCheck, true);
    window.addEventListener("focus", handleFocusOrVisibility);
    document.addEventListener("visibilitychange", handleFocusOrVisibility);

    return () => {
      document.removeEventListener("click", handleClickCheck, true);
      window.removeEventListener("focus", handleFocusOrVisibility);
      document.removeEventListener("visibilitychange", handleFocusOrVisibility);
    };
  }, [currentUser?._id, location.pathname, verifyActiveAccountStatus]);

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
        const userData = buildNormalizedUser(user);
        if (userData.isActive === false) {
          forceLogoutInactiveAccount(
            "Your account has been deactivated. Please contact the administrator.",
          );
          return {
            success: false,
            error: "Your account has been deactivated. Please contact the administrator.",
          };
        }

        stampAccountVerified();
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
  const logout = useCallback((redirectPath = "/login", { silent = false } = {}) => {
    try {
      clearAuthStorage();
      resetAccountVerifiedStamp();

      // Clear auth header
      delete api.defaults.headers.common["Authorization"];

      // Reset user state
      setCurrentUser(null);

      // Redirect to login
      navigate(redirectPath || "/login", { replace: true });
    } catch (error) {
      console.error("Error during logout:", error);
      setCurrentUser(null);
      navigate(redirectPath || "/login", { replace: true });
    }
    if (!silent) {
      message.success("Logged out successfully");
    }
  }, [navigate]);

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
    const userData = buildNormalizedUser(user);
    if (userData.isActive === false) {
      forceLogoutInactiveAccount(
        "Your account has been deactivated. Please contact the administrator.",
      );
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(userData));
    }

    stampAccountVerified();
    setCurrentUser(userData);

    // Set the auth header for future requests
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  const value = {
    currentUser,
    isAuthenticated: Boolean(currentUser && currentUser.isActive !== false),
    isApproved: currentUser?.isApproved || false,
    isAdmin:
      currentUser?.role === "admin" ||
      currentUser?.role === "employee" ||
      Boolean(currentUser?.adminRoleId),
    loading,
    login,
    register,
    logout,
    updateUser,
    setUserFromTokens,
    verifyActiveAccountStatus,
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
