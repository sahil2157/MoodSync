import api from './api';

export const getRandomQuote = (category) => api.get(`/quotes/random${category ? `?category=${encodeURIComponent(category)}` : ''}`).then((r) => r.data);
export const getQuoteForMood = (mood) => api.get(`/quotes/mood/${mood}`).then((r) => r.data);
export const favoriteQuote = (payload) => api.post('/quotes/favorite', payload).then((r) => r.data);
export const getFavoriteQuotes = () => api.get('/quotes/favorites').then((r) => r.data);
export const removeFavoriteQuote = (id) => api.delete(`/quotes/favorite/${id}`).then((r) => r.data);
