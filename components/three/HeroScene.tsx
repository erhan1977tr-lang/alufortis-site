'use client';
import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { dieGeometry, profileGeometry } from './profile';
import { Studio } from './Studio';
import { heroState } from '@/lib/sceneState';

function Extrusion() {
  const group = useRef<THREE.Group>(null);
  const profile = useRef<THREE.Mesh>(null);
  const pGeo = useMemo(profileGeometry, []);
  const dGeo = useMemo(dieGeometry, []);
  const aspect = useThree((s) => s.viewport.aspect);
  const width = useThree((s) => s.size.width);
  const wide = width >= 768 && aspect > 1.1;
  const compact = wide && width < 1200;

  useFrame((state, dt) => {
    if (!group.current || !profile.current) return;
    profile.current.scale.z = Math.max(0.001, heroState.length);
    profile.current.position.z = -0.45;
    const k = 1 - Math.exp(-dt * 3);
    const tx = (wide ? 0.3 : 0.22) + heroState.pointerX * 0.06 - heroState.scroll * 0.3;
    const ty = -0.22 + heroState.pointerY * 0.04;
    group.current.rotation.y += (tx - group.current.rotation.y) * k;
    group.current.rotation.x += (ty - group.current.rotation.x) * k;
    group.current.position.y = (wide ? -0.2 : -0.9) + heroState.scroll * 1.4;
  });

  return (
    <group ref={group} position={[wide ? (compact ? 2.4 : 1.75) : -1.1, 0, -9]} scale={wide ? (compact ? 0.78 : 1) : 1.3}>
      <mesh geometry={dGeo} position-z={-0.5} castShadow>
        <meshPhysicalMaterial color="#5d666f" metalness={1} roughness={0.5} />
      </mesh>
      <mesh ref={profile} geometry={pGeo} position-z={-0.45}>
        <meshPhysicalMaterial color="#cdd2d7" metalness={1} roughness={0.14} clearcoat={0.35} clearcoatRoughness={0.4} />
      </mesh>
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.4, 9], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      aria-hidden
    >
      <Studio />
      <Extrusion />
    </Canvas>
  );
}
