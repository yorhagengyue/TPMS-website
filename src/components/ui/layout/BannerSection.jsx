import React from 'react';
import { motion } from 'framer-motion';

export const BannerSection = ({ currentPage }) => {
  const pageTitles = {
    'news': 'Latest News & Updates',
    'events': 'Events Calendar',
    'check-in': 'Digital Attendance System',
    // Default for any other page
    'default': 'Mindsport Club'
  };

  const pageSubtitles = {
    'news': 'Stay updated with the latest happenings in the club',
    'events': 'Discover and participate in our upcoming activities',
    'check-in': 'Manage attendance and track participation',
    // Default for any other page
    'default': 'Temasek Polytechnic Strategic Gaming Community'
  };

  const title = pageTitles[currentPage] || pageTitles.default;
  const subtitle = pageSubtitles[currentPage] || pageSubtitles.default;

  return (
    <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 h-[300px]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
      
      {/* 增强背景遮罩，确保文字清晰可读 */}
      <div className="absolute inset-0 bg-blue-900/70 backdrop-blur-[1px]"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20 h-full flex items-center">
        <div className="max-w-3xl">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block px-3 py-1 mb-4 bg-blue-800 bg-opacity-70 rounded-md backdrop-blur-sm"
          >
            <span className="text-blue-100 font-medium uppercase tracking-wider text-sm">
              TP Mindsport Club
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl text-white font-bold mb-6"
          >
            {title}
          </motion.h1>
          
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-blue-100 max-w-2xl leading-relaxed"
          >
            {subtitle}
          </motion.p>
        </div>
      </div>
    </div>
  );
}; 