import api from './axios';

export const getRegistrationRequests = async (params) => {
  const response = await api.get('/registrations', { params });
  return response.data;
};

export const approveRegistration = async (id) => {
  const response = await api.post(`/registrations/${id}/approve`);
  return response.data;
};

export const rejectRegistration = async (id, reason) => {
  const response = await api.post(`/registrations/${id}/reject`, { reason });
  return response.data;
};
