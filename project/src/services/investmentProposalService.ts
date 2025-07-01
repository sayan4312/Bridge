import { API_ENDPOINTS, httpClient } from '../config/api';

export interface InvestmentProposal {
  _id: string;
  businessIdeaId: {
    _id: string;
    title: string;
    description: string;
    category: string;
    investmentNeeded: number;
    userId: string;
  };
  investorId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  amount: number;
  type: 'equity' | 'loan' | 'partnership';
  equityPercentage?: number;
  interestRate?: number;
  loanDuration?: number;
  terms: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  message?: string;
  responseMessage?: string;
  respondedAt?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentProposalCreateData {
  businessIdeaId: string;
  amount: number;
  type: 'equity' | 'loan' | 'partnership';
  equityPercentage?: number;
  interestRate?: number;
  loanDuration?: number;
  terms: string;
  message?: string;
}

export interface InvestmentProposalFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InvestmentProposalResponse {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: {
    proposals: InvestmentProposal[];
  };
}

class InvestmentProposalService {
  async getInvestmentProposals(filters: InvestmentProposalFilters = {}): Promise<InvestmentProposalResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_ENDPOINTS.INVESTMENT_PROPOSALS.BASE}?${queryParams.toString()}`;
    return await httpClient.get(url);
  }

  async getInvestmentProposal(id: string): Promise<{ success: boolean; data: { proposal: InvestmentProposal } }> {
    return await httpClient.get(API_ENDPOINTS.INVESTMENT_PROPOSALS.SINGLE(id));
  }

  async createInvestmentProposal(data: InvestmentProposalCreateData): Promise<{ success: boolean; data: { proposal: InvestmentProposal } }> {
    return await httpClient.post(API_ENDPOINTS.INVESTMENT_PROPOSALS.BASE, data);
  }

  async updateProposalStatus(id: string, status: 'accepted' | 'rejected', responseMessage?: string): Promise<{ success: boolean; data: { proposal: InvestmentProposal } }> {
    return await httpClient.put(API_ENDPOINTS.INVESTMENT_PROPOSALS.STATUS(id), { status, responseMessage });
  }

  async withdrawProposal(id: string): Promise<{ success: boolean; message: string }> {
    return await httpClient.put(API_ENDPOINTS.INVESTMENT_PROPOSALS.WITHDRAW(id));
  }

  async getProposalsForBusinessIdea(businessIdeaId: string, filters: InvestmentProposalFilters = {}): Promise<InvestmentProposalResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_ENDPOINTS.INVESTMENT_PROPOSALS.FOR_BUSINESS(businessIdeaId)}?${queryParams.toString()}`;
    return await httpClient.get(url);
  }

  // Helper method to calculate monthly payment for loans
  calculateMonthlyPayment(amount: number, interestRate: number, duration: number): number {
    const monthlyRate = interestRate / 100 / 12;
    const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, duration)) / 
                   (Math.pow(1 + monthlyRate, duration) - 1);
    return Math.round(payment * 100) / 100;
  }

  // Helper method to get status color
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'withdrawn': 'bg-gray-100 text-gray-800',
    };
    
    return colors[status] || colors['pending'];
  }

  // Helper method to get type color
  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'equity': 'bg-blue-100 text-blue-800',
      'loan': 'bg-purple-100 text-purple-800',
      'partnership': 'bg-green-100 text-green-800',
    };
    
    return colors[type] || colors['equity'];
  }
}

export const investmentProposalService = new InvestmentProposalService();