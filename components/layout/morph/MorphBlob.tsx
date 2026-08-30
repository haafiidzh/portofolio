"use client";

import { useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere } from "@react-three/drei";
import { useRef } from "react";
import { Color, type Mesh } from "three";
import { useMouseParallax } from "./useMouseParallax";
import { lerpParams, useScrollMorph } from "./useScrollMorph";

export default function MorphBlob() {
  const mesh = useRef<Mesh>(null);
  const pointer = useMouseParallax();
  const morph = useScrollMorph();

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    const { from, to, progress } = morph.current;
    const params = lerpParams(from, to, progress);

    mesh.current.rotation.x += 0.0012;
    mesh.current.rotation.y += 0.0018;
    mesh.current.position.y = Math.sin(t * 0.35) * 0.15;
    mesh.current.position.x += (params.posX - mesh.current.position.x) * 0.04;

    mesh.current.rotation.x +=
      (pointer.current.y * 0.15 - mesh.current.rotation.x * 0.02) * 0.02;
    mesh.current.rotation.y +=
      (pointer.current.x * 0.15 - mesh.current.rotation.y * 0.02) * 0.02;

    mesh.current.scale.x += (params.scale[0] - mesh.current.scale.x) * 0.05;
    mesh.current.scale.y += (params.scale[1] - mesh.current.scale.y) * 0.05;
    mesh.current.scale.z += (params.scale[2] - mesh.current.scale.z) * 0.05;

    const material = mesh.current.material;
    if (!Array.isArray(material) && "distort" in material) {
      const distortMaterial = material as unknown as {
        distort: number;
        opacity: number;
        color: Color;
      };
      distortMaterial.color.lerp(new Color(to.color), 0.05);
      distortMaterial.distort += (params.distort - distortMaterial.distort) * 0.05;
      distortMaterial.opacity += (params.opacity - distortMaterial.opacity) * 0.05;
    }
  });

  return (
    <Sphere ref={mesh} args={[1.4, 64, 64]}>
      <MeshDistortMaterial
        color="#7a5c8e"
        roughness={0.35}
        metalness={0.1}
        distort={0.4}
        speed={1.2}
        transparent
        opacity={0.5}
      />
    </Sphere>
  );
}
