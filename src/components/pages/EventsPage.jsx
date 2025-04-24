import React from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../ui/PageTransition';

export const EventsPage = ({ user }) => {
  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold mb-6 text-gray-800">Chess Rankings</h1>
          <div className="w-16 h-1 bg-blue-500 mx-auto mb-10"></div>
          <p className="text-2xl text-gray-600">Coming Soon...</p>
        </motion.div>
      </div>
    </PageTransition>
  );
}; 