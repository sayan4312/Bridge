import { API_ENDPOINTS, httpClient } from '../config/api';

export interface Consultation {
  _id: string;
  advisorId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    profile?: {
      company?: string;
      specialization?: string[];
    };
  };
  businessIdeaId?: {
    _id: string;
    title: string;
    category: string;
  };
  clientId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  title: string;
  description: string;
  advice: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
  status: 'draft' | 'published' | 'archived';
  isPublic: boolean;
  views: number;
  likes: Array<{
    user: string;
    createdAt: string;
  }>;
  comments: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
      role: string;
      avatar?: string;
    };
    content: string;
    createdAt: string;
  }>;
  rating: {
    average: number;
    count: number;
    ratings: Array<{
      user: string;
      score: number;
      createdAt: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ConsultationCreateData {
  title: string;
  description: string;
  advice: string;
  category: string;
  businessIdeaId?: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  isPublic?: boolean;
  status?: 'draft' | 'published';
}

export interface ConsultationFilters {
  page?: number;
  limit?: number;
  category?: string;
  isPublic?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ConsultationResponse {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: {
    consultations: Consultation[];
  };
}

class ConsultationService {
  async getConsultations(filters: ConsultationFilters = {}): Promise<ConsultationResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_ENDPOINTS.CONSULTATIONS.BASE}?${queryParams.toString()}`;
    return await httpClient.get(url);
  }

  async getConsultation(id: string): Promise<{ success: boolean; data: { consultation: Consultation } }> {
    return await httpClient.get(API_ENDPOINTS.CONSULTATIONS.SINGLE(id));
  }

  async createConsultation(data: ConsultationCreateData): Promise<{ success: boolean; data: { consultation: Consultation } }> {
    return await httpClient.post(API_ENDPOINTS.CONSULTATIONS.BASE, data);
  }

  async updateConsultation(id: string, data: Partial<ConsultationCreateData>): Promise<{ success: boolean; data: { consultation: Consultation } }> {
    return await httpClient.put(API_ENDPOINTS.CONSULTATIONS.SINGLE(id), data);
  }

  async deleteConsultation(id: string): Promise<{ success: boolean; message: string }> {
    return await httpClient.delete(API_ENDPOINTS.CONSULTATIONS.SINGLE(id));
  }

  async getMyConsultations(filters: ConsultationFilters = {}): Promise<ConsultationResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_ENDPOINTS.CONSULTATIONS.MY_CONSULTATIONS}?${queryParams.toString()}`;
    return await httpClient.get(url);
  }

  async toggleLike(id: string): Promise<{ success: boolean; data: { liked: boolean; likeCount: number } }> {
    return await httpClient.post(API_ENDPOINTS.CONSULTATIONS.LIKE(id));
  }

  async addComment(id: string, content: string): Promise<{ success: boolean; data: { consultation: Consultation } }> {
    return await httpClient.post(API_ENDPOINTS.CONSULTATIONS.COMMENT(id), { content });
  }

  // Helper method to get difficulty color
  getDifficultyColor(difficulty: string): string {
    const colors: Record<string, string> = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800',
    };
    
    return colors[difficulty] || colors['intermediate'];
  }

  // Helper method to get category color
  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'Strategy': 'bg-blue-100 text-blue-800',
      'Marketing': 'bg-green-100 text-green-800',
      'Finance': 'bg-purple-100 text-purple-800',
      'Operations': 'bg-yellow-100 text-yellow-800',
      'Technology': 'bg-indigo-100 text-indigo-800',
      'Legal': 'bg-gray-100 text-gray-800',
      'HR': 'bg-pink-100 text-pink-800',
      'Sales': 'bg-orange-100 text-orange-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    
    return colors[category] || colors['Other'];
  }
}

export const consultationService = new ConsultationService();