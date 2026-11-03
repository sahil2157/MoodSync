import api from './api';

export const listGames = () => api.get('/games').then((r) => r.data);
export const getGameAssets = (type) => api.get(`/games/assets/${type}`).then((r) => r.data);
export const saveGameSession = (payload) => api.post('/games/session', payload).then((r) => r.data);
export const getGameHistory = (gameType) => api.get(`/games/history${gameType ? `?gameType=${gameType}` : ''}`).then((r) => r.data);
