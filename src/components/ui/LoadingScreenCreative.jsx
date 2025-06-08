import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Float, Text3D, Center, Environment } from '@react-three/drei';
import anime from 'animejs/lib/anime.es.js';
import * as THREE from 'three';

// 3D 棋盘组件
function ChessBoard3D() {
  const meshRef = useRef();
  const [tiles, setTiles] = useState([]);
  
  useEffect(() => {
    const boardTiles = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        boardTiles.push({
          position: [i - 3.5, 0, j - 3.5],
          color: (i + j) % 2 === 0 ? '#f0d9b5' : '#b58863',
          id: `${i}-${j}`
        });
      }
    }
    setTiles(boardTiles);
  }, []);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });
  
  return (
    <group ref={meshRef}>
      {tiles.map((tile) => (
        <Float
          key={tile.id}
          speed={2}
          rotationIntensity={0.1}
          floatIntensity={0.1}
          floatingRange={[-0.1, 0.1]}
        >
          <mesh position={tile.position}>
            <boxGeometry args={[0.9, 0.1, 0.9]} />
            <meshStandardMaterial 
              color={tile.color} 
              metalness={0.3}
              roughness={0.4}
              emissive={tile.color}
              emissiveIntensity={0.1}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// 3D 棋子组件
function ChessPiece({ type, position, delay = 0 }) {
  const meshRef = useRef();
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setVisible(true), delay);
  }, [delay]);
  
  useFrame((state) => {
    if (meshRef.current && visible) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1 + position[1];
    }
  });
  
  const pieceGeometry = () => {
    switch(type) {
      case 'king':
        return <coneGeometry args={[0.3, 0.8, 4]} />;
      case 'queen':
        return <cylinderGeometry args={[0.3, 0.3, 0.7, 8]} />;
      case 'knight':
        return <torusGeometry args={[0.2, 0.1, 8, 16]} />;
      default:
        return <sphereGeometry args={[0.3, 16, 16]} />;
    }
  };
  
  return visible ? (
    <Float speed={3} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh ref={meshRef} position={position}>
        {pieceGeometry()}
        <meshStandardMaterial 
          color="#ffffff"
          metalness={0.8}
          roughness={0.2}
          emissive="#3b82f6"
          emissiveIntensity={0.3}
        />
      </mesh>
    </Float>
  ) : null;
}

// 粒子系统
function ParticleSystem() {
  const particlesRef = useRef();
  const particleCount = 1000;
  
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    
    colors[i * 3] = 0.2 + Math.random() * 0.5;
    colors[i * 3 + 1] = 0.5 + Math.random() * 0.5;
    colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
  }
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.03;
    }
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} vertexColors transparent opacity={0.6} />
    </points>
  );
}

// 3D 文字组件
function Logo3D({ progress }) {
  const textRef = useRef();
  
  useFrame((state) => {
    if (textRef.current) {
      textRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });
  
  return (
    <Center>
      <Text3D
        ref={textRef}
        font="/fonts/helvetiker_bold.typeface.json"
        size={1}
        height={0.2}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.02}
        bevelSize={0.02}
        bevelOffset={0}
        bevelSegments={5}
      >
        TPMS
        <meshStandardMaterial 
          color="#ffffff"
          metalness={0.8}
          roughness={0.2}
          emissive="#3b82f6"
          emissiveIntensity={progress / 100}
        />
      </Text3D>
    </Center>
  );
}

// 主加载动画组件
const LoadingScreenCreative = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('init'); // init, building, finalizing, complete
  const containerRef = useRef();
  const progressRef = useRef();
  const textRef = useRef();
  
  useEffect(() => {
    // 初始化动画
    anime({
      targets: containerRef.current,
      opacity: [0, 1],
      duration: 1000,
      easing: 'easeOutExpo'
    });
    
    // 进度条动画
    const progressAnimation = anime({
      targets: { value: 0 },
      value: 100,
      duration: 4000,
      easing: 'easeInOutQuad',
      update: (anim) => {
        const currentProgress = Math.round(anim.animations[0].currentValue);
        setProgress(currentProgress);
        
        // 更新进度条
        if (progressRef.current) {
          progressRef.current.style.width = `${currentProgress}%`;
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
            easing: 'easeOutExpo'
          })
          .add({
            targets: '.loading-3d-container',
            scale: [1, 1.1],
            opacity: [1, 0],
            duration: 800
          })
          .add({
            targets: '.loading-ui',
            translateY: [0, -50],
            opacity: [1, 0],
            duration: 600
          }, '-=400')
          .add({
            targets: containerRef.current,
            opacity: [1, 0],
            duration: 500,
            complete: () => {
              if (onComplete) onComplete();
            }
          }, '-=200');
        }, 500);
      }
    });
    
    return () => {
      progressAnimation.pause();
    };
  }, [onComplete]);
  
  const getPhaseText = () => {
    switch(phase) {
      case 'init':
        return 'Initializing chess engine...';
      case 'building':
        return 'Setting up the board...';
      case 'finalizing':
        return 'Preparing your experience...';
      case 'complete':
        return 'Welcome to TPMS!';
      default:
        return 'Loading...';
    }
  };
  
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-blue-900 to-black"
      style={{ opacity: 0 }}
    >
      {/* 3D 场景 */}
      <div className="loading-3d-container absolute inset-0">
        <Canvas
          camera={{ position: [0, 5, 10], fov: 60 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
          
          <Suspense fallback={null}>
            <ParticleSystem />
            <ChessBoard3D />
            
            {phase !== 'init' && (
              <>
                <ChessPiece type="king" position={[0, 2, 0]} delay={0} />
                <ChessPiece type="queen" position={[2, 2, 0]} delay={200} />
                <ChessPiece type="knight" position={[-2, 2, 0]} delay={400} />
              </>
            )}
            
            {phase === 'finalizing' && (
              <Logo3D progress={progress} />
            )}
          </Suspense>
          
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>
      
      {/* UI 层 */}
      <div className="loading-ui absolute inset-0 flex flex-col items-center justify-end pb-20 pointer-events-none">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-white mb-2 tracking-wider">
            T<span className="text-blue-400">♞</span>MS
          </h1>
          <p className="text-gray-300 text-sm tracking-widest uppercase">
            Temasek Polytechnic Mindsport Club
          </p>
        </div>
        
        {/* 进度信息 */}
        <div className="w-80 max-w-[80vw]">
          <div className="flex justify-between items-center mb-2">
            <span 
              ref={textRef}
              className="text-gray-300 text-sm"
            >
              {getPhaseText()}
            </span>
            <span className="text-blue-400 font-mono text-sm">
              {progress}%
            </span>
          </div>
          
          {/* 进度条 */}
          <div className="relative h-1 bg-gray-800 rounded-full overflow-hidden">
            <div 
              ref={progressRef}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300"
              style={{ width: '0%' }}
            >
              <div className="absolute inset-0 bg-white opacity-30 animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* 装饰性元素 */}
        <div className="absolute bottom-10 left-10 text-gray-600 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>System Ready</span>
          </div>
        </div>
        
        <div className="absolute bottom-10 right-10 text-gray-600 text-xs">
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreenCreative; 