import React, { useState } from 'react';
import { Header } from './components/ui/layout/Header';
import { EventsPage } from './components/pages/EventsPage';
import { CheckinPage } from './components/pages/CheckinPage';
import { HomePage } from './components/pages/HomePage';
import { motion } from 'framer-motion';
import { FiCalendar, FiArrowRight, FiAward, FiBell, FiBook, FiUsers } from 'react-icons/fi';

// News Page Component
const NewsPage = () => {
  // News items with icons as fallbacks
  const news = [
    {
      id: 1,
      title: "Chess Tournament Success",
      date: "2024-01-15",
      content: "Our team secured top positions in the inter-polytechnic chess championship. The event saw participation from all major polytechnics in Singapore with over 50 participants competing in various categories.",
      category: "Achievement",
      icon: <FiAward className="w-12 h-12 text-green-500" />
    },
    {
      id: 2,
      title: "New Gaming Room Opening",
      date: "2024-01-10",
      content: "We're excited to announce our new gaming room in Block A. This state-of-the-art facility features new chess sets, go boards, and digital gaming stations for strategic eSports.",
      category: "Announcement",
      icon: <FiBell className="w-12 h-12 text-blue-500" />
    },
    {
      id: 3,
      title: "Strategic Thinking Workshop",
      date: "2024-01-05",
      content: "The strategic thinking workshop conducted by International Master John Doe was a huge success with over 30 participants. Students learned advanced techniques to improve their strategic thinking abilities.",
      category: "Event",
      icon: <FiBook className="w-12 h-12 text-amber-500" />
    },
    {
      id: 4,
      title: "Partnership with Singapore Chess Federation",
      date: "2023-12-20",
      content: "We're proud to announce our new partnership with the Singapore Chess Federation, which will provide our members with more opportunities to participate in national-level competitions.",
      category: "Announcement",
      icon: <FiUsers className="w-12 h-12 text-purple-500" />
    }
  ];

  return (
    <div className="container mx-auto mt-8 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <h2 className="text-3xl font-bold mb-4 text-gray-800">Latest News & Updates</h2>
        <p className="text-gray-600 max-w-3xl">
          Stay up to date with the latest happenings, achievements, and announcements from the TP Mindsport Club community.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {news.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="group"
          >
            <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col hover:shadow-xl transition-shadow">
              <div className="h-48 overflow-hidden bg-gray-100 flex items-center justify-center">
                {/* Use icon instead of trying to load images */}
                <div className="flex flex-col items-center justify-center text-gray-400">
                  {item.icon}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-center mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.category === 'Achievement' ? 'bg-green-100 text-green-800' :
                    item.category === 'Announcement' ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {item.category}
                  </span>
                  <div className="text-sm text-gray-500 flex items-center">
                    <FiCalendar className="w-3 h-3 mr-1" />
                    {item.date}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-4 flex-grow">{item.content}</p>
                <button className="text-primary-600 font-medium text-sm inline-flex items-center mt-auto group-hover:text-primary-700">
                  Read more <FiArrowRight className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Main App Component
const TPMSApp = () => {
  const [currentPage, setCurrentPage] = useState('home');
  
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      <main className="animate-fade-in">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'news' && <NewsPage />}
        {currentPage === 'events' && <EventsPage />}
        {currentPage === 'check-in' && (
          <CheckinPage 
            studentData={studentData} 
            setStudentData={setStudentData}
          />
        )}
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
  );
}

export default TPMSApp;