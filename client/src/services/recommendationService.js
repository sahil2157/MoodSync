import api from './api';

export const getRecommendations = () => api.get('/recommendations').then((r) => r.data);
export const submitRecommendationFeedback = (id, feedback) => api.put(`/recommendations/${id}/feedback`, { feedback }).then((r) => r.data);
