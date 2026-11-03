import api from './api';

export const getGoals = () => api.get('/goals').then((r) => r.data);
export const createGoal = (payload) => api.post('/goals', payload).then((r) => r.data);
export const updateGoal = (id, payload) => api.put(`/goals/${id}`, payload).then((r) => r.data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`).then((r) => r.data);
