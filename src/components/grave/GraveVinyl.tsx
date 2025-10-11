'use client';

import { Canvas, useFrame } from "@react-three/fiber";
import { Text, PerspectiveCamera, Environment, ContactShadows } from "@react-three/drei";
import { useRef, Suspense, useMemo } from "react";
import { Group, Color, Mesh } from "three";
import { useSpring, animated } from "@react-spring/three";

interface VinylProps {
  bpm: number;
  tracks: number;
  name: string;
  candlesLit: number;
  isPlaying?: boolean;
}

function Vinyl({ bpm, tracks, name, candlesLit, isPlaying = false }: VinylProps) {
  const vinyl = useRef<Group>(null);
  const groovesRef = useRef<Mesh>(null);
  
  // BPM-based color mapping
  const color = useMemo(() => {
    if (bpm < 100) return new Color("#58a6ff"); // Blue - slow/chill
    if (bpm < 130) return new Color("#ff5858"); // Red - medium/house
    return new Color("#58ff65"); // Green - fast/techno
  }, [bpm]);

  // Glow intensity based on candles lit
  const glowIntensity = Math.min(candlesLit / 100, 1) * 3;

  // Rotation animation
  useFrame((state, delta) => {
    if (vinyl.current) {
      vinyl.current.rotation.y += isPlaying ? delta * 0.5 : delta * 0.05;
    }
    
    // Pulse grooves on candles
    if (groovesRef.current && candlesLit > 0) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.02 + 1;
      groovesRef.current.scale.setScalar(pulse);
    }
  });

  // Scale animation on candle lit
  const { scale } = useSpring({
    scale: candlesLit > 0 ? 1.05 : 1,
    config: { tension: 200, friction: 20 }
  });

  return (
    <animated.group ref={vinyl} scale={scale}>
      {/* Main vinyl disc */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[2, 2, 0.05, 64]} />
        <meshPhysicalMaterial 
          color="#0a0a0a" 
          metalness={0.9} 
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* BPM ring (outer glow ring) */}
      <mesh position={[0, 0.03, 0]}>
        <torusGeometry args={[2.1, 0.08, 16, 100]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={glowIntensity}
          toneMapped={false}
        />
      </mesh>

      {/* Grooves (track rays) */}
      <group ref={groovesRef}>
        {Array.from({ length: Math.min(tracks, 27) }).map((_, i) => {
          const angle = (i * Math.PI * 2) / Math.min(tracks, 27);
          const grooveDepth = 0.02 + (candlesLit / 500); // Deeper grooves with more candles
          
          return (
            <mesh 
              key={i} 
              rotation={[0, angle, 0]} 
              position={[0, 0.04, 0]}
            >
              <boxGeometry args={[grooveDepth, 1.8, grooveDepth]} />
              <meshBasicMaterial 
                color="#fff" 
                opacity={0.2 + (candlesLit / 500)} 
                transparent 
              />
            </mesh>
          );
        })}
      </group>

      {/* Center label */}
      <mesh position={[0, 0.06, 0]}>
        <circleGeometry args={[0.3, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} />
      </mesh>

      {/* Artist name text */}
      <Text
        position={[0, -2.7, 0]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        outlineWidth={0.02}
        outlineColor="#000000"
        maxWidth={4}
      >
        {name}
      </Text>

      {/* Candles counter */}
      <Text
        position={[0, -3.1, 0]}
        fontSize={0.15}
        color={color}
        anchorX="center"
      >
        {candlesLit} candles lit 🕯️
      </Text>

      {/* BPM indicator */}
      <Text
        position={[0, -3.4, 0]}
        fontSize={0.12}
        color="#888888"
        anchorX="center"
      >
        {bpm} BPM • {tracks} tracks
      </Text>
    </animated.group>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#888888" />
    </mesh>
  );
}

export interface GraveVinylProps extends VinylProps {
  className?: string;
}

export default function GraveVinyl({ className, ...vinylProps }: GraveVinylProps) {
  return (
    <div className={`w-full h-[600px] bg-black rounded-lg overflow-hidden ${className || ''}`}>
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={<LoadingFallback />}>
          <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={45} />
          
          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <spotLight 
            position={[10, 10, 10]} 
            intensity={1} 
            castShadow 
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#58a6ff" />
          
          {/* Vinyl component */}
          <Vinyl {...vinylProps} />
          
          {/* Environment */}
          <Environment preset="night" />
          
          {/* Shadow plane */}
          <ContactShadows 
            position={[0, -2, 0]} 
            opacity={0.4} 
            scale={10} 
            blur={2} 
            far={4}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
