import api from './axios';

export const chatApi = {
  async getMessages(sessionId, limit = 200) {
    const res = await api.get('/chat/messages', { params: { sessionId, limit } });
    return res.data?.data || [];
  },
  async saveMessage({ sessionId, userId, role, text, ts, meta }) {
    const res = await api.post('/chat/message', { sessionId, userId, role, text, ts, meta });
    return res.data?.data;
  },
  async endSession(sessionId) {
    const res = await api.post('/chat/end', { sessionId });
    return res.data?.data;
  },
  async createHandoff(sessionId, reason) {
    const res = await api.post('/chat/handoffs', { sessionId, reason });
    return res.data?.data;
  }
};

export default chatApi;
