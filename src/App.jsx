import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Header } from './components/ui/layout/Header';
import { EventsPage } from './components/pages/EventsPage';
import { CheckinPage } from './components/pages/CheckinPage';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import JoinUsPage from './components/pages/JoinUsPage';
import { StudentDashboard } from './components/pages/StudentDashboard';
import ChessRankPage from './components/pages/ChessRankPage';
import ProfilePage from './components/pages/ProfilePage';
import { IntroSection } from './components/ui/layout/IntroSection';
import { BannerSection } from './components/ui/layout/BannerSection';
import LoadingScreen from './components/ui/LoadingScreen';
import PageTransition from './components/ui/PageTransition';
import './styles/loading-screen.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiArrowRight, FiAward, FiBell, FiBook, FiUsers, FiAlertCircle } from 'react-icons/fi';

// Main App Component
const TPMSApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // 可以根据当前路径动态获取当前页面
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/') return 'profile';
    // 去掉前导斜杠返回页面名称
    return path.substring(1);
  };
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // 每次页面加载时，总是从false开始，确保加载动画显示
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

  // 应用启动后显示加载页面，然后过渡到主应用
  useEffect(() => {
    // 确保每次页面刷新或重新访问时都会显示加载动画
    // 清除任何现有的会话标记
    sessionStorage.removeItem('loadingShown');
    
    // 模拟应用初始化过程
    const appInitTimeout = setTimeout(() => {
      setIsAppReady(true);
      // 加载完成后，记录此次会话已显示过加载页面
      sessionStorage.setItem('loadingShown', 'true');
    }, 3000); // 3秒的加载动画

    return () => clearTimeout(appInitTimeout);
  }, []); // 空依赖数组确保只在组件挂载时执行一次

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
    navigate('/'); // 登录后导航到首页
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

  // 如果应用尚未准备好，显示加载页面
  if (!isAppReady) {
    return <LoadingScreen onComplete={() => setIsAppReady(true)} />;
  }

  // 获取当前页面
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
          
          {/* 在不是login, register和profile的页面显示Banner */}
          {currentPage !== 'profile' && currentPage !== 'login' && currentPage !== 'register' && (
            <div className="pt-20">
              <BannerSection currentPage={currentPage} />
            </div>
          )}

          {/* 主要内容区域 */}
          <main className={`animate-fade-in ${
            currentPage === 'login' || currentPage === 'register' || currentPage === 'joinus'
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
              {/* 将根路径重定向到/profile */}
              <Route path="/" element={
                <AuthGuard requiredAuth={true}>
                  <ProfilePage user={user} />
                </AuthGuard>
              } />
              <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
              <Route path="/register" element={<RegisterPage onLogin={handleLogin} />} />
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
              {/* 添加StudentDashboard作为独立路由 */}
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