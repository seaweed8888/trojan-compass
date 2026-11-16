import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Footprints,
  Flag,
  Layers,
  LogOut,
  MapPin,
  TreePine,
  X,
} from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { BUILDING_BY_CODE, type BuildingCode } from "../data/campus-display";
import { floorName, floorShort } from "../data/viewer-data";
import type { Route, StepIcon } from "../../routing/viewer-route";
import { COLORS, type LayerKey, type View } from "../types";
import { RestroomIcon } from "../renderer/RestroomIcon";
import { WheelchairIcon } from "../renderer/WheelchairIcon";
import { StairsIcon } from "../renderer/StairsIcon";

const STEP_ICONS: Record<StepIcon, ComponentType<{ className?: string }>> = {
  start: DoorOpen,
  walk: Footprints,
  stairs: StairsIcon,
  elevator: ArrowUpDown,
  arrive: Flag,
  outdoor: TreePine,
  exit: LogOut,
};

const LAYER_META: {
  key: LayerKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { key: "classrooms", label: "Classrooms", icon: MapPin, color: "#262626" },
  {
    key: "mensRestrooms",
    label: "Men’s restrooms",
    icon: (props) => <RestroomIcon {...props} men />,
    color: COLORS.restroom,
  },
  {
    key: "womensRestrooms",
    label: "Women’s restrooms",
    icon: (props) => <RestroomIcon {...props} women />,
    color: COLORS.restroom,
  },
  {
    key: "ramps",
    label: "Wheelchair ramps",
    icon: WheelchairIcon,
    color: COLORS.accessible,
  },
  {
    key: "elevators",
    label: "Elevators",
    icon: ArrowUpDown,
    color: COLORS.accessible,
  },
  { key: "stairs", label: "Stairs", icon: StairsIcon, color: "#3f3f46" },
  {
    key: "entrances",
    label: "Entrances",
    icon: DoorOpen,
    color: COLORS.entrance,
  },
  {
    key: "exits",
    label: "Emergency exits",
    icon: DoorOpen,
    color: COLORS.exit,
  },
];

export function LayerPanel({
  layers,
  onToggle,
  view,
  inline = false,
}: {
  layers: Set<LayerKey>;
  onToggle: (k: LayerKey) => void;
  view: View;
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (view.type !== "building") return null;
  return (
    <div
      className={
        inline
          ? "mobile-layer-options"
          : "desktop-map-control absolute right-4 top-4 z-40 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.08)] backdrop-blur max-md:top-16 max-md:w-52"
      }
    >
      {!inline && (
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex w-full items-center justify-between px-3 py-2.5 text-[13px] font-bold"
        >
          <span className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-cardinal" /> Map layers
          </span>
          <ChevronDown
            className={`h-4 w-4 text-neutral-400 transition ${open ? "" : "-rotate-90"}`}
          />
        </button>
      )}
      {(inline || open) && (
        <div
          className={
            inline
              ? "mobile-layer-grid"
              : "border-t border-neutral-100 px-1.5 pb-2 pt-1"
          }
        >
          {LAYER_META.map(({ key, label, icon: Icon, color }) => {
            const on = layers.has(key);
            return (
              <button
                key={key}
                onClick={() => onToggle(key)}
                role="switch"
                aria-checked={on}
                className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1 text-left transition hover:bg-neutral-50"
              >
                <span
                  className="grid h-5 w-5 place-items-center rounded-full text-white transition"
                  style={{ background: on ? color : "#d4d4d8" }}
                >
                  <Icon className="h-3 w-3" />
                </span>
                <span
                  className={`flex-1 text-[13px] ${on ? "font-semibold text-neutral-800" : "text-neutral-400"}`}
                >
                  {label}
                </span>
                <span
                  className={`relative h-4 w-7 rounded-full transition ${on ? "bg-cardinal" : "bg-neutral-200"}`}
                >
                  <span
                    className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${on ? "left-3.5" : "left-0.5"}`}
                  />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FloorSelector({
  code,
  levels,
  floor,
  allFloors,
  routeFloors,
  currentFloor,
  destinationFloor,
  onSelect,
  onSelectAll,
  inline = false,
}: {
  code?: BuildingCode;
  levels: number[];
  floor: number;
  allFloors?: boolean;
  routeFloors: number[];
  currentFloor?: number;
  destinationFloor?: number;
  onSelect: (f: number) => void;
  onSelectAll: () => void;
  inline?: boolean;
}) {
  return (
    <div
      className={
        inline
          ? "mobile-floor-options"
          : "desktop-map-control absolute right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
      }
    >
      {!inline && (
        <span className="px-1 pb-0.5 pt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-400">
          Floor
        </span>
      )}
      <button
        onClick={onSelectAll}
        aria-label="All floors"
        aria-pressed={!!allFloors}
        className={`grid h-9 w-9 place-items-center rounded-lg text-[13px] font-bold transition ${allFloors ? "bg-cardinal text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
      >
        All
      </button>
      {(inline ? levels : [...levels].reverse()).map((f) => (
        <button
          key={f}
          onClick={() => onSelect(f)}
          aria-label={`${floorName(f, code)}${f === currentFloor ? " · Current location" : ""}${f === destinationFloor ? " · Destination" : ""}`}
          title={`${floorName(f, code)}${f === currentFloor ? " · Current location" : ""}${f === destinationFloor ? " · Destination" : ""}`}
          aria-pressed={!allFloors && f === floor}
          className={`relative grid place-items-center rounded-lg text-[14px] font-bold transition ${
            f === destinationFloor
              ? "bg-gold text-neutral-900 hover:bg-gold/80"
              : !allFloors && f === floor
                ? "bg-cardinal text-white"
                : f === currentFloor
                  ? "bg-gold/20 text-cardinal hover:bg-gold/30"
                  : "text-neutral-600 hover:bg-neutral-100"
          } ${f === currentFloor || f === destinationFloor ? "ring-2 ring-inset ring-gold" : ""} ${inline && (f === currentFloor || f === destinationFloor) ? "h-auto w-auto min-h-9 gap-1 px-3 py-2" : "h-9 w-9"}`}
        >
          {floorShort(f)}
          {(f === currentFloor || f === destinationFloor) && (
            <span
              className={`${inline ? "flex flex-col" : "absolute right-full mr-2 flex flex-col"} gap-1 whitespace-nowrap text-[10px] font-bold text-neutral-900`}
            >
              {f === currentFloor && (
                <span className="rounded-full bg-gold px-2 py-1 shadow-sm">
                  Current location
                </span>
              )}
              {f === destinationFloor && (
                <span className="rounded-full bg-gold px-2 py-1 shadow-sm">
                  Destination
                </span>
              )}
            </span>
          )}
          {routeFloors.includes(f) && f !== floor && (
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-cardinal" />
          )}
        </button>
      ))}
    </div>
  );
}

export function Breadcrumb({
  view,
  onCampus,
}: {
  view: View;
  onCampus: () => void;
}) {
  if (view.type === "campus") return null;
  return (
    <div className="map-breadcrumb absolute left-4 top-4 z-30 flex max-w-[calc(100%-21rem)] items-center gap-2 rounded-full border border-neutral-200 bg-white/95 px-3 py-2 text-[13px] shadow-sm backdrop-blur max-md:max-w-[calc(100%-5.5rem)]">
      <button
        onClick={onCampus}
        className="shrink-0 font-semibold text-cardinal hover:underline"
      >
        All buildings
      </button>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" />
      <span className="rounded bg-cardinal px-1.5 py-0.5 text-[11px] font-bold text-white">
        {view.code}
      </span>
      <span className="truncate max-md:hidden">
        {BUILDING_BY_CODE[view.code].name}
      </span>
      <span className="shrink-0 text-neutral-600">
        {view.allFloors ? "All floors" : floorName(view.floor, view.code)}
      </span>
    </div>
  );
}

export function CampusHint() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 8000);
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return (
    <div className="animate-fade-up absolute left-4 top-4 z-40 flex w-max max-w-[calc(100%-6rem)] md:left-1/2 md:-translate-x-1/2 items-center gap-3 rounded-xl bg-neutral-900 px-4 py-3 text-[13px] font-medium text-white shadow-lg">
      <span role="status">Click a building or its code to see its floors.</span>
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss building tip"
        className="shrink-0 rounded p-1 text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function RouteBar({
  route,
  active,
  onStep,
  onClose,
}: {
  route: Route;
  active: number;
  onStep: (i: number) => void;
  onClose: () => void;
}) {
  const step = route.steps[active];
  if (!step) return null;
  const Icon = STEP_ICONS[step.icon];
  return (
    <div className="absolute left-1/2 top-16 z-30 w-[min(520px,calc(100%-2rem))] -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-xl bg-neutral-900 p-2 pl-3 text-white shadow-xl">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${step.icon === "arrive" ? "bg-cardinal" : step.icon === "elevator" ? "bg-[#1F5BA8]" : "bg-white/10"}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div key={active} className="animate-fade-up min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            Step {active + 1} of {route.steps.length}
            {step.building
              ? ` · ${step.building} ${floorName(step.floor ?? 1).toLowerCase()}`
              : " · Outdoors"}
          </div>
          <div className="text-[14px] font-medium leading-snug">
            {step.text}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            aria-label="Previous step"
            disabled={active === 0}
            onClick={() => onStep(active - 1)}
            className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 transition hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label="Next step"
            disabled={active === route.steps.length - 1}
            onClick={() => onStep(active + 1)}
            className="grid h-8 w-8 place-items-center rounded-lg bg-gold text-neutral-900 transition hover:bg-[#ffd633] disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            aria-label="End route"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
