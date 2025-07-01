import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useBusinessStore } from '../store/businessStore';
import {
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  Lightbulb,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, eachMonthOfInterval, startOfYear, endOfYear } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuthStore();
  const {
    businessIdeas,
    investmentProposals,
    loanOffers,
    consultations,
    fetchBusinessIdeas,
    fetchInvestmentProposals,
    fetchLoanOffers,
    fetchConsultations,
  } = useBusinessStore();
  const [showAllActivities, setShowAllActivities] = useState(false);

  useEffect(() => {
    fetchBusinessIdeas();
    fetchInvestmentProposals();
    fetchLoanOffers();
    fetchConsultations();
  }, [fetchBusinessIdeas, fetchInvestmentProposals, fetchLoanOffers, fetchConsultations]);

  const getRoleBasedStats = () => {
  if (!user || !user.id || !user.role) return [];

  const userId = user.id.toString();

  switch (user.role) {
    case 'business_person': {
      const myIdeas = businessIdeas.filter(idea => {
        const ideaUserId = typeof idea.userId === 'object' && idea.userId !== null ? idea.userId._id || idea.userId : idea.userId;
        return ideaUserId?.toString() === userId;
      });

      const myProposals = investmentProposals.filter(proposal =>
        businessIdeas.some(idea => {
          const ideaId = idea._id?.toString();
          const ideaUserId = typeof idea.userId === 'object' && idea.userId !== null ? idea.userId._id || idea.userId : idea.userId;
          const proposalIdeaId = typeof proposal.businessIdeaId === 'object' && proposal.businessIdeaId !== null
            ? proposal.businessIdeaId._id || proposal.businessIdeaId
            : proposal.businessIdeaId;
          return ideaId === proposalIdeaId?.toString() && ideaUserId?.toString() === userId;
        })
      );

      const totalFunding = myIdeas.reduce((sum, idea) => sum + (idea.investmentNeeded || 0), 0);

      const activeConsultations = consultations.filter(c => {
        const businessIdeaId = typeof c.businessIdeaId === 'object' && c.businessIdeaId !== null
          ? c.businessIdeaId._id || c.businessIdeaId
          : c.businessIdeaId;
        return myIdeas.some(idea => idea._id?.toString() === businessIdeaId?.toString());
      });

      return [
        { title: 'My Business Ideas', value: myIdeas.length, icon: Lightbulb, color: 'from-blue-500 to-cyan-500', change: '+12%' },
        { title: 'Investment Proposals', value: myProposals.length, icon: TrendingUp, color: 'from-green-500 to-emerald-500', change: '+8%' },
        { title: 'Total Funding Needed', value: `$${totalFunding.toLocaleString()}`, icon: DollarSign, color: 'from-purple-500 to-pink-500', change: '+15%' },
        { title: 'Active Consultations', value: activeConsultations.length, icon: MessageSquare, color: 'from-orange-500 to-red-500', change: '+5%' },
      ];
    }

    case 'investor': {
      const myInvestments = investmentProposals.filter(proposal => {
        const investorId = typeof proposal.investorId === 'object' && proposal.investorId !== null
          ? proposal.investorId._id || proposal.investorId
          : proposal.investorId;
        return investorId?.toString() === userId;
      });

      const totalInvested = myInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const acceptedCount = myInvestments.filter(inv => inv.status === 'accepted').length;

      return [
        { title: 'Available Ideas', value: businessIdeas.length, icon: Lightbulb, color: 'from-blue-500 to-cyan-500', change: '+20%' },
        { title: 'My Proposals', value: myInvestments.length, icon: TrendingUp, color: 'from-green-500 to-emerald-500', change: '+12%' },
        { title: 'Total Invested', value: `$${totalInvested.toLocaleString()}`, icon: DollarSign, color: 'from-purple-500 to-pink-500', change: '+25%' },
        { title: 'Portfolio Companies', value: acceptedCount, icon: Building2, color: 'from-orange-500 to-red-500', change: '+8%' },
      ];
    }

    case 'banker': {
      const myLoans = loanOffers.filter(loan => {
        const bankerId = typeof loan.bankerId === 'object' && loan.bankerId !== null ? loan.bankerId._id || loan.bankerId : loan.bankerId;
        return bankerId?.toString() === userId;
      });

      const totalAmount = myLoans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
      const avgInterest = (myLoans.reduce((sum, loan) => sum + (loan.interestRate || 0), 0) / (myLoans.length || 1)).toFixed(1);

      return [
        { title: 'Active Loan Offers', value: myLoans.filter(loan => loan.status === 'active').length, icon: Building2, color: 'from-blue-500 to-cyan-500', change: '+10%' },
        { title: 'Total Loan Amount', value: `$${totalAmount.toLocaleString()}`, icon: DollarSign, color: 'from-green-500 to-emerald-500', change: '+18%' },
        { title: 'Average Interest', value: `${avgInterest}%`, icon: TrendingUp, color: 'from-purple-500 to-pink-500', change: '-0.5%' },
        { title: 'Business Inquiries', value: businessIdeas.length, icon: Users, color: 'from-orange-500 to-red-500', change: '+15%' },
      ];
    }

    case 'business_advisor': {
      const myConsultations = consultations.filter(c => {
        const advisorId = typeof c.advisorId === 'object' && c.advisorId !== null ? c.advisorId._id || c.advisorId : c.advisorId;
        return advisorId?.toString() === userId;
      });

      const reviewedClients = new Set(myConsultations.map(c => {
        const bid = typeof c.businessIdeaId === 'object' && c.businessIdeaId !== null ? c.businessIdeaId._id || c.businessIdeaId : c.businessIdeaId;
        return bid?.toString();
      }));

      return [
        { title: 'Active Consultations', value: myConsultations.length, icon: MessageSquare, color: 'from-blue-500 to-cyan-500', change: '+22%' },
        { title: 'Business Ideas Reviewed', value: businessIdeas.length, icon: Lightbulb, color: 'from-green-500 to-emerald-500', change: '+18%' },
        { title: 'Clients Helped', value: reviewedClients.size, icon: Users, color: 'from-purple-500 to-pink-500', change: '+12%' },
        { title: 'Success Rate', value: '85%', icon: TrendingUp, color: 'from-orange-500 to-red-500', change: '+3%' },
      ];
    }

    default:
      return [];
  }
};


  const stats = getRoleBasedStats();

  // Generate months for the current year
  const months = eachMonthOfInterval({
    start: startOfYear(new Date()),
    end: endOfYear(new Date()),
  });

  // Example: Count proposals per month
  const monthlyData = months.map(month => {
    const monthNum = month.getMonth();
    const value = investmentProposals.filter(p =>
      p.createdAt && new Date(p.createdAt).getMonth() === monthNum
    ).length;
    return { month: format(month, 'MMM'), value };
  });

  const categoryColors: Record<string, string> = {
    Technology: '#3B82F6',
    Healthcare: '#10B981',
    Finance: '#8B5CF6',
    Agriculture: '#F59E0B',
    Other: '#F43F5E',
  };

  const categoryCounts: Record<string, number> = {};
  businessIdeas.forEach(idea => {
    const cat = idea.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
    color: categoryColors[name] || '#F43F5E',
  }));

  const recentIdeas = businessIdeas
    .slice(-3)
    .map(idea => ({
      action: `New business idea posted: ${idea.title}`,
      user: idea.userId?.name || idea.userId || 'Someone',
      time: format(new Date(idea.createdAt), 'PPP p'),
      rawDate: new Date(idea.createdAt),
      type: 'idea',
    }));

  const recentProposals = investmentProposals
    .slice(-3)
    .map(proposal => ({
      action: `Investment proposal: $${proposal.amount}`,
      user: proposal.investorId?.name || proposal.investorId || 'Investor',
      time: format(new Date(proposal.createdAt), 'PPP p'),
      rawDate: new Date(proposal.createdAt),
      type: 'investment',
    }));

  const recentLoans = loanOffers
    .slice(-3)
    .map(loan => ({
      action: `Loan offer updated: ${loan.title}`,
      user: loan.bankerId?.name || loan.bankerId || 'Banker',
      time: format(new Date(loan.updatedAt || loan.createdAt), 'PPP p'),
      rawDate: new Date(loan.updatedAt || loan.createdAt),
      type: 'loan',
    }));

  const recentConsultations = consultations
    .slice(-3)
    .map(c => ({
      action: `Consultation completed`,
      user: c.advisorId?.name || c.advisorId || 'Advisor',
      time: format(new Date(c.updatedAt || c.createdAt), 'PPP p'),
      rawDate: new Date(c.updatedAt || c.createdAt),
      type: 'consultation',
    }));

  const recentActivities = [
    ...recentIdeas,
    ...recentProposals,
    ...recentLoans,
    ...recentConsultations,
  ].sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

  const displayedActivities = showAllActivities ? recentActivities : recentActivities.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-blue-100 text-lg">
              {user?.role === 'business_person' && 'Ready to turn your ideas into reality?'}
              {user?.role === 'investor' && 'Discover your next investment opportunity.'}
              {user?.role === 'banker' && 'Help businesses grow with financial solutions.'}
              {user?.role === 'business_advisor' && 'Guide entrepreneurs to success.'}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
              <div className="text-6xl">
                {user?.role === 'business_person' && '💡'}
                {user?.role === 'investor' && '📈'}
                {user?.role === 'banker' && '🏦'}
                {user?.role === 'business_advisor' && '🎯'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change.startsWith('+');
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} p-3 text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {stat.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {stat.title}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Monthly Activity
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '12px',
                  backdropFilter: 'blur(12px)',
                }}
              />
              <Bar dataKey="value" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Business Categories
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '12px',
                  backdropFilter: 'blur(12px)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {categoryData.map((category, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                <span className="text-sm text-gray-600 dark:text-gray-300">{category.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
          <button
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
            onClick={() => setShowAllActivities((prev) => !prev)}
          >
            {showAllActivities ? 'Show Less' : 'View All'}
          </button>
        </div>
        
        <div className="space-y-4">
          {displayedActivities.map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                activity.type === 'idea' ? 'bg-blue-100 text-blue-600' :
                activity.type === 'investment' ? 'bg-green-100 text-green-600' :
                activity.type === 'loan' ? 'bg-purple-100 text-purple-600' :
                'bg-orange-100 text-orange-600'
              }`}>
                {activity.type === 'idea' && <Lightbulb className="w-5 h-5" />}
                {activity.type === 'investment' && <TrendingUp className="w-5 h-5" />}
                {activity.type === 'loan' && <Building2 className="w-5 h-5" />}
                {activity.type === 'consultation' && <MessageSquare className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white font-medium">
                  {activity.action}
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  by {typeof activity.user === 'string' ? activity.user : activity.user?.name}
                </p>
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                {activity.time}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;