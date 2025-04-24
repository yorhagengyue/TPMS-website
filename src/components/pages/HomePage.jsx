import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiUsers, FiCalendar, FiAward, FiStar, FiArrowRight, FiCheckSquare, FiActivity, FiInstagram, FiMapPin, FiClock, FiX, FiUser } from 'react-icons/fi';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import PageTransition from '../ui/PageTransition';
import { useInView } from "react-intersection-observer";
import HeroCarouselNew from '../HeroCarouselNew';

const ecoActivities = [
  {
    id: 1,
    title: "LEARN",
    description: "Discover environmental knowledge through interactive workshops, talks, and exhibits. Learn about climate change, biodiversity, waste management, and sustainable living practices.",
    icon: "🌱",
    color: "from-green-400 to-teal-500",
    url: "/learn-more",
    detailedInfo: [
      "Environmental Workshops: Monthly sessions on different ecological topics",
      "Guest Speakers: Industry experts sharing insights and experiences",
      "Educational Exhibits: Interactive displays on climate science and conservation",
      "Digital Resources: Access to our library of sustainability guides and articles"
    ]
  },
  {
    id: 2,
    title: "EXPERIENCE",
    description: "Immerse yourself in nature through guided activities. Participate in tree planting, nature walks, recycling projects, and educational games designed to foster appreciation for our environment.",
    icon: "🌿",
    color: "from-blue-400 to-cyan-500",
    url: "/experience",
    detailedInfo: [
      "Nature Trails: Guided walks through local green spaces and reserves",
      "Tree Planting Initiatives: Join our monthly tree planting activities",
      "Recycling Workshops: Hands-on sessions to learn creative reuse and recycling",
      "Outdoor Classroom: Educational activities in natural settings"
    ]
  },
  {
    id: 3,
    title: "GET INVOLVED",
    description: "Take action and make a difference! Join community clean-up events, volunteer for conservation projects, participate in eco-challenges, and connect with like-minded individuals.",
    icon: "🌏",
    color: "from-purple-400 to-indigo-500",
    url: "/get-involved",
    detailedInfo: [
      "Volunteer Program: Regular opportunities to join conservation projects",
      "Community Clean-ups: Organized events to clean beaches, parks, and neighborhoods",
      "Eco-Challenges: Monthly sustainability challenges to participate in",
      "Network Events: Connect with others who share a passion for the environment"
    ]
  }
];

const achievementData = [
  { 
    id: 1, 
    value: "300+", 
    label: "Members", 
    icon: <FiUsers className="text-2xl text-green-500" />,
    description: "Our club has grown to over 300 passionate players and supporters.",
    link: "https://www.instagram.com/tp_mindsports/",
    linkText: "Visit: https://www.instagram.com/tp_mindsports/"
  },
  { 
    id: 2, 
    value: "Venue", 
    label: "Meeting Location", 
    icon: <FiMapPin className="text-2xl text-blue-500" />,
    description: "Every Friday, 6 – 9 PM at the Student Alumni Hub L2 (behind Macs). A dedicated space for practice and tournaments.",
    link: "#",
    linkText: "Find us at SAH L2"
  },
  { 
    id: 3, 
    value: "Weekly", 
    label: "Sessions", 
    icon: <FiCalendar className="text-2xl text-purple-500" />,
    description: "Regular Friday meetups to sharpen skills, play friendly matches, and learn new strategies.",
    link: "/events",
    linkText: "Check our schedule"
  },
  { 
    id: 4, 
    value: "School &", 
    label: "Community", 
    icon: <FiActivity className="text-2xl text-yellow-500" />,
    description: "We partner with TP departments and local clubs to host workshops, exhibitions, and outreach events.",
    link: "/about",
    linkText: "Learn about our partnerships"
  }
];

export const HomePage = ({ user }) => {
  const [flippedCard, setFlippedCard] = useState(null);
  const [expandedAchievement, setExpandedAchievement] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showInstagramPromo, setShowInstagramPromo] = useState(true);
  
  // Animation controls for different sections
  const welcomeControls = useAnimation();
  const featuredControls = useAnimation();
  const ecoControls = useAnimation();
  const statsControls = useAnimation();
  
  // Intersection observers for different sections
  const [welcomeRef, welcomeInView] = useInView({ threshold: 0.3 });
  const [featuredRef, featuredInView] = useInView({ threshold: 0.3 });
  const [ecoRef, ecoInView] = useInView({ threshold: 0.2 });
  const [statsRef, statsInView] = useInView({ threshold: 0.3 });

  // Automatically hide Instagram promo after 10 seconds
  useEffect(() => {
    if (showInstagramPromo) {
      const timer = setTimeout(() => {
        setShowInstagramPromo(false);
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [showInstagramPromo]);

  // Trigger animations when sections come into view
  useEffect(() => {
    if (welcomeInView) welcomeControls.start("visible");
    if (featuredInView) featuredControls.start("visible");
    if (ecoInView) ecoControls.start("visible");
    if (statsInView) statsControls.start("visible");
  }, [welcomeInView, featuredInView, ecoInView, statsInView, welcomeControls, featuredControls, ecoControls, statsControls]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const flipCardVariants = {
    front: {
      rotateY: 0,
      transition: { duration: 0.5 }
    },
    back: {
      rotateY: 180,
      transition: { duration: 0.5 }
    }
  };

  const handleFlip = (id) => {
    if (flippedCard === id) {
      setFlippedCard(null);
    } else {
      setFlippedCard(id);
    }
  };
  
  const handleAchievementExpand = (id) => {
    setExpandedAchievement(expandedAchievement === id ? null : id);
  };

  const handleLearnMore = (e, activity) => {
    e.stopPropagation(); // Prevent card flip when clicking the button
    setSelectedActivity(activity);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedActivity(null), 300); // Clear after animation completes
  };

  // Particle animation for eco activities
  const Particles = ({ color }) => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full bg-gradient-to-r ${color} bg-opacity-70 w-4 h-4`}
            initial={{ 
              x: Math.random() * 100 - 50,
              y: Math.random() * 100 - 50,
              scale: 0,
              opacity: 0
            }}
            animate={{ 
              x: [null, Math.random() * 100 - 50],
              y: [null, Math.random() * 100 - 50],
              scale: [0, Math.random() * 0.8 + 0.2],
              opacity: [0, 0.7, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              repeatType: "loop", 
              duration: Math.random() * 5 + 5,
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <PageTransition>
      <div className="relative min-h-screen">
        {/* Hero Carousel - 添加顶部padding以避免被Header遮挡 */}
        <div className="pt-16 md:pt-16">
          <HeroCarouselNew />
        </div>
        
        {/* Floating Instagram Promotion */}
        <AnimatePresence>
          {showInstagramPromo && (
            <motion.div
              initial={{ opacity: 0, y: 100, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="fixed bottom-6 right-6 z-50"
            >
              <div className="bg-white rounded-lg shadow-xl overflow-hidden w-64 border-2 border-pink-400">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <FiInstagram className="text-white text-xl mr-2" />
                    <h3 className="text-white font-bold">TP MINDSPORTS</h3>
                  </div>
                  <button 
                    onClick={() => setShowInstagramPromo(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1"
                  >
                    <FiX />
                  </button>
                </div>
                <div className="p-4">
                  <p className="font-medium text-gray-800 mb-3">Follow our official Instagram account!</p>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <FiClock className="mr-2 text-pink-500" />
                      <span>Every Friday, 6-9PM</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FiMapPin className="mr-2 text-pink-500" />
                      <span>Student Alumni Hub L2 (Behind Macs)</span>
                    </div>
                  </div>
                  <a 
                    href="https://www.instagram.com/tp_mindsports/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-full font-medium block text-center hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    <div className="flex items-center justify-center">
                      <FiInstagram className="mr-2" />
                      <span>Visit Instagram</span>
                    </div>
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Welcome section with personalized greeting for logged in users */}
        <motion.section 
          ref={welcomeRef}
          initial="hidden"
          animate={welcomeControls}
          variants={containerVariants}
          className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-20 relative overflow-hidden"
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white bg-opacity-10 w-4 h-4"
                initial={{ 
                  x: Math.random() * 100 + "%", 
                  y: Math.random() * 100 + "%",
                  scale: Math.random() * 4 + 1
                }}
                animate={{
                  y: [null, Math.random() * 20 - 10 + "%"]
                }}
                transition={{ 
                  repeat: Infinity, 
                  repeatType: "mirror", 
                  duration: Math.random() * 10 + 10
                }}
              />
            ))}
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            {user ? (
              /* Enhanced personalized dashboard for logged-in users */
              <>
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">
                      Welcome back, <span className="text-green-300">{user.name}</span>!
                    </h1>
                    <p className="text-xl text-blue-100">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  
                  <Link to="/check-in" className="mt-4 md:mt-0">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg shadow-lg transition-all flex items-center"
                    >
                      <span className="mr-2">Quick Check-in</span>
                      <FiCheckSquare />
                    </motion.button>
                  </Link>
                </motion.div>
              </>
            ) : (
              /* Original content for non-logged-in users */
              <>
                <motion.div variants={itemVariants}>
                  <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    Welcome new members to <span className="text-green-300">TPMS AY25/26</span> !
                  </h1>
                </motion.div>
                
                <motion.p 
                  variants={itemVariants}
                  className="text-xl md:text-2xl text-blue-100 max-w-2xl mb-8"
                >
                  Join new year orientation on 2 May 6pm-9pm
                </motion.p>
                
                <motion.div variants={itemVariants}>
                  <a 
                    href="#" 
                    className="no-underline"
                  >
                    <motion.button
                      className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-8 rounded-lg shadow-lg transition-all duration-300 transform group relative overflow-hidden"
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.15)"
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="relative z-10 flex items-center">
                        Register Now 
                        <FiChevronRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </span>
                      <motion.span 
                        className="absolute inset-0 bg-green-400"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: 0 }}
                        transition={{ type: "spring", stiffness: 100 }}
                      />
                    </motion.button>
                  </a>
                </motion.div>
              </>
            )}
          </div>
        </motion.section>
        
        {/* Featured event section - Only show if user is NOT logged in */}
        {(!user || Object.keys(user).length === 0) && (
          <motion.section 
            ref={featuredRef}
            initial="hidden"
            animate={featuredControls}
            variants={containerVariants}
            className="py-16 bg-white"
          >
            <div className="container mx-auto px-4">
              <motion.div variants={itemVariants} className="mb-12 text-center">
                <h2 className="text-3xl font-bold mb-4">Featured Event</h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Our flagship environmental event bringing together students, educators, and community members for a day of learning and action.
                </p>
              </motion.div>
              
              <motion.div
                variants={itemVariants}
                className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/2 p-8 md:p-12">
                    <div className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
                      April 27, 2025
                    </div>
                    
                    <h3 className="text-2xl md:text-3xl font-bold mb-4">
                      Eco Festival: Little Hands, Big Impact
                    </h3>
                    
                    <p className="text-gray-600 mb-6">
                      Join our eco-friendly festival that combines learning, experience, and community involvement. Activities include workshops on sustainability, interactive games, and waste reduction awareness. Free entry for all!
                    </p>
                    
                    <div className="mb-8">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                          <FiCalendar className="text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Sunday, April 27, 2025</div>
                          <div className="text-sm text-gray-500">9:00 AM - 12:30 PM</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-1">
                          <FiUsers className="text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Free entry for all!</div>
                          <div className="text-sm text-gray-500">All ages welcome. Perfect for families and students.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:w-1/2 relative overflow-hidden min-h-[300px]">
                    {/* Animated background elements */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500 opacity-80"></div>
                    
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.8 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="relative w-80 h-80">
                        <motion.div
                          animate={{ 
                            rotate: 360
                          }}
                          transition={{ 
                            duration: 60, 
                            repeat: Infinity, 
                            ease: "linear"
                          }}
                          className="absolute inset-0"
                        >
                          {/* Orbiting elements */}
                          {[...Array(8)].map((_, i) => {
                            const angle = (i / 8) * Math.PI * 2;
                            const x = Math.cos(angle) * 120;
                            const y = Math.sin(angle) * 120;
                            
                            return (
                              <motion.div
                                key={i}
                                className="absolute w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center"
                                style={{
                                  left: `calc(50% + ${x}px)`,
                                  top: `calc(50% + ${y}px)`,
                                  transformOrigin: "center"
                                }}
                                animate={{
                                  scale: [1, 1.1, 1],
                                  rotate: [0, 360]
                                }}
                                transition={{
                                  scale: {
                                    duration: 4,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                    delay: i * 0.5
                                  },
                                  rotate: {
                                    duration: 30,
                                    repeat: Infinity,
                                    ease: "linear"
                                  }
                                }}
                              >
                                <span className="text-xl">
                                  {["🌱", "🌍", "🌿", "💧", "🌻", "♻️", "🐟", "🦋"][i]}
                                </span>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                        
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          animate={{
                            scale: [1, 1.05, 1]
                          }}
                          transition={{
                            duration: 5,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        >
                          <div className="w-40 h-40 rounded-full bg-white flex items-center justify-center shadow-xl">
                            <span className="text-7xl">🌎</span>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </div>
                
                {/* Register button section - Changed from Scan Me to direct Google Form Link */}
                <div className="p-6 bg-green-50 border-t border-green-100 rounded-b-2xl">
                  <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="text-gray-700 mb-4 md:mb-0">
                      <p className="font-medium text-lg">Ready to join us? Register for the Eco Festival today!</p>
                      <p className="text-sm text-gray-500">Free entry. Registration helps us prepare for your participation.</p>
                    </div>
                    
                    <a 
                      href="https://docs.google.com/forms/d/e/1FAIpQLSeagdLzx5WmfNDoWhFARYWtf9bchkRlV-pOQJpkXKows_KBXw/viewform" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="no-underline"
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors duration-300 flex items-center"
                      >
                        Register Now
                        <FiChevronRight className="ml-2" />
                      </motion.button>
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>
        )}
        
        {/* Eco activities section with 3D flip cards */}
        {(!user || Object.keys(user).length === 0) && (
        <motion.section 
          ref={ecoRef}
          initial="hidden"
          animate={ecoControls}
          variants={containerVariants}
          className="py-16 bg-gray-50"
        >
          <div className="container mx-auto px-4">
            <motion.div variants={itemVariants} className="mb-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Eco Activities</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Explore our three-part approach to environmental engagement designed to educate, inspire, and empower participants of all ages.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {ecoActivities.map((activity) => (
                <motion.div 
                  key={activity.id}
                  variants={itemVariants}
                  className="perspective-1000 h-[400px] cursor-pointer"
                  onClick={() => handleFlip(activity.id)}
                >
                  <motion.div
                    className="flip-card-inner relative h-full w-full"
                    animate={flippedCard === activity.id ? "back" : "front"}
                    variants={flipCardVariants}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Front of card */}
                    <div className={`flip-card-front absolute inset-0 rounded-xl overflow-hidden shadow-lg bg-gradient-to-br ${activity.color} p-8 flex flex-col items-center justify-center text-white`}>
                      <Particles color={activity.color} />
                      
                      <motion.div
                        className="text-7xl mb-6"
                        animate={{ 
                          y: [0, -10, 0],
                          rotate: [0, 5, 0, -5, 0]
                        }}
                        transition={{ 
                          duration: 5, 
                          repeat: Infinity,
                          repeatType: "loop"
                        }}
                      >
                        {activity.icon}
                      </motion.div>
                      
                      <h3 className="text-2xl font-bold mb-4 text-center">{activity.title}</h3>
                      
                      <div className="mt-auto text-center">
                        <div className="text-sm opacity-70">Click to flip</div>
                        <motion.div 
                          animate={{ y: [0, 5, 0] }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 1.5 
                          }}
                          className="text-xl mt-1"
                        >
                          ↓
                        </motion.div>
                      </div>
                    </div>
                    
                    {/* Back of card */}
                    <div className="flip-card-back absolute inset-0 rounded-xl shadow-lg bg-white p-8 flex flex-col text-gray-800">
                      <h3 className="text-2xl font-bold mb-4">{activity.title}</h3>
                      <p className="flex-grow text-gray-600">{activity.description}</p>
                      
                      <div className="mt-6 flex flex-col items-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`w-full py-2 px-4 rounded-lg transition-colors bg-gradient-to-r ${activity.color} text-white`}
                          onClick={(e) => handleLearnMore(e, activity)}
                        >
                          Learn More
                        </motion.button>
                        
                        <div className="mt-4 text-center">
                          <div className="text-sm text-gray-500">Click to flip back</div>
                          <motion.div
                            animate={{ y: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-xl mt-1"
                          >
                            ↑
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
        )}
        
        {/* Statistics & achievements section - Only show if user is NOT logged in */}
        {(!user || Object.keys(user).length === 0) && (
          <motion.section 
            ref={statsRef}
            initial="hidden"
            animate={statsControls}
            variants={containerVariants}
            className="py-16 bg-white"
          >
            <div className="container mx-auto px-4">
              <motion.div variants={itemVariants} className="mb-12 text-center">
                <h2 className="text-3xl font-bold mb-4">Our Impact</h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Connecting the TP Mindsports community through social engagement and weekly meetups.
                </p>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {achievementData.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    whileHover={{ y: -10, transition: { type: "spring", stiffness: 300 } }}
                    className={`relative bg-white rounded-xl shadow-lg p-6 border-t-4 ${
                      expandedAchievement === item.id ? 'h-auto' : 'h-48'
                    } overflow-hidden transition-all duration-300 cursor-pointer`}
                    onClick={() => handleAchievementExpand(item.id)}
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                        {item.icon}
                      </div>
                      <div>
                        <motion.div 
                          className="text-2xl md:text-3xl font-bold text-gray-800"
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ 
                            duration: 0.8,
                            delay: 0.2 
                          }}
                        >
                          {item.value}
                        </motion.div>
                        <div className="text-gray-600">{item.label}</div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedAchievement === item.id ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className="text-gray-600 mb-4">{item.description}</p>
                          <a 
                            href={item.link} 
                            className="text-blue-600 font-medium flex items-center hover:text-blue-800"
                            target={item.link.startsWith('http') ? "_blank" : "_self"}
                            rel={item.link.startsWith('http') ? "noopener noreferrer" : ""}
                          >
                            👉 {item.linkText} <FiChevronRight className="ml-1" />
                          </a>
                        </motion.div>
                      ) : (
                        <motion.div
                          className="absolute bottom-3 left-0 right-0 text-center text-sm text-blue-500"
                          animate={{ y: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          Click for details
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
        
        {/* CSS for 3D flip effect */}
        <style jsx>{`
          .perspective-1000 {
            perspective: 1000px;
          }
          
          .flip-card-inner {
            transition: transform 0.6s;
            transform-style: preserve-3d;
          }
          
          .flip-card-front, .flip-card-back {
            backface-visibility: hidden;
          }
          
          .flip-card-back {
            transform: rotateY(180deg);
          }
          
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(72, 187, 120, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(72, 187, 120, 0); }
            100% { box-shadow: 0 0 0 0 rgba(72, 187, 120, 0); }
          }
          
          .pulse {
            animation: pulse 2s infinite;
          }
        `}</style>

        {/* Modal for eco activity detailed information */}
        <AnimatePresence>
          {showModal && selectedActivity && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
              onClick={closeModal}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                className={`bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative overflow-hidden`}
                onClick={e => e.stopPropagation()}
              >
                {/* Background gradient banner */}
                <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-r ${selectedActivity.color}`}></div>
                
                <div className="relative z-10">
                  <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center text-3xl shadow-md mx-auto -mt-4 mb-2 border-4 border-white">
                    {selectedActivity.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-center mb-6 mt-2">{selectedActivity.title}</h3>
                  
                  <p className="mb-6 text-gray-700">{selectedActivity.description}</p>
                  
                  <h4 className="font-bold text-lg mb-3 text-gray-800">What we offer:</h4>
                  
                  <ul className="mb-6">
                    {selectedActivity.detailedInfo.map((info, index) => (
                      <motion.li 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start mb-3"
                      >
                        <div className={`rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center bg-gradient-to-r ${selectedActivity.color} text-white text-xs font-bold mr-3 mt-0.5`}>
                          {index + 1}
                        </div>
                        <span className="text-gray-700">{info}</span>
                      </motion.li>
                    ))}
                  </ul>
                  
                  <div className="flex justify-between items-center">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Close
                    </button>
                    
                    <Link to={selectedActivity.url}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-6 py-2 rounded-lg transition-colors bg-gradient-to-r ${selectedActivity.color} text-white flex items-center`}
                      >
                        Get Started
                        <FiArrowRight className="ml-2" />
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}; 