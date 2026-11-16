"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ChatTextRequest,
  ChatResponse,
  LocationRef,
  MapAction,
  RouteMode,
  Route as ApiRoute,
} from "@trojan-compass/shared";
import {
  client,
  compassApi,
  APIRequestError,
  clientRequestId,
} from "@/lib/api-client";
import { LatestRequest } from "@/lib/latest-request";
import { ViewerSession } from "../api-viewer";
import { parseMapLink, routeLinkParams } from "../map-link-input";
import {
  cellCenter,
  cellTitle,
  getLevels,
  getPlaces,
  floorY,
} from "../data/viewer-data";
import type { Route } from "../../routing/viewer-route";
import { COLORS, type LayerKey, type MapLocation, type View } from "../types";
import { MapLoading } from "@/components/layout/AppShellFallback";
import { Header } from "@/components/layout/Header";
import { campusLink } from '../campus-link';
import { FloorTools, type LocationField } from "./FloorTools";
import { Breadcrumb, FloorSelector, LayerPanel } from "./MapOverlays";

const MapCanvas = dynamic(
  () => import("../renderer/MapCanvas").then((m) => m.MapCanvas),
  {
    ssr: false,
    loading: () => <MapLoading />,
  },
);
const DEFAULT_LAYERS: LayerKey[] = [
  "classrooms",
  "mensRestrooms",
  "womensRestrooms",
  "ramps",
  "elevators",
  "stairs",
  "entrances",
  "exits",
];
export default function Wayfinder({ bundled = false }: { bundled?: boolean }) {
  const params = useSearchParams();
  const campusHref = campusLink(new URLSearchParams(params.toString()), bundled);
  const initial = useRef(params.toString());
  const session = useRef<ViewerSession | null>(null);
  const requests = useRef(new LatestRequest());
  const [view, setView] = useState<View>({
    type: "building",
    code: "LAW",
    floor: 1,
  });
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState("");
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [layers, setLayers] = useState(() => new Set(DEFAULT_LAYERS));
  const [route, setRoute] = useState<Route | null>(null);
  const [apiRoute, setApiRoute] = useState<ApiRoute | null>(null);
  function invalidate() {
    requests.current.invalidate();
  }
  function clearRoute() {
    invalidate();
    setRoute(null);
    setApiRoute(null);
  }
  const [selectedCell, setSelectedCell] = useState<string>();
  const [locations, setLocations] = useState({ from: "", to: "" });
  const [refs, setRefs] = useState<Record<LocationField, LocationRef | null>>({
    from: null,
    to: null,
  });
  const [picking, setPicking] = useState<LocationField | null>(null);
  const [currentLocation, setCurrentLocation] = useState<MapLocation | null>(
    null,
  );

  function fail(error: unknown) {
    if (
      error instanceof APIRequestError &&
      [409, 410].includes(error.status ?? 0)
    )
      return "The dataset changed. Reload map data, then resolve your locations again.";
    return error instanceof Error
      ? error.message
      : "The request failed. Please retry.";
  }
  function commit(result: Awaited<ReturnType<ViewerSession["actions"]>>) {
    result.commit();
    setView(result.view);
    setSelectedCell(result.selected);
    setRoute(result.route);
    setApiRoute(result.wireRoute);
    if (result.wireRoute) {
      const { origin, destination } = result.wireRoute;
      setView({
        type: "building",
        code: destination.buildingId as "LAW",
        floor: Number(destination.floorId),
      });
      setCurrentLocation({
        building: origin.buildingId as "LAW",
        floor: Number(origin.floorId),
        x: origin.position.x,
        z: origin.position.z,
        label: "Current location",
        placeId: origin.placeId ?? undefined,
      });
    }
    if (result.wireRoute) {
      const { origin, destination } = result.wireRoute;
      setRefs({ from: origin.requested, to: destination.requested });
      setLocations({
        from:
          result.places.find((p) => p.id === origin.placeId)?.displayLabel ??
          "Selected map position",
        to:
          result.places.find((p) => p.id === destination.placeId)
            ?.displayLabel ?? "Selected map position",
      });
    }
    setPicking(null);
  }
  useEffect(() => {
    let active = true;
    const ticket = requests.current.start();
    async function load() {
      try {
        const directory = await client.buildings(ticket.signal);
        const next = new ViewerSession(directory);
        const link = parseMapLink(
          new URLSearchParams(initial.current),
          directory.items,
        );
        let actions: MapAction[] = [
          {
            type: "focus_floor",
            buildingId: link.buildingId ?? "LAW",
            floorId: link.floorId,
          },
        ];
        const desired = await next.prepare(link.buildingId ?? "LAW");
        if (!desired.building.floors.some((f) => f.id === link.floorId))
          actions = [
            { type: "focus_building", buildingId: desired.building.id },
          ];
        let notice = "";
        try {
          if (link.room) {
            const place = await next.resolve(link.room);
            if (
              !link.buildingId ||
              link.allFloors ||
              !new URLSearchParams(initial.current).has("floor") ||
              place.floorId === link.floorId
            )
              actions = [
                {
                  type: "focus_place",
                  buildingId: place.buildingId,
                  floorId: place.floorId,
                  placeId: place.id,
                },
              ];
          }
          if (link.from && link.to) {
            const [from, to] = await Promise.all([
              next.resolve(link.from),
              next.resolve(link.to),
            ]);
            const via = link.via ? await next.resolve(link.via) : null;
            const response = await client.route({
              clientRequestId: clientRequestId(),
              dataVersion: directory.dataVersion,
              origin: {
                kind: "place",
                buildingId: from.buildingId,
                placeId: from.id,
              },
              destination: {
                kind: "place",
                buildingId: to.buildingId,
                placeId: to.id,
              },
              mode: link.mode,
              stepFree: link.stepFree,
              ...(via
                ? { via: { kind: "place" as const, buildingId: via.buildingId, placeId: via.id } }
                : {}),
              accessProfile: "public",
            });
            actions = [{ type: "show_route", route: response.route }];
          }
        } catch (e) {
          notice = fail(e);
        }
        const result = await next.actions(actions);
        if (!active || !ticket.isCurrent()) return;
        session.current = next;
        setVersion(directory.dataVersion);
        commit(result);
        if (link.allFloors && result.view.type === "building")
          setView({ ...result.view, allFloors: true });
        if (!link.buildingId && !link.room && !link.from && !link.to) {
          window.location.replace(campusHref);
          return;
        }
        setReady(true);
        setError(notice);
        if (!result.wireRoute) {
          setRefs({ from: null, to: null });
          setCurrentLocation(null);
        }
      } catch (e) {
        if (active && ticket.isCurrent()) setError(fail(e));
      }
    }
    void load();
    return () => {
      active = false;
      invalidate();
    };
  }, [reload]);

  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams();
    if (new URLSearchParams(initial.current).get('campusPort') === '3101')
      q.set('campusPort', '3101');
    if (view.type === "building") {
      q.set("building", view.code);
      q.set(
        "floor",
        view.allFloors ? "all" : view.floor === 0 ? "B" : String(view.floor),
      );
      if (selectedCell) q.set("room", selectedCell);
    }
    if (apiRoute)
      for (const [key, value] of routeLinkParams(apiRoute)) q.set(key, value);
    window.history.replaceState(null, "", window.location.pathname + "?" + q);
  }, [view, apiRoute, selectedCell, ready]);

  async function execute(actions: MapAction[]) {
    const ticket = requests.current.start();
    try {
      const result = await session.current!.actions(actions);
      if (ticket.isCurrent()) {
        commit(result);
        setError("");
      }
    } catch (error) {
      if (ticket.isCurrent()) throw error;
    }
  }
  async function search(query: string) {
    const ticket = requests.current.start();
    const s = session.current!;
    const results = await compassApi.buildings(
      { q: query, dataVersion: version, limit: 100 },
      ticket.signal,
    );
    if (results.items.length > 1)
      throw new Error("Choose a more specific building name or code.");
    const building = results.items[0];
    const place = building ? null : await s.resolve(query, ticket.signal);
    const result = await s.actions(
      building
        ? [{ type: "focus_building", buildingId: building.id }]
        : [
            {
              type: "focus_place",
              buildingId: place!.buildingId,
              floorId: place!.floorId,
              placeId: place!.id,
            },
          ],
    );
    if (ticket.isCurrent()) {
      commit(result);
      setError("");
    }
    return true;
  }
  function picked(location: MapLocation) {
    if (!picking) return;
    clearRoute();
    const ref: LocationRef = location.placeId
      ? {
          kind: "place",
          buildingId: location.building,
          placeId: location.placeId,
        }
      : {
          kind: "position",
          buildingId: location.building,
          floorId: String(location.floor),
          position: {
            x: location.x,
            y: floorY(location.floor, location.building),
            z: location.z,
          },
        };
    setLocations((current) => ({ ...current, [picking]: location.label }));
    setRefs((current) => ({ ...current, [picking]: ref }));
    if (picking === "from") setCurrentLocation(location);
    setPicking(null);
  }
  async function resolveField(
    field: LocationField,
    signal: AbortSignal,
  ): Promise<LocationRef> {
    if (refs[field]) return refs[field]!;
    const text = locations[field].trim();
    if (!text)
      throw new Error(
        `Choose a ${field === "from" ? "starting location" : "destination"}.`,
      );
    if (/^outside(?: the building)?$/i.test(text)) {
      const entrances = getPlaces(
        view.type === "building" ? view.code : undefined,
      ).filter((p) => p.kind === "entrance" && p.access.entryAllowed);
      if (entrances.length !== 1)
        throw new Error("Choose a specific entrance on the map or by name.");
      return {
        kind: "place",
        buildingId: entrances[0]!.buildingId,
        placeId: entrances[0]!.id,
      };
    }
    const p = await session.current!.resolve(text, signal);
    return { kind: "place", buildingId: p.buildingId, placeId: p.id };
  }
  async function directions(mode: RouteMode, stepFree: boolean) {
    const ticket = requests.current.start();
    const [origin, destination] = await Promise.all([
      resolveField("from", ticket.signal),
      resolveField("to", ticket.signal),
    ]);
    const id = clientRequestId();
    const response = await client.route(
      {
        clientRequestId: id,
        dataVersion: version,
        origin,
        destination,
        mode,
        stepFree,
        accessProfile: "public",
      },
      ticket.signal,
    );
    if (!ticket.isCurrent()) return;
    if (response.clientRequestId !== id || response.dataVersion !== version)
      throw new Error("Discarded a stale route response.");
    const result = await session.current!.actions([
      { type: "show_route", route: response.route },
    ]);
    if (!ticket.isCurrent()) return;
    commit(result);
    setRefs({ from: origin, to: destination });
    if (origin.kind === "position")
      setCurrentLocation({
        building: origin.buildingId as "LAW",
        floor: Number(origin.floorId),
        label: locations.from,
        x: origin.position.x,
        z: origin.position.z,
      });
    else {
      const p = result.places.find(
        (p) => p.id === origin.placeId && p.buildingId === origin.buildingId,
      );
      if (p)
        setCurrentLocation({
          building: p.buildingId as "LAW",
          floor: Number(p.floorId),
          label: p.displayLabel,
          x: p.position.x,
          z: p.position.z,
        });
    }
  }
  async function chat(
    request: Pick<ChatTextRequest, "message" | "history" | "preferences">,
  ): Promise<ChatResponse> {
    const ticket = requests.current.start();
    const id = clientRequestId();
    const selected = getPlaces().find((p) => p.id === selectedCell);
    const response = await client.chat(
      {
        ...request,
        clientRequestId: id,
        dataVersion: version,
        context: {
          buildingId: view.type === "building" ? view.code : null,
          floorId: view.type === "building" ? String(view.floor) : null,
          origin: refs.from,
          selectedPlace: selected
            ? {
                kind: "place",
                buildingId: selected.buildingId,
                placeId: selected.id,
              }
            : null,
        },
      },
      ticket.signal,
    );
    if (!ticket.isCurrent())
      throw new Error("This reply was superseded by a newer map selection.");
    if (response.clientRequestId !== id || response.dataVersion !== version)
      throw new Error("Discarded a stale chat response.");
    if (response.status === "resolved") {
      const result = await session.current!.actions(response.actions);
      if (!ticket.isCurrent())
        throw new DOMException(
          "A newer map selection replaced this reply.",
          "AbortError",
        );
      commit(result);
    }
    return response;
  }
  const highlights = useMemo(() => {
    const map = new Map<string, string>();
    if (route?.to.kind === "room") map.set(route.to.id, COLORS.cardinal);
    return map;
  }, [route]);
  function selectFloor(floor: number) {
    invalidate();
    if (view.type === "building") {
      setView({ ...view, floor, allFloors: false });
      setSelectedCell(undefined);
    }
  }
  const routeFloors =
    view.type === "building"
      ? (route?.legs
          .filter((l) => l.building === view.code)
          .flatMap((l) => l.floors) ?? [])
      : [];
  const toggleLayer = (key: LayerKey) =>
    setLayers((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const floorControls = (inline = false) =>
    view.type === "building" && (
      <FloorSelector
        inline={inline}
        code={view.code}
        levels={getLevels(view.code)}
        floor={view.floor}
        allFloors={view.allFloors}
        routeFloors={routeFloors}
        currentFloor={
          currentLocation?.building === view.code
            ? currentLocation.floor
            : undefined
        }
        destinationFloor={
          apiRoute?.destination.buildingId === view.code
            ? Number(apiRoute.destination.floorId)
            : undefined
        }
        onSelect={selectFloor}
        onSelectAll={() => {
          invalidate();
          setPicking(null);
          setView({ ...view, allFloors: true });
          setSelectedCell(undefined);
        }}
      />
    );
  return (
    <div className="compass-app flex h-full flex-col">
      <Header campusHref={campusHref} />
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 bg-cardinal-50 px-5 py-3 text-sm text-cardinal"
        >
          <span>{error}</span>
          <button
            className="shrink-0 font-bold underline"
            onClick={() => {
              initial.current =
                view.type === "building"
                  ? `building=${view.code}&floor=${view.floor}`
                  : "";
              setReload((x) => x + 1);
            }}
          >
            Reload map data
          </button>
        </div>
      )}
      {!ready ? (
        <MapLoading />
      ) : (
        <main
          id="main"
          className="compass-main relative flex min-h-0 flex-1 bg-white"
        >
          <div className="map-viewport relative min-w-0 flex-1">
            <MapCanvas
              view={view}
              layers={layers}
              route={route}
              apiRoute={apiRoute}
              highlights={highlights}
              selectedCell={selectedCell}
              currentLocation={currentLocation}
              placingCurrentLocation={picking === "from"}
              onMoveCurrentLocation={() => {
                invalidate();
                setPicking("from");
              }}
              onSelectLocation={picking ? picked : undefined}
              onSelectBuilding={(code) =>
                void execute([
                  { type: "focus_building", buildingId: code },
                ]).catch((e) => setError(fail(e)))
              }
              onSelectCell={(cell) => {
                if (picking) {
                  const [x, z] = cellCenter(cell);
                  picked({
                    building: cell.building,
                    floor: cell.floor,
                    placeId: cell.id,
                    label: cellTitle(cell),
                    x,
                    z,
                  });
                } else {
                  invalidate();
                  setSelectedCell(cell.id);
                  setView({
                    type: "building",
                    code: cell.building,
                    floor: cell.floor,
                  });
                }
              }}
              onSelectFloor={selectFloor}
            />
            <Breadcrumb
              view={view}
              onCampus={() => {
                invalidate();
                window.location.assign(campusHref);
              }}
            />
            {floorControls()}
            <LayerPanel layers={layers} view={view} onToggle={toggleLayer} />
            <p className="pointer-events-none absolute bottom-3 right-3 max-w-xs rounded bg-white/90 px-2 py-1 text-[10px] text-neutral-500">
              Illustrative USC map · access and navigation unverified
            </p>
          </div>
          <FloorTools
            floors={floorControls(true)}
            layers={
              <LayerPanel
                inline
                layers={layers}
                view={view}
                onToggle={toggleLayer}
              />
            }
            dataVersion={version}
            locations={locations}
            picking={picking}
            onPick={(field) => {
              invalidate();
              setPicking(field);
              if (field && view.type === "building")
                setView({ ...view, allFloors: false });
            }}
            onSearch={search}
            onDirections={directions}
            onChat={chat}
            onDraftChange={invalidate}
            onClearRoute={clearRoute}
            hasRoute={!!apiRoute}
            onLocationChange={(field, value) => {
              clearRoute();
              setLocations((current) => ({ ...current, [field]: value }));
              setRefs((current) => ({ ...current, [field]: null }));
              if (field === "from") setCurrentLocation(null);
            }}
          />
        </main>
      )}
    </div>
  );
}
