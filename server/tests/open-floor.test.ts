import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { BoxObject, FloorGeometry } from '@trojan-compass/shared';
import { OpenFloor } from '../src/modules/routing/open-floor.js';

function box(
  role: BoxObject['role'],
  x: number,
  z: number,
  width: number,
  depth: number
): BoxObject {
  return {
    kind: 'box',
    objectKey: `${role}:${x}:${z}`,
    role,
    placeId: null,
    materialKey: 'test',
    pickable: false,
    center: { x, y: 0, z },
    size: { x: width, y: 1, z: depth },
    yawRadians: 0,
  };
}
function space(objects: BoxObject[]) {
  return new OpenFloor(
    {
      floorId: '1',
      bounds: { min: { x: -10, y: 0, z: -10 }, max: { x: 10, y: 1, z: 10 } },
      objects,
    } as FloorGeometry,
    []
  );
}
test('open-space approaches bend around obstacles instead of crossing walls', () => {
  const floor = space([box('slab', 0, 0, 10, 10), box('wall', 0, 0, 1, 6)]);
  const start = { x: -3, y: 0, z: 0 },
    target = { position: { x: 3, y: 0, z: 0 } };
  assert.equal(floor.canTravel(start, target.position), false);
  const connection = floor.connect(start, [target]);
  assert.ok(connection);
  assert.ok(connection.points.length > 2);
  assert.deepEqual(connection.points[0], start);
  assert.deepEqual(connection.points.at(-1), target.position);
  for (let i = 1; i < connection.points.length; i++)
    assert.ok(floor.canTravel(connection.points[i - 1]!, connection.points[i]!));
});
test('open-space attachments stay within the slab union and reject walls, blocks and floor gaps', () => {
  const floor = space([box('slab', -3, 0, 2, 4), box('slab', 3, 0, 2, 4)]);
  const a = { x: -3, y: 0, z: 0 },
    b = { x: 3, y: 0, z: 0 };
  assert.ok(floor.contains(a));
  assert.ok(floor.contains(b));
  assert.equal(floor.canTravel(a, b), false);
  assert.equal(floor.connect(a, [{ position: b }]), null);
  const blocked = space([box('slab', 0, 0, 10, 10), box('room_highlight', 0, 0, 2, 2)]);
  assert.equal(blocked.contains({ x: 0, y: 0, z: 0 }), false);
  assert.equal(blocked.contains({ x: 20, y: 0, z: 0 }), false);
  assert.equal(blocked.connect({ x: 0, y: 0, z: 0 }, [{ position: { x: 3, y: 0, z: 0 } }]), null);
});
