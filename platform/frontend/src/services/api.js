import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error)
  }
)

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

// Company API
export const companyAPI = {
  create: (companyData) => api.post('/companies', companyData),
  getAll: (filters = {}) => api.get('/companies', { params: filters }),
  getById: (id) => api.get(`/companies/${id}`),
  update: (id, updates) => api.put(`/companies/${id}`, updates),
  updateStatus: (id, status) => api.patch(`/companies/${id}/status`, { status }),
  getSetupStatus: (id) => api.get(`/companies/${id}/setup-status`),
  retrySetup: (id) => api.post(`/companies/${id}/retry-setup`),
  delete: (id) => api.delete(`/companies/${id}`),
}

// Jira API
export const jiraAPI = {
  getSiteInfo: (siteId) => api.get(`/jira/site/${siteId}`),
  getConfig: (companyId) => api.get(`/jira/config/${companyId}`),
  updateConfig: (companyId, config) => api.put(`/jira/config/${companyId}`, config),
  createRequest: (companyId, requestData) => api.post(`/jira/request/${companyId}`, requestData),
  testConnection: (companyId) => api.get(`/jira/test/${companyId}`),
}

// Webhook API
export const webhookAPI = {
  test: (companyId, testTranscript) => api.post('/webhooks/test', { companyId, testTranscript }),
  health: () => api.get('/webhooks/health'),
}

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
}

export default api
