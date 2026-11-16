import { CameraControls } from "@react-three/drei";
import { Canvas, events, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { BuildingCode } from "../data/campus-display";
import type { Cell } from "../data/viewer-data";
import type { Route } from "../../routing/viewer-route";
import type { Route as ApiRoute } from "@trojan-compass/shared/api";
import {
  buildingFrame,
  roomFacingAngle,
  roomLabelsVisible,
  zoomModelWithShortcut,
} from "../camera";
import type { LayerKey, MapLocation, View } from "../types";
import { BuildingScene } from "./BuildingScene";
import { LabelLayerContext } from "./MapHtml";

interface Props {
  view: View;
  layers: Set<LayerKey>;
  route: Route | null;
  apiRoute?: ApiRoute | null;
  activeLegId?: string | null;
  highlights: Map<string, string>;
  selectedCell?: string;
  currentLocation: MapLocation | null;
  placingCurrentLocation: boolean;
  onMoveCurrentLocation: () => void;
  onSelectLocation?: (location: MapLocation) => void;
  onSelectBuilding: (code: BuildingCode) => void;
  onSelectCell: (cell: Cell) => void;
  onSelectFloor: (floor: number) => void;
}

function frame(
  controls: CameraControls,
  view: View,
  animate = true,
  selectedCell?: string,
  aspect = 1,
  fov = 32,
) {
  controls.maxDistance = 160;
  if (view.type === "campus") {
    controls.setLookAt(40, 62, 70, 0, 0, 3, animate);
  } else {
    const initialAngle = view.allFloors ? 0.08 : Math.atan2(4, 33);
    const azimuth = roomFacingAngle(
      view.code,
      selectedCell,
      animate ? controls.azimuthAngle : initialAngle,
    );
    const fitted = buildingFrame(
      view.code,
      aspect,
      fov,
      azimuth,
      view.allFloors ? 1.18 : Math.atan2(33, 32),
      view.allFloors ? undefined : view.floor,
    );
    controls.maxDistance = Math.max(160, fitted.distance * 1.5);
    controls.setLookAt(
      ...fitted.position.toArray(),
      ...fitted.target.toArray(),
      animate,
    );
  }
}

export function MapCanvas(props: Props) {
  const { view, route, layers } = props;
  const controls = useRef<CameraControls>(null);
  const [showRoomLabels, setShowRoomLabels] = useState(true);
  const labelLayer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const zoom = (event: KeyboardEvent) => {
      if (controls.current)
        zoomModelWithShortcut(
          event,
          controls.current,
          window.location.protocol,
        );
    };
    window.addEventListener("keydown", zoom);
    return () => window.removeEventListener("keydown", zoom);
  }, []);

  const indoorLegs = route?.legs.filter((l) => l.kind === "indoor") ?? [];
  const leg =
    view.type === "building"
      ? indoorLegs.find((l) => l.building === view.code)
      : undefined;
  const isFinalLeg = !!leg && route?.to.building === leg.building;

  return (
    <div
      data-floor-map
      className="relative h-full w-full"
      style={{ cursor: props.placingCurrentLocation ? "grabbing" : undefined }}
    >
      <LabelLayerContext.Provider value={labelLayer}>
        <Canvas
          events={(state) => ({
            ...events(state),
            filter: (hits) =>
              hits.sort(
                (a, b) =>
                  Number(!!b.object.userData.locationGuide) -
                  Number(!!a.object.userData.locationGuide),
              ),
          })}
          shadows="percentage"
          dpr={[1, 2]}
          flat
          camera={{ position: [40, 62, 70], fov: 32, near: 0.5, far: 600 }}
          onPointerMissed={() => (document.body.style.cursor = "")}
        >
          <color attach="background" args={["#ffffff"]} />
          <hemisphereLight args={["#ffffff", "#dcdce2", 1.0]} />
          <ambientLight intensity={0.55} />
          <directionalLight
            position={[30, 60, 25]}
            intensity={1.5}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-45}
            shadow-camera-right={45}
            shadow-camera-top={45}
            shadow-camera-bottom={-45}
            shadow-camera-far={160}
            shadow-bias={-0.0004}
          />
          {view.type === "building" && (
            <BuildingScene
              apiRoute={props.apiRoute}
              activeLegId={props.activeLegId}
              showRoomLabels={showRoomLabels}
              code={view.code}
              floor={view.floor}
              allFloors={view.allFloors}
              layers={layers}
              highlights={props.highlights}
              selectedCell={props.selectedCell}
              currentLocation={props.currentLocation}
              placingCurrentLocation={props.placingCurrentLocation}
              onMoveCurrentLocation={props.onMoveCurrentLocation}
              onSelectLocation={props.onSelectLocation}
              leg={leg?.kind === "indoor" ? leg : undefined}
              isFinalLeg={isFinalLeg}
              onSelectCell={props.onSelectCell}
              onSelectFloor={props.onSelectFloor}
            />
          )}
          <CameraControls
            ref={controls}
            onUpdate={() => {
              const c = controls.current;
              if (c)
                setShowRoomLabels((visible) =>
                  roomLabelsVisible(c.distance, c.maxDistance, visible),
                );
            }}
            enabled={!props.placingCurrentLocation}
            makeDefault
            minDistance={12}
            maxDistance={160}
            maxPolarAngle={Math.PI / 2.3}
            smoothTime={0.45}
          />
          <CameraRig
            view={view}
            controls={controls}
            selectedCell={props.selectedCell}
          />
        </Canvas>
      </LabelLayerContext.Provider>
      {/* Labels opt back into pointer events individually, so the layer never blocks the canvas. */}
      <div
        ref={labelLayer}
        className="pointer-events-none absolute inset-0 overflow-hidden"
      />
    </div>
  );
}

/** Lives inside the Canvas so the CameraControls ref is attached before framing. */
function CameraRig({
  view,
  controls,
  selectedCell,
}: {
  view: View;
  controls: React.RefObject<CameraControls | null>;
  selectedCell?: string;
}) {
  const first = useRef(true);
  const size = useThree((state) => state.size);
  const camera = useThree((state) => state.camera);
  const focusView = view.type === "building" && selectedCell ? view : null;
  const viewKey =
    view.type === "campus"
      ? "campus"
      : `${view.code}-${view.allFloors ? "all" : view.floor}`;
  useEffect(() => {
    if (!controls.current) return;
    frame(
      controls.current,
      view,
      !first.current,
      selectedCell,
      size.width / size.height,
      "fov" in camera ? Number(camera.fov) : 32,
    );
    first.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey, focusView, selectedCell, size.width, size.height]);
  return null;
}
