import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Workflows
export const workflowsApi = {
  getAll: () => api.get('/workflows'),
  getById: (workflowId: string) => api.get(`/workflows/${workflowId}`),
  approve: (workflowId: string, data: { edited_post?: string; approved_by: string }) =>
    api.post(`/workflows/${workflowId}/approve`, data),
  discard: (workflowId: string, data: { discarded_by: string; reason?: string }) =>
    api.post(`/workflows/${workflowId}/discard`, data),
  delete: (id: number) => api.delete(`/workflows/${id}`),
};

// Database - Transactions
export const transactionsApi = {
  getAll: (params?: { skip?: number; limit?: number; status?: string }) =>
    api.get('/database/transactions', { params }),
  getById: (id: number) => api.get(`/database/transactions/${id}`),
  create: (data: any) => api.post('/database/transactions', data),
  update: (id: number, data: any) => api.put(`/database/transactions/${id}`, data),
  delete: (id: number) => api.delete(`/database/transactions/${id}`),
};

// Database - Reviews
export const reviewsApi = {
  getAll: (params?: { skip?: number; limit?: number; sentiment?: string }) =>
    api.get('/database/reviews', { params }),
  getById: (id: number) => api.get(`/database/reviews/${id}`),
  create: (data: any) => api.post('/database/reviews', data),
  update: (id: number, data: any) => api.put(`/database/reviews/${id}`, data),
  delete: (id: number) => api.delete(`/database/reviews/${id}`),
};

// Database - Sentiments
export const sentimentsApi = {
  getAll: (params?: { skip?: number; limit?: number }) =>
    api.get('/database/sentiments', { params }),
  delete: (id: number) => api.delete(`/database/sentiments/${id}`),
};

export default api;
