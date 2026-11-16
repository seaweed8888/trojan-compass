import assert from 'node:assert/strict';
import { test } from 'node:test';
import './viewer-fixtures';
import { cellCenter, cellTitle, getLayout } from '../src/features/map/data/viewer-data';
import { mapLocationAt } from '../src/features/map/map-location';

test('Tommy drops snap to rooms and entrances, preserve open areas, and reject invalid points', () => {
  const layout = getLayout('LAW', 1);
  const room = layout.cells.find((cell) => cell.kind === 'room')!;
  const [x, z] = cellCenter(room);
  assert.equal(mapLocationAt(layout, x, z)?.label, cellTitle(room));
  const entrance = layout.entrances[0]!;
  assert.equal(mapLocationAt(layout, entrance.x + 0.1, entrance.z)?.label, `LAW ${entrance.label}`);
  assert.equal(mapLocationAt(layout, 10000, 10000), null);
  const block = layout.cells.find((cell) => cell.kind === 'block');
  if (block) assert.equal(mapLocationAt(layout, ...cellCenter(block)), null);
  let openPoint = false;
  for (let px = -30; px < 30 && !openPoint; px += 0.5) {
    for (let pz = -30; pz < 30 && !openPoint; pz += 0.5) {
      const location = mapLocationAt(layout, px, pz);
      if (location?.label.endsWith('open area')) {
        assert.equal(location.x, px);
        assert.equal(location.z, pz);
        openPoint = true;
      }
    }
  }
  assert.ok(openPoint, 'floor has selectable open areas');
});
