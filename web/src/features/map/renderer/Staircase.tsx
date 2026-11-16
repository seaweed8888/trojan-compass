import { Edges } from "@react-three/drei";
import type { StairPart } from "./stair-geometry";

export function Staircase({
  parts,
  active = true,
}: {
  parts: StairPart[];
  active?: boolean;
}) {
  return (
    <group>
      {parts.map((part, i) => (
        <mesh
          key={i}
          position={part.position}
          rotation={[0, part.yaw, 0]}
          castShadow
          receiveShadow
          renderOrder={80}
        >
          <boxGeometry args={part.size} />
          <meshStandardMaterial
            color="#d4d4d8"
            roughness={0.85}
            transparent={!active}
            opacity={active ? 1 : 0.5}
            depthTest={false}
            depthWrite={false}
          />
          <Edges
            color="#71717a"
            depthTest={false}
            depthWrite={false}
            renderOrder={81}
          />
        </mesh>
      ))}
    </group>
  );
}
