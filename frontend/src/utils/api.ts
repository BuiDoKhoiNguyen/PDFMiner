import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: '/api', // Assuming API is proxied through /api
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (username: string, password: string) => 
    api.post('/auth/login', { username, password }),
  
  register: (userData: {
    username: string;
    password: string;
    email: string;
    fullName: string;
  }) => api.post('/auth/register', userData),
  
  getCurrentUser: () => api.get('/me'),
};

// Document API
export const documentApi = {
  getAllDocuments: () => api.get('/documents'),
  
  getDocumentById: (id: string) => api.get(`/documents/${id}`),
  
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  deleteDocument: (id: string) => api.delete(`/documents/${id}`),
  
  updateDocument: (id: string) => api.put(`/documents/${id}`),
  
  searchDocuments: (keyword: string) => api.get(`/documents/search?keyword=${keyword}`),
  
  getSuggestions: (query: string, limit = 6) => 
    api.get(`/documents/suggest?query=${query}&limit=${limit}`),
  
  getDocumentStatus: (documentId: string) => 
    api.get(`/documents/${documentId}/status`),
    
  getDocumentFileUrl: (fileKey: string) => 
    api.get(`/files/url/${fileKey}`),
    
  downloadDocumentFile: (fileKey: string) => 
    api.get(`/files/download/${fileKey}`, {
      responseType: 'blob'
    }),
};

export default api;
