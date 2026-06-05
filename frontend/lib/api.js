import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || Cookies.get('token')) : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        Cookies.remove('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  getProfile: () => api.get('/api/auth/profile'),
  getUsers: () => api.get('/api/auth/users'),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/api/dashboard/stats'),
};

// Products
export const productsApi = {
  getAll: (params) => api.get('/api/products', { params }),
  getOne: (id) => api.get(`/api/products/${id}`),
  create: (data) => api.post('/api/products', data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  delete: (id) => api.delete(`/api/products/${id}`),
  adjustStock: (id, data) => api.post(`/api/products/${id}/adjust`, data),
  getMovements: (id, params) => api.get(`/api/products/${id}/movements`, { params }),
  getCategories: () => api.get('/api/products/categories'),
  createCategory: (data) => api.post('/api/products/categories', data),
};

// Suppliers
export const suppliersApi = {
  getAll: (params) => api.get('/api/suppliers', { params }),
  getOne: (id) => api.get(`/api/suppliers/${id}`),
  create: (data) => api.post('/api/suppliers', data),
  update: (id, data) => api.put(`/api/suppliers/${id}`, data),
  delete: (id) => api.delete(`/api/suppliers/${id}`),
};

// Orders
export const ordersApi = {
  getAll: (params) => api.get('/api/orders', { params }),
  getOne: (id) => api.get(`/api/orders/${id}`),
  create: (data) => api.post('/api/orders', data),
  updateStatus: (id, status) => api.patch(`/api/orders/${id}/status`, { status }),
  delete: (id) => api.delete(`/api/orders/${id}`),
};

// Alerts
export const alertsApi = {
  getAll: (params) => api.get('/api/alerts', { params }),
  getSummary: () => api.get('/api/alerts/summary'),
  markRead: (id) => api.patch(`/api/alerts/${id}/read`),
  dismiss: (id) => api.patch(`/api/alerts/${id}/dismiss`),
  markAllRead: () => api.patch('/api/alerts/read-all'),
};

// Reports
export const reportsApi = {
  getMovements: (params) => api.get('/api/reports/movements', { params }),
  getForecast: () => api.get('/api/reports/forecast'),
  getInventoryValue: () => api.get('/api/reports/inventory-value'),
  getTopMovers: (params) => api.get('/api/reports/top-movers', { params }),
};

export default api;
