import React from 'react';
import { motion } from 'framer-motion';

// 翻转卡片组件
export const FlipCard = ({ frontContent, backContent, isFlipped, onClick }) => {
  return (
    <div 
      className="flip-card-container w-full h-full cursor-pointer perspective-1000"
      onClick={onClick}
    >
      <div 
        className={`flip-card relative w-full h-full transition-transform duration-700 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* 正面 */}
        <div className="flip-card-front absolute w-full h-full backface-hidden rounded-xl overflow-hidden shadow-md">
          {frontContent}
        </div>
        
        {/* 背面 */}
        <div className="flip-card-back absolute w-full h-full backface-hidden rounded-xl overflow-hidden shadow-md rotate-y-180">
          {backContent}
        </div>
      </div>
      
      <style jsx>{`
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
  );
};

// 浮动动画元素
export const FloatingElement = ({ children, delay = 0, duration = 3, yOffset = 10 }) => {
  return (
    <motion.div
      animate={{ 
        y: [0, -yOffset, 0],
      }}
      transition={{ 
        repeat: Infinity,
        repeatType: "reverse",
        duration: duration,
        delay: delay,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
};

// 星形碎片动画
export const StarburstEffect = ({ color = "#22c55e", size = 100, count = 6 }) => {
  const particles = Array.from({ length: count });
  
  return (
    <div className="relative w-full h-full">
      {particles.map((_, index) => {
        const angle = (360 / count) * index;
        const delay = 0.1 * index;
        
        return (
          <motion.div
            key={index}
            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: color,
              originX: "50%",
              originY: "50%",
            }}
            initial={{ 
              x: -4,
              y: -4,
              scale: 0
            }}
            animate={{ 
              x: `calc(${Math.cos(angle * Math.PI / 180) * size}px - 4px)`,
              y: `calc(${Math.sin(angle * Math.PI / 180) * size}px - 4px)`,
              scale: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 1.5,
              delay: delay,
              repeat: Infinity,
              repeatDelay: 2
            }}
          />
        );
      })}
    </div>
  );
};

// 渐现动画（上升/下降/左右）
export const FadeInMotion = ({ 
  children, 
  direction = "up", 
  duration = 0.6, 
  delay = 0,
  distance = 20,
  className = "" 
}) => {
  const getInitialProps = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: distance };
      case "down":
        return { opacity: 0, y: -distance };
      case "left":
        return { opacity: 0, x: distance };
      case "right":
        return { opacity: 0, x: -distance };
      default:
        return { opacity: 0, y: distance };
    }
  };
  
  const getAnimateProps = () => {
    switch (direction) {
      case "up":
      case "down":
        return { opacity: 1, y: 0 };
      case "left":
      case "right":
        return { opacity: 1, x: 0 };
      default:
        return { opacity: 1, y: 0 };
    }
  };
  
  return (
    <motion.div
      initial={getInitialProps()}
      animate={getAnimateProps()}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 滚动出现效果
export const ScrollReveal = ({ 
  children, 
  threshold = 0.1,
  triggerOnce = true,
  className = ""
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: triggerOnce, threshold }}
      transition={{ duration: 0.6 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 循环旋转动画
export const RotateAnimation = ({ 
  children, 
  duration = 20,
  reverse = false,
  className = ""
}) => {
  return (
    <motion.div
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ 
        duration, 
        repeat: Infinity, 
        ease: "linear",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 脉冲点动画 - 适合指示器、徽章等
export const PulseAnimation = ({ 
  children, 
  scale = [1, 1.05], 
  duration = 2,
  className = "" 
}) => {
  return (
    <motion.div
      animate={{ 
        scale: scale
      }}
      transition={{ 
        repeat: Infinity,
        repeatType: "reverse",
        duration,
        ease: "easeInOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 波纹效果 - 适合按钮点击等
export const RippleEffect = ({ color = "rgba(255,255,255,0.7)", size = 100, duration = 1.5 }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        initial={{ scale: 0, opacity: 0.8, x: "-50%", y: "-50%" }}
        animate={{ scale: 1, opacity: 0 }}
        transition={{ duration, ease: "easeOut" }}
        className="absolute rounded-full"
        style={{ 
          left: "50%",
          top: "50%",
          width: size,
          height: size,
          backgroundColor: color,
        }}
      />
    </div>
  );
};

export default {
  FlipCard,
  FloatingElement,
  StarburstEffect,
  FadeInMotion,
  ScrollReveal,
  RotateAnimation,
  PulseAnimation,
  RippleEffect
}; 