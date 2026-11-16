import { StairsIcon } from "./StairsIcon";
import { Edges, Line } from "@react-three/drei";
import { MapHtml } from "./MapHtml";
import {
  Accessibility,
  ArrowUpDown,
  DoorOpen,
  TriangleAlert,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import type { BuildingCode } from "../data/campus-display";
import {
  cellCenter,
  cellTitle,
  floorName,
  floorY,
  getLayout,
  getLevels,
  planBounds,
  getPlaces,
  type Cell,
  type FloorLayout,
} from "../data/viewer-data";
import type { IndoorLeg } from "../../routing/viewer-route";
import { COLORS, type LayerKey, type MapLocation } from "../types";
import { MapBadge } from "./Badge";
import { RestroomIcon } from "./RestroomIcon";
import { WheelchairIcon } from "./WheelchairIcon";
import { EndPin, RouteLine, StartDot } from "./RouteLine";
import { FloorTransitionBeacon } from "./FloorTransitionBeacon";
import {
  sceneRoute,
  scenePosition,
  routeUsesStair,
} from "@/features/routing/route-scene";
import type { Route as ApiRoute } from "@trojan-compass/shared/api";
import {
  CurrentLocationPin,
  TommyTrojanMarker,
  TommyTrojanPlacement,
} from "./TommyTrojan";

interface Props {
  code: BuildingCode;
  floor: number;
  allFloors?: boolean;
  showRoomLabels?: boolean;
  layers: Set<LayerKey>;
  highlights: Map<string, string>;
  selectedCell?: string;
  currentLocation: MapLocation | null;
  placingCurrentLocation: boolean;
  onMoveCurrentLocation: () => void;
  onSelectLocation?: (location: MapLocation) => void;
  leg?: IndoorLeg;
  apiRoute?: ApiRoute | null;
  activeLegId?: string | null;
  isFinalLeg: boolean;
  onSelectCell: (cell: Cell) => void;
  onSelectFloor: (floor: number) => void;
}

const WALL_H = 0.85;
const WALL_COLOR = "#c9c9ce";

export function BuildingScene(props: Props) {
  const { code, floor, leg, isFinalLeg, currentLocation } = props;
  const levels = getLevels(code);
  const routePts = leg?.points.map(
    (p) => [p.x, p.y + 0.35, p.z] as [number, number, number],
  );
  const last = routePts?.at(-1);
  const focusedPlace = selectedPlace(props);
  const apiSegments = props.apiRoute ? sceneRoute(props.apiRoute, code) : [];
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, floorY(levels[0] ?? 1, code) - 0.3, 0]}
        receiveShadow
      >
        <planeGeometry args={[400, 400]} />
        <shadowMaterial opacity={0.1} />
      </mesh>
      {levels.map((f) =>
        props.allFloors || f === floor ? (
          <ActiveFloor key={f} {...props} floor={f} />
        ) : (
          <GhostFloor
            key={f}
            code={code}
            floor={f}
            above={f > floor}
            inRoute={!!leg?.floors.includes(f)}
            interactive={f < floor && !props.onSelectLocation}
            onClick={() => props.onSelectFloor(f)}
          />
        ),
      )}
      {!props.placingCurrentLocation &&
        currentLocation?.building === code &&
        (props.allFloors || currentLocation.floor === floor ? (
          <TommyTrojanMarker
            key={`${currentLocation.x}-${currentLocation.z}-${currentLocation.floor}`}
            location={currentLocation}
            onGrab={props.onMoveCurrentLocation}
          />
        ) : (
          <CurrentLocationPin
            location={currentLocation}
            onSelect={() => props.onSelectFloor(currentLocation.floor)}
          />
        ))}
      {props.placingCurrentLocation && props.onSelectLocation && (
        <TommyTrojanPlacement
          layout={getLayout(code, floor)}
          onDrop={props.onSelectLocation}
        />
      )}
      {focusedPlace && !leg && (
        <EndPin
          position={[
            focusedPlace.position.x,
            focusedPlace.position.y,
            focusedPlace.position.z,
          ]}
        />
      )}
      {!props.apiRoute && routePts && last && (
        <>
          {routePts.length > 1 && <RouteLine points={routePts} />}
          <StartDot
            position={[
              routePts[0]![0],
              routePts[0]![1] - 0.33,
              routePts[0]![2],
            ]}
          />
          {isFinalLeg ? (
            <EndPin position={[last[0], last[1] - 0.35, last[2]]} />
          ) : (
            <StartDot position={[last[0], last[1] - 0.33, last[2]]} />
          )}
        </>
      )}
      {apiSegments.map((segment) =>
        segment.kind === "vertical" ? (
          <FloorTransitionBeacon
            key={segment.id}
            transition={segment}
            floor={floor}
            allFloors={props.allFloors}
            active={!props.activeLegId || props.activeLegId === segment.id}
            onSelectFloor={props.onSelectFloor}
          />
        ) : (
          <RouteLine
            key={segment.id}
            points={segment.points}
            active={!props.activeLegId || props.activeLegId === segment.id}
            overlay
          />
        ),
      )}
      {props.apiRoute?.origin.buildingId === code && (
        <StartDot
          position={scenePosition(code, props.apiRoute.origin.position, 0.03)}
        />
      )}
      {props.apiRoute?.destination.buildingId === code && (
        <EndPin
          position={scenePosition(
            code,
            props.apiRoute.destination.position,
            0.03,
          )}
        />
      )}
    </group>
  );
}

function selectedPlace(props: Props) {
  return getPlaces(props.code).find(
    (p) =>
      p.id === props.selectedCell &&
      !p.sceneObjectKey &&
      (props.allFloors || p.floorId === String(props.floor)),
  );
}

function Slabs({
  layout,
  color,
  opacity = 1,
  edge,
  depthWrite = true,
  onSelect,
}: {
  layout: FloorLayout;
  color: string;
  opacity?: number;
  edge: string;
  depthWrite?: boolean;
  onSelect?: (x: number, z: number) => void;
}) {
  return (
    <>
      {layout.slabs.map(([x0, z0, x1, z1], i) => (
        <mesh
          key={i}
          position={[(x0 + x1) / 2, -0.12, (z0 + z1) / 2]}
          receiveShadow={opacity === 1}
          castShadow={opacity === 1}
          onClick={
            onSelect
              ? (event) => {
                  event.stopPropagation();
                  onSelect(event.point.x, event.point.z);
                }
              : undefined
          }
        >
          <boxGeometry args={[x1 - x0, 0.24, z1 - z0]} />
          <meshStandardMaterial
            color={color}
            transparent={opacity < 1}
            opacity={opacity}
            depthWrite={depthWrite}
          />
          <Edges color={edge} />
        </mesh>
      ))}
    </>
  );
}

function GhostFloor({
  code,
  floor,
  above,
  inRoute,
  interactive,
  onClick,
}: {
  code: BuildingCode;
  floor: number;
  above: boolean;
  inRoute: boolean;
  interactive: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const layout = getLayout(code, floor);
  const b = planBounds(code);
  return (
    <group
      position={[0, floorY(floor, code), 0]}
      onClick={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
    >
      <Slabs
        layout={layout}
        color={hover ? "#e9d6d6" : "#e4e4e7"}
        opacity={above ? (hover ? 0.35 : 0.07) : hover ? 0.8 : 0.55}
        depthWrite={!above}
        edge={
          inRoute
            ? above
              ? "#e2b4b4"
              : COLORS.cardinal
            : above
              ? "#d4d4d8"
              : "#b8b8be"
        }
      />
      <MapHtml
        position={[b.x0 + 1.4, 0, b.z1 + 0.9]}
        center
        zIndexRange={[20, 0]}
      >
        <button
          onClick={onClick}
          className={`whitespace-nowrap rounded-full border bg-white px-2 py-0.5 text-[11px] font-semibold shadow-sm transition hover:border-[#990000] hover:text-[#990000] ${
            inRoute
              ? "border-[#990000] text-[#990000]"
              : "border-neutral-200 text-neutral-500"
          }`}
        >
          {floorName(floor, code)}
        </button>
      </MapHtml>
    </group>
  );
}

function ActiveFloor({
  showRoomLabels = true,
  code,
  floor,
  layers,
  highlights,
  selectedCell,
  onSelectCell,
  onSelectLocation,
  apiRoute,
}: Props) {
  const source = getLayout(code, floor);
  const layout = {
    ...source,
    cells: source.cells.filter(
      (c) =>
        c.kind !== "stairs" ||
        routeUsesStair(apiRoute, code, String(floor), {
          x: c.door[0],
          y: floorY(floor, code),
          z: c.door[1],
        }),
    ),
  };
  const [hover, setHover] = useState<string | null>(null);
  const accessibleOn = layers.has("accessible");
  const nodeById = new Map(layout.walkNodes.map((n) => [n.id, n]));
  return (
    <group
      position={[0, floorY(floor, code), 0]}
      onClick={(event) => event.stopPropagation()}
      onPointerOver={(event) => event.stopPropagation()}
    >
      <Slabs
        layout={layout}
        color="#f4f4f6"
        edge="#b8b8be"
        onSelect={
          onSelectLocation
            ? (x, z) =>
                onSelectLocation({
                  label: `${code} ${floorName(floor, code)} · open area`,
                  building: code,
                  floor,
                  x,
                  z,
                })
            : undefined
        }
      />
      {layout.objects
        .filter((o) => o.role === "wall" && o.kind === "box")
        .map(
          (o) =>
            o.kind === "box" && (
              <mesh
                key={o.objectKey}
                position={[
                  o.center.x,
                  o.center.y - floorY(floor, code),
                  o.center.z,
                ]}
                rotation={[0, o.yawRadians, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[o.size.x, o.size.y, o.size.z]} />
                <meshStandardMaterial color={WALL_COLOR} roughness={0.9} />
              </mesh>
            ),
        )}
      {accessibleOn &&
        layout.walkEdges.map(([a, b], i) => {
          const na = nodeById.get(a)!;
          const nb = nodeById.get(b)!;
          return (
            <Line
              key={i}
              points={[
                [na.x, 0.04, na.z],
                [nb.x, 0.04, nb.z],
              ]}
              color={COLORS.accessible}
              lineWidth={3}
              transparent
              opacity={0.75}
            />
          );
        })}
      {layout.cells.map((c) => {
        const [cx, cz] = cellCenter(c);
        const w = c.x1 - c.x0;
        const d = c.z1 - c.z0;
        const hl = highlights.get(c.id);
        const selected = selectedCell === c.id;
        const hovered = hover === c.id;
        const interactive = c.kind !== "block";
        const base =
          c.kind === "block"
            ? "#dcdce0"
            : c.open
              ? "#ededf0"
              : c.kind === "restroom"
                ? "#e1e7ef"
                : c.kind === "elevator"
                  ? "#d8d8dc"
                  : c.kind === "stairs"
                    ? "#e6e6e9"
                    : "#e9e9ec";
        const color = selected
          ? COLORS.gold
          : (hl ?? (hovered ? "#e6d3d3" : base));
        return (
          <group key={c.id}>
            <mesh
              position={[cx, c.open ? 0.008 : 0.016, cz]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
              onPointerOver={
                interactive
                  ? (e) => {
                      e.stopPropagation();
                      setHover(c.id);
                      document.body.style.cursor = "pointer";
                    }
                  : undefined
              }
              onPointerOut={
                interactive
                  ? () => {
                      setHover((h) => (h === c.id ? null : h));
                      document.body.style.cursor = "";
                    }
                  : undefined
              }
              onClick={
                interactive
                  ? (e) => {
                      e.stopPropagation();
                      onSelectCell(c);
                    }
                  : undefined
              }
            >
              <planeGeometry args={[w, d]} />
              <meshStandardMaterial
                color={color}
                transparent={!!hl && !selected}
                opacity={hl && !selected ? (c.open ? 0.45 : 0.85) : 1}
              />
            </mesh>
            {c.kind === "elevator" && (
              <mesh position={[cx, 0.6, cz]} castShadow>
                <boxGeometry args={[w * 0.6, 1.2, d * 0.6]} />
                <meshStandardMaterial color="#b6b6bc" roughness={0.6} />
                <Edges color="#9a9aa0" />
              </mesh>
            )}
          </group>
        );
      })}
      <FloorMarkers
        showRoomLabels={showRoomLabels}
        layout={source}
        layers={layers}
        highlights={highlights}
        selectedCell={selectedCell}
        onSelectCell={onSelectCell}
        onSelectLocation={onSelectLocation}
      />
    </group>
  );
}

function FloorMarkers({
  showRoomLabels = true,
  layout,
  layers,
  highlights,
  selectedCell,
  onSelectCell,
  onSelectLocation,
}: {
  showRoomLabels?: boolean;
  layout: FloorLayout;
  layers: Set<LayerKey>;
  highlights: Map<string, string>;
  selectedCell?: string;
  onSelectCell: (c: Cell) => void;
  onSelectLocation?: (location: MapLocation) => void;
}) {
  const icon = "h-3.5 w-3.5";
  const markers: {
    key: string;
    pos: [number, number, number];
    node: ReactNode;
  }[] = [];
  for (const c of layout.cells) {
    const [cx, cz] = cellCenter(c);
    const badges: ReactNode[] = [];
    if (c.kind === "block") continue;
    if (c.kind === "room") {
      const hl = highlights.get(c.id);
      const selected = selectedCell === c.id;
      if ((showRoomLabels && layers.has("classrooms")) || hl || selected) {
        markers.push({
          key: c.id,
          pos: [cx, 1.3, cz],
          node: (
            <button
              onClick={() => onSelectCell(c)}
              title={[c.name, c.provenanceNote].filter(Boolean).join(" · ")}
              className="whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-bold tabular-nums shadow-sm transition hover:-translate-y-0.5"
              style={
                selected
                  ? {
                      background: COLORS.gold,
                      borderColor: COLORS.gold,
                      color: "#3b2f00",
                    }
                  : hl
                    ? {
                        background: hl,
                        borderColor: hl,
                        color: hl === "#E8B400" ? "#3b2f00" : "#fff",
                      }
                    : {
                        background: "#fff",
                        borderColor: "#d4d4d8",
                        color: "#262626",
                      }
              }
            >
              {c.label ?? c.number}
            </button>
          ),
        });
      }
      continue;
    }
    if (c.kind === "restroom") {
      const men = c.restroom !== "women" && layers.has("mensRestrooms");
      const women = c.restroom !== "men" && layers.has("womensRestrooms");
      if (men || women)
        badges.push(
          <MapBadge
            key="t"
            color={COLORS.restroom}
            title={
              men && women
                ? "Men’s and women’s restrooms"
                : men
                  ? "Men’s restroom"
                  : "Women’s restroom"
            }
          >
            <RestroomIcon men={men} women={women} className="h-5 w-5" />
          </MapBadge>,
        );
      if (layers.has("accessible") && c.stepFree)
        badges.push(
          <MapBadge
            key="a"
            color={COLORS.accessible}
            title="Accessible restroom"
          >
            <Accessibility className={icon} />
          </MapBadge>,
        );
    }
    if (c.kind === "elevator") {
      if (layers.has("elevators"))
        badges.push(
          <MapBadge key="e" color={COLORS.accessible} title={c.name}>
            <ArrowUpDown className={icon} />
          </MapBadge>,
        );
      if (layers.has("accessible") && c.stepFree)
        badges.push(
          <MapBadge key="a" color={COLORS.accessible} title="Step-free access">
            <Accessibility className={icon} />
          </MapBadge>,
        );
    }
    if (c.kind === "stairs") {
      if (layers.has("stairs"))
        badges.push(
          <MapBadge key="s" color="#3f3f46" title={c.name}>
            <StairsIcon className={icon} />
          </MapBadge>,
        );
      if (
        layers.has("exits") &&
        c.core !== "SC" &&
        !c.provenanceNote?.includes("position inferred")
      )
        badges.push(
          <MapBadge key="x" color={COLORS.exit} title="Emergency exit stair">
            <DoorOpen className={icon} />
          </MapBadge>,
        );
    }
    if (badges.length)
      markers.push({
        key: c.id,
        pos: [cx, 1.5, cz],
        node: (
          <button
            type="button"
            aria-label={`Select ${cellTitle(c)} (${c.id})`}
            onClick={() => onSelectCell(c)}
            className="flex gap-1 rounded-full focus-visible:outline-2 focus-visible:outline-cardinal"
          >
            {badges}
          </button>
        ),
      });
  }
  for (const e of layout.entrances) {
    const b: ReactNode[] = [];
    if (layers.has("ramps") && e.ramp)
      b.push(
        <MapBadge
          key="r"
          color={COLORS.accessible}
          title={`Wheelchair ramp · ${e.label}`}
        >
          <WheelchairIcon className={icon} />
        </MapBadge>,
      );
    if (layers.has(e.entrance ? "entrances" : "exits") || onSelectLocation)
      b.push(
        <MapBadge
          key="x"
          color={e.entrance ? COLORS.entrance : COLORS.exit}
          title={e.label}
        >
          <DoorOpen className={icon} />
        </MapBadge>,
      );
    if (layers.has("accessible") && e.stepFree)
      b.push(
        <MapBadge key="a" color={COLORS.accessible} title="Step-free entrance">
          <Accessibility className={icon} />
        </MapBadge>,
      );
    if (layers.has("accessible") && e.hasSteps)
      b.push(
        <MapBadge key="w" color="#B45309" title="Steps at this entrance">
          <TriangleAlert className={icon} />
        </MapBadge>,
      );
    if (b.length)
      markers.push({
        key: e.id,
        pos: [e.x, 1.1, e.z],
        node: onSelectLocation ? (
          <button
            type="button"
            aria-label={`Select ${layout.building} ${e.label}`}
            className="flex gap-1 rounded-full outline-offset-2 focus-visible:outline-2 focus-visible:outline-cardinal"
            onClick={() =>
              onSelectLocation({
                placeId: e.id,
                label: `${layout.building} ${e.label}`,
                building: layout.building,
                floor: layout.floor,
                x: e.x,
                z: e.z,
              })
            }
          >
            {b}
          </button>
        ) : (
          <span className="flex gap-1">{b}</span>
        ),
      });
  }
  return (
    <>
      {markers.map((m) => (
        <MapHtml key={m.key} position={m.pos} center zIndexRange={[20, 0]}>
          {m.node}
        </MapHtml>
      ))}
    </>
  );
}
