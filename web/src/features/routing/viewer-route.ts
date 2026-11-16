import type { Place, Route as WireRoute, Vector3 } from '@trojan-compass/shared';
import type { BuildingCode } from '../map/data/campus-display';
export type RouteMode = 'fastest' | 'stairs' | 'elevator';
export const MODE_LABELS: Record<RouteMode, string> = {
  fastest: 'Fastest',
  stairs: 'Stairs',
  elevator: 'Elevator',
};
export type StepIcon = 'start' | 'walk' | 'stairs' | 'elevator' | 'arrive' | 'outdoor' | 'exit';
export interface Step {
  icon: StepIcon;
  text: string;
  building?: BuildingCode;
  floor?: number;
}
export interface IndoorLeg {
  kind: 'indoor';
  building: BuildingCode;
  points: (Vector3 & { floor: number })[];
  floors: number[];
}
export interface OutdoorLeg {
  kind: 'outdoor';
  from: BuildingCode;
  to: BuildingCode;
  points: [number, number][];
}
export interface Route {
  from: { id: string; building: BuildingCode; floor: number; kind: string; label: string };
  to: Route['from'];
  mode: RouteMode;
  legs: IndoorLeg[];
  steps: Step[];
  meters: number;
  seconds: number;
  usesElevator: boolean;
  usesStairs: boolean;
  entranceSteps: boolean;
}
export function viewerRoute(route: WireRoute, places: Place[]): Route {
  if (route.legs.some((l) => l.kind === 'outdoor'))
    throw new Error('This viewer does not support outdoor route geometry.');
  const endpoint = (e: WireRoute['origin']) => ({
    id: e.placeId ?? e.nodeId,
    building: e.buildingId as BuildingCode,
    floor: Number(e.floorId),
    kind: places.find((p) => p.id === e.placeId)?.kind === 'classroom' ? 'room' : 'position',
    label: places.find((p) => p.id === e.placeId)?.displayLabel ?? 'Selected position',
  });
  const legs: IndoorLeg[] = [];
  for (const leg of route.legs) {
    if (leg.kind === 'outdoor') throw new Error('Unsupported leg.');
    let combined = legs.find((l) => l.building === leg.buildingId);
    if (!combined) {
      combined = {
        kind: 'indoor',
        building: leg.buildingId as BuildingCode,
        points: [],
        floors: [],
      };
      legs.push(combined);
    }
    const floorIds = leg.kind === 'indoor' ? [leg.floorId] : [leg.fromFloorId, leg.toFloorId];
    combined.floors = [...new Set([...combined.floors, ...floorIds.map(Number)])];
    combined.points.push(
      ...leg.points.map((p, i) => ({
        ...p,
        floor: Number(
          leg.kind === 'indoor' ? leg.floorId : i === 0 ? leg.fromFloorId : leg.toFloorId
        ),
      }))
    );
  }
  return {
    from: endpoint(route.origin),
    to: endpoint(route.destination),
    mode: route.mode,
    legs,
    steps: route.steps.map((s) => ({
      icon: ['start', 'stairs', 'elevator', 'arrive'].includes(s.kind)
        ? (s.kind as StepIcon)
        : 'walk',
      text: s.text,
      building: s.buildingId as BuildingCode | undefined,
      floor: s.floorId === null ? undefined : Number(s.floorId),
    })),
    meters: route.distanceMeters,
    seconds: route.durationSeconds,
    usesElevator: route.usesElevator,
    usesStairs: route.usesStairs,
    entranceSteps: false,
  };
}
