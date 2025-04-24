import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiArrowRight, FiClock, FiMapPin, FiInstagram } from 'react-icons/fi';

// 幻灯片数据
const slides = [
  {
    id: 1,
    image: '/images/slide1.jpg',
    mobileImage: '/images/slide1.jpg',
    title: 'Exciting Mind Games',
    content: 'Looking for exciting, challenging ways to keep your brain stimulated? Look no further as TPMS opens its doors to you, offering classic games like international chess, chinese chess, and others!',
    details: 'Make sure to come check us out at the CCA fair on 23-24 April at Horseshoe Plaza!',
    contentShort: 'TPMS opens its doors to you!',
    color: 'bg-indigo-500',
    link: '/joinus',
    linkText: 'Join Us',
    date: 'April 23-24, 2023',
    location: 'Horseshoe Plaza'
  },
  {
    id: 2,
    image: '/images/slide2.png',
    mobileImage: '/images/slide2.png',
    title: 'AY24/25 TPMS Maincomm',
    content: 'AY24/25 TPMS Maincomm signing off… Welcome new maincomm members in the near future!',
    contentShort: 'Farewell AY24/25 Maincomm!',
    color: 'bg-pink-500',
    link: 'https://www.instagram.com/p/DIwE8TxSOuM/?img_index=1',
    linkText: 'View on Instagram',
    isExternal: true
  },
  {
    id: 3,
    image: '/images/slide3.jpg',
    mobileImage: '/images/slide3.jpg',
    title: 'Welcome AY25/26 Maincomm',
    content: 'Welcoming our AY25/26 maincomm members into TPMS!',
    details: 'It\'s been a long and tough journey for us guys, but we\'ve finally made it. We\'d like to thank our outgoing maincomm members for their continuous support!',
    contentShort: 'Welcome our new maincomm members!',
    color: 'bg-emerald-500',
    link: 'https://www.instagram.com/p/DIxB6_HTTTG/?img_index=1',
    linkText: 'View on Instagram',
    isExternal: true
  }
];

const HeroCarouselNew = ({ height = null, maxHeight = '700px' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef(null);
  const carouselRef = useRef(null);
  const handleTouchStart = useRef(null);
  
  // 自定义媒体查询Hook
  function useMediaQuery(query) {
    const [matches, setMatches] = useState(false);
  
    useEffect(() => {
      const media = window.matchMedia(query);
      if (media.matches !== matches) {
        setMatches(media.matches);
      }
      
      const listener = () => setMatches(media.matches);
      media.addEventListener('change', listener);
      
      return () => media.removeEventListener('change', listener);
    }, [matches, query]);
  
    return matches;
  }
  
  // 检测是否为移动设备
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // 自动播放逻辑
  useEffect(() => {
    startAutoplay();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentIndex]);
  
  const startAutoplay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      if (!isHovering) {
        handleNext();
      }
    }, 6000);
  };
  
  const pauseAutoplay = () => {
    setIsHovering(true);
  };
  
  const resumeAutoplay = () => {
    setIsHovering(false);
  };
  
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

  // Touch handlers for mobile swipe
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
  
  // 动画变体
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      zIndex: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      zIndex: 0,
    })
  };

  // 图片变体
  const imageVariants = {
    enter: { scale: 1.05, opacity: 0.3 },
    center: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: 0.8,
        ease: 'easeOut' 
      } 
    },
    exit: { scale: 1.05, opacity: 0.3 }
  };
  
  // 内容变体
  const contentVariants = {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8, 
        ease: "easeOut" 
      }
    }
  };
  
  // 渐入动画，用于其它元素
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.6, delay: 0.2 }
    }
  };
  
  const currentSlide = slides[currentIndex];
  const colorClass = currentSlide?.color || 'bg-blue-500';
  
  // 计算进度条宽度
  const progressWidth = ((currentIndex + 1) / slides.length) * 100;

  return (
    <div 
      ref={carouselRef}
      className="relative w-full h-[900px] md:h-[1000px] lg:h-[1100px] overflow-hidden"
      onMouseEnter={pauseAutoplay}
      onMouseLeave={resumeAutoplay}
      style={height ? { height } : { maxHeight }}
    >
      {/* 背景图片轮播 */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "tween", duration: 0.8, ease: "easeInOut" },
            opacity: { duration: 0.5 }
          }}
          className="absolute inset-0 w-full h-full"
        >
          {/* 背景图片 */}
          <motion.div
            variants={imageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={isMobile && currentSlide.mobileImage ? currentSlide.mobileImage : currentSlide.image}
              alt={currentSlide.title}
              className="w-full h-full object-contain"
              onError={() => handleImageError(currentSlide.id)}
              loading="lazy"
            />
            
            {/* 渐变叠加层 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10"></div>
            
            {/* 主题色彩叠加 */}
            <div className={`absolute inset-0 ${colorClass} opacity-10`}></div>
          </motion.div>
          
          {/* 内容叠加层 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="container mx-auto px-6 md:px-12 flex flex-col items-center md:items-start justify-center h-full">
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                className="max-w-4xl text-center md:text-left"
              >
                {/* 主标题 */}
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 md:mb-6 leading-tight">
                  {currentSlide.title}
                </h2>
                
                {/* 内容文本 */}
                <p className="text-lg md:text-xl text-white/90 mb-6 md:mb-8 max-w-2xl">
                  {currentSlide.content}
                </p>
                
                {/* 详细信息 */}
                {currentSlide.details && (
                  <p className="text-md md:text-lg text-white/70 mb-8 max-w-2xl">
                    {currentSlide.details}
                  </p>
                )}
                
                {/* 日期和地点信息 */}
                {(currentSlide.date || currentSlide.location) && (
                  <div className="flex flex-col md:flex-row gap-4 mb-8 text-white/80">
                    {currentSlide.date && (
                      <div className="flex items-center">
                        <FiClock className="mr-2" />
                        <span>{currentSlide.date}</span>
                      </div>
                    )}
                    {currentSlide.location && (
                      <div className="flex items-center">
                        <FiMapPin className="mr-2" />
                        <span>{currentSlide.location}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 行动按钮 */}
                {currentSlide.link && (
                  <motion.div variants={fadeIn} initial="hidden" animate="visible">
                    {currentSlide.isExternal ? (
                      <a 
                        href={currentSlide.link} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center px-6 py-3 ${colorClass} text-white rounded-full font-medium text-lg transition-transform hover:scale-105 shadow-lg`}
                      >
                        {currentSlide.linkText || 'Learn More'}
                        {currentSlide.isExternal ? <FiInstagram className="ml-2" /> : <FiArrowRight className="ml-2" />}
                      </a>
                    ) : (
                      <a 
                        href={currentSlide.link} 
                        className={`inline-flex items-center px-6 py-3 ${colorClass} text-white rounded-full font-medium text-lg transition-transform hover:scale-105 shadow-lg`}
                      >
                        {currentSlide.linkText || 'Learn More'}
                        <FiArrowRight className="ml-2" />
                      </a>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* 导航按钮 */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between items-center px-4 md:px-10 z-10">
        <motion.button
          onClick={handlePrevious}
          initial={{ opacity: 0.6 }}
          whileHover={{ opacity: 1, scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full p-2 md:p-4 transition-all border border-white/20 shadow-lg"
          aria-label="Previous slide"
        >
          <FiChevronLeft className="w-6 h-6 text-white" />
        </motion.button>
        
        <motion.button
          onClick={handleNext}
          initial={{ opacity: 0.6 }}
          whileHover={{ opacity: 1, scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full p-2 md:p-4 transition-all border border-white/20 shadow-lg"
          aria-label="Next slide"
        >
          <FiChevronRight className="w-6 h-6 text-white" />
        </motion.button>
      </div>
      
      {/* 底部控制区 */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-10">
        <div className="container mx-auto flex flex-col md:flex-row md:items-center md:justify-between">
          {/* 分页指示器 */}
          <div className="flex space-x-3 justify-center md:justify-start">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`group relative h-3 transition-all duration-300 ${
                  index === currentIndex ? 'w-8' : 'w-3'
                }`}
              >
                <span 
                  className={`absolute inset-0 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? `${colorClass} shadow-md` 
                      : 'bg-white/40 group-hover:bg-white/60'
                  }`} 
                />
              </button>
            ))}
          </div>
          
          {/* 进度条 */}
          <div className="hidden md:block w-64 h-1 bg-white/20 rounded-full overflow-hidden mt-4 md:mt-0">
            <motion.div 
              className={`h-full ${colorClass}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressWidth}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          
          {/* 幻灯片计数器 */}
          <div className="text-white/60 text-sm font-medium hidden md:block">
            <span className="text-white">{currentIndex + 1}</span>
            <span className="mx-1">/</span>
            <span>{slides.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCarouselNew;
