import { useEffect, useRef, useState, type ComponentProps } from "react";
import { compassApi } from "@/lib/api-client";
import type {
  PlaceSearchResponse,
  BuildingListResponse,
} from "@trojan-compass/shared";

export function LocationAutocomplete({
  dataVersion,
  id,
  value,
  onChange,
  includeOutside = false,
  accessibleOnly = false,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange"> & {
  dataVersion: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  includeOutside?: boolean;
  accessibleOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [results, setResults] = useState<{ value: string; detail: string }[]>(
    [],
  );
  const [status, setStatus] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setResults([]);
    if (!dataVersion) return;
    setStatus("Searching…");
    const timer = setTimeout(async () => {
      try {
        const [places, buildings] = await Promise.all([
          compassApi.places(
            { q: value, limit: 8, stepFree: accessibleOnly, dataVersion },
            controller.signal,
          ),
          compassApi.buildings(
            { q: value, limit: 8, dataVersion },
            controller.signal,
          ),
        ]);
        if (controller.signal.aborted) return;
        if (
          places.dataVersion !== dataVersion ||
          buildings.dataVersion !== dataVersion
        )
          throw new Error("Dataset changed. Reload map data.");
        const outside =
          includeOutside &&
          /^(?:outside(?: the building)?)?$/i.test(value.trim())
            ? [
                {
                  value: "Outside the building",
                  detail: "Choose a specific entrance if asked.",
                },
              ]
            : [];
        setResults(
          [
            ...outside,
            ...places.items.map((r) => ({
              value: r.place.id,
              detail: r.matchLabel + " · " + r.secondaryLabel,
            })),
            ...buildings.items.map((b) => ({ value: b.id, detail: b.name })),
          ].slice(0, 12),
        );
        setStatus("No matching building or room.");
      } catch (error) {
        if (!controller.signal.aborted)
          setStatus(
            error instanceof Error ? error.message : "Search unavailable.",
          );
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, dataVersion, accessibleOnly, includeOutside]);
  const expanded = open && (!!value.trim() || includeOutside);
  const activeOption = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (expanded) activeOption.current?.scrollIntoView({ block: "nearest" });
  }, [active, expanded]);

  function choose(next: string) {
    onChange(next);
    setOpen(false);
    setActive(-1);
  }

  return (
    <div className="relative">
      <input
        {...props}
        id={id}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={`${id}-options`}
        aria-activedescendant={
          expanded && results[active] ? `${id}-option-${active}` : undefined
        }
        onChange={(event) => {
          onChange(event.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onFocus={() => {
          setActive(-1);
          setOpen(true);
        }}
        onBlur={() => {
          setOpen(false);
          setActive(-1);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Escape" && expanded) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          } else if (
            (event.key === "ArrowDown" || event.key === "ArrowUp") &&
            results.length
          ) {
            event.preventDefault();
            setOpen(true);
            setActive(
              event.key === "ArrowDown"
                ? (active + 1) % results.length
                : active <= 0
                  ? results.length - 1
                  : active - 1,
            );
          } else if (event.key === "Enter" && expanded && results[active]) {
            event.preventDefault();
            choose(results[active].value);
          }
        }}
      />
      {expanded && (
        <div className="scrollbar-thin relative z-50 mt-1 max-h-64 overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-xl">
          <ul
            id={`${id}-options`}
            role="listbox"
            aria-label="Building and room suggestions"
          >
            {results.map((option, index) => (
              <li
                key={option.value}
                ref={active === index ? activeOption : undefined}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={active === index}
                onPointerDown={(event) => event.preventDefault()}
                onPointerMove={() => setActive(index)}
                onClick={() => choose(option.value)}
                className={`cursor-pointer px-3 py-2 text-left ${active === index ? "bg-cardinal-50" : "hover:bg-cardinal-50"}`}
              >
                <span className="block text-[13px] font-semibold text-neutral-900">
                  {option.value}
                </span>
                <span className="block truncate text-[12px] font-normal text-neutral-500">
                  {option.detail}
                </span>
              </li>
            ))}
          </ul>
          {!results.length && (
            <p role="status" className="px-3 py-3 text-[13px] text-neutral-500">
              {status}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
