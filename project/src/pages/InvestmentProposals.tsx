import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useBusinessStore } from '../store/businessStore';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter,
  Search
} from 'lucide-react';
import { format } from 'date-fns';

const InvestmentProposals = () => {
  const { user } = useAuthStore();
  const {
    businessIdeas,
    investmentProposals,
    fetchBusinessIdeas,
    fetchInvestmentProposals,
    updateProposalStatus
  } = useBusinessStore();
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data on mount
  useEffect(() => {
    if (user?.role === 'business_person') {
      fetchBusinessIdeas();
    }
    fetchInvestmentProposals();
  }, [user, fetchBusinessIdeas, fetchInvestmentProposals]);

  const getRelevantProposals = () => {
  if (user?.role === 'investor') {
    return investmentProposals.filter(proposal => proposal.investorId?._id === user.id);
  } else if (user?.role === 'business_person') {
    const myBusinessIds = businessIdeas
.filter(idea => {
  if (typeof idea.userId === 'string') {
    return idea.userId === user?.id;
  }
  return idea.userId?._id === user?.id;
})
.map(idea => idea._id);

return investmentProposals.filter(proposal => {
  const businessIdeaId =
    typeof proposal.businessIdeaId === 'string'
      ? proposal.businessIdeaId
      : proposal.businessIdeaId?._id;
  return myBusinessIds.includes(businessIdeaId);
});

  }
  return investmentProposals;
};


  const filteredProposals = getRelevantProposals().filter(proposal => {
  const matchesStatus = filterStatus === 'all' || proposal.status === filterStatus;
  const businessIdeaId =
    typeof proposal.businessIdeaId === 'string'
      ? proposal.businessIdeaId
      : proposal.businessIdeaId?._id;
  const businessIdea = businessIdeas.find(idea => idea._id === businessIdeaId);
  const matchesSearch =
    businessIdea?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.investorId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  return matchesStatus && matchesSearch;
});


  const getBusinessIdea = (businessIdeaId: string) => {
  return businessIdeas.find(idea => idea._id === businessIdeaId);
};


  const handleStatusUpdate = (proposalId: string, status: 'accepted' | 'rejected') => {
    updateProposalStatus(proposalId, status);
    setShowDetailModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTotalInvestmentAmount = () => {
    return getRelevantProposals()
      .filter(p => p.status === 'accepted')
      .reduce((sum, proposal) => sum + proposal.amount, 0);
  };

  const getStats = () => {
    const proposals = getRelevantProposals();
    return {
      total: proposals.length,
      pending: proposals.filter(p => p.status === 'pending').length,
      accepted: proposals.filter(p => p.status === 'accepted').length,
      rejected: proposals.filter(p => p.status === 'rejected').length,
      totalAmount: getTotalInvestmentAmount(),
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {user?.role === 'investor' ? 'My Investment Proposals' : 'Investment Proposals'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {user?.role === 'investor' 
              ? 'Track your investment proposals and their status'
              : 'Review and manage investment proposals for your business ideas'
            }
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Proposals</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Pending</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.accepted}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Accepted</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rejected}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Rejected</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.totalAmount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {user?.role === 'investor' ? 'Invested' : 'Received'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search proposals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredProposals.map((proposal, index) => {
            const businessIdea = getBusinessIdea(
              typeof proposal.businessIdeaId === 'string'
                ? proposal.businessIdeaId
                : proposal.businessIdeaId?._id
            );
            
            return (
              <motion.div
                key={proposal._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => {
                  setSelectedProposal(proposal);
                  setShowDetailModal(true);
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {businessIdea?.title || 'Business Idea'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                       {user?.role === 'investor'
                        ? 'Your proposal'
                        : `Proposal from ${proposal.investorId?.name || 'Unknown'}`}
                      </p>

                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        ${proposal.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                        {proposal.type}
                      </p>
                    </div>
                    
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}>
                      {getStatusIcon(proposal.status)}
                      <span className="capitalize">{proposal.status}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <User className="w-4 h-4" />
                   <span>{proposal.investorId?.name || 'Unknown'}</span>

                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(proposal.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  
                  {proposal.interestRate && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <TrendingUp className="w-4 h-4" />
                      <span>{proposal.interestRate}% Interest</span>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                    {proposal.terms}
                  </p>
                </div>

                {user?.role === 'business_person' && proposal.status === 'pending' && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusUpdate(proposal._id, 'accepted');
                      }}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all"
                    >
                      Accept
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusUpdate(proposal._id, 'rejected');
                      }}
                      className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredProposals.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No investment proposals found
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {user?.role === 'investor' 
              ? 'You haven\'t made any investment proposals yet'
              : 'No investment proposals received for your business ideas'
            }
          </p>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedProposal && (
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
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Investment Proposal Details
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Business Idea
                  </h3>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {getBusinessIdea(selectedProposal.businessIdeaId)?.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    {getBusinessIdea(selectedProposal.businessIdeaId)?.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Investor
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedProposal.investorName}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Investment Amount
                      </label>
                      <p className="text-2xl font-bold text-green-600">
                        ${selectedProposal.amount.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Investment Type
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                        {selectedProposal.type}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedProposal.status)}`}>
                        {getStatusIcon(selectedProposal.status)}
                        <span className="capitalize">{selectedProposal.status}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Proposal Date
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {format(new Date(selectedProposal.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>

                    {selectedProposal.interestRate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Interest Rate
                        </label>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedProposal.interestRate}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Terms & Conditions
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedProposal.terms}
                    </p>
                  </div>
                </div>

                {user?.role === 'business_person' && selectedProposal.status === 'pending' && (
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => handleStatusUpdate(selectedProposal._id, 'accepted')}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
                    >
                      Accept Proposal
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedProposal._id, 'rejected')}
                      className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
                    >
                      Reject Proposal
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvestmentProposals;