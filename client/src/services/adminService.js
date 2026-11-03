import api from './api';

export const getAdminStats = () => api.get('/admin/stats').then((r) => r.data);

export const getAdminUsers = ({ search = '', role = '', page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (role) params.set('role', role);
  params.set('page', page);
  params.set('limit', limit);
  return api.get(`/admin/users?${params.toString()}`).then((r) => r.data);
};

export const getAdminUser = (id) => api.get(`/admin/users/${id}`).then((r) => r.data);

export const updateAdminUser = (id, payload) => api.put(`/admin/users/${id}`, payload).then((r) => r.data);

export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`).then((r) => r.data);
