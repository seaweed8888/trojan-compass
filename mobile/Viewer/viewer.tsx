import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useThree } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import { DoubleSide, Vector3 } from "three";
import { MapCanvas } from "../../web/src/features/map/renderer/MapCanvas";
import { clientRequestId } from "../../web/src/lib/api-client";
import { MapHtml } from "../../web/src/features/map/renderer/MapHtml";
import { FloorTransitionBeacon } from "../../web/src/features/map/renderer/FloorTransitionBeacon";
import { RouteLine } from "../../web/src/features/map/renderer/RouteLine";
import {
  sceneRoute,
  routeUsesStair,
} from "../../web/src/features/routing/route-scene";
import {
  BUILDINGS,
  type BuildingCode,
} from "../../web/src/features/map/data/campus-display";
import snapshot from "../TrojanCompass/Resources/preview-scenes.json";
import { installBuilding } from "../../web/src/features/map/data/viewer-data";
import type { Building, FloorResponse } from "@trojan-compass/shared";
for (const entry of snapshot.scenes)
  installBuilding(entry.building as Building, entry.floors as FloorResponse[]);
import {
  cellCenter,
  floorY,
  cellTitle,
  getLayout,
  getLevels,
} from "../../web/src/features/map/data/viewer-data";
import { mapLocationAt } from "../../web/src/features/map/map-location";
import type { LayerKey, MapLocation } from "../../web/src/features/map/types";

type Point = { x: number; y: number; z: number };
type LiveFloor = {
  id: string;
  elevation: number;
  bounds: { min: Point; max: Point };
  objects: any[];
  places: any[];
};
type State = {
  source: "preview" | "live";
  buildingId: string;
  floorId: string;
  allFloors: boolean;
  layers: LayerKey[];
  selectedPlaceId?: string;
  origin?: any;
  picking?: "origin" | "destination";
  floors?: LiveFloor[];
  route?: any;
  reset: number;
  reduceMotion: boolean;
};
type Envelope = {
  protocolVersion: number;
  messageId: string;
  kind: string;
  dataVersion: string;
  payload: any;
};
declare global {
  interface Window {
    CompassViewer: { receive: (m: Envelope) => void };
    webkit?: {
      messageHandlers: { compass: { postMessage: (m: Envelope) => void } };
    };
  }
}
let version = "web-preview-v1";
function emit(kind: string, payload: any, replyTo?: string) {
  window.webkit?.messageHandlers.compass.postMessage({
    protocolVersion: 1,
    messageId: clientRequestId(),
    kind,
    dataVersion: version,
    payload: { ...payload, replyTo },
  });
}
const defaults: State = {
  source: "preview",
  buildingId: "LAW",
  floorId: "1",
  allFloors: false,
  layers: [
    "classrooms",
    "mensRestrooms",
    "womensRestrooms",
    "ramps",
    "elevators",
    "stairs",
    "entrances",
    "exits",
  ],
  reset: 0,
  reduceMotion: false,
};
class ViewerBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch() {
    emit("viewer_error", {
      message:
        "The interior could not be rendered. Return to campus and try again.",
    });
  }
  render() {
    return this.state.error ? (
      <p role="alert" style={{ padding: 24 }}>
        Interior unavailable. Return to campus and try again.
      </p>
    ) : (
      this.props.children
    );
  }
}
function Viewer() {
  const [s, set] = useState(defaults);
  useEffect(() => {
    window.CompassViewer = {
      receive: (m) => {
        if (m.protocolVersion !== 1 || m.kind !== "command") return;
        const n = m.payload as State;
        if (
          n.source === "preview" &&
          !BUILDINGS.some((b) => b.code === n.buildingId)
        ) {
          emit(
            "ack",
            { success: false, message: "Unknown building" },
            m.messageId,
          );
          return;
        }
        if (n.source === "live" && !n.floors?.length) {
          emit(
            "ack",
            { success: false, message: "Missing geometry" },
            m.messageId,
          );
          return;
        }
        version = m.dataVersion;
        set(n);
        emit("ack", { success: true }, m.messageId);
      },
    };
    emit("viewer_ready", {
      supportedActions: [
        "focus_building",
        "focus_floor",
        "focus_place",
        "show_route",
        "set_state",
      ],
    });
    return () => {
      delete (window as any).CompassViewer;
    };
  }, []);
  const code = s.buildingId as BuildingCode;
  const location = (l: MapLocation) => {
    const layout = getLayout(l.building, l.floor);
    const cell = layout.cells.find((c) => {
      const [x, z] = cellCenter(c);
      return Math.hypot(x - l.x, z - l.z) < 0.03 && c.kind !== "block";
    });
    emit("position_picked", {
      ...l,
      placeId: l.placeId ?? cell?.id,
      position: { x: l.x, y: floorY(l.floor, l.building), z: l.z },
      coordinateSpace: "preview-meters",
    });
  };
  return (
    <div className="relative h-full">
      {s.source === "live" ? (
        <LiveViewer s={s} />
      ) : (
        <MapCanvas
          key={`${s.reset}-${s.reduceMotion}`}
          view={{
            type: "building",
            code,
            floor: Number(s.floorId),
            allFloors: s.allFloors,
          }}
          layers={new Set(s.layers)}
          route={null}
          apiRoute={s.route}
          highlights={new Map()}
          selectedCell={s.selectedPlaceId}
          currentLocation={
            s.origin
              ? {
                  building: s.origin.buildingId,
                  floor: Number(s.origin.floorId),
                  label: s.origin.label,
                  x: s.origin.x,
                  z: s.origin.z,
                }
              : null
          }
          placingCurrentLocation={s.picking === "origin"}
          onMoveCurrentLocation={() => emit("move_origin", {})}
          onSelectLocation={s.picking ? location : undefined}
          onSelectBuilding={() => {}}
          onSelectFloor={(floor) =>
            emit("floor_selected", { floorId: String(floor) })
          }
          onSelectCell={(c) => {
            if (s.picking) {
              const [x, z] = cellCenter(c);
              location({
                building: code,
                floor: c.floor,
                label: cellTitle(c),
                x,
                z,
              });
            } else
              emit("place_selected", {
                buildingId: code,
                floorId: String(c.floor),
                placeId: c.id,
              });
          }}
        />
      )}
    </div>
  );
}
const point = (p: Point): [number, number, number] => [p.x, p.y, p.z];
function LiveViewer({ s }: { s: State }) {
  const fs = s.floors!.filter((f) => s.allFloors || f.id === s.floorId);
  return (
    <Canvas
      camera={{ position: [25, 35, 40], fov: 40, near: 0.05, far: 5000 }}
      dpr={[1, 2]}
    >
      <color attach="background" args={["#fafaf9"]} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[20, 40, 10]} intensity={2} />
      {fs.map((f) => (
        <group key={f.id}>
          {f.objects.map((o: any) => {
            const selected = o.placeId === s.selectedPlaceId;
            const place = f.places.find((p) => p.id === o.placeId);
            if (
              place?.kind === "stairs" &&
              !routeUsesStair(s.route, s.buildingId, f.id, place.position)
            )
              return null;
            const pick = (e: any) => {
              e.stopPropagation();
              if (s.picking) {
                if (o.role === "wall" || o.role === "blocked") return;
                if (!o.pickable && o.role !== "slab") return;
                const p = place?.position || {
                  x: e.point.x,
                  y: f.elevation,
                  z: e.point.z,
                };
                emit("position_picked", {
                  buildingId: s.buildingId,
                  floorId: f.id,
                  position: p,
                  placeId: place?.id,
                  label: place?.label || `${s.buildingId} ${f.id} · open area`,
                  coordinateSpace: "canonical-meters",
                });
              } else if (o.pickable && place)
                emit("place_selected", {
                  buildingId: s.buildingId,
                  floorId: f.id,
                  placeId: place.id,
                });
            };
            return (
              <mesh
                key={o.objectKey}
                position={o.kind === "box" ? point(o.center) : undefined}
                rotation={o.kind === "box" ? [0, o.yawRadians, 0] : undefined}
                onClick={pick}
              >
                {o.kind === "box" ? (
                  <boxGeometry args={point(o.size)} />
                ) : (
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      args={[new Float32Array(o.vertices.flatMap(point)), 3]}
                    />
                    <bufferAttribute
                      attach="index"
                      args={[new Uint32Array(o.triangles), 1]}
                    />
                  </bufferGeometry>
                )}
                <meshStandardMaterial
                  side={DoubleSide}
                  color={
                    selected
                      ? "#ffcc00"
                      : o.role === "wall"
                        ? "#c9c9ce"
                        : "#eee9e3"
                  }
                  roughness={0.9}
                />
              </mesh>
            );
          })}
          {f.places
            .filter(
              (p) =>
                (p.id === s.selectedPlaceId || layerVisible(p, s.layers)),
            )
            .map((p) => (
              <MapHtml key={p.id} position={point(p.position)} center>
                <button
                  aria-label={p.label}
                  onClick={() =>
                    s.picking
                      ? emit("position_picked", {
                          buildingId: s.buildingId,
                          floorId: f.id,
                          position: p.position,
                          placeId: p.id,
                          label: p.label,
                          coordinateSpace: "canonical-meters",
                        })
                      : emit("place_selected", {
                          buildingId: s.buildingId,
                          floorId: f.id,
                          placeId: p.id,
                        })
                  }
                  style={{
                    fontSize: 12,
                    padding: "5px 8px",
                    borderRadius: 16,
                    border: "1px solid #ddd",
                    background:
                      p.id === s.selectedPlaceId ? "#ffcc00" : "white",
                    whiteSpace: "nowrap",
                    color: "#222",
                  }}
                >
                  {p.label}
                </button>
              </MapHtml>
            ))}
          {s.route?.legs
            .filter(
              (l: any) =>
                l.kind === "indoor" &&
                l.buildingId === s.buildingId &&
                l.floorId === f.id &&
                l.points.length > 1,
            )
            .map((l: any) => (
              <RouteLine
                key={l.id}
                points={l.points.map((p: Point) => [p.x, p.y + 0.12, p.z])}
                overlay
              />
            ))}
          {s.origin?.buildingId === s.buildingId &&
            s.origin.floorId === f.id && (
              <group position={[s.origin.x, s.origin.y + 0.2, s.origin.z]}>
                <mesh>
                  <sphereGeometry args={[0.3, 16, 16]} />
                  <meshStandardMaterial color="#ffcc00" />
                </mesh>
                <MapHtml position={[0, 0.6, 0]} center>
                  <button
                    onClick={() => emit("move_origin", {})}
                    style={{
                      background: "#990000",
                      color: "white",
                      border: 0,
                      borderRadius: 12,
                      padding: 5,
                      whiteSpace: "nowrap",
                    }}
                  >
                    You are here
                  </button>
                </MapHtml>
              </group>
            )}
        </group>
      ))}
      {s.route &&
        sceneRoute(s.route, s.buildingId as BuildingCode).map(
          (transition) =>
            transition.kind === "vertical" &&
            (s.allFloors || transition.floors.includes(Number(s.floorId))) && (
              <FloorTransitionBeacon
                key={transition.id}
                transition={transition}
                floor={Number(s.floorId)}
                allFloors={s.allFloors}
                active
                onSelectFloor={(floor) =>
                  emit("floor_selected", { floorId: String(floor) })
                }
              />
            ),
        )}
      <LiveCamera s={s} />
    </Canvas>
  );
}
function layerVisible(p: any, l: LayerKey[]) {
  if (p.isRamp) return l.includes("ramps");
  const k: Record<string, LayerKey> = {
    classroom: "classrooms",
    room: "classrooms",
    elevator: "elevators",
    stairs: "stairs",
    entrance: "entrances",
    emergency_exit: "exits",
    toilet: "mensRestrooms",
    restroom: "womensRestrooms",
  };
  return l.includes(k[p.kind] || "classrooms");
}
function LiveCamera({ s }: { s: State }) {
  const ref = useRef<CameraControls>(null),
    size = useThree((v) => v.size);
  useEffect(() => {
    const floors = s.floors!.filter((f) => s.allFloors || f.id === s.floorId);
    const points = floors.flatMap((f) => [f.bounds.min, f.bounds.max]);
    const min = new Vector3(
      ...(["x", "y", "z"].map((k) =>
        Math.min(...points.map((p) => (p as any)[k])),
      ) as [number, number, number]),
    );
    const max = new Vector3(
      ...(["x", "y", "z"].map((k) =>
        Math.max(...points.map((p) => (p as any)[k])),
      ) as [number, number, number]),
    );
    const center = min.clone().add(max).multiplyScalar(0.5),
      d =
        Math.max(10, max.distanceTo(min)) *
        Math.max(1, size.height / size.width);
    ref.current?.setLookAt(
      center.x + d * 0.7,
      center.y + d,
      center.z + d,
      center.x,
      center.y,
      center.z,
      !s.reduceMotion,
    );
  }, [s.buildingId, s.floorId, s.allFloors, s.reset, size.width, size.height]);
  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={2}
      maxDistance={3000}
      smoothTime={s.reduceMotion ? 0 : 0.3}
    />
  );
}
createRoot(document.getElementById("root")!).render(
  <ViewerBoundary>
    <Viewer />
  </ViewerBoundary>,
);
