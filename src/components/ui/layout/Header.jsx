import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "../button";
import { FiSearch, FiMenu, FiX, FiChevronDown, FiHome, FiCalendar, FiCheckSquare, FiUser, FiLogOut, FiLogIn, FiBell } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';

export const Header = ({ currentPage, setCurrentPage, user, onLogout }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const topNavItems = [
    { label: 'About', url: '#' },
    { label: 'Staff', url: '#' },
    { label: 'Students', url: '#' },
    { label: 'Alumni', url: '#' },
    { label: 'Visitors', url: '#' },
  ];
  
  const navItems = [
    { id: 'home', label: 'Home', icon: <FiHome />, requiresAuth: false, path: '/' },
    { id: 'news', label: 'News', icon: <FiBell />, requiresAuth: false, path: '/news' },
    { id: 'events', label: 'Events', icon: <FiCalendar />, requiresAuth: true, path: '/events' },
    { id: 'check-in', label: 'Check-in', icon: <FiCheckSquare />, requiresAuth: true, path: '/check-in' },
  ];

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (pageId, path) => {
    // Handle authentication requirements
    if (pageId === 'login' || (!user && navItems.find(item => item.id === pageId)?.requiresAuth)) {
      navigate('/login');
    } else {
      navigate(path);
    }
    setIsOpen(false);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 bg-white shadow-md py-3 transition-all duration-300"
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo and site name */}
          <Link to="/" className="flex items-center cursor-pointer">
            <div
              className="font-bold text-xl md:text-2xl text-primary-600"
            >
              TP Mindsport Club
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              const isDisabled = item.requiresAuth && !user;

              return isDisabled ? (
                <button
                  key={item.id}
                  className="px-3 py-2 rounded-md transition-colors duration-200 flex items-center text-gray-400 cursor-not-allowed"
                  disabled={true}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`px-3 py-2 rounded-md transition-colors duration-200 flex items-center ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}

            {/* User menu or login button */}
            {user ? (
              <div className="relative group ml-2">
                <button className="px-3 py-2 rounded-md transition-colors flex items-center text-gray-700 hover:bg-gray-100">
                  <span className="mr-1.5"><FiUser /></span>
                  {user.name ? user.name.split(' ')[0] : user.username}
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden transform scale-0 group-hover:scale-100 origin-top-right transition-transform duration-200">
                  <div className="px-4 py-3 text-sm text-gray-900 border-b">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-gray-500 truncate">{user.index_number}</div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                  >
                    <FiLogOut className="mr-2" /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/register"
                  className="px-3 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors flex items-center"
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-primary-600 border border-primary-600 hover:bg-primary-50 transition-colors flex items-center"
                >
                  Login
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white shadow-lg"
          >
            <div className="container mx-auto px-4 py-2">
              <nav className="flex flex-col space-y-2">
                {navItems.map((item) => {
                  const isActive = currentPage === item.id;
                  const isDisabled = item.requiresAuth && !user;

                  return isDisabled ? (
                    <button
                      key={item.id}
                      className="px-4 py-3 rounded-md transition-colors duration-200 flex items-center text-gray-400 cursor-not-allowed"
                      disabled={true}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`px-4 py-3 rounded-md transition-colors duration-200 flex items-center ${
                        isActive
                          ? 'bg-primary-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}

                {user ? (
                  <>
                    <div className="px-4 py-3 border-t border-gray-200">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                          <FiUser size={20} />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.index_number}</div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={onLogout}
                      className="px-4 py-3 rounded-md text-left transition-colors duration-200 flex items-center text-gray-700 hover:bg-gray-100"
                    >
                      <span className="mr-3"><FiLogOut /></span>
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2 mt-2">
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-3 rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors flex items-center justify-center"
                    >
                      Register
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-3 rounded-md text-primary-600 border border-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center"
                    >
                      Login
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      {searchOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute top-full left-0 right-0 bg-white shadow-md z-50 p-4"
        >
          <div className="container mx-auto">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full border border-gray-300 rounded-md py-2 px-4 pr-10"
              />
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-smu-red"
                onClick={() => setSearchOpen(false)}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
}; 