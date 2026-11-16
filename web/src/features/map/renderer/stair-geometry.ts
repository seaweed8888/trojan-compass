export type StairPoint = [number, number, number];
export type StairPart = {
  position: StairPoint;
  size: StairPoint;
  yaw: number;
};

/** Endpoints are landing surfaces in building-local meters. */
export function stairGeometry(
  a: StairPoint,
  b: StairPoint,
  width = 2.8,
  depth = 5,
) {
  const [low, high] = a[1] <= b[1] ? [a, b] : [b, a];
  const rise = high[1] - low[1];
  const parts: StairPart[] = [];
  const points: StairPoint[] = [low];
  if (rise < 0.01) return { parts, points: [a, b] };
  const alongX = width > depth;
  const lane = Math.min(width, depth) * 0.23;
  const treadWidth = Math.min(width, depth) * 0.42;
  const run = Math.max(0.3, Math.max(width, depth) - treadWidth);
  const middle: StairPoint = [
    (low[0] + high[0]) / 2 + (alongX ? run / 2 : 0),
    (low[1] + high[1]) / 2,
    (low[2] + high[2]) / 2 + (alongX ? 0 : run / 2),
  ];
  const offset = (p: StairPoint, side: number): StairPoint => [
    p[0] + (alongX ? 0 : side * lane),
    p[1],
    p[2] + (alongX ? side * lane : 0),
  ];
  const start: StairPoint = [
    low[0] - (alongX ? run / 2 : 0),
    low[1],
    low[2] - (alongX ? 0 : run / 2),
  ];
  const end: StairPoint = [
    high[0] - (alongX ? run / 2 : 0),
    high[1],
    high[2] - (alongX ? 0 : run / 2),
  ];
  const landings = [
    offset(start, -1),
    offset(middle, -1),
    offset(middle, 1),
    offset(end, 1),
  ];
  // shortcut: landing anchors and bounds are known, tread layout is estimated; use surveyed meshes when available.
  for (let flight = 0; flight < 2; flight++) {
    const start = landings[flight * 2]!,
      end = landings[flight * 2 + 1]!;
    points.push(start);
    const count = Math.ceil((end[1] - start[1]) / 0.18);
    const dx = (end[0] - start[0]) / count,
      dz = (end[2] - start[2]) / count;
    const height = (end[1] - start[1]) / count;
    for (let i = 0; i < count; i++) {
      const y = start[1] + height * (i + 1);
      const x = start[0] + dx * i,
        z = start[2] + dz * i;
      points.push([x, y, z], [x + dx, y, z + dz]);
      parts.push({
        position: [x + dx / 2, y - height / 2, z + dz / 2],
        size: [treadWidth, height, Math.hypot(dx, dz)],
        yaw: Math.atan2(dx, dz),
      });
    }
  }
  parts.push({
    position: [middle[0], middle[1] - 0.07, middle[2]],
    size: alongX
      ? [treadWidth, 0.14, lane * 2 + treadWidth]
      : [lane * 2 + treadWidth, 0.14, treadWidth],
    yaw: 0,
  });
  for (const p of [low, high])
    parts.push({
      position: [
        p[0] - (alongX ? run / 4 : 0),
        p[1] - 0.07,
        p[2] - (alongX ? 0 : run / 4),
      ],
      size: alongX
        ? [run / 2 + treadWidth, 0.14, lane * 2 + treadWidth]
        : [lane * 2 + treadWidth, 0.14, run / 2 + treadWidth],
      yaw: 0,
    });
  points.push(high);
  return { parts, points: a[1] <= b[1] ? points : points.reverse() };
}
