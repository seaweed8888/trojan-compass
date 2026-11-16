import { buildingCode, compassUrl, mapPoint } from './map-data.js'

const sidebar = document.querySelector('#sidebar')
const menu = document.querySelector('#hamburger')
const map = document.querySelector('#map')
const surface = document.querySelector('.gm-style > div:first-child')
const buildingTooltip = document.createElement('div')
buildingTooltip.className = 'demo-building-tooltip'
buildingTooltip.setAttribute('role', 'tooltip')
buildingTooltip.hidden = true
document.body.append(buildingTooltip)
function showBuildingName(target, x, y) {
  const building = target.closest('[data-place-name]')
  buildingTooltip.hidden = !building
  if (!building) return
  buildingTooltip.textContent = building.dataset.placeName
  if (!buildingCode({ name: building.dataset.placeName })) {
    const footer = document.createElement('small')
    footer.textContent = 'Floor Plan unavailable'
    buildingTooltip.append(footer)
  }
  buildingTooltip.style.left = `${Math.max(8, Math.min(x + 14, innerWidth - buildingTooltip.offsetWidth - 8))}px`
  buildingTooltip.style.top = `${Math.max(8, Math.min(y + 18, innerHeight - buildingTooltip.offsetHeight - 8))}px`
}
map.addEventListener('pointermove', e => showBuildingName(e.target, e.clientX, e.clientY))
map.addEventListener('focusin', e => {
  const rect = e.target.getBoundingClientRect()
  showBuildingName(e.target, rect.left + rect.width / 2, rect.bottom)
})
for (const event of ['pointerleave', 'pointerdown', 'focusout', 'wheel']) {
  map.addEventListener(event, () => { buildingTooltip.hidden = true })
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') buildingTooltip.hidden = true })
const status = document.createElement('div')
status.className = 'demo-status'
status.setAttribute('role', 'status')
document.body.append(status)
let statusTimer
function notify(text) {
  status.textContent = text
  clearTimeout(statusTimer)
  statusTimer = setTimeout(() => { status.textContent = '' }, 6000)
}

const label = document.createElement('div')
label.className = 'demo-label'
label.textContent = 'Local USC map demo · Click a building to explore inside'
document.body.append(label)

function toggleSidebar(open = !document.body.classList.contains('demo-sidebar-open')) {
  document.body.classList.toggle('demo-sidebar-open', open)
  sidebar.inert = !open
  sidebar.setAttribute('aria-hidden', String(!open))
  menu.setAttribute('aria-expanded', String(open))
}
menu.addEventListener('click', () => toggleSidebar())
menu.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSidebar() }
})

const panel = document.createElement('section')
panel.className = 'demo-panel'
panel.hidden = true
panel.setAttribute('aria-label', 'Map information')
document.body.append(panel)
let panelTrigger
function showPanel(title, trigger = document.activeElement) {
  panelTrigger = trigger
  panel.replaceChildren()
  const close = document.createElement('button')
  close.textContent = '×'
  close.dataset.close = ''
  close.setAttribute('aria-label', 'Close map information')
  close.onclick = closePanel
  const heading = document.createElement('h2')
  heading.textContent = title
  panel.append(close, heading)
  panel.hidden = false
  close.focus()
  return panel
}
function closePanel() {
  panel.hidden = true
  panelTrigger?.focus()
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) closePanel() })

function openPlace(place) {
  const code = buildingCode(place)
  if (code) { window.location.assign(compassUrl(code)); return }
  const card = showPanel(place.name)
  const text = document.createElement('p')
  text.textContent = 'This location has no interior model in the Trojan Compass demo.'
  const official = document.createElement('a')
  official.textContent = 'View on the official USC map ↗'
  official.href = `https://maps.usc.edu/?id=1928#!m/${place.id}`
  official.target = '_blank'
  official.rel = 'noopener noreferrer'
  card.append(text, official)
}

let zoom = 1, panX = 0, panY = 0
function updateMap() { surface.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})` }
function zoomMap(delta) { zoom = Math.min(3, Math.max(1, zoom + delta)); updateMap() }
function resetMap() { zoom = 1; panX = 0; panY = 0; updateMap() }
document.querySelector('.zoom-in').onclick = () => zoomMap(.25)
document.querySelector('.zoom-out').onclick = () => zoomMap(-.25)
document.querySelector('#view-home-button').onclick = resetMap
document.querySelector('[data-cy="top-bar-btn-0"]').onclick = resetMap
document.querySelector('[data-cy="top-bar-btn-1"]').onclick = () => {
  const card = showPanel('Health Sciences Campus')
  const text = document.createElement('p')
  text.textContent = 'This local demo includes the saved University Park map. Open the official map for Health Sciences Campus.'
  const link = document.createElement('a')
  link.href = 'https://maps.usc.edu/?id=1928'
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.textContent = 'Open official USC map ↗'
  card.append(text, link)
}
map.addEventListener('wheel', e => { e.preventDefault(); zoomMap(e.deltaY < 0 ? .1 : -.1) }, { passive: false })
let drag
map.addEventListener('pointerdown', e => {
  if (e.button !== 0 || e.target.closest('button,a,path,gmp-advanced-marker')) return
  drag = { x: e.clientX, y: e.clientY, panX, panY }
  map.setPointerCapture(e.pointerId)
})
map.addEventListener('pointermove', e => {
  if (!drag) return
  panX = Math.max(-500, Math.min(500, drag.panX + e.clientX - drag.x))
  panY = Math.max(-300, Math.min(300, drag.panY + e.clientY - drag.y))
  updateMap()
})
map.addEventListener('pointerup', () => { drag = null })
map.addEventListener('pointercancel', () => { drag = null })
map.addEventListener('keydown', e => {
  if (e.target !== map) return
  const directions = { ArrowLeft: [50, 0], ArrowRight: [-50, 0], ArrowUp: [0, 50], ArrowDown: [0, -50] }
  if (directions[e.key]) {
    e.preventDefault()
    panX = Math.max(-500, Math.min(500, panX + directions[e.key][0]))
    panY = Math.max(-300, Math.min(300, panY + directions[e.key][1]))
    updateMap()
  } else if (e.key === '+') zoomMap(.25)
  else if (e.key === '-') zoomMap(-.25)
  else if (e.key === 'Home') resetMap()
})

document.querySelector('[name="share-button"]').onclick = () => {
  const card = showPanel('Share this map')
  const input = document.createElement('input')
  input.value = window.location.href
  input.readOnly = true
  input.setAttribute('aria-label', 'Demo map link')
  input.style.width = '100%'
  const copy = document.createElement('button')
  copy.textContent = 'Copy link'
  copy.onclick = async () => {
    try { await navigator.clipboard.writeText(input.value); copy.textContent = 'Copied' }
    catch { input.focus(); input.select(); notify('Select and copy the link above.') }
  }
  card.append(input, copy)
}
document.querySelector('.cookie-preferences-link').onclick = () => {
  const card = showPanel('Cookie preferences')
  const text = document.createElement('p')
  text.textContent = 'This local demo does not use tracking cookies or analytics.'
  card.append(text)
}
document.querySelector('#location-services').onclick = () => notify('Location services are available on the official USC map.')
document.querySelector('.gm-svpc')?.addEventListener('click', () => notify('Street View is available on the official USC map.'))
// Remove the saved hover tooltip; it would otherwise remain stuck on screen.
document.querySelectorAll('.gm-style [role="tooltip"]').forEach(el => el.remove())
document.querySelectorAll('.gm-style [aria-label="Location name"]').forEach(el => el.remove())

async function init() {
  const response = await fetch('./locations.json')
  if (!response.ok) throw new Error('Could not load the campus directory. Refresh to try again.')
  const places = await response.json()
  const buildings = places.filter(p => p.category === 'Buildings')
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.classList.add('demo-footprints')
  svg.setAttribute('width', '1')
  svg.setAttribute('height', '1')
  svg.setAttribute('aria-label', 'Campus buildings')
  // Share the saved map's center with the original markers and map tiles.
  const origin = document.querySelector('gmp-advanced-marker').parentElement.parentElement
  const markerOrigin = origin.parentElement
  const footprintPane = document.createElement('div')
  footprintPane.style.cssText = 'position:absolute;left:0;top:0;z-index:105'
  footprintPane.append(svg)
  markerOrigin.insertBefore(footprintPane, origin)
  for (const place of places) {
    if (!place.paths?.length) continue
    const rings = typeof place.paths[0][0] === 'number' ? [place.paths] : place.paths
    const path = document.createElementNS(svg.namespaceURI, 'path')
    path.setAttribute('d', rings.map(ring => ring.map(([lat, lng], i) => `${i ? 'L' : 'M'}${mapPoint(lat, lng).join(',')}`).join(' ') + ' Z').join(' '))
    path.setAttribute('fill', place.color)
    path.setAttribute('fill-rule', 'evenodd')
    path.dataset.category = place.category === 'Buildings' ? 'buildings' : 'parking'
    path.dataset.placeName = place.name
    path.dataset.supported = String(!!buildingCode(place))
    path.setAttribute('role', 'link')
    path.setAttribute('aria-label', `${place.name}${buildingCode(place) ? ' — Explore in Trojan Compass' : ''}`)
    // Buildings can also be reached from the searchable directory, without hundreds of tab stops.
    if (buildingCode(place)) path.setAttribute('tabindex', '0')
    path.addEventListener('click', e => { e.stopPropagation(); openPlace(place) })
    path.addEventListener('keydown', e => { if (e.key === 'Enter') openPlace(place) })
    svg.append(path)
  }

  for (const marker of document.querySelectorAll('gmp-advanced-marker')) {
    const button = marker.querySelector('[aria-label^="Open Location:"]')
    if (!button) continue
    const name = button.getAttribute('aria-label').replace('Open Location: ', '')
    const place = places.find(p => p.name === name)
    if (!place) continue
    marker.dataset.category = place.category === 'Buildings' ? 'buildings' : 'parking'
    marker.addEventListener('click', e => { e.stopPropagation(); openPlace(place) })
    marker.dataset.placeName = name
  }

  const search = document.createElement('div')
  search.className = 'demo-search'
  const input = document.createElement('input')
  input.id = 'search-query'
  input.type = 'search'
  input.placeholder = 'Search buildings, places…'
  input.setAttribute('aria-label', 'Search campus locations')
  const results = document.createElement('div')
  results.className = 'demo-results'
  results.setAttribute('aria-label', 'Search results')
  search.append(input, results)
  document.querySelector('#sidebar-header').after(search)
  function showResults(list) {
    results.replaceChildren()
    if (!list.length) {
      const empty = document.createElement('p')
      empty.textContent = 'No locations found. Try a building name or code.'
      results.append(empty)
    }
    for (const place of list) {
      const code = buildingCode(place)
      const item = document.createElement(code ? 'a' : 'button')
      item.textContent = place.name.replace('LEED Certified Building: ', '')
      if (code) {
        item.href = compassUrl(code)
        const hint = document.createElement('small')
        hint.textContent = 'EXPLORE INSIDE · TROJAN COMPASS ↗'
        item.append(hint)
      } else item.onclick = () => openPlace(place)
      results.append(item)
    }
  }
  const categories = document.querySelector('.category-location-list')
  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase()
    categories.hidden = !!query
    if (!query) { results.replaceChildren(); return }
    showResults(places.filter(p => `${p.name} ${p.code}`.toLowerCase().includes(query)))
  })
  document.querySelector('#cat-53722').addEventListener('click', () => showResults(buildings.toSorted((a, b) => Number(!!buildingCode(b)) - Number(!!buildingCode(a)) || a.name.localeCompare(b.name))))

  function setCategory(category, visible) {
    document.querySelectorAll(`[data-category="${category}"]`).forEach(el => { el.style.display = visible ? '' : 'none' })
    const control = document.querySelector(`#cat-${category}-5372${category === 'buildings' ? '2' : '3'} [role="checkbox"]`)
    control?.setAttribute('aria-checked', String(visible))
    control?.classList.toggle('on', visible)
  }
  for (const control of document.querySelectorAll('[role="checkbox"]')) {
    const toggle = () => {
      const category = control.closest('li').id.includes('buildings') ? 'buildings' : control.closest('li').id.includes('parking') ? 'parking' : null
      if (!category) { notify('Additional categories are available on the official USC map.'); return }
      setCategory(category, control.getAttribute('aria-checked') !== 'true')
    }
    control.onclick = toggle
    control.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle() } }
  }
  document.querySelector('#clear').onclick = () => { setCategory('buildings', false); setCategory('parking', false) }
  document.querySelector('.map-layers').onclick = () => {
    const card = showPanel('Map layers')
    for (const category of ['buildings', 'parking']) {
      const row = document.createElement('label')
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      const control = document.querySelector(`#cat-${category}-5372${category === 'buildings' ? '2' : '3'} [role="checkbox"]`)
      checkbox.checked = control.getAttribute('aria-checked') === 'true'
      checkbox.onchange = () => setCategory(category, checkbox.checked)
      row.append(checkbox, category === 'buildings' ? 'Buildings' : 'Parking')
      card.append(row)
    }
  }
  document.querySelector('#sidebar-tab-tours').onclick = () => {
    showPanel('Admission tours').append(Object.assign(document.createElement('p'), { textContent: 'Visit admission.usc.edu for official campus tours. Interior exploration is available from Buildings in this demo.' }))
  }
  document.querySelector('#sidebar-tab-locations').onclick = () => { panel.hidden = true; input.focus() }
  document.querySelectorAll('.category .name[role="button"]').forEach(control => {
    if (control.id === 'cat-53722') return
    control.addEventListener('click', () => {
      if (control.textContent === 'Parking') showResults(places.filter(p => p.category !== 'Buildings'))
      else notify('This category is available on the official USC map. The local demo includes Buildings and Parking.')
    })
  })
  toggleSidebar(false)
}

init().catch(error => notify(error.message))
