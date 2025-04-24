import React from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiArrowRight, FiBell, FiUsers, FiMapPin } from 'react-icons/fi';

export const NewsPage = () => {
  // Only keep orientation and eco fest news items
  const news = [
    {
      id: 1,
      title: "New Member Orientation 2025",
      date: "2025-05-02",
      content: "Join us for the New Member Orientation on 2 May from 6pm to 9pm. Learn about our club activities, meet current members, and get started with your favorite mind sports!",
      category: "Orientation",
      icon: <FiUsers className="w-12 h-12 text-blue-500" />,
      location: "Student Alumni Hub L2 (behind Macs)"
    },
    {
      id: 2,
      title: "Eco Festival: Little Hands, Big Impact",
      date: "2025-04-27",
      content: "Join our eco-friendly festival that combines learning, experience, and community involvement. Activities include workshops on sustainability, interactive games, and waste reduction awareness.",
      category: "Festival",
      icon: <FiBell className="w-12 h-12 text-green-500" />,
      location: "Tampines West Community Centre"
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
        <h2 className="text-3xl font-bold mb-4 text-gray-800">Upcoming Events</h2>
        <p className="text-gray-600 max-w-3xl">
          Stay up to date with our upcoming orientation session and eco festival.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {news.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="group"
          >
            <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col hover:shadow-xl transition-shadow">
              <div className="h-48 overflow-hidden bg-gradient-to-r from-blue-500 to-green-400 flex items-center justify-center">
                {/* Use icon instead of trying to load images */}
                <div className="flex flex-col items-center justify-center text-white">
                  {item.icon}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-center mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.category === 'Orientation' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {item.category}
                  </span>
                  <div className="text-sm text-gray-500 flex items-center">
                    <FiCalendar className="w-3 h-3 mr-1" />
                    {new Date(item.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-4 flex-grow">{item.content}</p>
                
                {item.location && (
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <FiMapPin className="mr-2" />
                    <span>{item.location}</span>
                  </div>
                )}
                
                <button className="text-primary-600 font-medium text-sm inline-flex items-center mt-auto group-hover:text-primary-700">
                  More details <FiArrowRight className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}; 