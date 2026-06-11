import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
};

// Users
export const usersAPI = {
  list: () => api.get('/users/'),
  create: (data: { username: string; email: string; full_name: string; password: string; role: string }) =>
    api.post('/users/', data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// Inventory
export const inventoryAPI = {
  uploadCSV: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/inventory/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadJSON: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/inventory/upload-json', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  listUploads: (type?: string) =>
    api.get('/inventory/uploads', { params: type ? { upload_type: type } : {} }),
  reconcile: (csv_upload_id: number, json_upload_id: number) =>
    api.post('/inventory/reconcile', { csv_upload_id, json_upload_id }),
  getReconciliation: (id: number) => api.get(`/inventory/reconciliations/${id}`),
  listReconciliations: () => api.get('/inventory/reconciliations'),
  chatbot: (query: string, reconciliation_id?: number) =>
    api.post('/inventory/chatbot', { query, reconciliation_id }),
};

// Reports
export const reportsAPI = {
  generate: (reconId: number) => api.post(`/reports/generate/${reconId}`),
  download: (reportId: number) =>
    api.get(`/reports/download/${reportId}`, { responseType: 'blob' }),
  list: () => api.get('/reports/'),
};

// Audit
export const auditAPI = {
  getLogs: (params?: { skip?: number; limit?: number; user_id?: number }) =>
    api.get('/audit/logs', { params }),
};

export default api;
