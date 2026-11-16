import assert from 'node:assert/strict'
import { test } from 'node:test'
import surroundings from './surrounding-roads.json' with { type: 'json' }

test('real streets extend north, south, east, and west of campus', () => {
  const { roads } = surroundings
  for (const name of ['West Adams Boulevard', 'West Martin Luther King Junior Boulevard', 'South Vermont Avenue', 'South Figueroa Street', 'Exposition Boulevard']) {
    assert.ok(roads.some(road => road.name === name), `${name} retained`)
  }
  assert.ok(roads.some(road => road.name === 'West Adams Boulevard' && road.points.some(([lat]) => lat > 34.03)))
  assert.ok(roads.some(road => road.name === 'West Martin Luther King Junior Boulevard' && road.points.some(([lat]) => lat < 34.012)))
  assert.ok(roads.some(road => road.name === 'South Vermont Avenue' && road.points.some(([, lng]) => lng < -118.291)))
  assert.ok(roads.some(road => road.name === 'South Figueroa Street' && road.points.some(([, lng]) => lng > -118.281)))
})

test('surrounding street geometry is deduplicated and clipped to the downloaded region', () => {
  const { roads, bounds } = surroundings
  assert.equal(new Set(roads.map(road => road.id)).size, roads.length)
  for (const road of roads) {
    assert.ok(road.points.length >= 2, road.id)
    for (const [lat, lng] of road.points) {
      assert.ok(Number.isFinite(lat) && lat >= bounds.south && lat <= bounds.north, road.id)
      assert.ok(Number.isFinite(lng) && lng >= bounds.west && lng <= bounds.east, road.id)
    }
    assert.ok(!['footway', 'path', 'steps'].includes(road.kind), 'surrounding layer contains streets only')
  }
})
