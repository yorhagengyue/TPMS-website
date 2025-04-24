import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 幻灯片数据
const slides = [
  {
    id: 1,
    image: '/images/slide1.jpg',
    title: 'Exciting Mind Games',
    subtitle: 'Looking for exciting, challenging ways to keep your brain stimulated? Look no further!'
  },
  {
    id: 2,
    image: '/images/slide2.png',
    title: 'AY24/25 TPMS Maincomm',
    subtitle: 'AY24/25 TPMS Maincomm signing off… Welcome new maincomm members in the near future!'
  },
  {
    id: 3,
    image: '/images/slide3.jpg',
    title: 'Welcome AY25/26 Maincomm',
    subtitle: 'Welcoming our AY25/26 maincomm members into TPMS!'
  }
];

const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const intervalRef = useRef(null);
  
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
      handleNext();
    }, 5000);
  };
  
  const pauseAutoplay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  
  const resumeAutoplay = () => {
    if (!intervalRef.current) {
      startAutoplay();
    }
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
  
  // 动画变体
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1.1
    }),
    center: {
      x: 0,
      opacity: 1,
      zIndex: 1,
      scale: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      zIndex: 0,
      scale: 0.9
    })
  };

  // 图片变体
  const imageVariants = {
    enter: { scale: 1.2, opacity: 0.8 },
    center: { 
      scale: 1.05, 
      opacity: 1,
      transition: { 
        duration: 6, 
        ease: 'easeOut' 
      } 
    },
    exit: { scale: 1.1, opacity: 0.8 }
  };
  
  // 标题变体
  const titleVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };
  
  // 副标题变体
  const subtitleVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.8,
        delay: 0.2,
        ease: "easeOut"
      }
    }
  };
  
  // 导航按钮变体
  const navButtonVariants = {
    initial: { opacity: 0.7, scale: 1 },
    hover: { opacity: 1, scale: 1.1 },
    tap: { scale: 0.95 }
  };
  
  return (
    <div 
      className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden bg-gray-900"
      onMouseEnter={pauseAutoplay}
      onMouseLeave={resumeAutoplay}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.5 },
            scale: { duration: 0.5 }
          }}
          className="absolute w-full h-full"
        >
          {/* 带动画的幻灯片主体 */}
          <div className="relative w-full h-full overflow-hidden">
            {/* 图片带视差放大效果 */}
            <motion.div
              className="absolute inset-0"
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <img
                src={slides[currentIndex].image}
                alt={slides[currentIndex].title}
                className="w-full h-full object-cover"
              />
            </motion.div>
            
            {/* 增强渐变遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            
            {/* 添加一个底部更强的渐变 */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/90 to-transparent"></div>
            
            {/* 文本内容区带交错动画 */}
            <div className="absolute bottom-16 md:bottom-24 left-0 right-0 px-6 md:px-16 z-10">
              <motion.h2 
                className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-4 drop-shadow-lg"
                variants={titleVariants}
                initial="hidden"
                animate="visible"
                key={`title-${currentIndex}`}
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/80">
                  {slides[currentIndex].title}
                </span>
              </motion.h2>
              
              <motion.p 
                className="text-white text-lg md:text-xl opacity-90 max-w-2xl drop-shadow-lg"
                variants={subtitleVariants}
                initial="hidden"
                animate="visible"
                key={`subtitle-${currentIndex}`}
              >
                {slides[currentIndex].subtitle}
              </motion.p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* 导航按钮 - 仅在桌面端显示 - 增强设计 */}
      {!isMobile && (
        <>
          <motion.button
            onClick={handlePrevious}
            variants={navButtonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="absolute left-5 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm hover:bg-black/50 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center z-10 transition-all border border-white/10"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>
          <motion.button
            onClick={handleNext}
            variants={navButtonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="absolute right-5 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm hover:bg-black/50 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center z-10 transition-all border border-white/10"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </>
      )}
      
      {/* 分页指示器 - 美化设计 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-10">
        {slides.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => handleDotClick(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-[#ff5252] shadow-md shadow-[#ff5252]/30'
                : 'bg-white/50 hover:bg-[#ff5252]/70'
            }`}
            initial={{ scale: 1 }}
            animate={{ 
              scale: index === currentIndex ? 1.2 : 1,
              transition: { duration: 0.3 }
            }}
            whileHover={{ 
              scale: 1.3,
              transition: { duration: 0.2 }
            }}
            style={{ 
              boxShadow: index === currentIndex ? '0 0 10px rgba(255, 82, 82, 0.6)' : 'none'
            }}
          />
        ))}
      </div>
      
      {/* 顶部渐变叠加层 */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-5"></div>
      
      {/* 当前幻灯片计数器 */}
      <div className="absolute top-4 right-4 text-white/70 text-sm font-medium z-10 hidden md:block">
        <span className="text-white">{currentIndex + 1}</span>
        <span className="mx-1">/</span>
        <span>{slides.length}</span>
      </div>
    </div>
  );
};

export default HeroCarousel; 