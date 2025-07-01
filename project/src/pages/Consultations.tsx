import React, { useEffect ,useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useBusinessStore } from '../store/businessStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  MessageSquare,
  User,
  Calendar,
  Tag,
  Search,
  Filter,
  X,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';



const consultationSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  advice: z.string().min(10, 'Advice must be at least 10 characters'),
  category: z.string().min(1, 'Please select a category'),
  businessIdeaId: z.string().optional(),
});

type ConsultationForm = z.infer<typeof consultationSchema>;

const Consultations = () => {
  const { user } = useAuthStore();
  const { consultations, createConsultation, fetchConsultations, businessIdeas } = useBusinessStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
  fetchConsultations(); 
}, []);

  const form = useForm<ConsultationForm>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      category: 'Strategy',
    }
  });

  const categories = [
    'All', 'Strategy', 'Marketing', 'Finance', 'Operations',
    'Technology', 'Legal', 'HR', 'Sales', 'Other'
  ];

  const filteredConsultations = consultations.filter((consultation) => {
    const matchesSearch =
      consultation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.advisorId?.name?.toLowerCase().includes(searchTerm.toLowerCase()); 

    const matchesCategory =
      selectedCategory === 'all' ||
      consultation.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const onSubmit = async (data: ConsultationForm) => {
  if (!user) return;

  const success = await createConsultation({
    ...data,
     
  });

  if (success) {
    toast.success('Consultation created successfully');
    form.reset();
    setShowCreateModal(false);
  }
};


  const getMyConsultations = () => {
    
    return consultations.filter(c => c.advisorId?._id === user?.id);
  };

  const getBusinessIdea = (businessIdeaId?: string) => {
    if (!businessIdeaId) return null;
    return businessIdeas.find(idea => idea._id === businessIdeaId);
  };

  const getStats = () => {
    const myConsultations =
      user?.role === 'business_advisor' ? getMyConsultations() : consultations;

    const categoryStats = categories.slice(1).map(category => ({
      category,
      count: myConsultations.filter(c => c.category === category).length
    }));

    return {
      total: myConsultations.length,
      categories: categoryStats.filter(stat => stat.count > 0),
      topCategory: categoryStats.reduce((max, current) =>
        current.count > max.count ? current : max,
        { category: 'None', count: 0 }
      ),
    };
  };

  const stats = getStats();


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {user?.role === 'business_advisor' ? 'My Consultations' : 'Business Consultations'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {user?.role === 'business_advisor' 
              ? 'Share your expertise and help businesses grow'
              : 'Get expert advice from experienced business advisors'
            }
          </p>
        </div>
        
        {user?.role === 'business_advisor' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Consultation
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {user?.role === 'business_advisor' ? 'My Consultations' : 'Available Consultations'}
              </p>
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
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.categories.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Categories Covered</p>
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
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.topCategory.category}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Top Category</p>
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
              placeholder="Search consultations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {categories.map(category => (
                <option key={category} value={category.toLowerCase()}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Consultations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredConsultations.map((consultation, index) => {
            const linkedBusinessIdea = getBusinessIdea(
             typeof consultation.businessIdeaId === 'string'
             ? consultation.businessIdeaId
             : consultation.businessIdeaId?._id);

            
            return (
              <motion.div
                key={consultation._id}

                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => {
                  setSelectedConsultation(consultation);
                  setShowDetailModal(true);
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium">
                      {consultation.category}
                    </span>
                    {user?.role === 'business_advisor' && consultation.advisorId?._id === user.id && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs">
                        My Advice
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {consultation.title}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                  {consultation.description}
                </p>

                {linkedBusinessIdea && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Related Business Idea
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
                      {linkedBusinessIdea.title}
                    </p>
                  </div>
                )}

                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 mb-4">
                  <p className="text-sm text-green-700 dark:text-green-300 line-clamp-2">
                    <strong>Advice:</strong> {consultation.advice}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
                    <User className="w-4 h-4" />
                    <span>{consultation.advisorId?.name}</span>

                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(consultation.createdAt), 'MMM dd')}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredConsultations.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No consultations found
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {user?.role === 'business_advisor' 
              ? 'Share your first consultation to help businesses grow'
              : 'No consultations available for the selected criteria'
            }
          </p>
        </div>
      )}

      {/* Create Consultation Modal */}
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
                  Add New Consultation
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
                    Consultation Title
                  </label>
                  <input
                    {...form.register('title')}
                    type="text"
                    placeholder="Enter consultation title"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {form.formState.errors.title && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      {...form.register('category')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      {categories.slice(1).map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {form.formState.errors.category && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Related Business Idea (Optional)
                    </label>
                    <select
                      {...form.register('businessIdeaId')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select a business idea</option>
                    {businessIdeas.map((idea) => (
                      <option key={idea._id} value={idea._id}>
                        {idea.title}
                      </option>
                    ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Problem Description
                  </label>
                  <textarea
                    {...form.register('description')}
                    rows={4}
                    placeholder="Describe the business problem or challenge..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {form.formState.errors.description && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Advice & Solution
                  </label>
                  <textarea
                    {...form.register('advice')}
                    rows={6}
                    placeholder="Provide your expert advice and recommended solutions..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {form.formState.errors.advice && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.advice.message}</p>
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
                    Add Consultation
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedConsultation && (
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
                  {selectedConsultation.title}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      Problem Description
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {selectedConsultation.description}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      Expert Advice & Solution
                    </h3>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedConsultation.advice}
                      </p>
                    </div>
                  </div>

                  {getBusinessIdea(selectedConsultation.businessIdeaId) && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                        Related Business Idea
                      </h3>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <Lightbulb className="w-6 h-6 text-blue-600" />
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {getBusinessIdea(selectedConsultation.businessIdeaId)?.title}
                          </h4>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                          {getBusinessIdea(selectedConsultation.businessIdeaId)?.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Consultation Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Category:</span>
                        <span className="font-medium">{selectedConsultation.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Date:</span>
                        <span className="font-medium">
                          {format(new Date(selectedConsultation.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Business Advisor
                    </h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                     {(selectedConsultation?.advisorName?.charAt(0) || 'A')}
                      </div>
                       <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                       {selectedConsultation?.advisorName || 'Unknown Advisor'}
                         </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Business Advisor
                           </p>
                        </div>
                    </div>

                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Consultations;