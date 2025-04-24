import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiImage } from 'react-icons/fi';
import { useMediaQuery } from '../../hooks/useMediaQuery';

// 更新轮播图图片，使用本地图片路径并添加内容
const slides = [
  {
    id: 1,
    image: process.env.PUBLIC_URL + '/images/slide1.jpg',
    mobileImage: process.env.PUBLIC_URL + '/images/slide1.jpg',
    gradient: 'bg-gradient-to-r from-blue-800 to-blue-600',
    aspectRatio: '16/9',
    title: 'Exciting Mind Games',
    content: 'Looking for exciting, challenging ways to keep your brain stimulated? Look no further as TPMS opens its doors to you, offering classic games like international chess, chinese chess, and others!\n\nMake sure to come check us out at the CCA fair on 23-24 April at Horseshoe Plaza!',
    contentShort: 'TPMS opens its doors to you!'
  },
  {
    id: 2,
    image: process.env.PUBLIC_URL + '/images/slide2.png',
    mobileImage: process.env.PUBLIC_URL + '/images/slide2.png',
    gradient: 'bg-gradient-to-r from-purple-800 to-indigo-700',
    aspectRatio: '16/9',
    title: 'AY24/25 TPMS Maincomm',
    content: 'AY24/25 TPMS Maincomm signing off… Welcome new maincomm members in the near future!',
    contentShort: 'Farewell AY24/25 Maincomm!'
  },
  {
    id: 3,
    image: process.env.PUBLIC_URL + '/images/slide3.jpg',
    mobileImage: process.env.PUBLIC_URL + '/images/slide3.jpg',
    gradient: 'bg-gradient-to-r from-red-800 to-orange-700',
    aspectRatio: '16/9',
    title: 'Welcome AY25/26 Maincomm',
    content: 'Welcoming our AY25/26 maincomm members into TPMS!!!\n\nIt\'s been a long and tough journey for us guys, but we\'ve finally made it. We\'d like to thank our outgoing maincomm members for their continuous support!',
    contentShort: 'Welcome our new maincomm members!'
  }
];

export const Carousel = ({ aspectRatio = '16/9', height = null, maxHeight = '80vh' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const carouselRef = useRef(null);
  
  // Custom hook to check if we're on mobile
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  // Set dynamic sizing for carousel container
  useEffect(() => {
    if (carouselRef.current && !height) {
      const updateHeight = () => {
        const width = carouselRef.current.offsetWidth;
        const [w, h] = aspectRatio.split('/').map(Number);
        const calculatedHeight = (width * h) / w;
        carouselRef.current.style.height = `${calculatedHeight}px`;
      };
      
      updateHeight();
      window.addEventListener('resize', updateHeight);
      
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, [aspectRatio, height]);
  
  const handleImageError = (id) => {
    console.error(`Failed to load image for slide ${id}`);
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

  // Swipe handlers for mobile
  const handleTouchStart = useRef(null);
  const handleTouchEnd = useRef(null);
  
  useEffect(() => {
    const touchStartHandler = (e) => {
      handleTouchStart.current = e.touches[0].clientX;
    };
    
    const touchEndHandler = (e) => {
      if (!handleTouchStart.current) return;
      
      const touchEnd = e.changedTouches[0].clientX;
      const diff = handleTouchStart.current - touchEnd;
      
      // Swipe threshold
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          // Swipe left, go next
          handleNext();
        } else {
          // Swipe right, go previous
          handlePrevious();
        }
      }
      
      handleTouchStart.current = null;
    };
    
    const currentRef = carouselRef.current;
    if (currentRef) {
      currentRef.addEventListener('touchstart', touchStartHandler);
      currentRef.addEventListener('touchend', touchEndHandler);
    }
    
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('touchstart', touchStartHandler);
        currentRef.removeEventListener('touchend', touchEndHandler);
      }
    };
  }, []);

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

  // 将内容文本转换为带有换行符的JSX
  const formatContent = (content) => {
    if (!content) return null;
    return content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div 
      ref={carouselRef}
      className={`relative w-full overflow-hidden bg-gray-900 ${!height ? 'aspect-ratio-container' : ''}`}
      style={height ? { height } : { maxHeight }}
    >
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
          <div className={`relative w-full h-full flex ${isMobile ? 'flex-col' : 'flex-row'} ${hasImageError ? currentSlide.gradient : ''}`}>
            {/* 图片部分 */}
            <div className={`${isMobile ? 'w-full h-full' : 'w-3/5 h-full'} relative`}>
            {!hasImageError && (
              <img
                  src={isMobile && currentSlide.mobileImage ? currentSlide.mobileImage : currentSlide.image}
                alt={`${currentSlide.title || `Slide ${currentSlide.id}`}`}
                  className="w-full h-full object-contain transition-all"
                onError={() => handleImageError(currentSlide.id)}
                loading="lazy"
              />
            )}
            {hasImageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <FiImage className="w-16 h-16 text-white/30" />
              </div>
            )}
            
              {/* 移动端显示的简短文字 */}
              {isMobile && currentSlide.contentShort && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 md:p-6">
                <h3 className="text-white text-lg md:text-2xl font-bold">{currentSlide.title}</h3>
                  <p className="text-white/90 text-sm mt-1">{currentSlide.contentShort}</p>
                </div>
              )}
            </div>
            
            {/* 桌面端显示的详细文字内容 */}
            {!isMobile && (
              <div className="w-2/5 h-full bg-gray-900/90 p-6 md:p-8 flex flex-col justify-center">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-2xl md:text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600 drop-shadow-sm"
                >
                  {currentSlide.title}
                </motion.h2>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-white text-base md:text-lg space-y-4"
                >
                  <p className="leading-relaxed">{formatContent(currentSlide.content)}</p>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons - Hide on small screens if desired */}
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 md:p-3 rounded-full backdrop-blur-sm transition-all z-10 hidden sm:block"
        onClick={handlePrevious}
        aria-label="Previous slide"
      >
        <FiChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
      </button>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 md:p-3 rounded-full backdrop-blur-sm transition-all z-10 hidden sm:block"
        onClick={handleNext}
        aria-label="Next slide"
      >
        <FiChevronRight className="w-4 h-4 md:w-6 md:h-6" />
      </button>

      {/* Dots Navigation - Make larger touch targets on mobile */}
      <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 md:space-x-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
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