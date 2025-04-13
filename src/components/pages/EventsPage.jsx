import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { FiCalendar, FiMapPin, FiInfo, FiFilter, FiTag, FiClock, FiUsers, FiCheck, FiRotateCcw, FiX, FiChevronDown, FiChevronUp, FiChevronRight } from 'react-icons/fi';
import PageTransition from '../ui/PageTransition';
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faHandsHolding, faSeedling, faCalendarAlt, faClock, faMapMarkerAlt, faTicket } from '@fortawesome/free-solid-svg-icons';

// Event data with text-based icons instead of emojis
const events = [
  {
    id: 0,
    title: "Eco Festival: Little Hands, Big Impact",
    date: "April 27, 2025 (Sunday)",
    time: "9:00 A.M. - 12:30 P.M.",
    location: "Tampines West Community Centre, Basketball Court (Level 1)",
    description: "Join our eco-friendly festival that combines learning, experience, and community involvement. Activities include workshops on sustainability, interactive games, and waste reduction awareness. Free entry for all!",
    type: "Special",
    isFeatured: true,
    iconText: "E",
    iconBg: "bg-green-100 text-green-800",
    tags: ["Free Entry", "Environment", "Community"]
  },
  {
    id: 1,
    title: "Weekly Chess Tournament",
    date: "Every Friday, 3-6pm",
    location: "Block 3 Level 2",
    description: "Join our weekly chess tournament and improve your skills! Open to players of all skill levels with prizes for winners.",
    type: "Regular",
    iconText: "C",
    iconBg: "bg-blue-100 text-blue-800"
  },
  {
    id: 2,
    title: "Inter-Polytechnic Championship",
    date: "March 15, 2024",
    location: "TP Auditorium",
    description: "Annual championship between all polytechnics in Singapore. Register by March 10 to represent TP in this prestigious event.",
    type: "Special",
    iconText: "T",
    iconBg: "bg-amber-100 text-amber-800"
  },
  {
    id: 3,
    title: "Strategy Games Workshop",
    date: "February 20, 2024",
    location: "TP Hub, Level 2",
    description: "Learn the basics of strategic board games with our experienced instructors. Perfect for beginners!",
    type: "Workshop",
    iconText: "W",
    iconBg: "bg-emerald-100 text-emerald-800"
  },
  {
    id: 4,
    title: "Go Tournament",
    date: "Every Monday, 4-7pm",
    location: "Block 5 Level 3",
    description: "Weekly Go tournament for enthusiasts. Come practice this ancient strategic board game in a friendly environment.",
    type: "Regular",
    iconText: "G",
    iconBg: "bg-gray-100 text-gray-800"
  },
  {
    id: 5,
    title: "Digital Strategy Gaming Night",
    date: "February 25, 2024",
    location: "Online Event",
    description: "Join us for a night of digital strategy games. We'll be playing various popular titles and competing in friendly matches.",
    type: "Special",
    iconText: "D",
    iconBg: "bg-purple-100 text-purple-800"
  }
];

export const EventsPage = ({ user }) => {
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [showRegisterSuccess, setShowRegisterSuccess] = useState(false);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  // Track which cards are flipped
  const [flippedCards, setFlippedCards] = useState({});
  // Track scroll visibility
  const [visibleSections, setVisibleSections] = useState({});
  
  // Track which eco activity card is flipped
  const [flippedEcoCard, setFlippedEcoCard] = useState(null);
  
  // Refs for scroll tracking
  const featuredRef = useRef(null);
  const upcomingRef = useRef(null);
  
  // Animation controls
  const headerControls = useAnimation();
  const featuredControls = useAnimation();
  const listControls = useAnimation();
  const ecoControls = useAnimation();
  const featuredEventControls = useAnimation();
  
  // Intersection observers
  const [headerRef, headerInView] = useInView({ threshold: 0.3 });
  const [featuredSectionRef, featuredInView] = useInView({ threshold: 0.3 });
  const [listRef, listInView] = useInView({ threshold: 0.1 });
  const [ecoSectionRef, ecoInView] = useInView({ threshold: 0.2 });
  const [featuredEventRef, featuredEventInView] = useInView({ threshold: 0.3 });
  
  // Trigger animations when sections come into view
  useEffect(() => {
    if (headerInView) headerControls.start("visible");
    if (featuredInView) featuredControls.start("visible");
    if (listInView) listControls.start("visible");
    if (ecoInView) ecoControls.start("visible");
    if (featuredEventInView) featuredEventControls.start("visible");
  }, [headerInView, featuredInView, listInView, ecoInView, featuredEventInView, headerControls, featuredControls, listControls, ecoControls, featuredEventControls]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
  
  // Handle scroll visibility
  useEffect(() => {
    const handleScroll = () => {
      const observeSections = (ref, sectionId) => {
        if (ref.current) {
          const top = ref.current.getBoundingClientRect().top;
          if (top < window.innerHeight * 0.75) {
            setVisibleSections(prev => ({ ...prev, [sectionId]: true }));
          }
        }
      };
      
      observeSections(featuredRef, 'featured');
      observeSections(upcomingRef, 'upcoming');
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on initial load
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRegister = (eventId) => {
    setRegisteredEvents([...registeredEvents, eventId]);
    setShowRegisterSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowRegisterSuccess(false);
    }, 3000);
  };
  
  const handleFilterChange = (type) => {
    setSelectedEventType(type);
  };
  
  const toggleFlip = (eventId) => {
    setFlippedCards(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  // Featured event data
  const featuredEvent = {
    id: "eco-festival-2025",
    title: "Eco Festival: Little Hands, Big Impact",
    date: "April 27, 2025",
    time: "Sunday, 9:00 AM - 12:30 PM",
    location: "TPMS School Ground",
    description: "Join our eco-friendly festival that brings together students, educators, and community members to celebrate Earth Day with engaging activities, workshops, and performances focused on environmental conservation.",
    isFree: true,
    image: "/images/eco-festival.jpg", // Replace with actual image path
    registrationUrl: "/register/eco-festival-2025",
    detailsUrl: "/events/eco-festival-2025"
  };

  // List of other upcoming events
  const upcomingEvents = [
    {
      id: 'chess-tournament-2025',
      title: 'Annual Chess Championship',
      type: 'tournament',
      date: '15 May 2025',
      time: '10:00 AM - 6:00 PM',
      location: 'Temasek Polytechnic, Multi-Purpose Hall',
      description: 'Our annual chess tournament brings together players of all skill levels for a day of strategic competition and learning.',
      tags: ['Tournament', 'Competition'],
      image: '/images/chess-tournament.jpg'
    },
    {
      id: 'go-workshop-2025',
      title: 'Go Strategy Workshop',
      type: 'workshop',
      date: '22 May 2025',
      time: '2:00 PM - 5:00 PM',
      location: 'Temasek Polytechnic, Room B1-21',
      description: 'Learn advanced strategies and techniques for the ancient game of Go with our experienced instructors.',
      tags: ['Workshop', 'Training'],
      image: '/images/go-workshop.jpg'
    },
    {
      id: 'friendly-matches-2025',
      title: 'Friendly Matches Day',
      type: 'regular',
      date: '5 June 2025',
      time: '3:00 PM - 7:00 PM',
      location: 'Tampines Hub, Community Room 3',
      description: 'Join us for an afternoon of friendly matches in various mind sports. Perfect for beginners and experienced players alike.',
      tags: ['Casual', 'Social'],
      image: '/images/friendly-matches.jpg'
    },
    {
      id: 'eco-workshop-2025',
      title: 'Sustainability in Board Games',
      type: 'festival',
      date: '12 June 2025',
      time: '4:00 PM - 6:00 PM',
      location: 'Temasek Polytechnic, Innovation Hub',
      description: 'Explore how sustainability concepts are being incorporated into modern board game design and play eco-themed games.',
      tags: ['Sustainability', 'Education'],
      image: '/images/eco-workshop.jpg'
    },
    {
      id: 'xiangqi-meetup-2025',
      title: 'Chinese Chess Meetup',
      type: 'regular',
      date: '19 June 2025',
      time: '5:00 PM - 8:00 PM',
      location: 'Tampines West CC, Activity Room 2',
      description: 'A regular meetup for Chinese Chess enthusiasts. Share strategies, play matches, and improve your skills.',
      tags: ['Casual', 'Social'],
      image: '/images/xiangqi-meetup.jpg'
    }
  ];

  // Filter events based on selected type
  const filteredEvents = selectedEventType === 'all' 
    ? upcomingEvents 
    : upcomingEvents.filter(event => event.type === selectedEventType);

  // Filter animation variants
  const filterVariants = {
    closed: {
      height: 60,
      overflow: "hidden"
    },
    open: {
      height: "auto",
      transition: {
        duration: 0.3
      }
    }
  };

  // Animation variants for flip cards
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

  const handleEcoCardFlip = (id) => {
    setFlippedEcoCard(flippedEcoCard === id ? null : id);
  };

  const ecoActivities = [
    {
      id: "learn",
      title: "LEARN",
      icon: faLeaf,
      color: "from-green-400 to-green-600",
      textColor: "text-green-600",
      description: "Educational workshops and seminars about environmental conservation, biodiversity, and sustainable practices for daily life.",
      linkUrl: "/activities/learn"
    },
    {
      id: "experience",
      title: "EXPERIENCE",
      icon: faHandsHolding,
      color: "from-blue-400 to-blue-600",
      textColor: "text-blue-600",
      description: "Hands-on activities including nature trails, beach clean-ups, tree planting sessions, and biodiversity surveys.",
      linkUrl: "/activities/experience"
    },
    {
      id: "get-involved",
      title: "GET INVOLVED",
      icon: faSeedling,
      color: "from-teal-400 to-teal-600",
      textColor: "text-teal-600",
      description: "Join our eco clubs, volunteer for conservation projects, or become a sustainability ambassador in your community.",
      linkUrl: "/activities/get-involved"
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen pb-16">
        {/* Success message for event registration */}
        <AnimatePresence>
          {showRegisterSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg flex items-center"
            >
              <FiCheck className="text-green-500 mr-2" />
              <span>Successfully registered for the event!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page header */}
        <motion.header 
          ref={headerRef}
          initial="hidden"
          animate={headerControls}
          variants={containerVariants}
          className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-12 md:py-20"
        >
          <div className="container mx-auto px-4">
            <motion.h1 
              variants={itemVariants}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Environmental Events
            </motion.h1>
            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-xl text-blue-100 max-w-2xl mb-8"
            >
              Join our eco-friendly events, workshops, and activities to learn about sustainability and environmental conservation.
            </motion.p>
      </div>
        </motion.header>

        {/* Featured Event Section */}
        <motion.section
          ref={featuredEventRef}
          initial="hidden"
          animate={featuredEventControls}
          variants={containerVariants}
          className="py-16 px-6 md:px-12 bg-gradient-to-r from-green-100 to-teal-100 relative overflow-hidden"
        >
          {/* Animated background elements */}
          <motion.div 
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-green-200 opacity-30"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 45, 0]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-20 -left-20 w-60 h-60 rounded-full bg-teal-200 opacity-30"
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -45, 0]
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
          
          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold text-center text-green-800 mb-3"
          >
            Featured Event
          </motion.h2>
          
          <motion.p
            variants={itemVariants} 
            className="text-center text-gray-600 max-w-3xl mx-auto mb-12"
          >
            Join our flagship event bringing together students, educators, and community members 
            to celebrate and advance our eco initiatives
          </motion.p>
          
          <motion.div
            variants={containerVariants}
            className="max-w-6xl mx-auto"
          >
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row">
                {/* Event Details */}
                <div className="p-8 lg:p-12 lg:w-3/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-100 text-green-800 font-bold py-1 px-3 rounded-full text-sm">
                      April 27, 2025
                    </div>
                    <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                    <div className="bg-teal-100 text-teal-800 font-bold py-1 px-3 rounded-full text-sm">
                      Special Event
                    </div>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                    Eco Festival: Little Hands, Big Impact
                  </h3>
                  
                  <p className="text-gray-600 mb-6">
                    An eco-friendly festival showcasing student projects, interactive workshops, 
                    and engaging activities for all ages. Learn about biodiversity, conservation, 
                    and how small actions can lead to significant environmental impacts.
                  </p>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-start">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-green-600 mt-1 mr-3" />
                      <div>
                        <p className="font-medium text-gray-800">Sunday, April 27, 2025</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FontAwesomeIcon icon={faClock} className="text-green-600 mt-1 mr-3" />
                      <div>
                        <p className="font-medium text-gray-800">9:00 AM - 12:30 PM</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-600 mt-1 mr-3" />
                      <div>
                        <p className="font-medium text-gray-800">Campus Central Park</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FontAwesomeIcon icon={faTicket} className="text-green-600 mt-1 mr-3" />
                      <div>
                        <p className="font-medium text-gray-800">Free Entry</p>
                        <p className="text-gray-500 text-sm">Open to all students and community members</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      className="bg-green-600 hover:bg-green-700 py-2 px-6 font-medium text-white shadow-md hover:shadow-lg transition-all"
                      onClick={() => {
                        setRegisteredEvents(prev => {
                          if (!prev.includes("eco-festival-2025")) {
                            return [...prev, "eco-festival-2025"];
                          }
                          return prev;
                        });
                        setShowRegisterSuccess(true);
                        setTimeout(() => setShowRegisterSuccess(false), 3000);
                      }}
                    >
                      Register Now
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-50 py-2 px-6 font-medium"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
                
                {/* Visual Element */}
                <div className="lg:w-2/5 bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center p-8 lg:p-0">
                  <div className="relative h-60 w-60">
                    {/* Animated icons */}
                    <motion.div
                      className="absolute"
                      animate={{
                        rotate: [0, 360],
                        opacity: [0.8, 1, 0.8]
                      }}
                      transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      {[...Array(8)].map((_, index) => (
                        <motion.div
                          key={index}
                          className="absolute"
                          style={{
                            transform: `rotate(${index * 45}deg) translateY(-100px)`,
                            transformOrigin: "center center"
                          }}
                          animate={{ 
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.5
                          }}
                        >
                          <FontAwesomeIcon 
                            icon={[faLeaf, faSeedling, faHandsHolding][index % 3]} 
                            className="text-white text-2xl opacity-80" 
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                    
                    {/* Central element */}
                    <motion.div
                      className="h-40 w-40 bg-white bg-opacity-30 rounded-full flex items-center justify-center absolute top-10 left-10"
                      animate={{ 
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <motion.div 
                        className="h-32 w-32 bg-white bg-opacity-40 rounded-full flex items-center justify-center"
                        animate={{ 
                          rotate: [0, 5, 0, -5, 0]
                        }}
                        transition={{
                          duration: 7,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <FontAwesomeIcon 
                          icon={faLeaf} 
                          className="text-white text-5xl" 
                        />
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Eco Activities Section */}
        <motion.section 
          ref={ecoSectionRef}
          initial="hidden"
          animate={ecoControls}
          variants={containerVariants}
          className="py-16 px-6 md:px-12 bg-gradient-to-r from-green-50 to-teal-50"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold text-center text-green-700 mb-2"
          >
            Eco Activities
          </motion.h2>
          
          <motion.p 
            variants={itemVariants}
            className="text-center text-gray-600 max-w-3xl mx-auto mb-12"
          >
            Engage with nature and sustainability through our three core activity pillars
          </motion.p>
          
          <motion.div 
            variants={containerVariants}
            className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {ecoActivities.map((activity) => (
              <motion.div
                key={activity.id}
                variants={itemVariants}
                className="perspective-1000"
              >
                <div 
                  className={`relative w-full h-96 transform-style-3d transition-transform duration-700 ${
                    flippedCards[activity.id] ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* Card Front */}
                  <div 
                    className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer"
                    onClick={() => toggleFlip(activity.id)}
                  >
                    <div className={`h-1/2 bg-gradient-to-br ${activity.color} flex items-center justify-center`}>
                      <FontAwesomeIcon 
                        icon={activity.icon} 
                        className="text-white text-6xl"
                      />
                    </div>
                    <div className="p-6 text-center">
                      <h3 className={`text-2xl font-bold mb-2 ${activity.textColor}`}>
                        {activity.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Click to learn more
                      </p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFlip(activity.id);
                        }}
                        className={`mt-2 bg-transparent border ${activity.textColor} border-current rounded-full px-4 py-2 font-medium hover:bg-opacity-10 hover:bg-current transition-colors`}
                      >
                        Flip Card
                      </button>
                    </div>
                  </div>
                  
                  {/* Card Back */}
                  <div 
                    className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-lg overflow-hidden rotate-y-180 cursor-pointer"
                    onClick={() => toggleFlip(activity.id)}
                  >
                    <div className="p-8 flex flex-col h-full">
                      <h3 className={`text-2xl font-bold mb-4 ${activity.textColor}`}>
                        {activity.title}
                      </h3>
                      <p className="text-gray-600 flex-grow">
                        {activity.description}
                      </p>
                      <div className="mt-6 flex items-center justify-between">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFlip(activity.id);
                          }}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          Flip Back
                        </button>
                        <Link 
                          to={activity.linkUrl}
                          onClick={(e) => e.stopPropagation()}
                          className={`${activity.textColor} font-medium flex items-center hover:underline`}
                        >
                          Learn More <FiChevronRight className="ml-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* Event filters section with animation */}
        <section className="py-8 bg-gray-50 border-b border-gray-200">
          <div className="container mx-auto px-4">
            <motion.div 
              animate={visibleSections.filterOpen ? "open" : "closed"}
              variants={filterVariants}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div 
                className="p-4 flex justify-between items-center cursor-pointer"
                onClick={() => setVisibleSections(prev => ({ ...prev, filterOpen: !prev.filterOpen }))}
              >
                <div className="flex items-center">
                  <FiFilter className="mr-2 text-gray-500" />
                  <h3 className="font-medium text-lg">Filter Events</h3>
                </div>
                <motion.div
                  animate={{ rotate: visibleSections.filterOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FiChevronDown className="text-gray-500" />
                </motion.div>
              </div>
              
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedEventType === 'all'
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => handleFilterChange('all')}
                  >
                    All
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedEventType === 'tournament'
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => handleFilterChange('tournament')}
                  >
                    Tournaments
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedEventType === 'workshop'
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => handleFilterChange('workshop')}
                  >
                    Workshops
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedEventType === 'festival'
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => handleFilterChange('festival')}
                  >
                    Festival
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedEventType === 'regular'
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => handleFilterChange('regular')}
                  >
                    Regular
                  </motion.button>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-sm text-blue-600 flex items-center"
                    onClick={() => handleFilterChange('all')}
                  >
                    <FiRotateCcw className="mr-1" />
                    Reset Filters
                  </motion.button>
                </div>
              </div>
          </motion.div>
          </div>
        </section>

        {/* Upcoming events section */}
        <motion.section 
          ref={listRef}
          initial="hidden"
          animate={listControls}
          variants={containerVariants}
          className="py-12"
        >
          <div className="container mx-auto px-4">
            <motion.h2 
              variants={itemVariants}
              className="text-2xl font-bold mb-8"
            >
              {selectedEventType === "all" 
                ? "All Upcoming Events" 
                : `${selectedEventType} Events`}
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    variants={itemVariants}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    {flippedCards[event.id] ? (
                      // Back of card
                      <motion.div
                        initial={{ rotateY: 180, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: 180, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="h-full bg-white rounded-xl shadow-md p-6 flex flex-col"
                        style={{ minHeight: "380px" }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold">{event.title}</h3>
                          <button 
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => toggleFlip(event.id)}
                          >
                            <FiX className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <p className="text-gray-600 mb-6 flex-grow">{event.description}</p>
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center text-sm">
                            <FiCalendar className="text-green-500 mr-2" />
                            <span>{event.date}, {event.time}</span>
                          </div>
                          <div className="flex items-start text-sm">
                            <FiMapPin className="text-green-500 mr-2 mt-1" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                          {event.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {tag}
                            </span>
        ))}
      </div>
      
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          className={`px-4 py-2 bg-green-500 text-white rounded-lg flex items-center justify-center ${
                            registeredEvents.includes(event.id) ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={registeredEvents.includes(event.id)}
                          onClick={() => !registeredEvents.includes(event.id) && handleRegister(event.id)}
                        >
                          {registeredEvents.includes(event.id) ? (
                            <>
                              <FiCheck className="mr-2" />
                              <span>Already Registered</span>
                            </>
                          ) : (
                            <span>Register Now</span>
                          )}
                        </motion.button>
                        
                        <div className="mt-4 text-center">
                          <div className="text-xs text-gray-500">Click to flip back</div>
                        </div>
                      </motion.div>
                    ) : (
                      // Front of card
                      <motion.div
                        initial={{ rotateY: -180, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: -180, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className={`relative bg-white rounded-xl shadow-md overflow-hidden ${
                          visibleSections.expandedEvent === event.id ? 'h-auto' : 'h-[380px]'
                        }`}
                      >
                        <div 
                          className={`absolute top-0 left-0 w-full h-24 bg-gradient-to-br ${event.iconBg} flex items-center justify-center`}
                        >
                          <span className="text-4xl">{event.iconText}</span>
                        </div>
                        
                        <div className="pt-28 px-6 pb-6">
                          <div className="flex flex-col">
                            <div className="mb-auto">
                              {event.isFeatured && (
                                <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium mb-2">
                                  Featured
                                </span>
                              )}
                              
                              <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                              
                              <div className="flex items-center text-sm text-gray-600 mb-1">
                                <FiCalendar className="mr-2 text-gray-400" />
                                <span>{event.date}</span>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600 mb-1">
                                <FiClock className="mr-2 text-gray-400" />
                                <span>{event.time}</span>
                              </div>
                              
                              <div className="flex items-start text-sm text-gray-600 mb-4">
                                <FiMapPin className="mr-2 text-gray-400 mt-1" />
                                <span>{event.location}</span>
                              </div>
                              
                              <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                            </div>
                            
                            <div className="flex justify-between items-center mt-4">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="text-blue-600 flex items-center text-sm font-medium"
                                onClick={() => toggleFlip(event.id)}
                              >
                                <FiInfo className="mr-1" />
                                Details
                              </motion.button>
                              
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`px-4 py-2 bg-green-500 text-white rounded-lg text-sm ${
                                  registeredEvents.includes(event.id) ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                                disabled={registeredEvents.includes(event.id)}
                                onClick={() => !registeredEvents.includes(event.id) && handleRegister(event.id)}
                              >
                                {registeredEvents.includes(event.id) ? (
                                  <>
                                    <FiCheck className="mr-1 inline" />
                                    Registered
                                  </>
                                ) : (
                                  "Register"
                                )}
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
      {filteredEvents.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-gray-500 text-lg">No events found for this category. Please try another filter.</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
                  onClick={() => handleFilterChange('all')}
                >
                  View All Events
                </motion.button>
              </motion.div>
      )}
    </div>
        </motion.section>
        
        {/* CSS for card flip effect */}
        <style jsx>{`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(72, 187, 120, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(72, 187, 120, 0); }
            100% { box-shadow: 0 0 0 0 rgba(72, 187, 120, 0); }
          }
          
          .pulse {
            animation: pulse 2s infinite;
          }
          
          .line-clamp-3 {
            overflow: hidden;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
          }
          
          .perspective-1000 {
            perspective: 1000px;
          }
          
          .transform-style-3d {
            transform-style: preserve-3d;
          }
          
          .backface-hidden {
            backface-visibility: hidden;
          }
          
          .rotate-y-180 {
            transform: rotateY(180deg);
          }
        `}</style>
      </div>
    </PageTransition>
  );
}; 