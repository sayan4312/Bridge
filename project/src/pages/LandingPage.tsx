import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap,
  Building2,
  DollarSign,
  Lightbulb,
  UserCheck
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Connect with Investors',
      description: 'Access a network of qualified investors looking for the next big opportunity',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Building2 className="w-8 h-8" />,
      title: 'Business Opportunities',
      description: 'Discover innovative business ideas and investment opportunities',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: 'Secure Funding',
      description: 'Get access to loans and investment proposals from verified sources',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <UserCheck className="w-8 h-8" />,
      title: 'Expert Advice',
      description: 'Connect with business advisors and industry experts',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const roles = [
    {
      title: 'Business Person',
      description: 'Post your business ideas and connect with investors',
      icon: <Lightbulb className="w-12 h-12" />,
      features: ['Post Business Ideas', 'View Proposals', 'Connect with Investors']
    },
    {
      title: 'Investor',
      description: 'Discover and invest in promising business opportunities',
      icon: <TrendingUp className="w-12 h-12" />,
      features: ['Browse Ideas', 'Make Proposals', 'Track Investments']
    },
    {
      title: 'Banker',
      description: 'Offer loans and financial services to businesses',
      icon: <Building2 className="w-12 h-12" />,
      features: ['Post Loan Offers', 'Review Applications', 'Manage Portfolios']
    },
    {
      title: 'Business Advisor',
      description: 'Provide expertise and guidance to entrepreneurs',
      icon: <UserCheck className="w-12 h-12" />,
      features: ['Offer Consultations', 'Share Expertise', 'Build Network']
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.h1 
              className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              Bridge Business & Investment
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Connect entrepreneurs with investors, bankers, and business advisors in one powerful platform
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <button
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </button>
              
              <button className="text-gray-600 dark:text-gray-300 px-8 py-4 rounded-full font-semibold text-lg border-2 border-gray-200 dark:border-gray-600 hover:border-purple-400 transition-all duration-300">
                Learn More
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We provide a comprehensive ecosystem for business growth and investment opportunities
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} p-4 text-white mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Role
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Join as an entrepreneur, investor, banker, or business advisor
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {roles.map((role, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 cursor-pointer"
                onClick={() => navigate('/auth')}
              >
                <div className="text-blue-600 dark:text-blue-400 mb-4">
                  {role.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {role.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {role.description}
                </p>
                <ul className="space-y-2">
                  {role.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your Business Journey?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of entrepreneurs and investors already using our platform
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              Start Your Journey <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;