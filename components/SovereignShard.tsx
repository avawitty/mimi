
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Float, PerspectiveCamera, Environment, ContactShadows, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { TasteProfile } from '../types';

interface SovereignShardProps {
  tasteProfile?: TasteProfile;
}

const ShardMesh = ({ tasteProfile }: SovereignShardProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  
  // Map weights to visual parameters
  const weights = tasteProfile?.archetype_weights || { Architect: 0.25, Dreamer: 0.25, Archivist: 0.25, Catalyst: 0.25 };
  const colorFrequency = useMemo(() => {
    const colors = Object.keys(tasteProfile?.color_frequency || {});
    return colors.length > 0 ? colors[0] : '#10b981';
  }, [tasteProfile]);

  const architect = weights.Architect || 0.25;
  const dreamer = weights.Dreamer || 0.25;
  const archivist = weights.Archivist || 0.25;
  const catalyst = weights.Catalyst || 0.25;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = t * (0.1 + architect * 0.2);
      meshRef.current.rotation.y = t * (0.15 + architect * 0.2);
    }
    if (coreRef.current) {
      coreRef.current.rotation.x = -t * (0.2 + dreamer * 0.3);
      coreRef.current.rotation.z = t * (0.1 + dreamer * 0.2);
      coreRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.1 * catalyst);
    }
  });

  return (
    <Float speed={1 + dreamer * 2} rotationIntensity={0.5} floatIntensity={1}>
      <group scale={1.5 - archivist * 0.3}>
        {/* Outer Glass Shell */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[1.2, 64, 64]} />
          <MeshTransmissionMaterial 
            backside
            samples={4}
            thickness={0.5}
            chromaticAberration={0.1 + dreamer * 0.5}
            anisotropy={0.1}
            distortion={0.2 + catalyst * 0.5}
            distortionScale={0.5}
            temporalDistortion={0.1}
            color={colorFrequency}
            transmission={1}
            roughness={0.1 + architect * 0.2}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>
        
        {/* Inner Glowing Core */}
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial 
            color={colorFrequency} 
            emissive={colorFrequency}
            emissiveIntensity={1 + catalyst * 2}
            wireframe={architect > 0.4}
            transparent
            opacity={0.8}
          />
          <pointLight color={colorFrequency} intensity={2 + catalyst * 2} distance={5} />
        </mesh>
      </group>
    </Float>
  );
};

export const SovereignShard: React.FC<SovereignShardProps> = ({ tasteProfile }) => {
  return (
    <div className="w-full h-full min-h-[300px] relative">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <ShardMesh tasteProfile={tasteProfile} />
        
        <Environment preset="city" />
        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} />
      </Canvas>
      
      {/* Overlay Data */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
        <div className="space-y-1">
          <div className="text-[8px] text-stone-400 uppercase tracking-[0.3em] font-mono">Morphological State</div>
          <div className="text-[10px] text-stone-800 dark:text-stone-200 font-mono uppercase tracking-widest">
            {tasteProfile?.dominant_archetypes?.[0] || 'Unstable'}
          </div>
        </div>
        <div className="text-right space-y-1">
          <div className="text-[8px] text-stone-400 uppercase tracking-[0.3em] font-mono">Resonance</div>
          <div className="text-[10px] text-stone-800 dark:text-stone-200 font-mono uppercase tracking-widest">
            {Math.round((tasteProfile?.archetype_weights?.Dreamer || 0) * 100)}% Sync
          </div>
        </div>
      </div>
    </div>
  );
};

export default SovereignShard;
