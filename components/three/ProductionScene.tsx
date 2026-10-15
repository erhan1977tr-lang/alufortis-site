'use client';
import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { dieGeometry, profileGeometry } from './profile';
import { Studio } from './Studio';
import { productionState } from '@/lib/sceneState';

function Piece() {
  const group = useRef<THREE.Group>(null);
  const profile = useRef<THREE.Mesh>(null);
  const die = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  const dieMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const pGeo = useMemo(profileGeometry, []);
  const dGeo = useMemo(dieGeometry, []);
  const target = useMemo(() => new THREE.Color(), []);

  useFrame((state, dt) => {
    const k = 1 - Math.exp(-dt * 4);
    const f = productionState.finish;
    if (mat.current) {
      target.set(f.color);
      mat.current.color.lerp(target, k);
      mat.current.metalness += (f.metalness - mat.current.metalness) * k;
      mat.current.roughness += (f.roughness - mat.current.roughness) * k;
      mat.current.clearcoat += ((f.metalness > 0.5 ? 0.35 : 0) - mat.current.clearcoat) * k;
    }
    if (profile.current) {
      profile.current.scale.z += (productionState.length - profile.current.scale.z) * k;
      profile.current.position.z = -profile.current.scale.z / 2;
    }
    if (die.current && dieMat.current) {
      const d = productionState.die;
      dieMat.current.opacity += (d - dieMat.current.opacity) * k;
      die.current.visible = dieMat.current.opacity > 0.02;
      die.current.position.z = -profile.current!.scale.z / 2 - 0.5;
    }
    if (group.current) group.current.rotation.y = -0.95 + Math.sin(state.clock.elapsedTime * 0.25) * 0.2;
  });

  return (
    <group ref={group} rotation-x={0.3} scale={0.62}>
      <mesh ref={die} geometry={dGeo}>
        <meshPhysicalMaterial ref={dieMat} color="#5d666f" metalness={1} roughness={0.5} transparent />
      </mesh>
      <mesh ref={profile} geometry={pGeo}>
        <meshPhysicalMaterial ref={mat} color="#b4b9be" metalness={1} roughness={0.42} />
      </mesh>
    </group>
  );
}

export default function ProductionScene() {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0.3, 11], fov: 30 }} gl={{ antialias: true, alpha: true }} aria-hidden>
      <Studio />
      <Piece />
    </Canvas>
  );
}
