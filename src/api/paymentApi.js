import api from "./axios";

/**
 * Payment & Invoice API service for Admin Panel
 */
const paymentApi = {
  getAllPayments: async (params = {}) => {
    const response = await api.get("/admin/payments", { params });
    return response.data;
  },

  getStudentPaymentHistory: async (params = {}) => {
    const response = await api.get("/admin/payments/student-history", { params });
    return response.data;
  },

  createAdminPayment: async (payload) => {
    const response = await api.post("/admin/payments", payload);
    return response.data;
  },

  updateAdminPayment: async (id, payload) => {
    const response = await api.put(`/admin/payments/${id}`, payload);
    return response.data;
  },

  getPaymentById: async (id) => {
    const response = await api.get(`/admin/payments/${id}`);
    return response.data;
  },

  updatePaymentStatus: async (id, status) => {
    const response = await api.put(`/admin/payments/${id}/status`, { status });
    return response.data;
  },

  getInvoicePreview: async (id) => {
    const response = await api.get(`/admin/payments/${id}/invoice-preview`);
    return response.data;
  },

  fetchInvoicePdfBlob: async (id, download = false) => {
    const response = await api.get(`/admin/payments/${id}/invoice-pdf`, {
      params: download ? { download: "true" } : {},
      responseType: "blob",
      timeout: 30000,
    });
    return response.data;
  },

  sendInvoiceEmail: async (id, payload) => {
    const response = await api.post(`/admin/payments/${id}/send-invoice`, payload, {
      timeout: 30000,
    });
    return response.data;
  },

  getPendingAlertPreview: async (id, params = {}) => {
    const response = await api.get(`/admin/payments/${id}/pending-alert-preview`, {
      params,
    });
    return response.data;
  },

  sendPendingAlertEmail: async (id, payload) => {
    const response = await api.post(
      `/admin/payments/${id}/send-pending-alert`,
      payload,
      { timeout: 30000 }
    );
    return response.data;
  },
};

export default paymentApi;
