import api from './axios';

export const getAlerts = async (params) => {
  const response = await api.get('/alerts', { params });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get('/alerts/unread-count');
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await api.patch(`/alerts/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.patch('/alerts/read-all');
  return response.data;
};
