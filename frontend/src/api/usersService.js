import api from './axios';

export const getUsers = async (params) => {
  const response = await api.get('/users', { params });
  return response.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post('/users', data);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.patch(`/users/${id}`, data);
  return response.data;
};

export const updateUserStatus = async (id, data) => {
  const response = await api.patch(`/users/${id}/status`, data);
  return response.data;
};
