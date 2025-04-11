import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "../button";
import { FiChevronRight, FiUsers, FiCalendar, FiAward, FiBookOpen } from 'react-icons/fi';

export const IntroSection = () => {
  const featuredItems = [
    {
      icon: <FiUsers className="w-8 h-8 text-smu-red" />,
      title: "Join Our Club",
      description: "Become part of our growing community of strategic thinkers and mind sport enthusiasts.",
      link: "#"
    },
    {
      icon: <FiCalendar className="w-8 h-8 text-smu-red" />,
      title: "Upcoming Tournaments",
      description: "Check out our schedule of chess, Go, and other strategic game tournaments.",
      link: "#"
    },
    {
      icon: <FiAward className="w-8 h-8 text-smu-red" />,
      title: "Student Achievements",
      description: "Discover the accomplishments of our club members in national and international competitions.",
      link: "#"
    },
    {
      icon: <FiBookOpen className="w-8 h-8 text-smu-red" />,
      title: "Learning Resources",
      description: "Access learning materials and tutorials to improve your strategic thinking skills.",
      link: "#"
    }
  ];

  return (
    <>
      {/* Hero Section with Banner Image */}
      <div className="relative overflow-hidden">
        {/* Background Image - using a placeholder until image is available */}
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-full bg-gradient-to-r from-smu-navy to-smu-blue bg-opacity-90"
            style={{
              backgroundImage: "url('/images/banner.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-smu-navy/80 to-smu-blue/60"></div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4"
            >
              Welcome to Temasek Polytechnic<br/>
              <span className="text-smu-gold">Mindsport Club</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-white/90 mb-8 max-w-2xl"
            >
              Fostering strategic thinking, intellectual challenge and community through the world of mind sports.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap gap-4"
            >
              <Button 
                className="bg-smu-red hover:bg-smu-red/90 text-white px-6 py-3 rounded-md transition-all group"
              >
                <span className="flex items-center">
                  Join Us
                  <FiChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
              <Button 
                variant="outline" 
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-6 py-3 rounded-md transition-all"
              >
                Learn More
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Featured Content Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-smu-navy mb-4">Discover Mindsport Club</h2>
            <p className="text-smu-gray max-w-2xl mx-auto">
              Explore opportunities to develop your strategic thinking, connect with like-minded students, and represent Temasek Polytechnic in competitions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 flex flex-col"
              >
                <div className="mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-smu-navy mb-2">{item.title}</h3>
                <p className="text-smu-gray mb-4 flex-grow">{item.description}</p>
                <a 
                  href={item.link} 
                  className="text-smu-red font-medium inline-flex items-center group"
                >
                  Learn more 
                  <FiChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="bg-smu-lightgray py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-smu-red mb-2">500+</div>
              <div className="text-smu-navy font-medium">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-smu-red mb-2">24</div>
              <div className="text-smu-navy font-medium">Annual Events</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-smu-red mb-2">15+</div>
              <div className="text-smu-navy font-medium">Competition Achievements</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 