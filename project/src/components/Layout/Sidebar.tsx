import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  Lightbulb,
  TrendingUp,
  Building2,
  MessageSquare,
  User,
  LogOut,
  Bell
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const getNavItems = () => {
    const baseItems = [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ];

    const roleSpecificItems = {
      business_person: [
        { to: '/business-ideas', icon: Lightbulb, label: 'My Business Ideas' },
        { to: '/investments', icon: TrendingUp, label: 'Investment Proposals' },
        { to: '/loans', icon: Building2, label: 'Loan Offers' },
        { to: '/consultations', icon: MessageSquare, label: 'Business Advice' },
      ],
      investor: [
        { to: '/business-ideas', icon: Lightbulb, label: 'Browse Ideas' },
        { to: '/investments', icon: TrendingUp, label: 'My Investments' },
        { to: '/loans', icon: Building2, label: 'Loan Opportunities' },
      ],
      banker: [
        { to: '/business-ideas', icon: Lightbulb, label: 'Business Ideas' },
        { to: '/loans', icon: Building2, label: 'Loan Offers' },
        { to: '/investments', icon: TrendingUp, label: 'Investment Tracking' },
      ],
      business_advisor: [
        { to: '/business-ideas', icon: Lightbulb, label: 'Business Ideas' },
        { to: '/consultations', icon: MessageSquare, label: 'Consultations' },
        { to: '/investments', icon: TrendingUp, label: 'Investment Insights' },
      ],
    };

    return [
      ...baseItems,
      ...(user ? roleSpecificItems[user.role] || [] : []),
      { to: '/notifications', icon: Bell, label: 'Notifications' },
      { to: '/profile', icon: User, label: 'Profile' },
    ];
  };

  const navItems = getNavItems();

  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 h-screen w-64 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-r border-gray-200/50 dark:border-gray-700/50 shadow-xl z-50"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900 dark:text-white">Bridge</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Business Platform</p>
          </div>
        </div>

        {user && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        )}

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;