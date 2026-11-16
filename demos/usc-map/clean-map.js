import geography from './campus-geography.json' with { type: 'json' }
import surroundings from './surrounding-roads.json' with { type: 'json' }
import { mapPoint } from './map-data.js'
import heights from './building-heights.json' with { type: 'json' }
import { createPlaceActivation } from './place-activation.js'

const NS = 'http://www.w3.org/2000/svg'
const element = (name, attributes = {}) => {
  const node = document.createElementNS(NS, name)
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value))
  return node
}
const points = ring => ring.map(([lat, lng]) => mapPoint(lat, lng))
const path = ring => points(ring).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
function inside([lat, lng], ring) {
  let result = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i], [yj, xj] = ring[j]
    if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) result = !result
  }
  return result
}
export const onCleanCampus = place => geography.areas.some(area => inside([place.lat, place.lng], area.ring))

export function createCleanMap(map, places, onSelect, onOpen = onSelect) {
  const isDoubleTap = createPlaceActivation()
  let threeD = false
  const extrusions = []
  const surface = document.createElement('div')
  surface.className = 'clean-map-surface'
  const svg = element('svg', { class: 'clean-campus-map', 'aria-label': 'University Park campus and USC Village' })
  const allPoints = geography.areas.flatMap(area => points(area.ring))
  const xs = allPoints.map(p => p[0]), ys = allPoints.map(p => p[1])
  const bounds = { x: Math.min(...xs) - 22, y: Math.min(...ys) - 22, width: Math.max(...xs) - Math.min(...xs) + 44, height: Math.max(...ys) - Math.min(...ys) + 44 }
  svg.setAttribute('viewBox', `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`)
  const defs = element('defs')
  const clip = element('clipPath', { id: 'clean-campus-extent' })
  for (const area of geography.areas) clip.append(element('path', { d: `${path(area.ring)}Z` }))
  defs.append(clip)
  const [west, north] = mapPoint(surroundings.bounds.north, surroundings.bounds.west)
  const [east, south] = mapPoint(surroundings.bounds.south, surroundings.bounds.east)
  const extent = { x: west - 20, y: north - 20, width: east - west + 40, height: south - north + 40 }
  const exteriorMask = element('mask', { id: 'clean-exterior', maskUnits: 'userSpaceOnUse', ...extent })
  exteriorMask.append(element('rect', { ...extent, fill: 'white' }))
  for (const area of geography.areas) exteriorMask.append(element('path', { d: `${path(area.ring)}Z`, fill: 'black' }))
  defs.append(exteriorMask)
  svg.append(defs)
  const world = element('g', { class: 'clean-map-world' })
  svg.append(world)
  const streetsOutside = element('g', { class: 'clean-surrounding-roads', mask: 'url(#clean-exterior)', 'aria-hidden': 'true' })
  // Draw all casings first so road junctions join without gray seams.
  for (const layer of ['casing', 'surface']) {
    const group = element('g', { class: `clean-road-${layer}` })
    for (const category of ['local', 'major']) {
      const lines = surroundings.roads.filter(road => /^(motorway|trunk|primary|secondary)/.test(road.kind) === (category === 'major'))
      group.append(element('path', { d: lines.map(road => path(road.points)).join(' '), class: category }))
    }
    streetsOutside.append(group)
  }
  world.append(streetsOutside)
  const greens = element('g', { class: 'clean-greens', 'clip-path': 'url(#clean-campus-extent)', 'aria-hidden': 'true' })
  for (const green of geography.greens ?? []) greens.append(element('path', { d: `${path(green.ring)}Z`, 'data-green-name': green.name || green.kind }))
  world.append(greens)
  const roads = element('g', { class: 'clean-roads', 'clip-path': 'url(#clean-campus-extent)', 'aria-hidden': 'true' })
  const walkways = element('g', { 'clip-path': 'url(#clean-campus-extent)' })
  for (const road of geography.roads) {
    const walking = ['footway', 'path', 'pedestrian', 'steps', 'cycleway'].includes(road.kind)
    const line = element('path', { d: path(road.points), class: walking ? 'clean-walkway' : 'clean-street' })
    ;(walking ? walkways : roads).append(line)
  }
  roads.append(walkways)
  world.append(roads)
  const hedges = element('g', { class: 'clean-hedges', 'aria-hidden': 'true', 'clip-path': 'url(#clean-campus-extent)' })
  for (const hedge of geography.hedges) hedges.append(element('path', { d: path(hedge) }))
  world.append(hedges)
  const buildings = element('g', { class: 'clean-buildings' })
  const seen = new Map()
  const buildingNodes = new Map()
  for (const place of places.filter(onCleanCampus)) {
    if (!place.paths?.length) continue
    const rings = typeof place.paths[0][0] === 'number' ? [place.paths] : place.paths
    const key = JSON.stringify(rings)
    if (seen.has(key)) { buildingNodes.set(place.id, seen.get(key)); continue }
    const parking = place.category !== 'Buildings' || /parking|garage/i.test(place.name)
    const group = element('g', { class: parking ? 'clean-building-mass parking-mass' : 'clean-building-mass', 'data-category': parking ? 'parking' : 'buildings', 'data-place-id': place.id, 'data-place-name': place.name })
    const height = heights.buildings[String(place.id)]?.meters ?? (parking ? 14 : 12)
    // Web Mercator units per real meter at USC's latitude, with a 45-degree view.
    const depth = height * (256 * 2 ** 16) / (40075016.686 * Math.cos(place.lat * Math.PI / 180))
    const offsetX = depth * .18, offsetY = -depth / .74
    const walls = element('g', { class: 'clean-building-walls', 'aria-hidden': 'true', display: 'none' })
    const faces = { 'wall-shade': [], 'wall-light': [] }
    for (const ring of rings) {
      const base = points(ring)
      for (let i = 0; i < base.length; i++) {
        const [ax, ay] = base[i], [bx, by] = base[(i + 1) % base.length]
        if (ax === bx && ay === by) continue
        faces[bx > ax ? 'wall-shade' : 'wall-light'].push(`M${ax},${ay}L${bx},${by}L${bx + offsetX},${by + offsetY}L${ax + offsetX},${ay + offsetY}Z`)
      }
    }
    for (const [shade, paths] of Object.entries(faces)) walls.append(element('path', { d: paths.join(' '), class: shade }))
    group.append(walls)
    const shape = element('path', {
      d: rings.map(ring => `${path(ring)}Z`).join(' '),
      class: parking ? 'clean-building clean-parking' : 'clean-building',
      role: 'button', tabindex: '0', 'aria-label': `Select ${place.name}`, 'aria-pressed': 'false',
      'data-place-name': place.name,
      'data-building-key': place.code || String(place.id),
    })
    // Residential colleges can share one physical building/code; hover the full footprint.
    const setHover = active => {
      for (const part of new Set(buildingNodes.values())) {
        if (part.dataset.buildingKey === shape.dataset.buildingKey) part.classList.toggle('is-hovered', active)
      }
    }
    group.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') setHover(true) })
    group.addEventListener('pointerleave', () => setHover(false))
    shape.addEventListener('focus', () => setHover(true))
    shape.addEventListener('blur', () => setHover(false))
    shape.setAttribute('aria-description', 'Click to show name. Double-click or press Enter to explore.')
    const select = event => { selectPlace(place.id); onSelect(place, event) }
    group.addEventListener('click', e => {
      e.stopPropagation()
      if (isDoubleTap({ id: place.id, time: e.timeStamp, x: e.clientX, y: e.clientY, keyboard: e.detail === 0 })) onOpen(place)
      else select(e)
    })
    shape.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (e.repeat) return
        if (e.key === 'Enter') onOpen(place)
        else select(e)
      }
    })
    group.append(shape)
    buildingNodes.set(place.id, shape)
    seen.set(key, shape)
    extrusions.push({ group, shape, walls, depth, offsetX, offsetY, y: Math.max(...rings.flatMap(ring => points(ring).map(p => p[1]))) })
    buildings.append(group)
  }
  for (const mass of extrusions.toSorted((a, b) => a.y - b.y)) buildings.append(mass.group)
  world.append(buildings)
  const streetLabels = element('g', { class: 'clean-street-labels', 'aria-hidden': 'true' })
  for (const label of geography.labels) {
    const [x, y] = mapPoint(...label.point)
    const text = element('text', { x, y, 'text-anchor': 'middle', transform: `rotate(${label.angle ?? 0} ${x} ${y})` })
    text.textContent = label.name
    streetLabels.append(text)
  }
  for (const area of geography.areas) {
    const coords = points(area.ring)
    const x = (Math.min(...coords.map(p => p[0])) + Math.max(...coords.map(p => p[0]))) / 2
    const y = area.name === 'USC Village' ? Math.min(...coords.map(p => p[1])) - 8 : Math.max(...coords.map(p => p[1])) + 16
    const text = element('text', { x, y, 'text-anchor': 'middle', class: 'clean-region-label' })
    text.textContent = area.name.toUpperCase()
    streetLabels.append(text)
  }
  world.append(streetLabels)
  surface.append(svg)
  map.replaceChildren(surface)
  document.body.classList.add('clean-campus')
  map.classList.add('clean-map-ready')
  const attribution = document.createElement('a')
  attribution.className = 'clean-map-attribution'
  attribution.href = 'https://www.openstreetmap.org/copyright'
  attribution.target = '_blank'; attribution.rel = 'noopener noreferrer'
  attribution.textContent = '© OpenStreetMap contributors'
  map.append(attribution)
  const viewToggle = document.createElement('button')
  viewToggle.type = 'button'
  viewToggle.className = 'campus-view-toggle'
  viewToggle.textContent = '3D'
  viewToggle.setAttribute('aria-label', 'Show 3D buildings')
  viewToggle.setAttribute('aria-pressed', 'false')
  viewToggle.onclick = () => setView(!threeD)
  map.append(viewToggle)
  function setView(enabled) {
    threeD = enabled
    const centerY = bounds.y + bounds.height / 2
    world.setAttribute('transform', enabled ? `translate(0 ${centerY * .26}) scale(1 .74)` : '')
    for (const mass of extrusions) {
      mass.shape.setAttribute('transform', enabled ? `translate(${mass.offsetX} ${mass.offsetY})` : '')
      mass.walls.setAttribute('display', enabled && mass.depth > 0 ? '' : 'none')
    }
    map.classList.toggle('map-is-3d', enabled)
    viewToggle.textContent = enabled ? '2D' : '3D'
    viewToggle.setAttribute('aria-label', enabled ? 'Show 2D map' : 'Show 3D buildings')
    viewToggle.setAttribute('aria-pressed', String(enabled))
  }
  let fit = 1, zoom = 1
  function updateLabels() {
    for (const text of streetLabels.children) text.setAttribute('font-size', 8 / fit / zoom)
  }
  function resize() {
    fit = Math.max(.1, Math.min((map.clientWidth - 8) / bounds.width, (map.clientHeight - 16) / bounds.height))
    svg.style.width = `${bounds.width * fit}px`; svg.style.height = `${bounds.height * fit}px`
    updateLabels()
  }
  function selectPlace(id) {
    const selected = buildingNodes.get(id)
    for (const shape of new Set(buildingNodes.values())) shape.setAttribute('aria-pressed', String(!!selected && shape.dataset.buildingKey === selected.dataset.buildingKey))
  }
  new ResizeObserver(resize).observe(map)
  resize()
  return {surface, selectPlace, setView, setZoom(value) { zoom = value; updateLabels() }}
}
