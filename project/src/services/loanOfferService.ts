import { API_ENDPOINTS, httpClient } from '../config/api';

export interface LoanOffer {
  _id: string;
  bankerId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    profile?: {
      company?: string;
    };
  };
  title: string;
  description?: string;
  amount: number;
  maxAmount?: number;
  interestRate: number;
  duration: number;
  conditions: string;
  requirements: {
    minCreditScore?: number;
    minAnnualRevenue?: number;
    collateralRequired: boolean;
    businessPlanRequired: boolean;
    guarantorRequired: boolean;
  };
  loanType: 'business' | 'equipment' | 'working_capital' | 'real_estate' | 'personal' | 'other';
  status: 'active' | 'inactive' | 'suspended';
  applicationCount: number;
  approvalRate: number;
  processingTime: '1-3 days' | '1 week' | '2 weeks' | '1 month' | '2+ months';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LoanOfferCreateData {
  title: string;
  description?: string;
  amount: number;
  maxAmount?: number;
  interestRate: number;
  duration: number;
  conditions: string;
  requirements?: {
    minCreditScore?: number;
    minAnnualRevenue?: number;
    collateralRequired?: boolean;
    businessPlanRequired?: boolean;
    guarantorRequired?: boolean;
  };
  loanType?: 'business' | 'equipment' | 'working_capital' | 'real_estate' | 'personal' | 'other';
  processingTime?: '1-3 days' | '1 week' | '2 weeks' | '1 month' | '2+ months';
  tags?: string[];

  status?: 'active' | 'inactive' | 'suspended';
}

export interface LoanOfferFilters {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive' | 'suspended' | 'all';
  loanType?: 'business' | 'equipment' | 'working_capital' | 'real_estate' | 'personal' | 'other';
  minAmount?: number;
  maxAmount?: number;
  maxInterestRate?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LoanOfferResponse {
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  loanOffers: LoanOffer[];
}



class LoanOfferService {
  async getLoanOffers(filters: LoanOfferFilters = {}): Promise<LoanOfferResponse> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_ENDPOINTS.LOAN_OFFERS.BASE}?${queryParams.toString()}`;
    const response = await httpClient.get(url);
    return {
      ...response.data.pagination,
      loanOffers: response.data.loanOffers,
      count: response.data.count,
    };
  }

  async getMyLoanOffers(filters: LoanOfferFilters = {}): Promise<LoanOfferResponse> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_ENDPOINTS.LOAN_OFFERS.MY_OFFERS}?${queryParams.toString()}`;
    const response = await httpClient.get(url);
    return {
      ...response.data.pagination,
      loanOffers: response.data.loanOffers,
      count: response.data.count,
    };
  }

  async getLoanOffer(id: string): Promise<LoanOffer> {
    const response = await httpClient.get(API_ENDPOINTS.LOAN_OFFERS.SINGLE(id));
    return response.data.loanOffer;
  }

  async createLoanOffer(data: LoanOfferCreateData): Promise<LoanOffer> {
    const response = await httpClient.post(API_ENDPOINTS.LOAN_OFFERS.BASE, data);
    return response.data.loanOffer;
  }

  async updateLoanOffer(
  id: string,
  data: Partial<LoanOfferCreateData>
): Promise<LoanOffer> {
  const response = await httpClient.put(API_ENDPOINTS.LOAN_OFFERS.SINGLE(id), data);
  return response.data.loanOffer;
}


  async deleteLoanOffer(id: string): Promise<{ message: string }> {
    const response = await httpClient.delete(API_ENDPOINTS.LOAN_OFFERS.SINGLE(id));
    return { message: response.data.message };
  }

  // Helper method to calculate monthly payment
  calculateMonthlyPayment(amount: number, interestRate: number, duration: number): number {
    const monthlyRate = interestRate / 100 / 12;
    const payment =
      (amount * monthlyRate * Math.pow(1 + monthlyRate, duration)) /
      (Math.pow(1 + monthlyRate, duration) - 1);
    return Math.round(payment * 100) / 100;
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
}

export const loanOfferService = new LoanOfferService();
