import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiImage } from 'react-icons/fi';

// Updated slides with background gradients as fallbacks
const slides = [
  {
    id: 1,
    image: '/images/slide1.jpg',
    title: 'Strategic Thinking',
    subtitle: 'Develop Your Mind',
    description: 'Join our chess tournaments and enhance your strategic thinking abilities',
    gradient: 'bg-gradient-to-r from-blue-800 to-blue-600'
  },
  {
    id: 2,
    image: '/images/slide2.jpg',
    title: 'Team Spirit',
    subtitle: 'Grow Together',
    description: 'Experience the power of collaboration in our team events',
    gradient: 'bg-gradient-to-r from-purple-800 to-indigo-700'
  },
  {
    id: 3,
    image: '/images/slide3.jpg',
    title: 'Competitive Gaming',
    subtitle: 'Rise to the Challenge',
    description: 'Participate in our e-sports tournaments and showcase your skills',
    gradient: 'bg-gradient-to-r from-red-800 to-orange-700'
  },
  {
    id: 4,
    image: '/images/slide4.jpg',
    title: 'Learning Journey',
    subtitle: 'Master the Game',
    description: 'Learn from experienced coaches and improve your gameplay',
    gradient: 'bg-gradient-to-r from-emerald-800 to-teal-700'
  },
  {
    id: 5,
    image: '/images/slide5.jpg',
    title: 'Community',
    subtitle: 'Join Our Family',
    description: 'Be part of a vibrant community of strategic gaming enthusiasts',
    gradient: 'bg-gradient-to-r from-amber-800 to-yellow-700'
  }
];

export const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  
  const handleImageError = (id) => {
    setImageErrors(prev => ({...prev, [id]: true}));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const handlePrevious = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  const handleDotClick = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const currentSlide = slides[currentIndex];
  const hasImageError = imageErrors[currentSlide.id];

  return (
    <div className="relative h-[600px] overflow-hidden bg-gray-900">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="absolute w-full h-full"
        >
          <div className={`relative w-full h-full ${hasImageError ? currentSlide.gradient : ''}`}>
            {!hasImageError && (
              <img
                src={currentSlide.image}
                alt={currentSlide.title}
                className="w-full h-full object-cover"
                onError={() => handleImageError(currentSlide.id)}
              />
            )}
            {hasImageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <FiImage className="w-16 h-16 text-white/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="max-w-3xl"
              >
                <h3 className="text-blue-400 text-xl md:text-2xl font-light mb-2">
                  {currentSlide.subtitle}
                </h3>
                <h2 className="text-white text-4xl md:text-6xl font-bold mb-4">
                  {currentSlide.title}
                </h2>
                <p className="text-gray-300 text-lg md:text-xl">
                  {currentSlide.description}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-all"
        onClick={handlePrevious}
      >
        <FiChevronLeft className="w-6 h-6" />
      </button>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-all"
        onClick={handleNext}
      >
        <FiChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-white scale-110'
                : 'bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}; 