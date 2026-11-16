import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FloorSelector } from "../src/features/map/components/MapOverlays";

test("the current-location floor stays marked while another floor or all floors are selected", () => {
  for (const currentFloor of [0, 1])
    for (const allFloors of [false, true]) {
      const html = renderToStaticMarkup(
        createElement(FloorSelector, {
          levels: [0, 1, 2],
          floor: 2,
          allFloors,
          currentFloor,
          routeFloors: [],
          onSelect() {},
          onSelectAll() {},
        }),
      );
      assert.match(html, /ring-gold/);
      assert.match(
        html,
        new RegExp(
          `aria-label="${currentFloor === 0 ? "Basement" : "Floor 1"} · Current location"`,
        ),
      );
      assert.equal((html.match(/>Current location</g) ?? []).length, 1);
    }
});

test("no current-location floor is marked before a location is selected", () => {
  const html = renderToStaticMarkup(
    createElement(FloorSelector, {
      levels: [0, 1, 2],
      floor: 1,
      routeFloors: [2],
      onSelect() {},
      onSelectAll() {},
    }),
  );
  assert.doesNotMatch(html, /Current location|Destination|ring-gold/);
  assert.match(html, /aria-label="Floor 1"[^>]*aria-pressed="true"/);
});

test("destination stays yellow in the widget and tab, including basement, selected, and all-floor views", () => {
  for (const inline of [false, true])
    for (const destinationFloor of [0, 1])
      for (const floor of [1, 2])
        for (const allFloors of [false, true]) {
          const html = renderToStaticMarkup(
            createElement(FloorSelector, {
              levels: [0, 1, 2],
              floor,
              allFloors,
              inline,
              destinationFloor,
              currentFloor: 1,
              routeFloors: [0, 1, 2],
              onSelect() {},
              onSelectAll() {},
            }),
          );
          const button = html.match(
            new RegExp(
              `<button[^>]*aria-label="${destinationFloor === 0 ? "Basement" : "Floor 1"}[^\"]*Destination"[^>]*>`,
            ),
          )?.[0];
          assert.ok(button);
          assert.match(button, /bg-gold text-neutral-900/);
          assert.match(button, /ring-gold/);
          assert.match(
            button,
            new RegExp(
              `aria-pressed="${!allFloors && destinationFloor === floor}"`,
            ),
          );
          assert.equal((html.match(/>Destination</g) ?? []).length, 1);
          assert.equal((html.match(/>Current location</g) ?? []).length, 1);
          if (destinationFloor === 1)
            assert.match(button, /Current location · Destination/);
        }
});
