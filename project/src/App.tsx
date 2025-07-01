import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, initializeAuth } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import BusinessIdeas from './pages/BusinessIdeas';
import InvestmentProposals from './pages/InvestmentProposals';
import LoanOffers from './pages/LoanOffers';
import Consultations from './pages/Consultations';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

// Layout
import Layout from './components/Layout/Layout';

function App() {
  const { user, isAuthenticated } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Initialize authentication state on app start
    initializeAuth();
  }, []);

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 transition-colors duration-300">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route 
                path="/auth" 
                element={isAuthenticated ? <Navigate to="/dashboard" /> : <AuthPage />} 
              />
              <Route
                path="/dashboard"
                element={
                  isAuthenticated ? (
                    <Layout>
                      <Dashboard />
                    </Layout>
                  ) : (
                    <Navigate to="/auth" />
                  )
                }
              />
              <Route
                path="/notifications"
                element={
                  isAuthenticated ? (
                    <Layout>
                      <Notifications />
                    </Layout>
                  ) : (
                    <Navigate to="/auth" />
                  )
                }
              />
              <Route
                path="/business-ideas"
                element={
                  isAuthenticated ? (
                    <Layout>
                      <BusinessIdeas />
                    </Layout>
                  ) : (
                    <Navigate to="/auth" />
                  )
                }
              />
              <Route
                path="/investments"
                element={
                  isAuthenticated ? (
                    <Layout>
                      <InvestmentProposals />
                    </Layout>
                  ) : (
                    <Navigate to="/auth" />
                  )
                }
              />
              <Route
                path="/loans"
                element={
                  isAuthenticated ? (
                    <Layout>
                      <LoanOffers />
                    </Layout>
                  ) : (
                    <Navigate to="/auth" />
                  )
                }
              />
              <Route
                path="/consultations"
                element={
                  isAuthenticated ? (
                    <Layout>
                      <Consultations />
                    </Layout>
                  ) : (
                    <Navigate to="/auth" />
                  )
                }
              />
              <Route
                path="/profile"
                element={
                  isAuthenticated ? (
                    <Layout>
                      <Profile />
                    </Layout>
                  ) : (
                    <Navigate to="/auth" />
                  )
                }
              />
            </Routes>
          </AnimatePresence>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: theme === 'dark' ? '#374151' : '#ffffff',
              color: theme === 'dark' ? '#ffffff' : '#000000',
            },
          }}
        />
      </Router>
    </div>
  );
}

export default App;