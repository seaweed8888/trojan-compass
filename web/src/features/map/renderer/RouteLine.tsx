import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import type { Line2 } from "three/examples/jsm/lines/Line2.js";
import { routeChevrons } from "@/features/routing/route-scene";
import { useReducedMotion } from "./useReducedMotion";
import { COLORS } from "../types";

/** Animated "marching ants" route polyline. */
export function RouteLine({
  points,
  width = 5,
  color: customColor,
  active = true,
  overlay = false,
}: {
  points: [number, number, number][];
  width?: number;
  color?: string;
  active?: boolean;
  overlay?: boolean;
}) {
  const ref = useRef<Line2>(null);
  const color = customColor ?? COLORS.route;
  const arrows = useMemo(
    () => routeChevrons(points),
    [points],
  );
  const reducedMotion = useReducedMotion();
  useFrame((_, dt) => {
    const mat = ref.current?.material as { dashOffset: number } | undefined;
    if (mat && !reducedMotion) mat.dashOffset -= dt * 1.4;
  });
  if (points.length < 2) return null;
  return (
    <group>
      <Line
        points={points}
        color={color === "#ffcc00" ? "#594600" : "#ffffff"}
        lineWidth={width + 1.5}
        depthTest={!overlay}
        depthWrite={!overlay}
        renderOrder={overlay ? 100 : 0}
        transparent
        opacity={active ? 0.92 : 0.5}
      />
      <Line
        points={points}
        color={color}
        lineWidth={width}
        depthTest={!overlay}
        depthWrite={!overlay}
        renderOrder={overlay ? 101 : 0}
        transparent
        opacity={active ? 1 : 0.4}
      />
      {active && (
        <Line
          ref={ref}
          points={points}
          color="#ffffff"
          lineWidth={Math.max(1.5, width * 0.35)}
          dashed
          dashSize={0.18}
          gapSize={0.8}
          depthTest={!overlay}
          depthWrite={!overlay}
          renderOrder={overlay ? 102 : 0}
        />
      )}
      {arrows.map((arrow, i) => (
        <group key={i}>
          <Line
            points={arrow}
            color={color === "#ffcc00" ? "#594600" : "#ffffff"}
            lineWidth={5}
            depthTest={!overlay}
            depthWrite={!overlay}
            renderOrder={overlay ? 104 : 1}
            transparent
            opacity={active ? 0.95 : 0.5}
          />
          <Line
            points={arrow}
            color={color}
            lineWidth={3.5}
            depthTest={!overlay}
            depthWrite={!overlay}
            renderOrder={overlay ? 105 : 2}
            transparent
            opacity={active ? 1 : 0.45}
          />
        </group>
      ))}
    </group>
  );
}

export function EndPin({ position }: { position: [number, number, number] }) {
  const color = COLORS.route;
  const ref = useRef<Group>(null);
  const reducedMotion = useReducedMotion();
  useFrame(({ clock }) => {
    if (ref.current)
      ref.current.position.y =
        position[1] +
        0.25 +
        (reducedMotion ? 0 : Math.sin(clock.elapsedTime * 3) * 0.12);
  });
  return (
    <group>
      <group ref={ref} position={position}>
        <mesh position={[0, 1.15, 0]} castShadow>
          <sphereGeometry args={[0.45, 24, 24]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.55, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[0.32, 0.9, 24]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.15, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
      <mesh
        position={[position[0], position[1] + 0.03, position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.35, 0.6, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

export function StartDot({ position }: { position: [number, number, number] }) {
  const color = COLORS.route;
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.16, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.06, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}
