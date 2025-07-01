import { API_ENDPOINTS, httpClient } from '../config/api';
import { UserRole } from '../store/authStore';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  data: {
    user: User;
  };
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await httpClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    
    if (response.success && response.token) {
      localStorage.setItem('token', response.token);
    }
    
    return response;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await httpClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
    
    if (response.success && response.token) {
      localStorage.setItem('token', response.token);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await httpClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await httpClient.get(API_ENDPOINTS.AUTH.ME);
    return response.data.user;
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    const response = await httpClient.put(API_ENDPOINTS.AUTH.UPDATE_PROFILE, profileData);
    return response.data.user;
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<void> {
    await httpClient.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, passwordData);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Check if token is expired (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();