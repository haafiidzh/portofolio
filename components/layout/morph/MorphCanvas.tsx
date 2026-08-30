"use client";

import { Canvas } from "@react-three/fiber";
import MorphBlob from "./MorphBlob";

export default function MorphCanvas() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 3]} intensity={1.2} color="#f4efe9" />
      <MorphBlob />
    </Canvas>
  );
}
