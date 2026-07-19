import axiosInstance from './axios';

/**
 * Device Service
 * Handles all device-related API calls
 */
const deviceService = {
  /**
   * Fetch all devices with pagination and filters
   * @param {Object} params - Query parameters (page, limit, category, status, departmentId, search)
   */
  getDevices: async (params) => {
    const response = await axiosInstance.get('/devices', { params });
    return response.data;
  },

  /**
   * Fetch global device statistics
   */
  getDeviceStats: async () => {
    const response = await axiosInstance.get('/devices/stats');
    return response.data;
  },

  /**
   * Fetch a single device by ID
   */
  getDeviceById: async (id) => {
    const response = await axiosInstance.get(`/devices/${id}`);
    return response.data;
  },

  /**
   * Create a new device
   * @param {Object} data - Device data payload
   */
  createDevice: async (data) => {
    const response = await axiosInstance.post('/devices', data);
    return response.data;
  },

  /**
   * Update device details
   */
  updateDevice: async (id, data) => {
    const response = await axiosInstance.patch(`/devices/${id}`, data);
    return response.data;
  },

  /**
   * Update device status (e.g. REPORT FAULT)
   */
  updateDeviceStatus: async (id, status) => {
    const response = await axiosInstance.patch(`/devices/${id}/status`, { status });
    return response.data;
  },

  /**
   * Delete a device
   */
  deleteDevice: async (id) => {
    const response = await axiosInstance.delete(`/devices/${id}`);
    return response.data;
  }
};

export default deviceService;
