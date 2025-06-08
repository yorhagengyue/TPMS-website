import React, { useEffect, useRef, useState } from 'react';
import anime from 'animejs/lib/anime.es.js';

const LoadingScreenImpact = ({ onComplete }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const progressBarRef = useRef(null);
  const logoContainerRef = useRef(null);
  const tLetterRef = useRef(null);
  const pLetterRef = useRef(null);
  const msTextRef = useRef(null);
  const titleRef = useRef(null);
  const progressInfoRef = useRef(null);
  const glowRef = useRef(null);
  
  const [loadingText, setLoadingText] = useState('INITIALIZING CHESS MATRIX...');
  const [progressValue, setProgressValue] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('startup');

  // Particle system for background effects
  const particles = useRef([]);
  const animationFrameRef = useRef();

  useEffect(() => {
    initializeParticleSystem();
    startImpactAnimation();
    simulateLoading();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const initializeParticleSystem = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particles
    particles.current = [];
    for (let i = 0; i < 100; i++) {
      particles.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        opacity: Math.random() * 0.8 + 0.2,
        color: `rgba(${Math.random() > 0.5 ? '59, 130, 246' : '239, 68, 68'}, ${Math.random() * 0.8 + 0.2})`,
        life: Math.random() * 100 + 50
      });
    }

    animateParticles();
  };

  const animateParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.current.forEach((particle, index) => {
      // Update particle position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.life--;

      // Wrap around screen edges
      if (particle.x < 0) particle.x = canvas.width;
      if (particle.x > canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = canvas.height;
      if (particle.y > canvas.height) particle.y = 0;

      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.opacity;
      ctx.fill();

      // Create trailing effect
      ctx.beginPath();
      ctx.arc(particle.x - particle.speedX * 5, particle.y - particle.speedY * 5, particle.size * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.opacity * 0.3;
      ctx.fill();

      // Reset particle if life ends
      if (particle.life <= 0) {
        particle.x = Math.random() * canvas.width;
        particle.y = Math.random() * canvas.height;
        particle.life = Math.random() * 100 + 50;
        particle.opacity = Math.random() * 0.8 + 0.2;
      }
    });

    ctx.globalAlpha = 1;
    animationFrameRef.current = requestAnimationFrame(animateParticles);
  };

  const startImpactAnimation = () => {
    const timeline = anime.timeline({
      easing: 'easeOutExpo'
    });



    // Initial state - hide T and MS elements
    anime.set([tLetterRef.current, msTextRef.current], {
      opacity: 0,
      scale: 0,
      rotateY: -180,
      translateX: (el, i) => (i === 0 ? -200 : 200),
      translateY: -100
    });
    
    // Set P letter initial state separately
    if (pLetterRef.current) {
      anime.set(pLetterRef.current, {
        opacity: 0,
        scale: 0,
        translateY: -150
      });
    }

    anime.set(titleRef.current, {
      opacity: 0,
      translateY: 50
    });

    anime.set(glowRef.current, {
      opacity: 0,
      scale: 0
    });

    // EXPLOSIVE ENTRANCE SEQUENCE
    timeline
      // 1. Background glow explosion
      .add({
        targets: glowRef.current,
        opacity: [0, 1],
        scale: [0, 2],
        duration: 800,
        complete: () => setCurrentPhase('logo-assembly')
      })
      
      // 2. Letters fly in from different directions and collide
      .add({
        targets: tLetterRef.current,
        opacity: [0, 1],
        scale: [0, 1.2, 1],
        rotateY: [-180, 0],
        translateX: [-200, 0],
        translateY: [-100, 0],
        duration: 1000,
        elasticity: 600,
        complete: () => {
          if (tLetterRef.current) {
            tLetterRef.current.classList.remove('opacity-0');
            tLetterRef.current.style.opacity = '1';
          }
        }
      }, '-=600')
      
      .add({
        targets: pLetterRef.current,
        opacity: [0, 1],
        scale: [0, 1.3, 1],
        rotateY: [360, 0],
        rotateZ: [720, 0],
        translateX: [0, 0],
        translateY: [-150, 0],
        duration: 1200,
        elasticity: 800,
        easing: 'easeOutElastic',
        complete: () => {
          // Ensure P stays visible after animation
          if (pLetterRef.current) {
            pLetterRef.current.classList.remove('opacity-0');
            pLetterRef.current.style.opacity = '1';
            pLetterRef.current.style.transform = 'scale(1) rotateY(0deg) rotateZ(0deg) translateX(0px) translateY(0px)';
            pLetterRef.current.style.visibility = 'visible';
          }
        }
      }, '-=800')
      
      .add({
        targets: msTextRef.current,
        opacity: [0, 1],
        scale: [0, 1.2, 1],
        rotateY: [180, 0],
        translateX: [200, 0],
        translateY: [-100, 0],
        duration: 1000,
        elasticity: 600,
        complete: () => {
          if (msTextRef.current) {
            msTextRef.current.classList.remove('opacity-0');
            msTextRef.current.style.opacity = '1';
          }
        }
      }, '-=900')

      // 3. Scale collision effect
      .add({
        targets: [tLetterRef.current, pLetterRef.current, msTextRef.current],
        scale: [1.2, 0.9, 1],
        duration: 400,
        delay: anime.stagger(100),
        complete: () => {
          setCurrentPhase('title-reveal');
          // Ensure all letters are visible after collision effect
          [tLetterRef.current, pLetterRef.current, msTextRef.current].forEach(ref => {
            if (ref) {
              ref.style.opacity = '1';
            }
          });
        }
      })

      // 4. Title dramatic entrance
      .add({
        targets: titleRef.current,
        opacity: [0, 1],
        translateY: [50, 0],
        scale: [0.8, 1],
        duration: 800
      }, '-=200')

      // 5. Add floating animation to logo
      .add({
        targets: logoContainerRef.current,
        translateY: [-3, 3],
        duration: 2000,
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine'
      }, '-=400');

    // Continuous glow pulse
    anime({
      targets: glowRef.current,
      scale: [2, 2.5, 2],
      opacity: [1, 0.7, 1],
      duration: 3000,
      loop: true,
      easing: 'easeInOutSine'
    });

    // P letter special rotation
    setTimeout(() => {
      if (pLetterRef.current) {
        anime({
          targets: pLetterRef.current,
          rotateY: [0, 15, 0, -15, 0],
          duration: 4000,
          loop: true,
          easing: 'easeInOutSine'
        });
      }
    }, 2000); // Delay to ensure main animation completes first
  };

  const simulateLoading = () => {
    let progress = 0;
    const loadingSteps = [
      { threshold: 0, text: 'INITIALIZING CHESS MATRIX...', phase: 'init' },
      { threshold: 15, text: 'LOADING GAME ENGINES...', phase: 'engines' },
      { threshold: 30, text: 'SYNCHRONIZING PLAYER DATA...', phase: 'sync' },
      { threshold: 50, text: 'BUILDING TOURNAMENT GRID...', phase: 'grid' },
      { threshold: 70, text: 'ACTIVATING NEURAL NETWORK...', phase: 'neural' },
      { threshold: 85, text: 'FINALIZING CONNECTIONS...', phase: 'final' },
      { threshold: 95, text: 'LAUNCHING INTERFACE...', phase: 'launch' },
      { threshold: 100, text: 'READY TO CHECKMATE!', phase: 'complete' }
    ];

    const loadingInterval = setInterval(() => {
      const increment = Math.random() * 4 + 1;
      progress += increment;

      if (progress >= 100) {
        progress = 100;
        clearInterval(loadingInterval);
      }

      // Update progress bar with lightning effect
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${progress}%`;
        
        // Add electric spark effect
        if (progress > 0 && progress < 100) {
          anime({
            targets: progressBarRef.current,
            boxShadow: [
              '0 0 10px rgba(59, 130, 246, 0.8)',
              '0 0 25px rgba(59, 130, 246, 1)',
              '0 0 10px rgba(59, 130, 246, 0.8)'
            ],
            duration: 300,
            easing: 'easeInOutQuad'
          });
        }
      }

      setProgressValue(Math.floor(progress));

      // Update loading text based on progress
      const currentStep = loadingSteps.find(step => progress >= step.threshold);
      if (currentStep) {
        setLoadingText(currentStep.text);
        setCurrentPhase(currentStep.phase);
      }

      if (progress >= 100) {
        setTimeout(() => {
          executeExitAnimation();
        }, 800);
      }
    }, 150);
  };

  const executeExitAnimation = () => {
    const exitTimeline = anime.timeline({
      easing: 'easeInOutCubic'
    });

    exitTimeline
      // Progress info disappears
      .add({
        targets: progressInfoRef.current,
        opacity: [1, 0],
        translateY: [0, -20],
        duration: 400
      })
      
      // Logo elements explode outward
      .add({
        targets: tLetterRef.current,
        opacity: [1, 0],
        scale: [1, 0.5],
        rotateY: [0, 360],
        translateX: [0, -300],
        duration: 800
      }, '-=200')
      
      .add({
        targets: pLetterRef.current,
        opacity: [1, 0],
        scale: [1, 0.3],
        rotateZ: [0, 720],
        translateY: [0, -200],
        duration: 800
      }, '-=700')
      
      .add({
        targets: msTextRef.current,
        opacity: [1, 0],
        scale: [1, 0.5],
        rotateY: [0, -360],
        translateX: [0, 300],
        duration: 800
      }, '-=700')
      
      // Title fades
      .add({
        targets: titleRef.current,
        opacity: [1, 0],
        translateY: [0, -30],
        duration: 600
      }, '-=600')
      
      // Glow implodes
      .add({
        targets: glowRef.current,
        opacity: [1, 0],
        scale: [2, 0],
        duration: 800
      }, '-=400')
      
      // Final container fade
      .add({
        targets: containerRef.current,
        opacity: [1, 0],
        duration: 600,
        complete: () => {
          if (onComplete) {
            onComplete();
          }
        }
      }, '-=300');
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #0f1419 0%, #000000 100%)'
      }}
    >
      {/* Particle Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      {/* Glow Effect */}
      <div
        ref={glowRef}
        className="absolute inset-0 opacity-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
          zIndex: 2
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Logo Container */}
        <div ref={logoContainerRef} className="flex items-center justify-center mb-8">
          <div
            ref={tLetterRef}
            className="font-black text-white opacity-0"
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 'clamp(120px, 20vw, 280px)',
              textShadow: '0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(59, 130, 246, 0.6)',
              filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))'
            }}
          >
            T
          </div>
          
          <div
            ref={pLetterRef}
            className="font-black text-white mx-4 opacity-0"
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 'clamp(120px, 20vw, 280px)',
              textShadow: '0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(239, 68, 68, 0.6)',
              filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.8)'
            }}
          >
            P
          </div>
          
          <div
            ref={msTextRef}
            className="font-black text-white opacity-0"
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 'clamp(120px, 20vw, 280px)',
              textShadow: '0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(59, 130, 246, 0.6)',
              filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))'
            }}
          >
            MS
          </div>
        </div>

        {/* Title */}
        <div
          ref={titleRef}
          className="font-light text-center opacity-0 mb-20"
          style={{
            fontSize: 'clamp(20px, 4vw, 42px)',
            background: 'linear-gradient(45deg, #3b82f6, #ef4444, #10b981)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            animation: 'gradientShift 3s ease infinite',
            fontFamily: 'Roboto, sans-serif',
            letterSpacing: '0.1em'
          }}
        >
          TEMASEK POLYTECHNIC MINDSPORT CLUB
        </div>

        {/* Progress Information */}
        <div ref={progressInfoRef} className="text-center mb-12">
          <div 
            className="font-medium text-white mb-4"
            style={{
              fontSize: 'clamp(18px, 3vw, 32px)',
              textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
              fontFamily: 'Roboto, sans-serif'
            }}
          >
            {loadingText}
          </div>
          <div 
            className="font-bold"
            style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              background: 'linear-gradient(90deg, #3b82f6, #ef4444)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 0 20px rgba(59, 130, 246, 0.8)'
            }}
          >
            {progressValue}%
          </div>
        </div>

        {/* Progress Bar */}
        <div 
          className="relative bg-gray-800 rounded-full overflow-hidden border border-gray-700"
          style={{
            width: 'clamp(300px, 50vw, 600px)',
            height: 'clamp(6px, 1vw, 12px)'
          }}
        >
          <div
            ref={progressBarRef}
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #ef4444, #10b981)',
              backgroundSize: '200% 100%',
              animation: 'progressGlow 1.5s ease-in-out infinite',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3)'
            }}
          />
          
          {/* Lightning overlay */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255, 255, 255, 0.3) 11px, rgba(255, 255, 255, 0.3) 12px)',
              animation: 'lightning 0.5s linear infinite'
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes progressGlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes lightning {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreenImpact; 