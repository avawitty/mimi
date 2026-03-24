
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Float, PerspectiveCamera, OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { fetchAllPublicProfiles } from '../services/firebaseUtils';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const UserStar = ({ profile, position }: { profile: UserProfile, position: [number, number, number] }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={hovered ? "#00FF00" : "#FFFFFF"} transparent opacity={0.8} />
      </mesh>
      
      <AnimatePresence>
        {hovered && (
          <Html distanceFactor={10}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-black/90 border border-white/20 p-3 rounded-lg backdrop-blur-xl text-white min-w-[150px] pointer-events-none"
            >
              <div className="text-xs font-mono opacity-50 uppercase tracking-widest mb-1">Aesthetic Frequency</div>
              <div className="text-sm font-medium mb-2">@{profile.handle || 'anonymous'}</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(profile.tasteVector || {})
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([tag]) => (
                    <span key={tag} className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded uppercase">
                      {tag}
                    </span>
                  ))}
              </div>
            </motion.div>
          </Html>
        )}
      </AnimatePresence>
    </group>
  );
};

const Constellation = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const all = await fetchAllPublicProfiles();
      setProfiles(all);
      setLoading(false);
    };
    load();
  }, []);

  const starData = useMemo(() => {
    return profiles.map(p => {
      const vector = p.tasteVector || {};
      let x = 0, y = 0, z = 0;
      
      // Map tags to axes
      Object.entries(vector).forEach(([tag, weight]) => {
        const lowerTag = tag.toLowerCase();
        if (['brutalist', 'structured', 'industrial', 'dark', 'geometric'].includes(lowerTag)) {
          x += weight * 10;
        } else if (['ethereal', 'fluid', 'soft', 'organic', 'gothic'].includes(lowerTag)) {
          y += weight * 10;
        } else if (['minimal', 'minimalist', 'clean', 'vintage', 'retro'].includes(lowerTag)) {
          z += weight * 10;
        } else {
          // Default distribution for unknown tags
          x += weight * 2;
          y += weight * 2;
          z += weight * 2;
        }
      });
      
      // Fallback to archetype weights if tasteVector is empty
      if (x === 0 && y === 0 && z === 0) {
        const weights = p.tasteProfile?.archetype_weights || {};
        x = (weights['Architect'] || 0) * 10;
        y = (weights['Dreamer'] || 0) * 10;
        z = (weights['Archivist'] || 0) * 10;
      }
      
      // Add jitter
      const jitter = () => (Math.random() - 0.5) * 5;
      
      return {
        profile: p,
        position: [x + jitter(), y + jitter(), z + jitter()] as [number, number, number]
      };
    });
  }, [profiles]);

  if (loading) return null;

  return (
    <>
      {starData.map((data, i) => (
        <UserStar key={data.profile.uid || i} profile={data.profile} position={data.position} />
      ))}
      
      {/* Visual Axis Labels */}
      <group>
        <Html position={[12, 0, 0]} center>
          <div className="text-white/50 font-mono text-xs uppercase tracking-widest pointer-events-none">ARCHITECT</div>
        </Html>
        <Html position={[0, 12, 0]} center>
          <div className="text-white/50 font-mono text-xs uppercase tracking-widest pointer-events-none">DREAMER</div>
        </Html>
        <Html position={[0, 0, 12]} center>
          <div className="text-white/50 font-mono text-xs uppercase tracking-widest pointer-events-none">ARCHIVIST</div>
        </Html>
      </group>
    </>
  );
};

export const LatentConstellation = () => {
  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h2 className="text-white font-mono text-xl uppercase tracking-[0.2em]">The Latent Constellation</h2>
        <p className="text-white/40 text-xs mt-2 uppercase tracking-widest italic">Aesthetic Networking in N-Dimensional Space</p>
      </div>
      
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={50} />
        <OrbitControls enableDamping dampingFactor={0.05} autoRotate autoRotateSpeed={0.5} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <Constellation />
      </Canvas>
      
      <div className="absolute bottom-8 right-8 z-10 flex flex-col items-end">
        <div className="text-[10px] text-white/30 uppercase tracking-[0.3em] mb-4">Navigation: Orbit / Zoom</div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <span className="text-[10px] text-white/50 uppercase tracking-widest">User Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00FF00]" />
            <span className="text-[10px] text-white/50 uppercase tracking-widest">Active Resonance</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatentConstellation;
