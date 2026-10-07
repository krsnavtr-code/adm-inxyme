import axios from "axios";

const LANDING_BASE_URL =
  import.meta.env.VITE_LANDING_API_URL || "http://localhost:5006/api";

const landingClient = axios.create({
  baseURL: LANDING_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Fetch Leads (completed registrations) from landing page database
 */
export const getLandingLeads = async (params = {}) => {
  try {
    const res = await landingClient.get("/leads", { params });
    return res.data;
  } catch (err) {
    console.error("Error fetching landing leads:", err);
    throw err;
  }
};

/**
 * Fetch Partial Leads (onBlur / abandoned form fills)
 */
export const getPartialLeads = async (params = {}) => {
  try {
    const res = await landingClient.get("/partial-leads", { params });
    return res.data;
  } catch (err) {
    console.error("Error fetching partial leads:", err);
    throw err;
  }
};

/**
 * Fetch Payments from landing page database
 */
export const getLandingPayments = async (params = {}) => {
  try {
    const res = await landingClient.get("/payments", { params });
    return res.data;
  } catch (err) {
    console.error("Error fetching landing payments:", err);
    throw err;
  }
};

/**
 * Fetch Visitors (device fingerprints, visit counts, returning users)
 */
export const getLandingVisitors = async (params = {}) => {
  try {
    const res = await landingClient.get("/visitors", { params });
    return res.data;
  } catch (err) {
    console.error("Error fetching landing visitors:", err);
    throw err;
  }
};

/**
 * Fetch Visitor Page Views & Course module interest
 */
export const getLandingPageViews = async (params = {}) => {
  try {
    const res = await landingClient.get("/visitor-page-views", { params });
    return res.data;
  } catch (err) {
    console.error("Error fetching landing page views:", err);
    throw err;
  }
};

/**
 * Fetch Server Tracking Logs (Meta CAPI / Ad-blocker bypass logs)
 */
export const getServerTrackingLogs = async (params = {}) => {
  try {
    const res = await landingClient.get("/server-tracking/logs", { params });
    return res.data;
  } catch (err) {
    console.error("Error fetching server tracking logs:", err);
    throw err;
  }
};

export default landingClient;
