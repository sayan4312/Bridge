import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useBusinessStore } from '../store/businessStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  X,
  Trash,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { businessIdeaService } from '../services/businessIdeaService';
import { useChatStore } from '../store/chatStore';

// Define the schema for business idea form validation
const businessIdeaSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Please select a category'),
  investmentNeeded: z.number().min(1000, 'Investment must be at least $1,000'),
});

type BusinessIdeaForm = z.infer<typeof businessIdeaSchema>;

const BusinessIdeas = () => {
  const { user, isAuthenticated } = useAuthStore();
  const {
    businessIdeas,
    myBusinessIdeas,
    createBusinessIdea,
    createInvestmentProposal,
    investmentProposals,
    fetchBusinessIdeas,
    fetchMyBusinessIdeas,
    fetchInvestmentProposals, // <-- Make sure this is in your store!
    businessIdeasLoading,
    businessIdeasError,
    reset,
  } = useBusinessStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentType, setInvestmentType] = useState('equity');
  const [investmentTerms, setInvestmentTerms] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const form = useForm<BusinessIdeaForm>({
    resolver: zodResolver(businessIdeaSchema),
    defaultValues: {
      category: 'Technology',
    },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      // Reset business store to clear stale data
      reset();
      if (user.role === 'business_person') {
        fetchMyBusinessIdeas(); // Fetch all user-specific ideas
      } else {
        fetchBusinessIdeas(); // Fetch all ideas
      }
    } else {
      // For unauthenticated users, fetch all ideas
      reset();
      fetchBusinessIdeas();
    }
    fetchInvestmentProposals(); // <-- Always fetch proposals on mount
  }, [isAuthenticated, user, fetchBusinessIdeas, fetchMyBusinessIdeas, fetchInvestmentProposals, reset]);

  const categories = [
    'All',
    'Technology',
    'Healthcare',
    'Finance',
    'Agriculture',
    'Education',
    'Manufacturing',
    'Retail',
    'Services',
    'Other',
  ];

  // Filter ideas based on search and category
  const filteredIdeas = (user?.role === 'business_person' ? myBusinessIdeas : businessIdeas).filter(
    (idea) => {
      const matchesSearch =
        idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' ||
        idea.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesStatus =
        selectedStatus === 'all' || idea.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    }
  );

  const onSubmit = async (data: BusinessIdeaForm) => {
    if (!user) {
      toast.error('Please log in to create a business idea');
      return;
    }
    if (user.role !== 'business_person') {
      toast.error('Only entrepreneurs can create business ideas');
      return;
    }

    try {
      const success = await createBusinessIdea({
        title: data.title,
        description: data.description,
        category: data.category,
        investmentNeeded: data.investmentNeeded,
      });
      if (success) {
        form.reset();
        setShowCreateModal(false);
      }
    } catch (error) {
      toast.error('Failed to create business idea');
    }
  };

  const handleInvestment = async () => {
    if (!user || !selectedIdea || !investmentAmount || !investmentTerms) {
      toast.error('Please fill in all investment details');
      return;
    }
    if (user.role !== 'investor') {
      toast.error('Only investors can submit investment proposals');
      return;
    }

    const payload: any = {
      businessIdeaId: selectedIdea._id,
      amount: parseInt(investmentAmount),
      type: investmentType,
      terms: investmentTerms,
    };

    if (investmentType === 'loan') {
      payload.interestRate = 8.5;
      payload.loanDuration = 12;
    }

    if (investmentType === 'equity') {
      payload.equityPercentage = 10;
    }

    try {
      const success = await createInvestmentProposal(payload);
      if (success) {
        await fetchInvestmentProposals(); // <-- Refresh proposals after creation
        toast.success('Proposal sent successfully');
        setShowInvestModal(false);
        setInvestmentAmount('');
        setInvestmentTerms('');
        setSelectedIdea(null);
      }
    } catch (error) {
      toast.error('Failed to send proposal');
    }
  };

  // Robust proposal-idea ID comparison
  const getProposalsForIdea = (ideaId: string) => {
    return investmentProposals.filter((proposal) => {
      if (!proposal.businessIdeaId) return false;
      const proposalIdeaId =
        typeof proposal.businessIdeaId === 'object' && proposal.businessIdeaId !== null
          ? proposal.businessIdeaId._id
          : proposal.businessIdeaId;
      return proposalIdeaId?.toString() === ideaId?.toString();
    });
  };

  const isMyIdea = (idea: any) =>
    user?.id ===
    (typeof idea.userId === 'object'
      ? idea.userId._id || idea.userId.id
      : idea.userId);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this idea?');
    if (!confirmed) return;

    try {
      await businessIdeaService.deleteBusinessIdea(id);
      toast.success('Business idea deleted');
      fetchBusinessIdeas(); 
    } catch (error) {
      toast.error('Failed to delete idea');
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {user?.role === 'business_person' ? 'My Business Ideas' : 'Browse Business Ideas'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {user?.role === 'business_person'
              ? 'Manage your business ideas and track investment proposals'
              : 'Discover innovative business opportunities to invest in'}
          </p>
        </div>

        {user?.role === 'business_person' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Post New Idea
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="absolute top-3 left-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search business ideas"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50"
          />
        </div>

        <div className="relative">
          <Filter className="absolute top-3 left-3 text-gray-400 w-5 h-5" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50"
          >
            {categories.map((cat) => (
              <option key={cat.toLowerCase()} value={cat.toLowerCase()}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {user?.role === 'business_person' && (
          <div className="relative">
            <Filter className="absolute top-3 left-3 text-gray-400 w-5 h-5" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="funded">Funded</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        )}
      </div>

      {/* Loading and Error States */}
      {businessIdeasLoading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-4">Loading...</p>
        </div>
      )}
      {businessIdeasError && (
        <div className="text-center py-12">
          <p className="text-red-500">{businessIdeasError}</p>
        </div>
      )}

      {/* Ideas Grid */}
      {!businessIdeasLoading && !businessIdeasError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredIdeas.map((idea) => (
              <motion.div
                key={idea._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                onClick={() => {
                  setSelectedIdea(idea);
                  setShowDetailModal(true);
                  fetchInvestmentProposals();
                }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg cursor-pointer transition hover:scale-[1.01]"
              >
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-3 py-1 rounded-full">
                    {idea.category}
                  </span>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      idea.status === 'active'
                        ? 'bg-green-500'
                        : idea.status === 'funded'
                        ? 'bg-blue-500'
                        : 'bg-gray-400'
                    }`}
                  ></div>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {idea.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 my-2">
                  {idea.description}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>${idea.investmentNeeded.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(idea.createdAt), 'MMM dd')}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <User className="w-4 h-4" />
                    <span>
                      {typeof idea.userId === 'object'
                        ? idea.userId.name || 'Anonymous'
                        : 'Anonymous'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>{getProposalsForIdea(idea._id).length} proposals</span>
                  </div>
                  
                  {user?.role === 'investor' && !isMyIdea(idea) && (
                    <div className="flex gap-2">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedIdea(idea);
                          setShowInvestModal(true);
                        }}
                        className="bg-green-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-green-700 transition"
                      >
                        Invest
                      </button>
                      <button
                        onClick={async e => {
                          e.stopPropagation();
                          // Find the user's proposal for this idea
                          const myProposal = getProposalsForIdea(idea._id).find(
                            (proposal) => {
                              const investorId = typeof proposal.investorId === 'object' ? proposal.investorId._id : proposal.investorId;
                              return investorId === user?.id;
                            }
                          );
                          if (!myProposal) {
                            toast.error('You must submit an investment proposal before starting a chat.');
                            return;
                          }
                          // Create or get chat room for this proposal
                          const created = await useChatStore.getState().createChatRoomFromProposal({ investmentProposalId: myProposal._id });
                          if (created) {
                            // Find the chat room just created or fetched
                            const chatRooms = useChatStore.getState().chatRooms;
                            const chatRoom = chatRooms.find(room => room.investmentProposalId?._id === myProposal._id);
                            if (chatRoom) {
                              useChatStore.getState().selectChatRoom(chatRoom);
                            }
                            window.location.href = '/chat';
                          } else {
                            toast.error('Failed to create or open chat room.');
                          }
                        }}
                        className="bg-blue-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition flex items-center gap-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Chat
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {!businessIdeasLoading && !businessIdeasError && filteredIdeas.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No business ideas found
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Try adjusting your search criteria or{' '}
            {user?.role === 'business_person' && 'create a new business idea'}
          </p>
        </div>
      )}

      {/* Create Business Idea Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Post New Business Idea
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    {...form.register('title')}
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
                    placeholder="Your idea's title"
                  />
                  {form.formState.errors.title && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    {...form.register('category')}
                    className="w-full px-4 py-3 rounded-xl border bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
                  >
                    {categories.slice(1).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.category && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.category.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Investment Needed ($)
                  </label>
                  <input
                    {...form.register('investmentNeeded', { valueAsNumber: true })}
                    type="number"
                    className="w-full px-4 py-3 rounded-xl border bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
                    placeholder="Enter amount"
                  />
                  {form.formState.errors.investmentNeeded && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.investmentNeeded.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    {...form.register('description')}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
                    placeholder="Explain your business idea in detail"
                  />
                  {form.formState.errors.description && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-md hover:scale-105 transition"
                  >
                    Post Idea
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Investment Modal */}
      <AnimatePresence>
        {showInvestModal && selectedIdea && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowInvestModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-xl w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Make Investment Proposal
                </h2>
                <button
                  onClick={() => setShowInvestModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <h3 className="font-semibold text-gray-900 dark:text-white">{selectedIdea.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Investment needed: ${selectedIdea.investmentNeeded.toLocaleString()}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Investment Amount ($)
                  </label>
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    placeholder="Enter your investment"
                    className="w-full px-4 py-3 rounded-xl border bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Investment Type
                  </label>
                  <select
                    value={investmentType}
                    onChange={(e) => setInvestmentType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
                  >
                    <option value="equity">Equity</option>
                    <option value="loan">Loan</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    value={investmentTerms}
                    onChange={(e) => setInvestmentTerms(e.target.value)}
                    rows={4}
                    placeholder="Describe your expectations..."
                    className="w-full px-4 py-3 rounded-xl border bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
                  />
                  {investmentTerms.length > 0 && investmentTerms.length < 10 && (
                    <div className="text-red-600 text-sm mt-1">
                      Terms must be at least 10 characters.
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    onClick={() => setShowInvestModal(false)}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInvestment}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-md hover:scale-105 transition"
                  >
                    Submit Proposal
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedIdea && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {selectedIdea.title}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Idea Description & Proposals */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      Description
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {selectedIdea.description}
                    </p>
                  </div>

                  {isMyIdea(selectedIdea) && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                        Investment Proposals ({getProposalsForIdea(selectedIdea._id).length})
                      </h3>
                      <div className="space-y-4">
                        {getProposalsForIdea(selectedIdea._id).map((proposal) => (
                          <div key={proposal._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                Investor ID: {proposal.investorId._id.slice(0, 8)}...
                              </h4>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  proposal.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : proposal.status === 'accepted'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {proposal.status}
                              </span>
                            </div>
                            <p className="text-green-600 font-semibold mb-2">
                              ${proposal.amount.toLocaleString()} - {proposal.type}
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">{proposal.terms}</p>
                          </div>
                        ))}
                        {getProposalsForIdea(selectedIdea._id).length === 0 && (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                            No investment proposals yet
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Sidebar Info */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Investment Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Amount Needed:</span>
                        <span className="font-semibold text-green-600">
                          ${selectedIdea.investmentNeeded.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Category:</span>
                        <span className="font-medium">{selectedIdea.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Status:</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedIdea.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : selectedIdea.status === 'funded'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {selectedIdea.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Business Owner
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedIdea.title.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Posted by: {typeof selectedIdea.userId === 'object' ? selectedIdea.userId?.name || 'Unknown User' : `User ${selectedIdea.userId.slice(0, 8)}`}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Business Person</p>
                      </div>
                    </div>
                  </div>

                  {user?.role === 'investor' && !isMyIdea(selectedIdea) && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowInvestModal(true);
                      }}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition"
                    >
                      Make Investment Proposal
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessIdeas;