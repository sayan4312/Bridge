import { API_ENDPOINTS, httpClient } from '../config/api';

export interface BusinessIdea {
  _id: string;
  title: string;
  description: string;
  category: string;
  investmentNeeded: number;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  status: 'active' | 'funded' | 'closed';
  files?: Array<{
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
  }>;
  tags?: string[];
  fundingGoal: number;
  currentFunding: number;
  investorCount: number;
  views: number;
  likes: Array<{
    user: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessIdeaCreateData {
  title: string;
  description: string;
  category: string;
  investmentNeeded: number;
  tags?: string[];
}

export interface BusinessIdeaFilters {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minInvestment?: number;
  maxInvestment?: number;
}

export interface BusinessIdeaResponse {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: {
    businessIdeas: BusinessIdea[];
  };
}

class BusinessIdeaService {
  async getBusinessIdeas(filters: BusinessIdeaFilters = {}): Promise<BusinessIdeaResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_ENDPOINTS.BUSINESS_IDEAS.BASE}?${queryParams.toString()}`;
    return await httpClient.get(url);
  }

  async getBusinessIdea(id: string): Promise<{ success: boolean; data: { businessIdea: BusinessIdea } }> {
    return await httpClient.get(API_ENDPOINTS.BUSINESS_IDEAS.SINGLE(id));
  }

  async createBusinessIdea(data: BusinessIdeaCreateData): Promise<{ success: boolean; data: { businessIdea: BusinessIdea } }> {
    return await httpClient.post(API_ENDPOINTS.BUSINESS_IDEAS.BASE, data);
  }

  async updateBusinessIdea(id: string, data: Partial<BusinessIdeaCreateData>): Promise<{ success: boolean; data: { businessIdea: BusinessIdea } }> {
    return await httpClient.put(API_ENDPOINTS.BUSINESS_IDEAS.SINGLE(id), data);
  }

  async deleteBusinessIdea(id: string): Promise<{ success: boolean; message: string }> {
    return await httpClient.delete(API_ENDPOINTS.BUSINESS_IDEAS.SINGLE(id));
  }

  async toggleLike(id: string): Promise<{ success: boolean; data: { liked: boolean; likeCount: number } }> {
    return await httpClient.post(API_ENDPOINTS.BUSINESS_IDEAS.LIKE(id));
  }

  async getMyBusinessIdeas(filters: BusinessIdeaFilters = {}): Promise<BusinessIdeaResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_ENDPOINTS.BUSINESS_IDEAS.MY_IDEAS}?${queryParams.toString()}`;
    return await httpClient.get(url);
  }

  // Helper method to format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Helper method to calculate funding percentage
  calculateFundingPercentage(currentFunding: number, fundingGoal: number): number {
    return Math.round((currentFunding / fundingGoal) * 100);
  }

  // Helper method to get category color
  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'Technology': 'bg-blue-100 text-blue-800',
      'Healthcare': 'bg-green-100 text-green-800',
      'Finance': 'bg-purple-100 text-purple-800',
      'Agriculture': 'bg-yellow-100 text-yellow-800',
      'Education': 'bg-indigo-100 text-indigo-800',
      'Manufacturing': 'bg-gray-100 text-gray-800',
      'Retail': 'bg-pink-100 text-pink-800',
      'Services': 'bg-orange-100 text-orange-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    
    return colors[category] || colors['Other'];
  }
}

export const businessIdeaService = new BusinessIdeaService();