import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useBusinessStore } from '../store/businessStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Building2,
  DollarSign,
  Calendar,
  TrendingUp,
  Search,
  Filter,
  X,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';


const loanOfferSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  amount: z.number().min(1000, 'Loan amount must be at least $1,000'),
  interestRate: z.number().min(0.1).max(50, 'Interest rate must be between 0.1% and 50%'),
  duration: z.number().min(1).max(360, 'Duration must be between 1 and 360 months'),
  conditions: z.string().min(10, 'Conditions must be at least 10 characters'),
});

type LoanOfferForm = z.infer<typeof loanOfferSchema>;

const LoanOffers = () => {
  const { user, isAuthenticated } = useAuthStore();
  const {
    loanOffers,
    myLoanOffers,
    fetchLoanOffers,
    fetchMyLoanOffers,
    createLoanOffer,
    updateLoanOffer,
    loanOffersLoading,
    loanOffersError,
    reset,
  } = useBusinessStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<"active" | "inactive" | "suspended" | "all">('all');

  const form = useForm<LoanOfferForm>({
    resolver: zodResolver(loanOfferSchema),
    defaultValues: {
      amount: 1000,
      interestRate: 0.1,
      duration: 1,
      conditions: '',
    },
  });

  
  useEffect(() => {
    if (isAuthenticated && user) {
      reset(); // Clear stale state
      if (user.role === 'banker') {
        fetchMyLoanOffers({ status: filterStatus }); 
      } else {
        fetchLoanOffers({ status: filterStatus }); 
      }
    } else {
      reset();
      fetchLoanOffers({ status: filterStatus }); 
    }
  }, [isAuthenticated, user, filterStatus, fetchLoanOffers, fetchMyLoanOffers, reset]);

  const filteredOffers = (user?.role === 'banker' ? myLoanOffers : loanOffers).filter((offer) => {
    const matchesSearch =
      (user?.name || 'Bank').toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.conditions.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || offer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const onSubmit = async (data: LoanOfferForm) => {
  if (!user) {
    toast.error('Please log in to create a loan offer');
    return;
  }

  try {
    const success = await createLoanOffer(data); 
    if (success) {
      form.reset();
      setShowCreateModal(false);
      toast.success('Loan offer created successfully!');
    }
  } catch (error) {
    toast.error('Failed to create loan offer');
  }
};

 const toggleOfferStatus = async (offerId: string, currentStatus: string) => {
  try {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    
    const offer = (user?.role === 'banker' ? myLoanOffers : loanOffers).find(o => o._id === offerId);
    if (!offer) {
      toast.error('Offer not found');
      return;
    }

    // Send all required fields for update
    const success = await updateLoanOffer(offerId, {
      title: offer.title,
      amount: offer.amount,
      interestRate: offer.interestRate,
      duration: offer.duration,
      conditions: offer.conditions,
      status: newStatus,
    });

    if (success) {
      toast.success(`Loan offer ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
    } else {
      toast.error('Could not update loan offer status.');
    }
  } catch (error) {
    toast.error('Failed to update loan offer status');
  }
};


  const calculateMonthlyPayment = (amount: number, rate: number, duration: number) => {
    const monthlyRate = rate / 100 / 12;
    const payment =
      (amount * monthlyRate * Math.pow(1 + monthlyRate, duration)) /
      (Math.pow(1 + monthlyRate, duration) - 1);
    return payment;
  };

  const getStats = () => {
    const offers = user?.role === 'banker' ? myLoanOffers : loanOffers;
    return {
      total: offers.length,
      active: offers.filter((o) => o.status === 'active').length,
      totalAmount: offers.reduce((sum, offer) => sum + offer.amount, 0),
      avgInterest: offers.length > 0
        ? offers.reduce((sum, offer) => sum + offer.interestRate, 0) / offers.length
        : 0,
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {user?.role === 'banker' ? 'My Loan Offers' : 'Available Loan Offers'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {user?.role === 'banker'
              ? 'Manage your loan offers and track applications'
              : 'Browse available loan offers from verified banks'}
          </p>
        </div>

        {user?.role === 'banker' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Loan Offer
          </button>
        )}
      </div>

      {/* Loading and Error States */}
      {loanOffersLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300">Loading loan offers...</p>
        </div>
      )}
      {loanOffersError && (
        <div className="text-center py-12">
          <p className="text-red-500">{loanOffersError}</p>
        </div>
      )}

      {/* Stats Cards */}
      {!loanOffersLoading && !loanOffersError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Offers</p>
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
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Active Offers</p>
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
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${stats.totalAmount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Amount</p>
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
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.avgInterest.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Avg Interest</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Search and Filter */}
      {!loanOffersLoading && !loanOffersError && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search loan offers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "active" | "inactive" | "suspended" | "all")}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Loan Offers Grid */}
      {!loanOffersLoading && !loanOffersError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredOffers.map((offer, index) => (
              <motion.div
                key={offer._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => {
                  setSelectedOffer(offer);
                  setShowDetailModal(true);
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {typeof offer.bankerId === 'object'
    ? offer.bankerId.name
    : 'Bank'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Bank Loan Officer</p>
                    </div>
                  </div>

                  <div
                    className={`w-3 h-3 rounded-full ${offer.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}
                  />
                </div>

                <div className="space-y-4">
                  <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl">
                    <p className="text-3xl font-bold text-green-600 mb-1">
                      ${offer.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Loan Amount Available</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{offer.interestRate}%</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Interest Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{offer.duration}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Months</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{offer.conditions}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(offer.createdAt), 'MMM dd')}</span>
                    </div>

                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      ~${calculateMonthlyPayment(offer.amount, offer.interestRate, offer.duration).toLocaleString()}/mo
                    </div>
                  </div>

                  {user?.role === 'banker' &&
  ((typeof offer.bankerId === 'object'
    ? offer.bankerId._id
    : offer.bankerId) === user?.id) && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      toggleOfferStatus(offer._id, offer.status);
    }}
    className={`w-full px-4 py-2 rounded-xl font-medium transition-all ${
      offer.status === 'active'
        ? 'bg-red-100 text-red-600 hover:bg-red-200'
        : 'bg-green-100 text-green-600 hover:bg-green-200'
    }`}
  >
    {offer.status === 'active' ? 'Deactivate' : 'Activate'}
  </button>
)}

                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!loanOffersLoading && !loanOffersError && filteredOffers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No loan offers found
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {user?.role === 'banker'
              ? 'Create your first loan offer to help businesses grow'
              : 'No loan offers available at the moment'}
          </p>
        </div>
      )}

      {/* Create Loan Offer Modal */}
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Loan Offer</h2>
          <button
            onClick={() => setShowCreateModal(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* 🔹 New Title Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              {...form.register('title')}
              type="text"
              placeholder="Enter loan title"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {form.formState.errors.title && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Loan Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Loan Amount ($)
            </label>
            <input
              {...form.register('amount', { valueAsNumber: true })}
              type="number"
              placeholder="Enter loan amount"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {form.formState.errors.amount && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interest Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interest Rate (%)
              </label>
              <input
                {...form.register('interestRate', { valueAsNumber: true })}
                type="number"
                step="0.1"
                placeholder="Enter interest rate"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {form.formState.errors.interestRate && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.interestRate.message}</p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (Months)
              </label>
              <input
                {...form.register('duration', { valueAsNumber: true })}
                type="number"
                placeholder="Enter duration in months"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {form.formState.errors.duration && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.duration.message}</p>
              )}
            </div>
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Terms & Conditions
            </label>
            <textarea
              {...form.register('conditions')}
              rows={6}
              placeholder="Describe the loan terms, requirements, and conditions..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {form.formState.errors.conditions && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.conditions.message}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
            >
              Create Loan Offer
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>


      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedOffer && (
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Loan Offer Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {user?.name || 'Bank'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">Bank Loan Officer</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Loan Amount
                      </label>
                      <p className="text-3xl font-bold text-green-600">
                        ${selectedOffer.amount.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Interest Rate
                      </label>
                      <p className="text-2xl font-bold text-blue-600">{selectedOffer.interestRate}%</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Duration
                      </label>
                      <p className="text-2xl font-bold text-purple-600">{selectedOffer.duration} months</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Monthly Payment
                      </label>
                      <p className="text-2xl font-bold text-orange-600">
                        $
                        {calculateMonthlyPayment(
                          selectedOffer.amount,
                          selectedOffer.interestRate,
                          selectedOffer.duration
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Total Payback
                      </label>
                      <p className="text-2xl font-bold text-red-600">
                        $
                        {(
                          calculateMonthlyPayment(
                            selectedOffer.amount,
                            selectedOffer.interestRate,
                            selectedOffer.duration
                          ) * selectedOffer.duration
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                          selectedOffer.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}
                      >
                        {selectedOffer.status === 'active' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                        <span className="capitalize">{selectedOffer.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Terms & Conditions
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedOffer.conditions}</p>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    <strong>Note:</strong> This is a demo application. In a real scenario, you would need to contact
                    the bank directly to apply for this loan.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                  {user?.role !== 'banker' && selectedOffer.status === 'active' && (
                    <button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
                      Apply for Loan
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

export default LoanOffers;