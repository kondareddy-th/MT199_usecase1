import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Service for MT Navigator
const apiService = {
  // Generic request methods
  get: async (url, params = {}) => {
    try {
      const response = await api.get(url, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  post: async (url, data = {}) => {
    try {
      const response = await api.post(url, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  put: async (url, data = {}) => {
    try {
      const response = await api.put(url, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  delete: async (url) => {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Investigation APIs
  createInvestigation: async (messageId, priority = 'medium', customerInfo = null) => {
    return await apiService.post('/api/investigations/', { message_id: messageId, priority, customer_info: customerInfo });
  },

  getInvestigations: async (status = '', priority = '', limit = 10, offset = 0) => {
    return await apiService.get('/api/investigations/', { status, priority, limit, offset });
  },

  getInvestigationById: async (investigationId) => {
    return await apiService.get(`/api/investigations/${investigationId}`);
  },

  getInvestigationByReference: async (referenceNumber) => {
    return await apiService.get(`/api/investigations/reference/${referenceNumber}`);
  },

  addInvestigationAction: async (investigationId, actionData) => {
    return await apiService.post(`/api/investigations/${investigationId}/actions`, actionData);
  },

  updateInvestigationActionStatus: async (actionId, status, notes = null) => {
    return await apiService.put(`/api/investigations/actions/${actionId}`, { status, notes });
  },

  resolveInvestigation: async (investigationId, resolutionNotes) => {
    return await apiService.put(`/api/investigations/${investigationId}/resolve`, { resolution_notes: resolutionNotes });
  },

  closeInvestigation: async (investigationId) => {
    return await apiService.put(`/api/investigations/${investigationId}/close`);
  },

  generateCustomerNotification: async (investigationId, notificationType) => {
    return await apiService.post(`/api/investigations/${investigationId}/notifications`, { notification_type: notificationType });
  },

  // Existing methods (MT199 Analyzer, MT Messages, Settings, etc.) remain unchanged...

  analyzeMT199: async (content) => {
    return await apiService.post('/api/mt/analyze-mt199', { content });
  },

  processMTMessage: async (content, mode = 'convert', messageId = null, feelingLucky = false) => {
    return await apiService.post('/api/mt/process', { content, mode, message_id: messageId, feeling_lucky: feelingLucky });
  },

  uploadMTFile: async (file, mode = 'convert') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);

    return await api.post('/api/mt/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getMessageHistory: async (limit = 10, offset = 0) => {
    return await apiService.get(`/api/mt/history`, { limit, offset });
  },

  getMessageById: async (id) => {
    return await apiService.get(`/api/mt/message/${id}`);
  },

  getSettings: async () => {
    return await apiService.get('/api/settings');
  },

  updateSettings: async (settings) => {
    return await apiService.post('/api/settings', settings);
  },

  deleteApiKey: async () => {
    return await apiService.delete('/api/settings/api-key');
  },
};

export default apiService;
