import React, { useEffect, useRef, useState } from 'react';
import anime from 'animejs/lib/anime.es.js';

const LoadingScreenEnhanced = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('init');
  const progressBarRef = useRef(null);
  const particlesRef = useRef([]);
  const chessIconsRef = useRef([]);
  
  // 棋子 Unicode 符号
  const chessSymbols = ['♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟'];
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 初始化粒子
    initParticles();
    initChessIcons();
    
    // 动画循环
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 绘制粒子
      drawParticles(ctx);
      
      // 绘制棋子图标
      drawChessIcons(ctx);
      
      requestAnimationFrame(animate);
    };
    animate();
    
    // 启动加载动画序列
    startLoadingSequence();
    
    // 窗口大小调整
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // 初始化粒子系统
  const initParticles = () => {
    const particleCount = 100;
    particlesRef.current = [];
    
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        color: `hsl(${200 + Math.random() * 60}, 70%, 60%)`
      });
    }
  };
  
  // 初始化棋子图标
  const initChessIcons = () => {
    const iconCount = 12;
    chessIconsRef.current = [];
    
    for (let i = 0; i < iconCount; i++) {
      chessIconsRef.current.push({
        symbol: chessSymbols[i % chessSymbols.length],
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        scale: 0,
        targetScale: Math.random() * 0.5 + 0.5,
        opacity: 0
      });
    }
  };
  
  // 绘制粒子
  const drawParticles = (ctx) => {
    particlesRef.current.forEach((particle, index) => {
      // 更新位置
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // 边界检测
      if (particle.x < 0 || particle.x > window.innerWidth) particle.vx *= -1;
      if (particle.y < 0 || particle.y > window.innerHeight) particle.vy *= -1;
      
      // 绘制粒子
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.opacity;
      ctx.fill();
      
      // 连接临近粒子
      particlesRef.current.forEach((otherParticle, otherIndex) => {
        if (index !== otherIndex) {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = particle.color;
            ctx.globalAlpha = (1 - distance / 100) * 0.2;
            ctx.stroke();
          }
        }
      });
    });
    ctx.globalAlpha = 1;
  };
  
  // 绘制棋子图标
  const drawChessIcons = (ctx) => {
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    chessIconsRef.current.forEach((icon) => {
      // 更新位置和旋转
      icon.x += icon.vx;
      icon.y += icon.vy;
      icon.rotation += icon.rotationSpeed;
      
      // 边界检测
      if (icon.x < 50 || icon.x > window.innerWidth - 50) icon.vx *= -1;
      if (icon.y < 50 || icon.y > window.innerHeight - 50) icon.vy *= -1;
      
      // 绘制
      ctx.save();
      ctx.translate(icon.x, icon.y);
      ctx.rotate(icon.rotation);
      ctx.scale(icon.scale, icon.scale);
      ctx.fillStyle = '#3b82f6';
      ctx.globalAlpha = icon.opacity;
      ctx.fillText(icon.symbol, 0, 0);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  };
  
  // 启动加载序列
  const startLoadingSequence = () => {
    // 容器淡入
    anime({
      targets: containerRef.current,
      opacity: [0, 1],
      duration: 1000,
      easing: 'easeOutExpo'
    });
    
    // 棋子图标动画
    anime({
      targets: chessIconsRef.current,
      scale: (el, i) => el.targetScale,
      opacity: 0.3,
      delay: anime.stagger(100),
      duration: 1500,
      easing: 'easeOutElastic(1, .5)'
    });
    
    // 标题动画
    anime.timeline({
      easing: 'easeOutExpo'
    })
    .add({
      targets: '.loading-title span',
      translateY: [50, 0],
      opacity: [0, 1],
      delay: anime.stagger(100),
      duration: 1000
    })
    .add({
      targets: '.loading-subtitle',
      translateX: [-50, 0],
      opacity: [0, 1],
      duration: 800
    }, '-=500');
    
    // 进度条动画
    const progressAnimation = anime({
      targets: { value: 0 },
      value: 100,
      duration: 4000,
      easing: 'easeInOutQuad',
      update: (anim) => {
        const currentProgress = Math.round(anim.animations[0].currentValue);
        setProgress(currentProgress);
        
        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${currentProgress}%`;
        }
        
        // 更新阶段
        if (currentProgress < 30) {
          setPhase('init');
        } else if (currentProgress < 70) {
          setPhase('building');
        } else if (currentProgress < 90) {
          setPhase('finalizing');
        } else {
          setPhase('complete');
        }
      },
      complete: () => {
        setTimeout(() => {
          // 退出动画
          anime.timeline({
            easing: 'easeInExpo'
          })
          .add({
            targets: '.loading-content',
            scale: [1, 0.9],
            opacity: [1, 0],
            duration: 600
          })
          .add({
            targets: canvasRef.current,
            opacity: [1, 0],
            duration: 800
          }, '-=400')
          .add({
            targets: containerRef.current,
            opacity: [1, 0],
            duration: 500,
            complete: () => {
              if (onComplete) onComplete();
            }
          }, '-=300');
        }, 500);
      }
    });
  };
  
  const getPhaseText = () => {
    switch(phase) {
      case 'init':
        return '初始化棋局引擎...';
      case 'building':
        return '构建智慧棋盘...';
      case 'finalizing':
        return '准备您的体验...';
      case 'complete':
        return '欢迎来到 TPMS！';
      default:
        return '加载中...';
    }
  };
  
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-blue-900 to-black overflow-hidden"
      style={{ opacity: 0 }}
    >
      {/* Canvas 背景 */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0"
        style={{ opacity: 0.8 }}
      />
      
      {/* 主要内容 */}
      <div className="loading-content relative z-10 h-full flex flex-col items-center justify-center">
        {/* 标题 */}
        <div className="loading-title text-8xl font-bold text-white mb-4 flex items-center">
          <span>T</span>
          <span className="text-blue-400 mx-2">♞</span>
          <span>M</span>
          <span>S</span>
        </div>
        
        <p className="loading-subtitle text-gray-300 text-lg tracking-widest uppercase mb-16">
          Temasek Polytechnic Mindsport Club
        </p>
        
        {/* 进度信息 */}
        <div className="w-96 max-w-[80vw]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-300 text-sm">
              {getPhaseText()}
            </span>
            <span className="text-blue-400 font-mono text-sm">
              {progress}%
            </span>
          </div>
          
          {/* 进度条 */}
          <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              ref={progressBarRef}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
              style={{ width: '0%' }}
            >
              {/* 光效 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
            </div>
          </div>
        </div>
        
        {/* 装饰元素 */}
        <div className="absolute bottom-10 left-10 text-gray-500 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>系统就绪</span>
          </div>
        </div>
        
        <div className="absolute bottom-10 right-10 text-gray-500 text-xs">
          <span>v1.0.0</span>
        </div>
        
        {/* 棋盘格装饰 */}
        <div className="absolute top-10 left-10 grid grid-cols-3 gap-1 opacity-20">
          {[...Array(9)].map((_, i) => (
            <div 
              key={i}
              className={`w-4 h-4 ${(Math.floor(i/3) + i%3) % 2 === 0 ? 'bg-white' : 'bg-gray-600'}`}
            />
          ))}
        </div>
        
        <div className="absolute top-10 right-10 grid grid-cols-3 gap-1 opacity-20">
          {[...Array(9)].map((_, i) => (
            <div 
              key={i}
              className={`w-4 h-4 ${(Math.floor(i/3) + i%3) % 2 === 0 ? 'bg-white' : 'bg-gray-600'}`}
            />
          ))}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreenEnhanced; 