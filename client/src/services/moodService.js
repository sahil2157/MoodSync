import api from './api';

export const analyzeMood = (text) => api.post('/mood/analyze', { text }).then((r) => r.data);
export const getMoodHistory = (limit = 30) => api.get(`/mood/history?limit=${limit}`).then((r) => r.data);
export const getLatestMood = () => api.get('/mood/latest').then((r) => r.data);
export const quickMood = (emotion) => api.post('/mood/quick', { emotion }).then((r) => r.data);
