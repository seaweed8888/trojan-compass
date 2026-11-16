import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixtureBuildings } from './viewer-fixtures';
import { parseMapLink, routeLinkParams } from '../src/features/map/map-link-input';
import { makeServices, routeRequest, scope } from '../../server/tests/support/fixture';

test('saved links preserve room and route references for backend resolution', () => {
  const link = parseMapLink(
    new URLSearchParams(
      'building=law&floor=B&room=LAW-2-Lincoln&from=LAW-101&to=LAW-107&mode=elevator'
    ),
    fixtureBuildings
  );
  assert.equal(link.buildingId, 'LAW');
  assert.equal(link.floorId, '0');
  assert.equal(link.room, 'LAW-2-Lincoln');
  assert.equal(link.from, 'LAW-101');
  assert.equal(link.to, 'LAW-107');
  assert.equal(link.mode, 'elevator');
  assert.equal(link.stepFree, false);
  assert.equal(link.via, null);
});

test('sharing a stopover retains verified step-free routing when reopened', async () => {
  const { routing } = makeServices();
  const request = routeRequest({
    destination: { kind: 'place', buildingId: 'LAW', placeId: 'LAW-101' },
    via: { kind: 'place', buildingId: 'LAW', placeId: 'LAW-301' },
    mode: 'elevator', stepFree: true,
  });
  const original = await routing.calculateRoute(scope(), request);
  const link = parseMapLink(routeLinkParams(original), fixtureBuildings);
  assert.equal(link.via, 'LAW-301');
  assert.equal(link.stepFree, true);
  assert.equal(link.mode, 'elevator');
  const reopened = await routing.calculateRoute(scope(), {
    ...request,
    origin: { kind: 'place', buildingId: 'LAW', placeId: link.from! },
    destination: { kind: 'place', buildingId: 'LAW', placeId: link.to! },
    via: { kind: 'place', buildingId: 'LAW', placeId: link.via! },
    mode: link.mode, stepFree: link.stepFree,
  });
  assert.equal(reopened.via?.placeId, 'LAW-301');
  assert.equal(reopened.verifiedStepFree, true);
  assert.equal(reopened.usesStairs, false);
  assert.equal(reopened.distanceMeters, original.distanceMeters);
  for (const query of ['via=', 'via=%20', 'stepFree=1', 'stepFree='])
    assert.throws(() => parseMapLink(new URLSearchParams(query), fixtureBuildings));
});
test('all floors and unknown building values are handled without inventing records', () => {
  assert.equal(parseMapLink(new URLSearchParams('building=DMC&floor=all'), fixtureBuildings).buildingId, 'VKC');
  assert.equal(
    parseMapLink(new URLSearchParams('building=LAW&floor=all'), fixtureBuildings).allFloors,
    true
  );
  const link = parseMapLink(
    new URLSearchParams('building=XYZ&floor=bad&mode=bad'),
    fixtureBuildings
  );
  assert.equal(link.buildingId, undefined);
  assert.equal(link.floorId, '1');
  assert.equal(link.mode, 'fastest');
});
