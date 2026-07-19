import api from './axios';

const workOrderService = {
  createWorkOrder: async (data) => {
    const response = await api.post('/work-orders', data);
    return response.data;
  },

  getWorkOrders: async (params) => {
    const response = await api.get('/work-orders', { params });
    return response.data;
  },

  getWorkOrderById: async (id) => {
    const response = await api.get(`/work-orders/${id}`);
    return response.data;
  },

  updateWorkOrder: async (id, data) => {
    const response = await api.patch(`/work-orders/${id}`, data);
    return response.data;
  },

  deleteWorkOrder: async (id) => {
    const response = await api.delete(`/work-orders/${id}`);
    return response.data;
  }
};

export default workOrderService;
