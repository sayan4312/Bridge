const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    ME: `${API_BASE_URL}/auth/me`,
    UPDATE_PROFILE: `${API_BASE_URL}/auth/profile`,
    CHANGE_PASSWORD: `${API_BASE_URL}/auth/password`,
  },
  
  // Business Ideas endpoints
  BUSINESS_IDEAS: {
    BASE: `${API_BASE_URL}/business-ideas`,
    MY_IDEAS: `${API_BASE_URL}/business-ideas/my/ideas`,
    LIKE: (id: string) => `${API_BASE_URL}/business-ideas/${id}/like`,
    SINGLE: (id: string) => `${API_BASE_URL}/business-ideas/${id}`,
  },
  
  // Investment Proposals endpoints
  INVESTMENT_PROPOSALS: {
    BASE: `${API_BASE_URL}/investment-proposals`,
    SINGLE: (id: string) => `${API_BASE_URL}/investment-proposals/${id}`,
    STATUS: (id: string) => `${API_BASE_URL}/investment-proposals/${id}/status`,
    WITHDRAW: (id: string) => `${API_BASE_URL}/investment-proposals/${id}/withdraw`,
    FOR_BUSINESS: (businessIdeaId: string) => `${API_BASE_URL}/investment-proposals/business-idea/${businessIdeaId}`,
  },
  
  // Loan Offers endpoints
  LOAN_OFFERS: {
    BASE: `${API_BASE_URL}/loan-offers`,
    SINGLE: (id: string) => `${API_BASE_URL}/loan-offers/${id}`,
    MY_OFFERS: `${API_BASE_URL}/loan-offers/my/offers`,
  },
  
  
  // Consultations endpoints
  CONSULTATIONS: {
    BASE: `${API_BASE_URL}/consultations`,
    SINGLE: (id: string) => `${API_BASE_URL}/consultations/${id}`,
    MY_CONSULTATIONS: `${API_BASE_URL}/consultations/my/consultations`,
    LIKE: (id: string) => `${API_BASE_URL}/consultations/${id}/like`,
    COMMENT: (id: string) => `${API_BASE_URL}/consultations/${id}/comment`,
  },

  // Notifications endpoints
  NOTIFICATIONS: {
    BASE: `${API_BASE_URL}/notifications`,
    SINGLE: (id: string) => `${API_BASE_URL}/notifications/${id}`,
    MARK_READ: (id: string) => `${API_BASE_URL}/notifications/${id}/read`,
    MARK_ALL_READ: `${API_BASE_URL}/notifications/mark-all-read`,
    CLEAR_READ: `${API_BASE_URL}/notifications/clear-read`,
    STATS: `${API_BASE_URL}/notifications/stats`,
  }
};


// HTTP client configuration
export const httpClient = {
  get: async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    
    return response.json();
  },

  post: async (url: string, data?: any, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    
    return response.json();
  },

  put: async (url: string, data?: any, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    
    return response.json();
  },

  delete: async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    
    return response.json();
  },
};

export default API_ENDPOINTS;