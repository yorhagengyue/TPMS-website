import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "../button";
import { IntroSection } from "./IntroSection";
import { BannerSection } from "./BannerSection";
import { FiSearch, FiMenu, FiX, FiChevronDown } from 'react-icons/fi';

export const Header = ({ currentPage, setCurrentPage }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const topNavItems = [
    { label: 'About', url: '#' },
    { label: 'Staff', url: '#' },
    { label: 'Students', url: '#' },
    { label: 'Alumni', url: '#' },
    { label: 'Visitors', url: '#' },
  ];
  
  const navItems = [
    { 
      label: 'Home', 
      value: 'home',
      submenu: []
    },
    { 
      label: 'News', 
      value: 'news',
      submenu: [
        { label: 'Club News', url: '#' },
        { label: 'Achievements', url: '#' },
        { label: 'Announcements', url: '#' }
      ]
    },
    { 
      label: 'Events', 
      value: 'events',
      submenu: [
        { label: 'Upcoming Events', url: '#' },
        { label: 'Past Events', url: '#' },
        { label: 'Tournaments', url: '#' }
      ]
    },
    { 
      label: 'Check-in', 
      value: 'check-in',
      submenu: []
    },
    { 
      label: 'Resources', 
      value: 'resources',
      submenu: [
        { label: 'Chess Resources', url: '#' },
        { label: 'Go Tutorials', url: '#' },
        { label: 'Strategic Games', url: '#' }
      ]
    }
  ];

  return (
    <header className="relative w-full">
      {/* Top utility navigation - SMU style */}
      <div className="bg-smu-navy text-white text-xs">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-10">
            <div className="hidden md:flex space-x-6">
              {topNavItems.map((item, index) => (
                <a key={index} href={item.url} className="hover:text-smu-gold transition-colors">
                  {item.label}
                </a>
              ))}
            </div>
            <div className="flex items-center space-x-4 ml-auto">
              <button 
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-1 hover:text-smu-gold transition-colors"
              >
                <FiSearch className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              {logoError ? (
                <div className="h-12 w-12 bg-smu-red rounded-md flex items-center justify-center text-white font-bold text-xl">
                  TP
                </div>
              ) : (
                <img 
                  src="/images/logo.png" 
                  alt="TP Logo" 
                  className="h-12 w-auto"
                  onError={() => setLogoError(true)} 
                />
              )}
              <div className="text-smu-navy">
                <h1 className="text-xl font-serif font-bold leading-tight">
                  Temasek Polytechnic
                </h1>
                <p className="text-sm text-smu-gray font-medium">Mindsport Club</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <div key={item.value} className="relative group">
                  <Button
                    variant="ghost"
                    className={`transition-all px-4 py-2 h-16 text-base rounded-none border-b-2 ${
                      currentPage === item.value 
                        ? "border-smu-red text-smu-red font-medium" 
                        : "border-transparent text-smu-navy hover:text-smu-red hover:border-smu-red/30"
                    }`}
                    onClick={() => setCurrentPage(item.value)}
                  >
                    <span className="flex items-center">
                      {item.label}
                      {item.submenu.length > 0 && (
                        <FiChevronDown className="ml-1 w-4 h-4" />
                      )}
                    </span>
                  </Button>
                  
                  {/* Dropdown for submenu */}
                  {item.submenu.length > 0 && (
                    <div className="absolute left-0 w-48 bg-white shadow-lg rounded-b-md overflow-hidden z-50 transform origin-top scale-0 group-hover:scale-100 transition-transform duration-150 ease-in-out">
                      <div className="py-2">
                        {item.submenu.map((subitem, idx) => (
                          <a 
                            key={idx}
                            href={subitem.url}
                            className="block px-4 py-2 text-sm text-smu-navy hover:bg-smu-lightgray hover:text-smu-red"
                          >
                            {subitem.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                className="text-smu-navy"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <FiX className="w-6 h-6" />
                ) : (
                  <FiMenu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white border-b border-gray-200 shadow-md"
        >
          <div className="py-2 px-4">
            {navItems.map((item) => (
              <div key={item.value} className="py-2">
                <Button
                  variant="ghost"
                  className={`w-full text-left justify-between ${
                    currentPage === item.value 
                      ? "text-smu-red font-medium" 
                      : "text-smu-navy"
                  } px-0 py-2 hover:text-smu-red flex items-center`}
                  onClick={() => {
                    setCurrentPage(item.value);
                    setMobileMenuOpen(false);
                  }}
                >
                  <span>{item.label}</span>
                  {item.submenu.length > 0 && (
                    <FiChevronDown className="w-4 h-4" />
                  )}
                </Button>
                
                {/* Mobile submenu */}
                {item.submenu.length > 0 && (
                  <div className="pl-4 mt-1 border-l-2 border-gray-100">
                    {item.submenu.map((subitem, idx) => (
                      <a
                        key={idx}
                        href={subitem.url}
                        className="block py-2 text-sm text-smu-gray hover:text-smu-red"
                      >
                        {subitem.label}
                      </a>
                    ))}
                  </div>
                )}
                
                {item !== navItems[navItems.length - 1] && (
                  <div className="h-px bg-gray-100 my-2"></div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

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

      {/* Banner based on current page */}
      {currentPage === 'home' ? <IntroSection /> : <BannerSection currentPage={currentPage} />}
    </header>
  );
}; 