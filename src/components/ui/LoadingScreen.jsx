import React, { useEffect, useRef, useState } from 'react';
import anime from 'animejs/lib/anime.es.js';

const LoadingScreen = ({ onComplete }) => {
  const progressBarRef = useRef(null);
  const loadingIntervalRef = useRef(null);
  const [loadingText, setLoadingText] = useState('正在载入系统，请稍候...');
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    // 开始加载动画
    startSplashAnimation();

    // 清理函数
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, []);

  // 开始动画序列
  const startSplashAnimation = () => {
    // 字母元素动画序列
    const timeline = anime.timeline({
      easing: 'easeOutExpo'
    });
    
    // 先显示T字母
    timeline.add({
      targets: '.t-letter',
      scale: [0, 1],
      opacity: [0, 1],
      duration: 800
    })
    // 再显示骑士
    .add({
      targets: '.knight',
      scale: [0, 1],
      opacity: [0, 1],
      translateY: [-20, 0],
      duration: 600,
      easing: 'easeOutQuad'
    }, '-=600') // 更早开始骑士动画
    // 最后显示MS文字
    .add({
      targets: '.ms-text',
      scale: [0, 1],
      opacity: [0, 1],
      duration: 600
    }, '-=500') // 更早开始MS动画
    // 显示欢迎文字区域
    .add({
      targets: '.welcome-area',
      opacity: [0, 1],
      translateX: [20, 0],
      duration: 600
    })
    // 显示进度条容器
    .add({
      targets: '.progress-container',
      opacity: [0, 1],
      duration: 600
    }, '-=300');

    // 模拟加载进度
    simulateLoading();
  };

  // 模拟加载过程
  const simulateLoading = () => {
    let progress = 0;
    
    loadingIntervalRef.current = setInterval(() => {
      // 随机增加进度，模拟实际加载
      const increment = Math.random() * 5 + 1;
      progress += increment;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(loadingIntervalRef.current);
        
        // 更新进度条显示
        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${progress}%`;
        }
        
        // 更新进度值和加载文本
        setProgressValue(100);
        setLoadingText('加载完成');
        
        // 延迟后调用完成回调
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 800);
      } else {
        // 更新进度条显示
        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${progress}%`;
        }
        
        // 更新进度值
        setProgressValue(Math.floor(progress));
        
        // 根据加载进度更新文本
        if (progress > 80) {
          setLoadingText('准备完成，即将进入系统...');
        } else if (progress > 50) {
          setLoadingText('加载系统资源中...');
        } else if (progress > 20) {
          setLoadingText('初始化系统组件...');
        }
      }
    }, 200);
  };

  return (
    <div className="splash-container">
      <div className="content-area">
        <div className="tpms-wrap">
          <span className="t-letter">T</span>
          <span className="knight">♞</span>
          <span className="ms-text">MS</span>
        </div>
        
        <div className="welcome-area">
          <p className="welcome-text">欢迎来到思维运动俱乐部</p>
        </div>
      </div>
      
      <div className="progress-info">
        <div className="progress-text">{loadingText}</div>
        <div className="progress-percentage">{progressValue}%</div>
      </div>
      
      <div className="progress-container">
        <div className="progress-bar" ref={progressBarRef}></div>
      </div>
    </div>
  );
};

export default LoadingScreen; 