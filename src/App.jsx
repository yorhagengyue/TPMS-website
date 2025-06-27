import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Header } from './components/ui/layout/Header';
import { EventsPage } from './components/pages/EventsPage';
import { CheckinPage } from './components/pages/CheckinPage';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import JoinUsPage from './components/pages/JoinUsPage';
import { ForgotPasswordPage } from './components/pages/ForgotPasswordPage';
import { StudentDashboard } from './components/pages/StudentDashboard';
import ChessRankPage from './components/pages/ChessRankPage';
import ProfilePage from './components/pages/ProfilePage';
import { IntroSection } from './components/ui/layout/IntroSection';
import { BannerSection } from './components/ui/layout/BannerSection';
import LoadingScreenImpact from './components/ui/LoadingScreenImpact';
import PageTransition from './components/ui/PageTransition';
import './styles/loading-screen.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiArrowRight, FiAward, FiBell, FiBook, FiUsers, FiAlertCircle } from 'react-icons/fi';

// Main App Component
const TPMSApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Get current page based on the current path
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/') return 'profile';
    // Remove leading slash to return page name
    return path.substring(1);
  };
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Always start from false on each page load to ensure loading animation shows
  const [isAppReady, setIsAppReady] = useState(false);
  
  // Initialize student data from localStorage with error handling
  const [studentData, setStudentData] = useState(() => {
    try {
      const saved = localStorage.getItem('studentData');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error loading student data:", error);
      return [];
    }
  });

  // Show loading page after app startup, then transition to main app
  useEffect(() => {
    // Ensure loading animation shows on every page refresh or revisit
    // Clear any existing session markers
    sessionStorage.removeItem('loadingShown');
    
    // Simulate app initialization process
    const appInitTimeout = setTimeout(() => {
      setIsAppReady(true);
      // Record that loading page has been shown for this session
      sessionStorage.setItem('loadingShown', 'true');
    }, 4000); // 4 seconds of loading animation for full impact

    return () => clearTimeout(appInitTimeout);
  }, []); // Empty dependency array ensures execution only on component mount

  // Check if user is logged in on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (!savedToken || !savedUser) {
          setLoading(false);
          return;
        }
        
        // Validate token with server
        const response = await fetch('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${savedToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data.user);
          } else {
            // Token is invalid, clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } else {
          // Token is invalid, clear local storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    navigate('/'); // Navigate to homepage after login
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Call logout API
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login');
    }
  };

  // Authenticated route guard
  const AuthGuard = ({ children, requiredAuth }) => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      );
    }
    
    if (requiredAuth && !user) {
      navigate('/login');
      return null;
    }
    
    return children;
  };

  // Show loading page if app is not ready yet
  if (!isAppReady) {
    return <LoadingScreenImpact onComplete={() => setIsAppReady(true)} />;
  }

  // Get current page
  const currentPage = getCurrentPage();

  return (
    <AnimatePresence mode="wait">
      <PageTransition key="main-app">
        <div className="min-h-screen bg-gray-50">
          <Header 
            currentPage={currentPage} 
            setCurrentPage={(page) => navigate(`/${page === 'profile' ? '' : page}`)} 
            user={user}
            onLogout={handleLogout}
          />
          
          {/* Show Banner on pages other than login, register, forgot-password and profile */}
          {currentPage !== 'profile' && currentPage !== 'login' && currentPage !== 'register' && currentPage !== 'forgot-password' && (
            <div className="pt-20">
              <BannerSection currentPage={currentPage} />
            </div>
          )}

          {/* Main content area */}
          <main className={`animate-fade-in ${
            currentPage === 'login' || currentPage === 'register' || currentPage === 'forgot-password' || currentPage === 'joinus'
            ? 'pt-32' 
            : currentPage === 'profile'
            ? 'pt-24' // Profile page needs some padding
            : 'pt-8'
          }`}>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-3xl mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start rounded-md"
              >
                <FiAlertCircle className="mr-3 mt-0.5 flex-shrink-0" size={20} />
                <span>{error}</span>
              </motion.div>
            )}
            
            <Routes>
              {/* Redirect root path to /profile */}
              <Route path="/" element={
                <AuthGuard requiredAuth={true}>
                  <ProfilePage user={user} />
                </AuthGuard>
              } />
              <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
              <Route path="/register" element={<RegisterPage onLogin={handleLogin} />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage onLogin={handleLogin} />} />
              <Route path="/joinus" element={<JoinUsPage />} />
              <Route path="/events" element={
                <AuthGuard requiredAuth={true}>
                  <EventsPage user={user} />
                </AuthGuard>
              } />
              <Route path="/chess-rank" element={<ChessRankPage user={user} />} />
              <Route path="/profile" element={
                <AuthGuard requiredAuth={true}>
                  <ProfilePage user={user} />
                </AuthGuard>
              } />
              <Route path="/check-in" element={
                <AuthGuard requiredAuth={true}>
                  <CheckinPage 
                    studentData={studentData} 
                    setStudentData={setStudentData}
                    user={user} 
                  />
                </AuthGuard>
              } />
              {/* Add StudentDashboard as independent route */}
              <Route path="/dashboard" element={
                <AuthGuard requiredAuth={true}>
                  <StudentDashboard user={user} />
                </AuthGuard>
              } />
            </Routes>
          </main>
          
          <footer className="bg-primary-800 text-white mt-20 py-8">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">Contact Us</h3>
                  <p>Email: mindsport@tp.edu.sg</p>
                  <p>Phone: +65 6789 1234</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-4">Location</h3>
                  <p>Temasek Polytechnic</p>
                  <p>21 Tampines Avenue 1</p>
                  <p>Singapore 529757</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-4">Follow Us</h3>
                  <div className="flex space-x-4">
                    {/* Add social media icons here */}
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-primary-700 text-center">
                <p>&copy; 2024 TP Mindsport Club. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </PageTransition>
    </AnimatePresence>
  );
}

export default TPMSApp;