import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { businessIdeaService, BusinessIdea, BusinessIdeaCreateData, BusinessIdeaFilters } from '../services/businessIdeaService';
import { investmentProposalService, InvestmentProposal, InvestmentProposalCreateData, InvestmentProposalFilters } from '../services/investmentProposalService';
import { loanOfferService, LoanOffer, LoanOfferCreateData, LoanOfferFilters } from '../services/loanOfferService';
import { consultationService, Consultation, ConsultationCreateData, ConsultationFilters } from '../services/consultationService';
import { logAction } from '../utils/logger';
import toast from 'react-hot-toast';
import { useAuthStore } from './authStore';

interface BusinessState {
  // Business Ideas
  businessIdeas: BusinessIdea[];
  myBusinessIdeas: BusinessIdea[];
  selectedBusinessIdea: BusinessIdea | null;
  businessIdeasLoading: boolean;
  businessIdeasError: string | null;

  // Investment Proposals
  investmentProposals: InvestmentProposal[];
  selectedInvestmentProposal: InvestmentProposal | null;
  investmentProposalsLoading: boolean;
  investmentProposalsError: string | null;

  // Loan Offers
  loanOffers: LoanOffer[];
  myLoanOffers: LoanOffer[];
  selectedLoanOffer: LoanOffer | null;
  loanOffersLoading: boolean;
  loanOffersError: string | null;

  // Consultations
  consultations: Consultation[];
  myConsultations: Consultation[];
  selectedConsultation: Consultation | null;
  consultationsLoading: boolean;
  consultationsError: string | null;

  // Business Ideas Actions
  fetchBusinessIdeas: (filters?: BusinessIdeaFilters) => Promise<void>;
  fetchBusinessIdea: (id: string) => Promise<void>;
  fetchMyBusinessIdeas: (filters?: BusinessIdeaFilters) => Promise<void>;
  createBusinessIdea: (data: BusinessIdeaCreateData) => Promise<boolean>;
  updateBusinessIdea: (id: string, data: Partial<BusinessIdeaCreateData>) => Promise<boolean>;
  deleteBusinessIdea: (id: string) => Promise<boolean>;
  toggleLikeBusinessIdea: (id: string) => Promise<void>;

  // Investment Proposals Actions
  fetchInvestmentProposals: (filters?: InvestmentProposalFilters) => Promise<void>;
  fetchInvestmentProposal: (id: string) => Promise<void>;
  createInvestmentProposal: (data: InvestmentProposalCreateData) => Promise<boolean>;
  updateProposalStatus: (id: string, status: 'accepted' | 'rejected', responseMessage?: string) => Promise<boolean>;
  withdrawProposal: (id: string) => Promise<boolean>;
  fetchProposalsForBusinessIdea: (businessIdeaId: string, filters?: InvestmentProposalFilters) => Promise<void>;

  // Loan Offers Actions
  fetchLoanOffers: (filters?: LoanOfferFilters) => Promise<void>;
  fetchLoanOffer: (id: string) => Promise<void>;
  fetchMyLoanOffers: (filters?: LoanOfferFilters) => Promise<void>;
  createLoanOffer: (data: LoanOfferCreateData) => Promise<boolean>;
  updateLoanOffer: (id: string, data: Partial<LoanOfferCreateData> & { status?: 'active' | 'inactive' }) => Promise<boolean>;
  deleteLoanOffer: (id: string) => Promise<boolean>;

  // Consultations Actions
  fetchConsultations: (filters?: ConsultationFilters) => Promise<void>;
  fetchConsultation: (id: string) => Promise<void>;
  fetchMyConsultations: (filters?: ConsultationFilters) => Promise<void>;
  createConsultation: (data: ConsultationCreateData) => Promise<boolean>;
  updateConsultation: (id: string, data: Partial<ConsultationCreateData>) => Promise<boolean>;
  deleteConsultation: (id: string) => Promise<boolean>;
  toggleLikeConsultation: (id: string) => Promise<void>;
  addComment: (id: string, content: string) => Promise<boolean>;

  // Utility actions
  clearErrors: () => void;
  reset: () => void;
  setSelectedBusinessIdea: (idea: BusinessIdea | null) => void;
  setSelectedInvestmentProposal: (proposal: InvestmentProposal | null) => void;
  setSelectedLoanOffer: (offer: LoanOffer | null) => void;
  setSelectedConsultation: (consultation: Consultation | null) => void;
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      // Initial state
      businessIdeas: [],
      myBusinessIdeas: [],
      selectedBusinessIdea: null,
      businessIdeasLoading: false,
      businessIdeasError: null,

      investmentProposals: [],
      selectedInvestmentProposal: null,
      investmentProposalsLoading: false,
      investmentProposalsError: null,

      loanOffers: [],
      myLoanOffers: [],
      selectedLoanOffer: null,
      loanOffersLoading: false,
      loanOffersError: null,

      consultations: [],
      myConsultations: [],
      selectedConsultation: null,
      consultationsLoading: false,
      consultationsError: null,

      // Business Ideas Actions
      fetchBusinessIdeas: async (filters?: BusinessIdeaFilters) => {
        set({ businessIdeasLoading: true, businessIdeasError: null });

        try {
          const response = await businessIdeaService.getBusinessIdeas(filters);

          if (response.success) {
            set({
              businessIdeas: response.data.businessIdeas,
              businessIdeasLoading: false,
            });
          } else {
            set({
              businessIdeasError: 'Failed to fetch business ideas',
              businessIdeasLoading: false,
            });
          }
        } catch (error: any) {
          set({
            businessIdeasError: error.message || 'Failed to fetch business ideas',
            businessIdeasLoading: false,
          });
        }
      },

      fetchBusinessIdea: async (id: string) => {
        set({ businessIdeasLoading: true, businessIdeasError: null });

        try {
          const response = await businessIdeaService.getBusinessIdea(id);

          if (response.success) {
            set({
              selectedBusinessIdea: response.data.businessIdea,
              businessIdeasLoading: false,
            });
          } else {
            set({
              businessIdeasError: 'Business idea not found',
              businessIdeasLoading: false,
            });
          }
        } catch (error: any) {
          set({
            businessIdeasError: error.message || 'Failed to fetch business idea',
            businessIdeasLoading: false,
          });
        }
      },

      fetchMyBusinessIdeas: async (filters?: BusinessIdeaFilters) => {
        const user = useAuthStore.getState().user;
        if (!user || user.role !== 'business_person') {
          set({
            myBusinessIdeas: [],
            businessIdeasLoading: false,
            businessIdeasError: user ? 'Only entrepreneurs can view their own business ideas' : 'Please log in',
          });
          toast.error(user ? 'Only entrepreneurs can view their own business ideas' : 'Please log in');
          return;
        }

        set({ businessIdeasLoading: true, businessIdeasError: null });

        try {
          const response = await businessIdeaService.getMyBusinessIdeas(filters);

          if (response.success) {
            set({
              myBusinessIdeas: response.data.businessIdeas,
              businessIdeasLoading: false,
            });
          } else {
            set({
              businessIdeasError: 'Failed to fetch your business ideas',
              businessIdeasLoading: false,
            });
          }
        } catch (error: any) {
          set({
            businessIdeasError: error.message || 'Failed to fetch your business ideas',
            businessIdeasLoading: false,
          });
        }
      },

      createBusinessIdea: async (data: BusinessIdeaCreateData) => {
        const user = useAuthStore.getState().user;
        if (!user || user.role !== 'business_person') {
          toast.error('Only entrepreneurs can create business ideas');
          return false;
        }

        try {
          const response = await businessIdeaService.createBusinessIdea(data);

          if (response.success) {
            set((state) => ({
              businessIdeas: [response.data.businessIdea, ...state.businessIdeas],
              myBusinessIdeas: [response.data.businessIdea, ...state.myBusinessIdeas],
            }));

            logAction('BUSINESS_IDEA_CREATED', {
              ideaId: response.data.businessIdea._id,
              title: response.data.businessIdea.title,
            });

            toast.success('Business idea created successfully!');
            return true;
          } else {
            toast.error('Failed to create business idea');
            return false;
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to create business idea');
          return false;
        }
      },

      updateBusinessIdea: async (id: string, data: Partial<BusinessIdeaCreateData>) => {
        const user = useAuthStore.getState().user;
        if (!user || user.role !== 'business_person') {
          toast.error('Only entrepreneurs can update business ideas');
          return false;
        }

        try {
          const response = await businessIdeaService.updateBusinessIdea(id, data);

          if (response.success) {
            set((state) => ({
              businessIdeas: state.businessIdeas.map((idea) =>
                idea._id === id ? response.data.businessIdea : idea
              ),
              myBusinessIdeas: state.myBusinessIdeas.map((idea) =>
                idea._id === id ? response.data.businessIdea : idea
              ),
              selectedBusinessIdea: state.selectedBusinessIdea?._id === id
                ? response.data.businessIdea
                : state.selectedBusinessIdea,
            }));

            logAction('BUSINESS_IDEA_UPDATED', { ideaId: id });

            toast.success('Business idea updated successfully!');
            return true;
          } else {
            toast.error('Failed to update business idea');
            return false;
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to update business idea');
          return false;
        }
      },

      deleteBusinessIdea: async (id: string) => {
        const user = useAuthStore.getState().user;
        if (!user || user.role !== 'business_person') {
          toast.error('Only entrepreneurs can delete business ideas');
          return false;
        }

        try {
          const response = await businessIdeaService.deleteBusinessIdea(id);

          if (response.success) {
            set((state) => ({
              businessIdeas: state.businessIdeas.filter((idea) => idea._id !== id),
              myBusinessIdeas: state.myBusinessIdeas.filter((idea) => idea._id !== id),
              selectedBusinessIdea: state.selectedBusinessIdea?._id === id
                ? null
                : state.selectedBusinessIdea,
            }));

            logAction('BUSINESS_IDEA_DELETED', { ideaId: id });

            toast.success('Business idea deleted successfully!');
            return true;
          } else {
            toast.error('Failed to delete business idea');
            return false;
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to delete business idea');
          return false;
        }
      },

      toggleLikeBusinessIdea: async (id: string) => {
        try {
          const response = await businessIdeaService.toggleLike(id);

          if (response.success) {
            const updateLikes = (idea: BusinessIdea) => {
              if (idea._id === id) {
                return {
                  ...idea,
                  likes: response.data.liked
                    ? [...idea.likes, { user: 'current-user', createdAt: new Date().toISOString() }]
                    : idea.likes.slice(0, -1),
                };
              }
              return idea;
            };

            set((state) => ({
              businessIdeas: state.businessIdeas.map(updateLikes),
              myBusinessIdeas: state.myBusinessIdeas.map(updateLikes),
              selectedBusinessIdea: state.selectedBusinessIdea?._id === id
                ? updateLikes(state.selectedBusinessIdea)
                : state.selectedBusinessIdea,
            }));

            logAction(response.data.liked ? 'LIKE_BUSINESS_IDEA' : 'UNLIKE_BUSINESS_IDEA', {
              ideaId: id,
            });
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to update like');
        }
      },

      // Investment Proposals Actions
      fetchInvestmentProposals: async (filters?: InvestmentProposalFilters) => {
        set({ investmentProposalsLoading: true, investmentProposalsError: null });

        try {
          const response = await investmentProposalService.getInvestmentProposals(filters);

          if (response.success) {
            set({
              investmentProposals: response.data.proposals,
              investmentProposalsLoading: false,
            });
          } else {
            set({
              investmentProposalsError: 'Failed to fetch investment proposals',
              investmentProposalsLoading: false,
            });
          }
        } catch (error: any) {
          set({
            investmentProposalsError: error.message || 'Failed to fetch investment proposals',
            investmentProposalsLoading: false,
          });
        }
      },

      fetchInvestmentProposal: async (id: string) => {
        set({ investmentProposalsLoading: true, investmentProposalsError: null });

        try {
          const response = await investmentProposalService.getInvestmentProposal(id);

          if (response.success) {
            set({
              selectedInvestmentProposal: response.data.proposal,
              investmentProposalsLoading: false,
            });
          } else {
            set({
              investmentProposalsError: 'Investment proposal not found',
              investmentProposalsLoading: false,
            });
          }
        } catch (error: any) {
          set({
            investmentProposalsError: error.message || 'Failed to fetch investment proposal',
            investmentProposalsLoading: false,
          });
        }
      },

      createInvestmentProposal: async (data: InvestmentProposalCreateData) => {
        const user = useAuthStore.getState().user;
        if (!user || user.role !== 'investor') {
          toast.error('Only investors can create investment proposals');
          return false;
        }

        try {
          const response = await investmentProposalService.createInvestmentProposal(data);

          if (response.success) {
            set((state) => ({
              investmentProposals: [response.data.proposal, ...state.investmentProposals],
            }));

            logAction('INVESTMENT_PROPOSAL_CREATED', {
              proposalId: response.data.proposal._id,
              businessIdeaId: data.businessIdeaId,
            });

            toast.success('Investment proposal submitted successfully!');
            return true;
          } else {
            toast.error('Failed to create investment proposal');
            return false;
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to create investment proposal');
          return false;
        }
      },

      updateProposalStatus: async (id: string, status: 'accepted' | 'rejected', responseMessage?: string) => {
        try {
          const response = await investmentProposalService.updateProposalStatus(id, status, responseMessage);

          if (response.success) {
            set((state) => ({
              investmentProposals: state.investmentProposals.map((proposal) =>
                proposal._id === id ? response.data.proposal : proposal
              ),
              selectedInvestmentProposal: state.selectedInvestmentProposal?._id === id
                ? response.data.proposal
                : state.selectedInvestmentProposal,
            }));

            logAction('INVESTMENT_PROPOSAL_STATUS_UPDATED', { proposalId: id, status });
            toast.success(`Proposal ${status} successfully!`);
            return true;
          } else {
            toast.error('Failed to update proposal status');
            return false;
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to update proposal status');
          return false;
        }
      },

      withdrawProposal: async (id: string) => {
        try {
          const response = await investmentProposalService.withdrawProposal(id);

          if (response.success) {
            set((state) => ({
              investmentProposals: state.investmentProposals.map((proposal) =>
                proposal._id === id ? { ...proposal, status: 'withdrawn' as const } : proposal
              ),
            }));

            logAction('INVESTMENT_PROPOSAL_WITHDRAWN', { proposalId: id });
            toast.success('Proposal withdrawn successfully!');
            return true;
          } else {
            toast.error('Failed to withdraw proposal');
            return false;
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to withdraw proposal');
          return false;
        }
      },

      fetchProposalsForBusinessIdea: async (businessIdeaId: string, filters?: InvestmentProposalFilters) => {
        set({ investmentProposalsLoading: true, investmentProposalsError: null });

        try {
          const response = await investmentProposalService.getProposalsForBusinessIdea(businessIdeaId, filters);

          if (response.success) {
            set({
              investmentProposals: response.data.proposals,
              investmentProposalsLoading: false,
            });
          } else {
            set({
              investmentProposalsError: 'Failed to fetch proposals',
              investmentProposalsLoading: false,
            });
          }
        } catch (error: any) {
          set({
            investmentProposalsError: error.message || 'Failed to fetch proposals',
            investmentProposalsLoading: false,
          });
        }
      },

      // Loan Offers Actions
fetchLoanOffers: async (filters?: LoanOfferFilters) => {
  set({ loanOffersLoading: true, loanOffersError: null });

  try {
    const response = await loanOfferService.getLoanOffers(filters);

    set({
      loanOffers: response.loanOffers,
      loanOffersLoading: false,
    });
  } catch (error: any) {
    set({
      loanOffersError: error.message || 'Failed to fetch loan offers',
      loanOffersLoading: false,
    });
  }
},

fetchLoanOffer: async (id: string) => {
  set({ loanOffersLoading: true, loanOffersError: null });

  try {
    const loanOffer = await loanOfferService.getLoanOffer(id);

    set({
      selectedLoanOffer: loanOffer,
      loanOffersLoading: false,
    });
  } catch (error: any) {
    set({
      loanOffersError: error.message || 'Failed to fetch loan offer',
      loanOffersLoading: false,
    });
  }
},

fetchMyLoanOffers: async (filters?: LoanOfferFilters) => {
  const user = useAuthStore.getState().user;

  if (!user || user.role !== 'banker') {
    set({
      myLoanOffers: [],
      loanOffersLoading: false,
      loanOffersError: user
        ? 'Only bankers can view their own loan offers'
        : 'Please log in',
    });

    toast.error(
      user
        ? 'Only bankers can view their own loan offers'
        : 'Please log in'
    );
    return;
  }

  set({ loanOffersLoading: true, loanOffersError: null });

  try {
    const response = await loanOfferService.getMyLoanOffers(filters);

    set({
      myLoanOffers: response.loanOffers,
      loanOffersLoading: false,
    });
  } catch (error: any) {
    set({
      loanOffersError: error.message || 'Failed to fetch your loan offers',
      loanOffersLoading: false,
    });
  }
},

createLoanOffer: async (data: LoanOfferCreateData) => {
  const user = useAuthStore.getState().user;
  if (!user || user.role !== 'banker') {
    toast.error('Only bankers can create loan offers');
    return false;
  }

  try {
    const newLoanOffer = await loanOfferService.createLoanOffer(data);

    set((state) => ({
      loanOffers: [newLoanOffer, ...state.loanOffers],
      myLoanOffers: [newLoanOffer, ...state.myLoanOffers],
    }));

    logAction('LOAN_OFFER_CREATED', {
      offerId: newLoanOffer._id,
      amount: newLoanOffer.amount,
    });

    toast.success('Loan offer created successfully!');
    return true;
  } catch (error: any) {
    toast.error(error.message || 'Failed to create loan offer');
    return false;
  }
},

updateLoanOffer: async (
  id: string,
  data: Partial<LoanOfferCreateData> & { status?: 'active' | 'inactive' }
): Promise<boolean> => {
  const user = useAuthStore.getState().user;

  if (!user || user.role !== 'banker') {
    toast.error('Only bankers can update loan offers');
    return false;
  }

  try {
    const updatedLoanOffer = await loanOfferService.updateLoanOffer(id, data);

    set((state) => ({
      loanOffers: state.loanOffers.map((offer) =>
        offer._id === id ? updatedLoanOffer : offer
      ),
      myLoanOffers: state.myLoanOffers.map((offer) =>
        offer._id === id ? updatedLoanOffer : offer
      ),
      selectedLoanOffer:
        state.selectedLoanOffer?._id === id
          ? updatedLoanOffer
          : state.selectedLoanOffer,
    }));

    logAction('LOAN_OFFER_UPDATED', { offerId: id });

    toast.success('Loan offer updated successfully!');
    return true;
  } catch (error: any) {
    toast.error(error.message || 'Failed to update loan offer');
    return false;
  }
},


deleteLoanOffer: async (id: string) => {
  const user = useAuthStore.getState().user;
  if (!user || user.role !== 'banker') {
    toast.error('Only bankers can delete loan offers');
    return false;
  }

  try {
    await loanOfferService.deleteLoanOffer(id);

    set((state) => ({
      loanOffers: state.loanOffers.filter((offer) => offer._id !== id),
      myLoanOffers: state.myLoanOffers.filter((offer) => offer._id !== id),
      selectedLoanOffer:
        state.selectedLoanOffer?._id === id ? null : state.selectedLoanOffer,
    }));

    logAction('LOAN_OFFER_DELETED', { offerId: id });

    toast.success('Loan offer deleted successfully!');
    return true;
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete loan offer');
    return false;
  }
},

      // Consultations Actions
      fetchConsultations: async (filters?: ConsultationFilters) => {
        set({ consultationsLoading: true, consultationsError: null });

        try {
          const response = await consultationService.getConsultations(filters);

          if (response.success) {
            set({
              consultations: response.data.consultations,
              consultationsLoading: false,
            });
          } else {
            set({
              consultationsError: 'Failed to fetch consultations',
              consultationsLoading: false,
            });
          }
        } catch (error: any) {
          set({
            consultationsError: error.message || 'Failed to fetch consultations',
            consultationsLoading: false,
          });
        }
      },

      fetchConsultation: async (id: string) => {
        set({ consultationsLoading: true, consultationsError: null });

        try {
          const response = await consultationService.getConsultation(id);

          if (response.success) {
            set({
              selectedConsultation: response.data.consultation,
              consultationsLoading: false,
            });
          } else {
            set({
              consultationsError: 'Consultation not found',
              consultationsLoading: false,
            });
          }
        } catch (error: any) {
          set({
            consultationsError: error.message || 'Failed to fetch consultation',
            consultationsLoading: false,
          });
        }
      },

      fetchMyConsultations: async (filters?: ConsultationFilters) => {
        const user = useAuthStore.getState().user;
        if (!user || user.role !== 'business_advisor') {
          set({
            myConsultations: [],
            consultationsLoading: false,
            consultationsError: user ? 'Only business advisors can view their own consultations' : 'Please log in',
          });
          toast.error(user ? 'Only business advisors can view their own consultations' : 'Please log in');
          return;
        }

        set({ consultationsLoading: true, consultationsError: null });

        try {
          const response = await consultationService.getMyConsultations(filters);

          if (response.success) {
            set({
              myConsultations: response.data.consultations,
              consultationsLoading: false,
            });
          } else {
            set({
              consultationsError: 'Failed to fetch your consultations',
              consultationsLoading: false,
            });
          }
        } catch (error: any) {
          set({
            consultationsError: error.message || 'Failed to fetch your consultations',
            consultationsLoading: false,
          });
        }
      },

      createConsultation: async (data: ConsultationCreateData) => {
        const user = useAuthStore.getState().user;
        if (!user || user.role !== 'business_advisor') {
          toast.error('Only business advisors can create consultations');
          return false;
        }

        try {
          const response = await consultationService.createConsultation(data);

          if (response.success) {
            set((state) => ({
              consultations: [response.data.consultation, ...state.consultations],
              myConsultations: [response.data.consultation, ...state.myConsultations],
            }));

            logAction('CONSULTATION_CREATED', {
              consultationId: response.data.consultation._id,
              title: response.data.consultation.title,
            });

            toast.success('Consultation created successfully!');
            return true;
          } else {
            toast.error('Failed to create consultation');
            return false;
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to create consultation');
          return false;
        }
      },

      updateConsultation: async (id: string, data: Partial<ConsultationCreateData>) => {
        const user = useAuthStore.getState().user;
        if (!user || user.role !== 'business_advisor') {
          toast.error('Only business advisors can update consultations');
          return false;
        }

        try {
          const response = await consultationService.updateConsultation(id, data);

          if (response.success) {
            set((state) => ({
              consultations: state.consultations.map((consultation) =>
                consultation._id === id ? response.data.consultation : consultation
              ),
              myConsultations: state.myConsultations.map((consultation) =>
                consultation._id === id ? response.data.consultation : consultation
              ),
              selectedConsultation: state.selectedConsultation?._id === id
                ? response.data.consultation
                : state.selectedConsultation,
            }));

            logAction('CONSULTATION_UPDATED', { consultationId: id });

            toast.success('Consultation updated successfully!');
            return true;
          } else {
            toast.error('Failed to update consultation');
            return false;
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to update consultation');
          return false;
        }
      },

      deleteConsultation: async (id: string) => {
        const user = useAuthStore.getState().user;
        if (!user || user.role !== 'business_advisor') {
          toast.error('Only business advisors can delete consultations');
          return false;
        }

        try {
          const response = await consultationService.deleteConsultation(id);

          if (response.success) {
            set((state) => ({
              consultations: state.consultations.filter((consultation) => consultation._id !== id),
              myConsultations: state.myConsultations.filter((consultation) => consultation._id !== id),
              selectedConsultation: state.selectedConsultation?._id === id
                ? null
                : state.selectedConsultation,
            }));

            logAction('CONSULTATION_DELETED', { consultationId: id });

            toast.success('Consultation deleted successfully!');
            return true;
          } else {
            toast.error('Failed to delete consultation');
            return false;
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to delete consultation');
          return false;
        }
      },

      toggleLikeConsultation: async (id: string) => {
        try {
          const response = await consultationService.toggleLike(id);

          if (response.success) {
            const updateLikes = (consultation: Consultation) => {
              if (consultation._id === id) {
                return {
                  ...consultation,
                  likes: response.data.liked
                    ? [...consultation.likes, { user: 'current-user', createdAt: new Date().toISOString() }]
                    : consultation.likes.slice(0, -1),
                };
              }
              return consultation;
            };

            set((state) => ({
              consultations: state.consultations.map(updateLikes),
              myConsultations: state.myConsultations.map(updateLikes),
              selectedConsultation: state.selectedConsultation?._id === id
                ? updateLikes(state.selectedConsultation)
                : state.selectedConsultation,
            }));

            logAction(response.data.liked ? 'LIKE_CONSULTATION' : 'UNLIKE_CONSULTATION', {
              consultationId: id,
            });
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to update like');
        }
      },

      addComment: async (id: string, content: string) => {
        try {
          const response = await consultationService.addComment(id, content);

          if (response.success) {
            set((state) => ({
              consultations: state.consultations.map((consultation) =>
                consultation._id === id ? response.data.consultation : consultation
              ),
              myConsultations: state.myConsultations.map((consultation) =>
                consultation._id === id ? response.data.consultation : consultation
              ),
              selectedConsultation: state.selectedConsultation?._id === id
                ? response.data.consultation
                : state.selectedConsultation,
            }));

            logAction('COMMENT_CREATED', { consultationId: id, content });

            toast.success('Comment added successfully!');
            return true;
          } else {
            toast.error('Failed to add comment');
            return false;
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to add comment');
          return false;
        }
      },

      // Utility actions
      clearErrors: () => {
        set({
          businessIdeasError: null,
          investmentProposalsError: null,
          loanOffersError: null,
          consultationsError: null,
        });
      },

      reset: () => {
        set({
          businessIdeas: [],
          myBusinessIdeas: [],
          selectedBusinessIdea: null,
          businessIdeasLoading: false,
          businessIdeasError: null,
          investmentProposals: [],
          selectedInvestmentProposal: null,
          investmentProposalsLoading: false,
          investmentProposalsError: null,
          loanOffers: [],
          myLoanOffers: [],
          selectedLoanOffer: null,
          loanOffersLoading: false,
          loanOffersError: null,
          consultations: [],
          myConsultations: [],
          selectedConsultation: null,
          consultationsLoading: false,
          consultationsError: null,
        });
      },

      setSelectedBusinessIdea: (idea) => {
        set({ selectedBusinessIdea: idea });
      },

      setSelectedInvestmentProposal: (proposal) => {
        set({ selectedInvestmentProposal: proposal });
      },

      setSelectedLoanOffer: (offer) => {
        set({ selectedLoanOffer: offer });
      },

      setSelectedConsultation: (consultation) => {
        set({ selectedConsultation: consultation });
      },
    }),
    {
      name: 'business-storage',
      partialize: (state) => ({
        selectedBusinessIdea: state.selectedBusinessIdea,
        selectedInvestmentProposal: state.selectedInvestmentProposal,
        selectedLoanOffer: state.selectedLoanOffer,
        selectedConsultation: state.selectedConsultation,
      }),
    }
  )
);