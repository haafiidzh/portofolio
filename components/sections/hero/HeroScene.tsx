"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere } from "@react-three/drei";
import { useRef } from "react";
import type { Mesh } from "three";
import { useMouseParallax } from "./useMouseParallax";

function Blob() {
  const mesh = useRef<Mesh>(null);
  const pointer = useMouseParallax();

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.x += 0.0015;
    mesh.current.rotation.y += 0.002;
    mesh.current.position.y = Math.sin(t * 0.4) * 0.15;

    mesh.current.rotation.x +=
      (pointer.current.y * 0.15 - mesh.current.rotation.x * 0.02) * 0.02;
    mesh.current.rotation.y +=
      (pointer.current.x * 0.15 - mesh.current.rotation.y * 0.02) * 0.02;
  });

  return (
    <Sphere ref={mesh} args={[1.4, 64, 64]}>
      <MeshDistortMaterial
        color="#7a5c8e"
        roughness={0.35}
        metalness={0.1}
        distort={0.4}
        speed={1.2}
      />
    </Sphere>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 3]} intensity={1.2} color="#f4efe9" />
      <Blob />
    </Canvas>
  );
}
