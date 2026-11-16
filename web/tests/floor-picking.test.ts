import assert from "node:assert/strict";
import { test } from "node:test";
import {
  Children,
  createElement,
  isValidElement,
  type ComponentProps,
  type FunctionComponent,
  type ReactElement,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import "./viewer-fixtures";
import { BuildingScene } from "../src/features/map/renderer/BuildingScene";
import { getLayout } from "../src/features/map/data/viewer-data";

function scene(floor: number, allFloors = false) {
  return BuildingScene({
    code: "LAW",
    floor,
    allFloors,
    layers: new Set(),
    highlights: new Map(),
    currentLocation: null,
    placingCurrentLocation: false,
    isFinalLeg: false,
    onMoveCurrentLocation() {},
    onSelectCell() {},
    onSelectFloor() {},
  });
}

test("stairs and exit markers remain available without an active route", () => {
  const floor = Children.toArray(scene(1).props.children).find(
    (child) =>
      isValidElement<{ onSelectCell?: unknown }>(child) &&
      "onSelectCell" in child.props,
  ) as ReactElement<ComponentProps<typeof BuildingScene>>;
  const expected = getLayout("LAW", 1).cells.filter((c) => c.kind === "stairs");
  assert.ok(expected.length > 0);
  function Probe() {
    const Component = floor.type as FunctionComponent<typeof floor.props>;
    const group = Component({
      ...floor.props,
      layers: new Set(["stairs", "exits"]),
    }) as ReactElement<{ children: React.ReactNode }>;
    const markers = Children.toArray(group.props.children).find(
      (child) =>
        isValidElement<{ showRoomLabels?: boolean }>(child) &&
        "showRoomLabels" in child.props,
    ) as ReactElement<{ layout: ReturnType<typeof getLayout> }>;
    assert.deepEqual(
      markers.props.layout.cells.filter((c) => c.kind === "stairs"),
      expected,
    );
    const Markers = markers.type as FunctionComponent<typeof markers.props>;
    const labels = Markers(markers.props) as ReactElement<{
      children: React.ReactNode;
    }>;
    const html = Children.toArray(labels.props.children)
      .map((child) =>
        renderToStaticMarkup(
          (child as ReactElement<{ children: React.ReactNode }>).props.children,
        ),
      )
      .join("");
    assert.match(html, /Emergency exit stair/);
    for (const stair of expected) assert.ok(html.includes(stair.name));
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
});

test("faint floors above the selected floor cannot intercept clicks", () => {
  const floors = Children.toArray(scene(2).props.children).filter(
    (child): child is ReactElement<{ floor: number; interactive: boolean }> =>
      isValidElement<{ interactive: boolean }>(child) &&
      "interactive" in child.props,
  );
  assert.ok(floors.some(({ props }) => props.floor > 2));
  assert.ok(floors.some(({ props }) => props.floor < 2));
  for (const { props } of floors)
    assert.equal(props.interactive, props.floor < 2);
});

test("active floor surfaces block clicks and hover reaching floors behind them", () => {
  for (const allFloors of [false, true]) {
    const floors = Children.toArray(scene(4, allFloors).props.children).filter(
      (child): child is ReactElement<ComponentProps<typeof BuildingScene>> =>
        isValidElement<ComponentProps<typeof BuildingScene>>(child) &&
        "onSelectCell" in child.props,
    );
    assert.ok(floors.length > 0);
    for (const floor of floors) {
      let blocked = 0;
      function Probe() {
        const Component = floor.type as FunctionComponent<
          ComponentProps<typeof BuildingScene>
        >;
        const group = Component(floor.props) as ReactElement<{
          onClick: (event: { stopPropagation(): void }) => void;
          onPointerOver: (event: { stopPropagation(): void }) => void;
        }>;
        const event = { stopPropagation: () => blocked++ };
        group.props.onClick(event);
        group.props.onPointerOver(event);
        return null;
      }
      renderToStaticMarkup(createElement(Probe));
      assert.equal(blocked, 2);
    }
  }
});
