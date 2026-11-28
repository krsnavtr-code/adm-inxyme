import axios from "axios";
import { toast } from "react-hot-toast";

export const ACCOUNT_INACTIVE_EVENT = "inxyme:account-inactive";

const DEFAULT_INACTIVE_MESSAGE =
  "Your account is inactive or has been deactivated. Please contact the administrator.";

let lastAccountVerifiedAt = 0;
let isHandlingInactiveLogout = false;
let globalInterceptorInstalled = false;

export const stampAccountVerified = () => {
  lastAccountVerifiedAt = Date.now();
};

export const resetAccountVerifiedStamp = () => {
  lastAccountVerifiedAt = 0;
};

export const getLastAccountVerifiedAt = () => lastAccountVerifiedAt;

export const clearAuthStorage = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("Users");
};

export const isInactiveAccountError = (error) => {
  if (!error) return false;
  const status = error.response?.status;
  const data = error.response?.data || {};
  if (data.accountInactive === true || data.code === "ACCOUNT_INACTIVE") {
    return true;
  }
  if (status === 401 || status === 403) {
    const msg = String(data.message || error.message || "").toLowerCase();
    if (
      msg.includes("not active") ||
      msg.includes("inactive") ||
      msg.includes("deactivated") ||
      msg.includes("suspended")
    ) {
      return true;
    }
  }
  return false;
};

export const forceLogoutInactiveAccount = (customMessage = "") => {
  const displayMessage = String(customMessage || "").trim() || DEFAULT_INACTIVE_MESSAGE;

  clearAuthStorage();
  resetAccountVerifiedStamp();

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(ACCOUNT_INACTIVE_EVENT, { detail: { message: displayMessage } }),
    );
  }

  if (!isHandlingInactiveLogout) {
    isHandlingInactiveLogout = true;
    toast.error(displayMessage, { id: "account-inactive-toast", duration: 5000 });
    setTimeout(() => {
      isHandlingInactiveLogout = false;
    }, 3000);
  }

  if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
    window.location.replace("/login?error=account_suspended");
  }
};

export const installGlobalAxiosActiveCheck = () => {
  if (globalInterceptorInstalled) return;
  globalInterceptorInstalled = true;

  axios.interceptors.response.use(
    (response) => {
      const sentAuth = Boolean(response?.config?.headers?.Authorization);
      if (sentAuth) {
        if (response?.data?.user?.isActive === false || response?.data?.data?.isActive === false) {
          forceLogoutInactiveAccount();
          return Promise.reject(new Error(DEFAULT_INACTIVE_MESSAGE));
        }
        stampAccountVerified();
      }
      return response;
    },
    (error) => {
      if (isInactiveAccountError(error)) {
        forceLogoutInactiveAccount(error.response?.data?.message);
      }
      return Promise.reject(error);
    },
  );
};
