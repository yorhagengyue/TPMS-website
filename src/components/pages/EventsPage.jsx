import React from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';
import { FaChess } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import PageTransition from '../ui/PageTransition';

export const EventsPage = ({ user }) => {
  // Placeholder events data - in a real app, this would come from an API
  const events = [
    {
      id: 1,
      title: 'Weekly Chess Training Session',
      date: 'Every Friday',
      time: '4:00 PM - 6:00 PM',
      location: 'Student Activity Center, Room 3-01',
      type: 'Regular Meeting',
      description: 'Regular chess training and practice games for all skill levels.'
    },
    {
      id: 2,
      title: 'TPMS Internal Chess Tournament',
      date: 'Coming Soon',
      time: 'TBA',
      location: 'TBA',
      type: 'Tournament',
      description: 'Monthly internal tournament for TPMS members. Prizes for top 3 players!'
    }
  ];

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">TPMS Events</h1>
          <div className="w-16 h-1 bg-blue-500 mb-10"></div>
          
          {/* Chess Rankings Link */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <FaChess />
                  Looking for Chess Rankings?
                </h2>
                <p className="text-blue-700">
                  View current Chess.com ratings and rankings for all TPMS members.
                </p>
              </div>
              <Link 
                to="/chess-rank"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors flex items-center gap-2"
              >
                View Rankings →
              </Link>
            </div>
          </div>
          
          {/* Events List */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Upcoming Events</h2>
            
            {events.length > 0 ? (
              events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-800">{event.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      event.type === 'Tournament' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {event.type}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{event.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <FiCalendar />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiClock />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiMapPin />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600">No upcoming events at the moment. Check back later!</p>
              </div>
            )}
          </div>
          
          {/* Join CCA Notice */}
          <div className="mt-12 bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Not a member yet?</h3>
            <p className="text-yellow-700 mb-4">
              Join TPMS to participate in our events and activities!
            </p>
            <Link 
              to="/joinus"
              className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-md transition-colors"
            >
              Join TPMS
            </Link>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}; 