'use client';
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { dieGeometry, profileGeometry } from './profile';
import { heroState } from '@/lib/sceneState';

const isMobile = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Metal yüzeylere yansıyan renkli stüdyo ışıkları: parlak panellerden oluşan küçük bir sahne
// bir kez ortam haritasına çevrilir (ağ bağlantısı gerekmez). Her karede yalnızca döndürülür,
// böylece yansımalar profilin üzerinde maliyetsiz kayar.
function ColorStudio() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const room = new THREE.Scene();
    room.background = new THREE.Color('#1b2129');
    const panel = (color: string, power: number, w: number, h: number, pos: [number, number, number]) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(power), side: THREE.DoubleSide }),
      );
      m.position.set(...pos);
      m.lookAt(0, 0, 0);
      room.add(m);
    };
    panel('#e8eef5', 3, 10, 10, [0, 9, 0]); // tepe softbox
    panel('#9aa4b2', 1.8, 20, 10, [0, 0, 10]); // önden nötr dolgu
    panel('#ff9a55', 3.5, 14, 0.7, [0, 4, -6]); // bronz şerit
    panel('#4f9bff', 3, 14, 0.7, [0, -4, 5]); // mavi şerit
    panel('#ff8a55', 0.9, 3, 10, [-8, 0, 2]); // sıcak yan ışık
    panel('#5a95ff', 0.9, 3, 10, [8, 0, -2]); // soğuk yan ışık
    panel('#ffffff', 5, 1, 10, [7, 1, 4]); // beyaz kenar ışığı
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 1.3;
    return () => {
      env.dispose();
      pmrem.dispose();
      room.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
    };
  }, [gl, scene]);
  return (
    <>
      <directionalLight position={[5, 7, 6]} intensity={1.6} color="#ffd2a8" />
      <directionalLight position={[-6, -2, 3]} intensity={0.9} color="#8fb8ff" />
    </>
  );
}

function LightSweep() {
  const scene = useThree((s) => s.scene);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    scene.environmentRotation.set(Math.sin(t * 0.17) * 0.25, t * 0.22 + heroState.scroll * 1.6, 0);
  });
  return null;
}

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
    const k = 1 - Math.exp(-dt * 3);
    const t = state.clock.elapsedTime;
    const tx = (wide ? 0.3 : 0.5) + heroState.pointerX * 0.08 - heroState.scroll * 0.35 + Math.sin(t * 0.3) * 0.04;
    const ty = -0.22 + heroState.pointerY * 0.05;
    group.current.rotation.y += (tx - group.current.rotation.y) * k;
    group.current.rotation.x += (ty - group.current.rotation.x) * k;
    group.current.position.y = (wide ? -0.2 : -0.9) + heroState.scroll * 1.4;
  });

  return (
    <group ref={group} position={[wide ? (compact ? 2.4 : 1.75) : -1.1, 0, -9]} scale={wide ? (compact ? 0.78 : 1) : 1.3}>
      <mesh geometry={dGeo} position-z={-0.5}>
        <meshPhysicalMaterial color="#7a838e" metalness={1} roughness={0.28} />
      </mesh>
      <mesh ref={profile} geometry={pGeo} position-z={-0.45}>
        <meshPhysicalMaterial
          color="#e6eaee"
          metalness={1}
          roughness={0.3}
          anisotropy={0.85}
          clearcoat={0.5}
          clearcoatRoughness={0.15}
        />
      </mesh>
    </group>
  );
}

// Açılışta kamera uzaktan ve yukarıdan profile doğru süzülür; kaydırınca hafifçe geri çekilir.
function CameraRig() {
  const look = useMemo(() => new THREE.Vector3(0, 0, -9), []);
  useFrame(({ camera }, dt) => {
    const k = 1 - Math.exp(-dt * 2.5);
    const intro = heroState.intro;
    const tx = heroState.pointerX * 0.35;
    const ty = 0.4 + (1 - intro) * 2.2 - heroState.pointerY * 0.2 + heroState.scroll * 0.8;
    const tz = 9 + (1 - intro) * 5 + heroState.scroll * 2;
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (ty - camera.position.y) * k;
    camera.position.z += (tz - camera.position.z) * k;
    camera.lookAt(look);
  });
  return null;
}

export default function HeroScene() {
  const mobile = useMemo(isMobile, []);
  const reduce = useMemo(reducedMotion, []);

  return (
    <Canvas
      dpr={[1, mobile ? 1.5 : 1.75]}
      camera={{ position: [0, 2.6, 14], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      aria-hidden
    >
      <ColorStudio />
      {!reduce && <LightSweep />}
      <CameraRig />
      <Extrusion />
      {!reduce && (
        <Sparkles
          count={mobile ? 28 : 70}
          scale={[12, 6, 6]}
          position={[1, 0, -7]}
          size={mobile ? 2.2 : 3}
          speed={0.25}
          opacity={0.55}
          color="#ffb27a"
        />
      )}
    </Canvas>
  );
}
