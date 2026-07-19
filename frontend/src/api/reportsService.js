import api from './axios';

export const getDashboardMetrics = async () => {
  const { data } = await api.get('/reports/dashboard');
  return data.data;
};

export const getAnalyticsMetrics = async () => {
  const { data } = await api.get('/reports/analytics');
  return data.data;
};

export const getReports = async (params = {}) => {
  const { data } = await api.get('/reports', { params });
  return data;
};

export const generateReport = async (payload) => {
  const { data } = await api.post('/reports/generate', payload);
  return data.data;
};

export const getDownloadUrl = (reportId) => {
  // Return the full URL for the download endpoint.
  // Note: Since this is an authenticated endpoint, the frontend needs to fetch it as a blob
  // or the backend needs to allow downloading it via cookie session. 
  // Assuming standard Axios blob download:
  return `/reports/${reportId}/download`;
};

export const downloadReportBlob = async (reportId) => {
  const response = await api.get(`/reports/${reportId}/download`, { responseType: 'blob' });
  return response.data;
};
