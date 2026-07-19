import api from './axios';

const pmTaskService = {
  getPMTasks: async (params) => {
    const response = await api.get('/pm-tasks', { params });
    return response.data;
  },
  
  getPMTaskById: async (id) => {
    const response = await api.get(`/pm-tasks/${id}`);
    return response.data;
  },

  createPMTask: async (data) => {
    const response = await api.post('/pm-tasks', data);
    return response.data;
  },

  updatePMTask: async (id, data) => {
    const response = await api.patch(`/pm-tasks/${id}`, data);
    return response.data;
  },

  deletePMTask: async (id) => {
    const response = await api.delete(`/pm-tasks/${id}`);
    return response.data;
  }
};

export default pmTaskService;
