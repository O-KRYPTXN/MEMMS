import api from './axios';

const faultReportService = {
  createFaultReport: async (data) => {
    const response = await api.post('/fault-reports', data);
    return response.data;
  },

  getFaultReports: async (params) => {
    const response = await api.get('/fault-reports', { params });
    return response.data;
  },

  getFaultReportStats: async () => {
    const response = await api.get('/fault-reports/stats');
    return response.data;
  },

  updateFaultReport: async (id, data) => {
    const response = await api.patch(`/fault-reports/${id}`, data);
    return response.data;
  }
};

export default faultReportService;
