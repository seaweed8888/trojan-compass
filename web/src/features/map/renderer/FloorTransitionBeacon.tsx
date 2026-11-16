import { Billboard, Edges, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useRef } from "react";
import type { Group } from "three";
import {
  stairFlight,
  type FloorTransition,
} from "@/features/routing/route-scene";
import { floorName } from "../data/viewer-data";
import { MapHtml } from "./MapHtml";
import { useReducedMotion } from "./useReducedMotion";
import { RouteLine } from "./RouteLine";
import { Staircase } from "./Staircase";

/** Stairs connect the landing surfaces; elevators retain the upright lift beacon. */
type Props = {
  transition: FloorTransition;
  active: boolean;
  onSelectFloor: (floor: number) => void;
  floor?: number;
  allFloors?: boolean;
};

export function FloorTransitionBeacon(props: Props) {
  return props.transition.connectorKind === "stairs" ? (
    <StairTransition {...props} />
  ) : (
    <LiftTransition {...props} />
  );
}

function StairTransition({
  transition,
  active,
  onSelectFloor,
  floor = transition.fromFloor,
  allFloors = false,
}: Props) {
  const flight = stairFlight(
    transition,
    allFloors ? transition.fromFloor : floor,
  );
  if (!flight) return null;
  const destination =
    floor === transition.toFloor
      ? transition.toFloor
      : transition.direction === "up"
        ? (transition.floors.find((f) => f > floor) ?? transition.toFloor)
        : ([...transition.floors].reverse().find((f) => f < floor) ??
          transition.toFloor);
  const arrived = floor === transition.toFloor;
  const caption = arrived
    ? `Stairs · Arrive on ${floorName(floor)}`
    : `Stairs · ${transition.direction} to ${floorName(destination)}`;
  const label =
    floor === transition.toFloor ? transition.exit : transition.entry;
  return (
    <group>
      <Staircase parts={flight.parts} active={active} />
      <RouteLine points={flight.points} active={active} overlay />
      <MapHtml
        position={[label[0], label[1] + 1.7, label[2]]}
        center
        zIndexRange={[25, 21]}
      >
        <button
          type="button"
          aria-label={caption}
          onClick={() => onSelectFloor(destination)}
          className="whitespace-nowrap rounded-xl border border-neutral-300 bg-white/95 px-3 py-2 text-left text-neutral-800 shadow-sm focus-visible:outline-2 focus-visible:outline-neutral-700"
        >
          <span className="block text-[11px] font-bold">
            {arrived
              ? "Leave stairs here"
              : `${transition.direction === "up" ? "↗ Up" : "↘ Down"} to ${floorName(destination).toLowerCase()}`}
          </span>
          <span className="block text-[10px] text-neutral-500">
            Stairs · {floorName(floor)}
          </span>
        </button>
      </MapHtml>
    </group>
  );
}

function LiftTransition({
  transition,
  active,
  onSelectFloor,
}: {
  transition: FloorTransition;
  active: boolean;
  onSelectFloor: (floor: number) => void;
}) {
  const platform = useRef<Group>(null);
  const reducedMotion = useReducedMotion();
  const {
    center,
    size,
    entry,
    exit,
    direction,
    connectorKind,
    fromFloor,
    toFloor,
  } = transition;
  const [width, height, depth] = size;
  const low = Math.min(entry[1], exit[1]),
    high = Math.max(entry[1], exit[1]);
  const sign = direction === "up" ? 1 : -1;
  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  const caption = `${connectorKind === "stairs" ? "Stairs" : connectorKind === "elevator" ? "Elevator" : "Ramp"} · ${direction} to ${floorName(toFloor).toLowerCase()}`;
  useFrame(({ clock }) => {
    if (!platform.current) return;
    const progress =
      reducedMotion || !active ? 0.5 : (clock.elapsedTime * 0.24) % 1;
    platform.current.position.y = entry[1] + (exit[1] - entry[1]) * progress;
  });

  return (
    <group>
      <mesh position={center} renderOrder={80}>
        <boxGeometry args={size} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={active ? 0.16 : 0.07}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
        <Edges
          color="#3b82f6"
          lineWidth={1.1}
          transparent
          opacity={active ? 0.7 : 0.3}
          depthWrite={false}
          depthTest={false}
          renderOrder={81}
        />
      </mesh>
      {[low, high].map((y) => (
        <mesh key={y} position={[center[0], y, center[2]]} renderOrder={82}>
          <boxGeometry args={[width, 0.07, depth]} />
          <meshBasicMaterial
            color="#3b82f6"
            transparent
            opacity={active ? 0.32 : 0.15}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
          <Edges
            color="#2563eb"
            lineWidth={1.7}
            transparent
            opacity={active ? 0.8 : 0.4}
            depthWrite={false}
            depthTest={false}
            renderOrder={83}
          />
        </mesh>
      ))}
      <group ref={platform} position={[center[0], center[1], center[2]]}>
        <mesh renderOrder={84}>
          <boxGeometry args={[width * 0.94, 0.09, depth * 0.94]} />
          <meshBasicMaterial
            color="#93c5fd"
            transparent
            opacity={active ? 0.5 : 0.2}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
          <Edges
            color="#2563eb"
            lineWidth={2}
            transparent
            opacity={active ? 0.9 : 0.4}
            depthWrite={false}
            depthTest={false}
            renderOrder={85}
          />
        </mesh>
      </group>
      {/* These small landing pads preserve the true start/end of each green walking leg. */}
      {[entry, exit].map((point, i) => (
        <mesh
          key={i}
          position={[point[0], point[1] + 0.08, point[2]]}
          renderOrder={103}
        >
          <boxGeometry args={[0.9, 0.08, 0.9]} />
          <meshBasicMaterial
            color="#2563eb"
            transparent
            opacity={active ? 0.6 : 0.3}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      <Billboard position={center} lockX lockZ>
        {[-1, 0, 1].map((i) => (
          <Line
            key={i}
            points={[
              [-0.32, i * Math.min(0.7, height / 5) - sign * 0.18, 0],
              [0, i * Math.min(0.7, height / 5) + sign * 0.18, 0],
              [0.32, i * Math.min(0.7, height / 5) - sign * 0.18, 0],
            ]}
            color="#1d4ed8"
            lineWidth={3}
            transparent
            opacity={active ? 0.9 : 0.4}
            depthWrite={false}
            depthTest={false}
            renderOrder={105}
          />
        ))}
      </Billboard>
      <MapHtml
        position={[center[0], high + 1.3, center[2]]}
        center
        zIndexRange={[25, 21]}
      >
        <button
          type="button"
          aria-label={caption}
          title={`${floorName(fromFloor)} → ${floorName(toFloor)}`}
          onClick={() => onSelectFloor(toFloor)}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-blue-300 bg-blue-50/95 px-2.5 py-1.5 text-left text-blue-800 shadow-sm backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <Icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          <span>
            <span className="block text-[11px] font-bold">
              {direction === "up" ? "Up" : "Down"} to{" "}
              {floorName(toFloor).toLowerCase()}
            </span>
            <span className="block text-[10px] capitalize text-blue-600">
              {connectorKind}
            </span>
          </span>
        </button>
      </MapHtml>
    </group>
  );
}
