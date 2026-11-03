import api from './api';

export const createJournalEntry = (payload) => api.post('/journal', payload).then((r) => r.data);
export const getJournalEntries = (limit = 30) => api.get(`/journal?limit=${limit}`).then((r) => r.data);
export const deleteJournalEntry = (id) => api.delete(`/journal/${id}`).then((r) => r.data);
