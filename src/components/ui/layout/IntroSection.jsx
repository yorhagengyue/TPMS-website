import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "../button";
import { FiChevronRight, FiUsers, FiCalendar, FiAward, FiBookOpen, FiLogIn, FiUserPlus } from 'react-icons/fi';
import { Carousel } from "../carousel";
import { Link } from 'react-router-dom';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

export const IntroSection = ({ user }) => {
  // Check if we're on mobile
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const featuredItems = [
    {
      icon: <FiUsers className="w-8 h-8 text-primary-600" />,
      title: "Join Our Club",
      description: "Become part of our growing community of strategic thinkers and mind sport enthusiasts.",
      link: user ? "/events" : "/register"
    },
    {
      icon: <FiCalendar className="w-8 h-8 text-primary-600" />,
      title: "Upcoming Tournaments",
      description: "Check out our schedule of chess, Go, and other strategic game tournaments.",
      link: "/events"
    },
    {
      icon: <FiAward className="w-8 h-8 text-primary-600" />,
      title: "Student Achievements",
      description: "Discover the accomplishments of our club members in national and international competitions.",
      link: "#"
    },
    {
      icon: <FiBookOpen className="w-8 h-8 text-primary-600" />,
      title: "Learning Resources",
      description: "Access learning materials and tutorials to improve your strategic thinking skills.",
      link: "#"
    }
  ];

  return (
    <>
      {/* Responsive Carousel Section - Increased Height */}
      <div className={`w-full ${isMobile ? 'aspect-ratio-16-9 carousel-mobile-height' : 'h-[700px]'}`}>
        <Carousel 
          aspectRatio="16/9"
          height={isMobile ? null : "700px"}
          maxHeight={isMobile ? "65vh" : "85vh"}
        />
      </div>

      {/* Hero Content - Responsive layout improvements */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4"
            >
              Welcome to Temasek Polytechnic<br/>
              <span className="text-primary-400">Mindsport Club</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-white/90 mb-6 md:mb-8 max-w-2xl"
            >
              Fostering strategic thinking, intellectual challenge and community through the world of mind sports.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap gap-3 md:gap-4"
            >
              {/* Conditional buttons based on authentication status */}
              {user ? (
                /* For logged in users */
                <Link to="/events">
                  <Button 
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-md transition-all group text-sm md:text-base"
                  >
                    <span className="flex items-center">
                      Explore Events
                      <FiChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
              ) : (
                /* For guests */
                <Link to="/register">
                  <Button 
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-md transition-all group text-sm md:text-base"
                  >
                    <span className="flex items-center">
                      <FiUserPlus className="mr-1 md:mr-2" />
                      Join Us
                      <FiChevronRight className="ml-1 md:ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
              )}
              
              {user ? (
                /* For logged in users */
                <Link to="/check-in">
                  <Button 
                    variant="outline" 
                    className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-4 py-2 md:px-6 md:py-3 rounded-md transition-all group text-sm md:text-base"
                  >
                    <span className="flex items-center">
                      Check In Now
                      <FiChevronRight className="ml-1 md:ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
              ) : (
                /* For guests */
                <Link to="/login">
                  <Button 
                    variant="outline" 
                    className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-4 py-2 md:px-6 md:py-3 rounded-md transition-all group text-sm md:text-base"
                  >
                    <span className="flex items-center">
                      <FiLogIn className="mr-1 md:mr-2" />
                      Log In
                      <FiChevronRight className="ml-1 md:ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Featured Content Section - Responsive improvement */}
      <div className="bg-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 md:mb-4">Discover Mindsport Club</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
              Explore opportunities to develop your strategic thinking, connect with like-minded students, and represent Temasek Polytechnic in competitions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {featuredItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 md:p-6 flex flex-col"
              >
                <div className="mb-3 md:mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-3 md:mb-4 flex-grow text-sm md:text-base">{item.description}</p>
                <Link 
                  to={item.link} 
                  className="text-primary-600 font-medium inline-flex items-center group text-sm md:text-base"
                >
                  Learn more 
                  <FiChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="bg-gray-100 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-1 md:mb-2">500+</div>
              <div className="text-gray-800 font-medium text-sm md:text-base">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-1 md:mb-2">24</div>
              <div className="text-gray-800 font-medium text-sm md:text-base">Annual Events</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-1 md:mb-2">15+</div>
              <div className="text-gray-800 font-medium text-sm md:text-base">Competition Achievements</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 