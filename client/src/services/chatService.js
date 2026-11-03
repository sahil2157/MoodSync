import api from './api';

export const sendChatMessage = (payload) => api.post('/chat', payload).then((r) => r.data);
export const getChatHistory = (limit = 50) => api.get(`/chat/history?limit=${limit}`).then((r) => r.data);
