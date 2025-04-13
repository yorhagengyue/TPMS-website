import React, { useEffect, useRef, useState } from 'react';
import anime from 'animejs/lib/anime.es.js';

const LoadingScreen = ({ onComplete }) => {
  const progressBarRef = useRef(null);
  const loadingIntervalRef = useRef(null);
  const logoRef = useRef(null);
  const tRef = useRef(null);
  const knightRef = useRef(null);
  const msRef = useRef(null);
  const welcomeRef = useRef(null);
  const progressInfoRef = useRef(null);
  const demoLabelRef = useRef(null);
  
  const [loadingText, setLoadingText] = useState('Initializing system...');
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    // Initialize anime.js animations
    initLogoAnimation();
    
    // Start progress simulation
    simulateLoading();

    // Cleanup function
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, []);

  const initLogoAnimation = () => {
    // Logo entrance animation
    const logoTimeline = anime.timeline({
      easing: 'easeOutExpo'
    });

    // T letter animation
    logoTimeline
      .add({
        targets: tRef.current,
        opacity: [0, 1],
        scale: [0, 1],
        duration: 800,
        delay: 300
      })
      // Knight animation
      .add({
        targets: knightRef.current,
        opacity: [0, 1],
        scale: [0, 1],
        duration: 800
      }, '-=400')
      // MS animation
      .add({
        targets: msRef.current,
        opacity: [0, 1],
        scale: [0, 1],
        duration: 800
      }, '-=400')
      // Welcome text animation
      .add({
        targets: welcomeRef.current,
        opacity: [0, 1],
        translateX: [20, 0],
        duration: 800
      }, '-=400')
      // Demo label animation
      .add({
        targets: demoLabelRef.current,
        opacity: [0, 1],
        scale: [0.5, 1],
        duration: 600
      }, '-=400')
      // Progress bar container fade in
      .add({
        targets: '.progress-container',
        opacity: [0, 1],
        duration: 800
      }, '-=200');
      
    // Add subtle floating animation
    anime({
      targets: logoRef.current,
      translateY: [-5, 5],
      duration: 3000,
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine'
    });
    
    // Add pulse animation to demo label
    anime({
      targets: demoLabelRef.current,
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1],
      duration: 2000,
      loop: true,
      easing: 'easeInOutSine'
    });
  };

  // Simulate loading process
  const simulateLoading = () => {
    let progress = 0;
    
    loadingIntervalRef.current = setInterval(() => {
      // Random progress increment
      const increment = Math.random() * 5 + 1;
      progress += increment;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(loadingIntervalRef.current);
        
        // Update progress bar
        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${progress}%`;
        }
        
        // Update progress value and text
        setProgressValue(100);
        setLoadingText('Loaded successfully');
        
        // Wait a bit to show the 100% state before fading out
        setTimeout(() => {
          // Orchestrated fade out animations
          const fadeOutTimeline = anime.timeline({
            easing: 'easeOutCubic'
          });
          
          // First animate progress info
          fadeOutTimeline
            .add({
              targets: progressInfoRef.current,
              opacity: [1, 0],
              translateY: [0, -10],
              duration: 400
            })
            // Demo label fade out
            .add({
              targets: demoLabelRef.current,
              opacity: [1, 0],
              scale: [1, 0.8],
              duration: 300
            }, '-=300')
            // Then animate the TPMS logo with scale and fade
            .add({
              targets: [tRef.current, knightRef.current, msRef.current],
              opacity: [1, 0],
              scale: [1, 1.1],
              duration: 500,
              delay: anime.stagger(100)
            }, '-=200')
            // Then animate the welcome text
            .add({
              targets: welcomeRef.current,
              opacity: [1, 0],
              translateY: [0, -15],
              duration: 400
            }, '-=300')
            // Finally fade out the entire container
            .add({
              targets: '.splash-container',
              opacity: [1, 0],
              translateY: [0, -30],
              duration: 800,
              complete: () => {
                if (onComplete) {
                  onComplete();
                }
              }
            }, '-=200');
          
          // Add a background color shift for additional effect
          anime({
            targets: '.splash-container',
            background: [
              'linear-gradient(to bottom, #000, #0a1529)',
              'linear-gradient(to bottom, #000, #000)'
            ],
            duration: 1500,
            easing: 'easeOutQuad'
          });
        }, 600);
      } else {
        // Update progress bar
        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${progress}%`;
        }
        
        // Update progress value
        setProgressValue(Math.floor(progress));
        
        // Update loading text based on progress
        if (progress > 80) {
          setLoadingText('Preparing to launch...');
        } else if (progress > 50) {
          setLoadingText('Loading resources...');
        } else if (progress > 20) {
          setLoadingText('Initializing components...');
        }
      }
    }, 200);
  };

  return (
    <div className="splash-container">
      {/* Demo label */}
      <div 
        ref={demoLabelRef} 
        className="demo-label absolute top-4 right-4 bg-yellow-500 text-yellow-900 font-bold px-3 py-1 rounded-md z-20 text-sm shadow-lg transform rotate-3"
      >
        DEMO MODE
      </div>
      
      <div className="content-area" ref={logoRef}>
        <div className="tpms-wrap">
          {/* TPMS Logo with individual letter refs */}
          <span ref={tRef} className="t-letter">T</span>
          <span ref={knightRef} className="knight">♞</span>
          <span ref={msRef} className="ms-text">MS</span>
        </div>
        
        <div ref={welcomeRef} className="welcome-area">
          <p className="welcome-text">Temasek Polytechnic Mindsport Club</p>
        </div>
      </div>
      
      <div className="progress-info" ref={progressInfoRef}>
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