import { Accessibility, ArrowUpDown, MapPin } from "lucide-react";
import { StairsIcon } from "@/features/map/renderer/StairsIcon";
import { useState, type RefObject } from "react";
import { LocationAutocomplete } from "@/features/search/components/LocationAutocomplete";
import { INPUT, ACTION } from "@/components/ui/form-styles";
import type { RouteMode } from "@trojan-compass/shared";
import type { LocationField } from "../types";

export function RoutePlanner({
  dataVersion,
  onDirections,
  locations,
  onLocationChange,
  picking,
  onPick,
  accessibleOnly,
  setAccessibleOnly,
  travelMode,
  setTravelMode,
  lastPick,
  setNotice,
  onPendingChange,
}: {
  onPendingChange?: (pending: boolean) => void;
  locations: Record<LocationField, string>;
  onLocationChange: (field: LocationField, value: string) => void;
  picking: LocationField | null;
  onPick: (field: LocationField | null) => void;
  accessibleOnly: boolean;
  setAccessibleOnly: (value: boolean) => void;
  travelMode: RouteMode;
  setTravelMode: (value: RouteMode) => void;
  lastPick: RefObject<LocationField | null>;
  setNotice: (message: string) => void;
  dataVersion: string;
  onDirections: (mode: RouteMode, stepFree: boolean) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  return (
    <form
      id="directions-form"
      className="directions-form space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending) return;
        setPending(true);
        onPendingChange?.(true);
        try {
          // shortcut: accessibility selects elevators only; restore step-free checks when ramp access is ready.
          await onDirections(travelMode, false);
          setNotice("");
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError")
            return;
          setNotice(
            error instanceof Error ? error.message : "Route request failed.",
          );
        } finally {
          setPending(false);
          onPendingChange?.(false);
        }
      }}
    >
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 p-3">
        <input
          type="checkbox"
          checked={accessibleOnly}
          onChange={(event) => {
            setAccessibleOnly(event.target.checked);
            if (event.target.checked) setTravelMode("elevator");
          }}
          className="h-4 w-4 shrink-0 accent-cardinal"
        />
        <Accessibility className="h-4 w-4 shrink-0 text-cardinal" />
        <span>
          <span className="block text-[13px] font-semibold">Accessibility</span>
          <span className="block text-[12px] text-neutral-500">
            Use elevators between floors
          </span>
        </span>
      </label>
      {picking && (
        <div
          role="status"
          className="rounded-lg bg-cardinal-50 p-3 text-[12px] text-cardinal"
        >
          <p className="font-bold">
            Select {picking === "from" ? "current location" : "destination"}
          </p>
          <p className="mt-1">
            {picking === "from"
              ? "Carry the Trojan guide over a room, entrance, or open floor area. Release or click to put him down."
              : "Click a room, entrance, or open floor area on the map."}{" "}
            You can change floors first.
          </p>
          <button
            type="button"
            onClick={() => onPick(null)}
            className="mt-2 rounded px-2 py-1 font-semibold hover:bg-white"
          >
            Cancel
          </button>
        </div>
      )}
      {(
        [
          {
            field: "from",
            label: "Current location",
            placeholder: "e.g. LAW 101 or OUTSIDE",
          },
          { field: "to", label: "Destination", placeholder: "e.g. TCC 201" },
        ] as const
      ).map(({ field, label, placeholder }) => (
        <div className="directions-location" key={field}>
          <label
            htmlFor={`directions-${field}`}
            className="block text-[12px] font-semibold text-neutral-700"
          >
            {label}
          </label>
          <div className="relative mt-1.5">
            <LocationAutocomplete
              dataVersion={dataVersion}
              id={`directions-${field}`}
              value={locations[field]}
              includeOutside={field === "from"}
              onChange={(value) => {
                onLocationChange(field, value);
                onPick(null);
              }}
              placeholder={placeholder}
              aria-describedby={
                field === "from" ? "current-location-hint" : undefined
              }
              className={`${INPUT} mt-0 pr-11`}
            />
            <button
              type="button"
              aria-pressed={picking === field}
              aria-label={`Select ${label.toLowerCase()} on map`}
              title={`Select ${label.toLowerCase()} on map`}
              onPointerDown={
                field === "from"
                  ? (event) => {
                      if (
                        event.button !== 0 ||
                        event.pointerType !== "mouse" ||
                        window.matchMedia("(max-width: 767px)").matches
                      )
                        return;
                      lastPick.current = field;
                      onPick(field);
                      setNotice("");
                      if (
                        event.currentTarget.hasPointerCapture(event.pointerId)
                      )
                        event.currentTarget.releasePointerCapture(
                          event.pointerId,
                        );
                    }
                  : undefined
              }
              onClick={() => {
                lastPick.current = field;
                onPick(field);
                setNotice("");
              }}
              className={`absolute top-1 right-1 grid h-9 w-9 touch-none place-items-center rounded-md text-cardinal transition hover:bg-cardinal-50 focus-visible:outline-2 focus-visible:outline-cardinal ${picking === field ? "bg-cardinal-50 ring-1 ring-cardinal/30" : ""}`}
            >
              <MapPin className="h-4 w-4" />
            </button>
          </div>
          {field === "from" && (
            <p
              id="current-location-hint"
              className="mt-1.5 text-[12px] leading-relaxed text-neutral-500"
            >
              Outside? Type “outside” or choose “Outside the building” to start
              at an entrance.
            </p>
          )}
        </div>
      ))}
      <fieldset>
        <legend className="mb-1.5 text-[12px] font-semibold text-neutral-700">
          Travel between floors
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "stairs", label: "Stairs", icon: StairsIcon },
              { value: "elevator", label: "Elevators", icon: ArrowUpDown },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <label
              key={value}
              className={`relative flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition focus-within:ring-2 focus-within:ring-cardinal/30 ${travelMode === value ? "border-cardinal bg-cardinal-50 text-cardinal" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"} ${accessibleOnly && value === "stairs" ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <input
                type="radio"
                name="directions-travel-mode"
                value={value}
                checked={travelMode === value}
                disabled={accessibleOnly && value === "stairs"}
                onChange={() => setTravelMode(value)}
                className="sr-only"
              />
              <Icon className="h-4 w-4" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        id="directions-submit"
        onPointerDown={(event) => event.preventDefault()}
        disabled={pending}
        className={`desktop-directions-action ${ACTION}`}
      >
        <MapPin className="h-4 w-4" />{" "}
        {pending ? "Calculating…" : "Get directions"}
      </button>
    </form>
  );
}
