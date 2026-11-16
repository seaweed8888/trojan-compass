import { setupMobileCampus } from './mobile.js'
import { createCleanMap, onCleanCampus } from './clean-map.js'
import { buildingCode, compassUrl } from './map-data.js'

const brand = document.querySelector('#header .logo a')
brand.className = 'compass-brand'
brand.href = './'
brand.removeAttribute('target')
brand.setAttribute('aria-label', 'Trojan Compass campus map')
brand.innerHTML = '<img src="./assets/usc_monogram_white_210x76.png" alt="USC"><span class="campus-brand-divider" aria-hidden="true"></span><span class="compass-wordmark">Trojan <span>Compass</span></span>'

const sidebar = document.querySelector('#sidebar')
const menu = document.querySelector('#hamburger')
const map = document.querySelector('#map')
let surface = document.querySelector('.gm-style > div:first-child')
let cleanMap
const buildingTooltip = document.createElement('div')
let pinnedBuildingName = false
buildingTooltip.className = 'demo-building-tooltip'
buildingTooltip.setAttribute('role', 'tooltip')
buildingTooltip.hidden = true
document.body.append(buildingTooltip)
function showBuildingName(target, x, y) {
  const building = target.closest('[data-place-name]')
  buildingTooltip.hidden = !building
  if (!building) return
  renderPlaceName(buildingTooltip, building.dataset.placeName)
  buildingTooltip.style.left = `${Math.max(8, Math.min(x + 14, innerWidth - buildingTooltip.offsetWidth - 8))}px`
  buildingTooltip.style.top = `${Math.max(8, Math.min(y + 18, innerHeight - buildingTooltip.offsetHeight - 8))}px`
}
map.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && !e.buttons) showBuildingName(e.target, e.clientX, e.clientY) })
map.addEventListener('focusin', e => {
  const rect = e.target.getBoundingClientRect()
  showBuildingName(e.target, rect.left + rect.width / 2, rect.bottom)
})
for (const event of ['pointerleave', 'pointerdown', 'focusout', 'wheel']) {
  map.addEventListener(event, () => { pinnedBuildingName = false; buildingTooltip.hidden = true })
}
map.addEventListener('click', () => { pinnedBuildingName = false; buildingTooltip.hidden = true; cleanMap?.selectPlace(null) })
document.addEventListener('keydown', e => { if (e.key === 'Escape') { pinnedBuildingName = false; buildingTooltip.hidden = true } })
// Dismiss names and desktop cards from anywhere outside them, including toolbars.
document.addEventListener('pointerdown', e => {
  if (!buildingTooltip.contains(e.target)) { pinnedBuildingName = false; buildingTooltip.hidden = true }
  if (!panel.hidden && !panel.contains(e.target) && !document.body.classList.contains('mobile-campus')) closePanel(false)
}, true)
function renderPlaceName(target, name) {
  const text = name.replace('LEED Certified Building: ', '')
  const match = text.match(/^(.*?)(\s*\([A-Z0-9-]{2,8}\))$/)
  target.replaceChildren()
  const label = document.createElement('span')
  label.className = 'campus-place-name'
  label.textContent = match ? match[1] : text
  target.append(label)
  if (match) {
    const code = document.createElement('span')
    code.className = 'campus-place-code'
    code.textContent = match[2].trim()
    target.append(' ', code)
  }
  if (target === buildingTooltip && !buildingCode({ name })) {
    const footer = document.createElement('small')
    footer.textContent = 'Floor Plan unavailable'
    target.append(footer)
  }
}
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
label.textContent = 'Click for a building name · Double-click to explore inside'
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
  close.onclick = () => closePanel()
  const heading = document.createElement('h2')
  renderPlaceName(heading, title)
  panel.append(close, heading)
  panel.hidden = false
  close.focus()
  document.dispatchEvent(new CustomEvent('campus:panel-open', { detail: { title } }))
  return panel
}
function closePanel(restoreFocus = true) {
  panel.hidden = true
  document.dispatchEvent(new Event('campus:panel-close'))
  if (restoreFocus && !document.body.classList.contains('mobile-campus')) panelTrigger?.focus()
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) closePanel() })

function showPlaceName(place, event) {
  cleanMap?.selectPlace(place.id)
  const rect = event.currentTarget.getBoundingClientRect()
  const pointer = typeof event.clientX === 'number' && (event.clientX !== 0 || event.clientY !== 0)
  const x = pointer ? event.clientX : rect.left + rect.width / 2
  const y = pointer ? event.clientY : rect.top + rect.height / 2
  renderPlaceName(buildingTooltip, place.name)
  buildingTooltip.hidden = false
  buildingTooltip.style.left = `${Math.max(8, Math.min(x + 14, innerWidth - buildingTooltip.offsetWidth - 8))}px`
  buildingTooltip.style.top = `${Math.max(8, Math.min(y + 18, innerHeight - buildingTooltip.offsetHeight - 8))}px`
  pinnedBuildingName = true
}
function enterPlace(place) {
  const code = buildingCode(place)
  if (code) window.location.assign(compassUrl(code))
  else openPlace(place)
}
function openPlace(place) {
  const code = buildingCode(place)
  cleanMap?.selectPlace(place.id)
  const card = showPanel(place.name)
  if (code) {
    const explore = document.createElement('a')
    explore.className = 'clean-explore-link'
    explore.textContent = 'Explore building'
    explore.href = compassUrl(code)
    card.append(explore)
    return
  }
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
function updateMap() { surface.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`; cleanMap?.setZoom(zoom) }
function zoomMap(delta) { zoom = Math.min(5, Math.max(1, zoom + delta)); updateMap() }
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
let drag, pinch
const touches = new Map()
let suppressClickUntil = 0
const limit = (value, max) => Math.max(-max, Math.min(max, value))
function touchPair() {
  const [a, b] = [...touches.values()]
  const rect = map.getBoundingClientRect()
  return { distance: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2 - rect.left - rect.width / 2, y: (a.y + b.y) / 2 - rect.top - rect.height / 2 }
}
map.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch') {
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (touches.size === 2) {
      pinch = { ...touchPair(), zoom, panX, panY }
      drag = null
      for (const id of touches.keys()) map.setPointerCapture(id)
      suppressClickUntil = Date.now() + 500
      return
    }
  }
  if (e.button !== 0 || (e.pointerType !== 'touch' && e.target.closest('button,a,path,gmp-advanced-marker'))) return
  drag = { x: e.clientX, y: e.clientY, panX, panY }
  if (e.pointerType !== 'touch') map.setPointerCapture(e.pointerId)
})
map.addEventListener('pointermove', e => {
  if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pinch && touches.size >= 2) {
    const next = touchPair()
    zoom = Math.min(5, Math.max(1, pinch.zoom * next.distance / Math.max(1, pinch.distance)))
    const ratio = zoom / pinch.zoom
    panX = limit(next.x - (pinch.x - pinch.panX) * ratio, 500)
    panY = limit(next.y - (pinch.y - pinch.panY) * ratio, 300)
    suppressClickUntil = Date.now() + 500
    updateMap()
    return
  }
  if (!drag) return
  if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return
  if (e.pointerType === 'touch') map.setPointerCapture(e.pointerId)
  suppressClickUntil = Date.now() + 500
  panX = limit(drag.panX + e.clientX - drag.x, 500)
  panY = limit(drag.panY + e.clientY - drag.y, 300)
  updateMap()
})
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) map.addEventListener(type, e => {
  touches.delete(e.pointerId)
  if (pinch) suppressClickUntil = Date.now() + 500
  pinch = null
  drag = null
})
map.addEventListener('click', e => {
  if (Date.now() < suppressClickUntil) { e.preventDefault(); e.stopPropagation() }
}, true)
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
  const places = (await response.json()).filter(onCleanCampus)
  const buildings = places.filter(p => p.category === 'Buildings')
  cleanMap = createCleanMap(map, places, showPlaceName, enterPlace)
  surface = cleanMap.surface

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
      const item = document.createElement('button')
      renderPlaceName(item, place.name)
      item.onclick = () => openPlace(place)
      results.append(item)
    }
    document.dispatchEvent(new Event('campus:results'))
  }
  const categories = document.querySelector('.category-location-list')
  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase()
    categories.hidden = !!query
    if (!query) { showResults(buildings.filter(b => /\((LAW|THH|TCC|VKC)\)/.test(b.name)).slice(0, 4)); return }
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
  setupMobileCampus({ search, categories, panel, resetMap, showResults, buildings, notify })
}

init().catch(error => notify(error.message))
