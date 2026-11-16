import assert from 'node:assert/strict'
import { test } from 'node:test'
import geography from './campus-geography.json' with { type: 'json' }

test('fields and Village landscaping survive the clean campus crop', () => {
  const names = new Set(geography.greens.map(green => green.name))
  for (const name of ['Dedeaux Field', 'Howard Jones Field', 'Allyson Felix Field', 'Brittingham Intramural Field', 'Village Turf', 'Great Lawn', 'Alumni Park', 'McCarthy Quad']) {
    assert.ok(names.has(name), `${name} remains green`)
  }
  for (const green of geography.greens) {
    assert.deepEqual(green.ring[0], green.ring.at(-1), `closed polygon: ${green.name || green.id}`)
  }
})

test('Village border streets and unnamed campus walkways remain in the map', () => {
  const names = new Set(geography.roads.map(road => road.name))
  for (const name of ['West 30th Street', 'McClintock Avenue', 'West Jefferson Boulevard', 'South Hoover Street']) {
    assert.ok(names.has(name), name)
  }
  // OSM footways across the campus were previously lost by a name-only filter.
  for (const id of ['154906776', '154906779', '154906782']) {
    assert.ok(geography.roads.some(road => road.id === id && road.kind === 'footway' && road.name === ''), id)
  }
})
