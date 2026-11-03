import api from './api';

export const getMusicByCategory = (category) => api.get(`/music/recommendations?category=${encodeURIComponent(category)}`).then((r) => r.data);
export const searchMusic = (q) => api.get(`/music/search?q=${encodeURIComponent(q)}`).then((r) => r.data);
