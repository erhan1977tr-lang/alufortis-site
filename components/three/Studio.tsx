'use client';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Ağ bağlantısı gerektirmeyen stüdyo ortamı: metal yüzeylerdeki yansımaları üretir
export function Studio() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
    scene.environment = env;
    scene.environmentIntensity = 1.1;
    return () => {
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 7, 6]} intensity={1.6} />
      <directionalLight position={[-6, -2, 3]} intensity={0.5} color="#d9c3a5" />
    </>
  );
}
