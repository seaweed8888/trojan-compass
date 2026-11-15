import { Accessibility, ArrowUpDown, ChevronDown, ChevronRight, MapPin, MessageCircle, Route, Search, Send, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { RouteMode } from '../../lib/routing'
import { LocationAutocomplete } from './LocationAutocomplete'
import { StairsIcon } from '../map/StairsIcon'

const TOOLS = [
  { id: 'search', label: 'Search', description: 'Find a building or room', icon: Search },
  { id: 'chat', label: 'Chat', description: 'Ask Compass', icon: MessageCircle },
  { id: 'directions', label: 'Directions', description: 'Plan your way there', icon: Route },
] as const

type Tool = typeof TOOLS[number]['id']
export type LocationField = 'from' | 'to'
const INPUT = 'mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[14px] font-normal outline-none transition placeholder:text-neutral-400 focus:border-cardinal focus:ring-2 focus:ring-cardinal/15'
const ACTION = 'flex w-full items-center justify-center gap-2 rounded-lg bg-cardinal px-3 py-2.5 text-[13px] font-bold text-white transition hover:bg-cardinal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cardinal'

export function FloorTools({ locations, onLocationChange, picking, onPick, onSearch }: {
  locations: Record<LocationField, string>
  onLocationChange: (field: LocationField, value: string) => void
  picking: LocationField | null
  onPick: (field: LocationField | null) => void
  onSearch: (query: string) => boolean
}) {
  const [active, setActive] = useState<Tool | null>(null)
  const [width, setWidth] = useState(336)
  const drag = useRef<{ x: number; width: number } | null>(null)
  const [query, setQuery] = useState('')
  const [travelMode, setTravelMode] = useState<RouteMode>('stairs')
  const [accessibleOnly, setAccessibleOnly] = useState(false)
  const lastPick = useRef<LocationField | null>(null)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; text: string }[]>([
    { role: 'assistant', text: 'Hi, Trojan! I’m Compass. Looking for a room or planning your next stop? Ask me anything about getting around campus.' },
  ])
  const [notice, setNotice] = useState('')
  const menu = useRef<HTMLDetailsElement>(null)
  const sidebar = useRef<HTMLElement>(null)
  const conversation = useRef<HTMLDivElement>(null)
  const tool = TOOLS.find((item) => item.id === active)

  useEffect(() => {
    if (picking) setActive('directions')
  }, [picking])

  useEffect(() => {
    if (active && !picking) {
      sidebar.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(lastPick.current ? `#directions-${lastPick.current}` : 'input, textarea')?.focus()
      lastPick.current = null
    }
  }, [active, picking])

  useEffect(() => {
    if (!picking) return
    const cancel = (event: KeyboardEvent) => { if (event.key === 'Escape') onPick(null) }
    window.addEventListener('keydown', cancel)
    return () => window.removeEventListener('keydown', cancel)
  }, [picking, onPick])

  useEffect(() => {
    conversation.current?.scrollTo({ top: conversation.current.scrollHeight })
  }, [messages, active])

  function selectTool(next: Tool | null) {
    if (active === 'directions' && next !== 'directions') onLocationChange('from', '')
    onPick(null)
    lastPick.current = null
    setActive(next)
  }

  function close() {
    selectTool(null)
    if (menu.current) menu.current.open = false
    menu.current?.querySelector('summary')?.focus()
  }

  return (
    <div style={{ width: active ? width : 0 }} className={`relative order-first z-50 shrink-0 max-w-[calc(100%-16rem)] max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:max-w-[calc(100%-4.75rem)] ${picking ? 'max-md:top-[60%]' : ''}`}>
      <details ref={menu} className={`group absolute bottom-4 left-full z-[60] ml-4 w-56 rounded-xl border border-neutral-200 bg-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.08)] backdrop-blur ${active ? 'max-md:w-11' : 'max-md:w-52'}`}
        onKeyDown={(event) => { if (event.key === 'Escape') close() }}>
        <summary aria-label="Search & tools" className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-[13px] font-bold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cardinal [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2"><Search className="h-4 w-4 shrink-0 text-cardinal" /><span className={active ? 'max-md:hidden' : ''}>Search & tools</span></span>
          <ChevronDown className={`h-4 w-4 -rotate-90 text-neutral-400 transition group-open:rotate-0 ${active ? 'max-md:hidden' : ''}`} />
        </summary>
        <div className={`border-t border-neutral-100 px-1.5 pb-2 pt-1 ${active ? 'max-md:absolute max-md:bottom-full max-md:right-0 max-md:mb-2 max-md:w-52 max-md:rounded-xl max-md:border max-md:border-neutral-200 max-md:bg-white max-md:shadow-lg' : ''}`}>
          {TOOLS.map(({ id, label, description, icon: Icon }) => (
            <button key={id} aria-controls="floor-tools-sidebar" aria-expanded={active === id}
              onClick={() => {
                selectTool(id)
                setNotice('')
                if (menu.current) menu.current.open = false
                if (active === id) sidebar.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')?.focus()
              }}
              className={`flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition hover:bg-neutral-50 ${active === id ? 'bg-cardinal-50 text-cardinal' : 'text-neutral-700'}`}>
              <Icon className="h-4 w-4 shrink-0 text-cardinal" />
              <span className="flex-1"><span className="block text-[13px] font-semibold">{label}</span><span className="block text-[11px] text-neutral-500">{description}</span></span>
              <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
            </button>
          ))}
        </div>
      </details>

      {tool && (
        <aside ref={sidebar} id="floor-tools-sidebar" aria-labelledby="floor-tools-title"
          onKeyDown={(event) => { if (event.key === 'Escape') close() }}
          className="absolute inset-0 flex flex-col border-r border-neutral-200 bg-white max-md:shadow-xl">
          <div role="separator" tabIndex={0} aria-label="Resize tools sidebar" aria-orientation="vertical" aria-valuemin={240} aria-valuemax={640} aria-valuenow={width}
            onPointerDown={(event) => {
              if (event.button !== 0) return
              drag.current = { x: event.clientX, width: sidebar.current?.offsetWidth ?? width }
              event.currentTarget.setPointerCapture(event.pointerId)
              event.preventDefault()
            }}
            onPointerMove={(event) => {
              if (drag.current) setWidth(Math.max(240, Math.min(640, drag.current.width + event.clientX - drag.current.x)))
            }}
            onPointerUp={(event) => {
              drag.current = null
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
            }}
            onLostPointerCapture={() => { drag.current = null }}
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
              event.preventDefault()
              setWidth((current) => event.key === 'Home' ? 240 : event.key === 'End' ? 640 : Math.max(240, Math.min(640, current + (event.key === 'ArrowRight' ? 16 : -16))))
            }}
            className="group absolute inset-y-0 -right-1 z-10 flex w-2 cursor-col-resize touch-none select-none items-center justify-center outline-none hover:bg-cardinal/10 focus-visible:bg-cardinal/10">
            <span className="h-10 w-1 rounded-full bg-neutral-300 transition group-hover:bg-cardinal group-focus-visible:bg-cardinal" />
          </div>
          <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-cardinal-50 text-cardinal"><tool.icon className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1"><h2 id="floor-tools-title" className="text-[16px] font-bold">{tool.label}</h2><p className="text-[12px] text-neutral-500">{tool.description}</p></div>
            <button onClick={close} aria-label="Close tools sidebar" className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"><X className="h-4 w-4" /></button>
          </div>
          <div className={active === 'chat' ? 'flex min-h-0 flex-1 flex-col px-5 pb-3 pt-5' : 'min-h-0 flex-1 overflow-y-auto p-5'}>
            {active === 'search' && (
              <form className="space-y-4" onSubmit={(event) => {
                event.preventDefault()
                setNotice(onSearch(query) ? '' : 'No matching building or room. Try LAW 101 or THH 201.')
              }}>
                <p className="text-[13px] leading-relaxed text-neutral-500">Find your next class, meeting, or study spot.</p>
                <div>
                  <label htmlFor="room-search" className="block text-[12px] font-semibold text-neutral-700">Building and room code</label>
                  <LocationAutocomplete id="room-search" value={query} onChange={(value) => { setQuery(value); setNotice('') }} placeholder="e.g. LAW 101" required className={INPUT} />
                </div>
                <button className={ACTION}><Search className="h-4 w-4" /> Search rooms</button>
              </form>
            )}
            {active === 'directions' && (
              <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setNotice('Route planning is coming soon. Your locations are ready to try.') }}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 p-3">
                  <input type="checkbox" checked={accessibleOnly} onChange={(event) => {
                    setAccessibleOnly(event.target.checked)
                    if (event.target.checked) setTravelMode('elevator')
                  }} className="h-4 w-4 shrink-0 accent-cardinal" />
                  <Accessibility className="h-4 w-4 shrink-0 text-cardinal" />
                  <span><span className="block text-[13px] font-semibold">Accessibility</span><span className="block text-[12px] text-neutral-500">Step-free entrances and elevator access</span></span>
                </label>
                {picking && (
                  <div role="status" className="rounded-lg bg-cardinal-50 p-3 text-[12px] text-cardinal">
                    <p className="font-bold">Select {picking === 'from' ? 'current location' : 'destination'}</p>
                    <p className="mt-1">{picking === 'from' ? 'Carry the Trojan guide over a room, entrance, or open floor area. Release or click to put him down.' : 'Click a room, entrance, or open floor area on the map.'} You can change floors first.</p>
                    <button type="button" onClick={() => onPick(null)} className="mt-2 rounded px-2 py-1 font-semibold hover:bg-white">Cancel</button>
                  </div>
                )}
                {([
                  { field: 'from', label: 'Current location', placeholder: 'e.g. LAW 101 or OUTSIDE' },
                  { field: 'to', label: 'Destination', placeholder: 'e.g. TCC 201' },
                ] as const).map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <label htmlFor={`directions-${field}`} className="block text-[12px] font-semibold text-neutral-700">{label}</label>
                    <div className="relative mt-1.5">
                      <LocationAutocomplete id={`directions-${field}`} value={locations[field]} includeOutside={field === 'from'} accessibleOnly={accessibleOnly}
                        onChange={(value) => { onLocationChange(field, value); onPick(null) }} placeholder={placeholder}
                        aria-describedby={field === 'from' ? 'current-location-hint' : undefined} className={`${INPUT} mt-0 pr-11`} />
                      <button type="button" aria-pressed={picking === field} aria-label={`Select ${label.toLowerCase()} on map`} title={`Select ${label.toLowerCase()} on map`}
                        onPointerDown={field === 'from' ? (event) => {
                          if (event.button !== 0 || event.pointerType !== 'mouse' || window.matchMedia('(max-width: 767px)').matches) return
                          lastPick.current = field
                          onPick(field)
                          setNotice('')
                          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
                        } : undefined}
                        onClick={() => { lastPick.current = field; onPick(field); setNotice('') }}
                        className={`absolute inset-y-1 right-1 grid w-9 touch-none place-items-center rounded-md text-cardinal transition hover:bg-cardinal-50 focus-visible:outline-2 focus-visible:outline-cardinal ${picking === field ? 'bg-cardinal-50 ring-1 ring-cardinal/30' : ''}`}><MapPin className="h-4 w-4" /></button>
                    </div>
                    {field === 'from' && <p id="current-location-hint" className="mt-1.5 text-[12px] leading-relaxed text-neutral-500">Outside? Type “outside” or choose “Outside the building” to start at an entrance.</p>}
                  </div>
                ))}
                <fieldset>
                  <legend className="mb-1.5 text-[12px] font-semibold text-neutral-700">Travel between floors</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: 'stairs', label: 'Stairs', icon: StairsIcon },
                      { value: 'elevator', label: 'Elevators', icon: ArrowUpDown },
                    ] as const).map(({ value, label, icon: Icon }) => (
                      <label key={value} className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition focus-within:ring-2 focus-within:ring-cardinal/30 ${travelMode === value ? 'border-cardinal bg-cardinal-50 text-cardinal' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'} ${accessibleOnly && value === 'stairs' ? 'cursor-not-allowed opacity-40' : ''}`}>
                        <input type="radio" name="directions-travel-mode" value={value} checked={travelMode === value} disabled={accessibleOnly && value === 'stairs'} onChange={() => setTravelMode(value)} className="sr-only" />
                        <Icon className="h-4 w-4" />{label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <button className={ACTION}><MapPin className="h-4 w-4" /> Get directions</button>
              </form>
            )}
            {active === 'chat' && (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <div ref={conversation} role="log" aria-label="Demo conversation" aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                  {messages.map((message, index) => (
                    <div key={index} className={`rounded-xl px-3 py-2.5 text-[13px] leading-relaxed ${message.role === 'user' ? 'ml-6 bg-cardinal text-white' : 'mr-3 bg-neutral-100 text-neutral-700'}`}>
                      <span className={`mb-1 flex items-center gap-1.5 text-[11px] font-bold ${message.role === 'user' ? 'text-white/70' : 'text-cardinal'}`}>{message.role === 'assistant' && <Sparkles className="h-3 w-3" />}{message.role === 'user' ? 'You' : 'Compass'}</span>
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    </div>
                  ))}
                </div>
                <form className="flex shrink-0 items-end gap-2" onSubmit={(event) => {
                  event.preventDefault()
                  if (!draft.trim()) return
                  // shortcut: canned replies only, replace when the assistant service is connected.
                  setMessages((current) => [...current, { role: 'user', text: draft.trim() }, { role: 'assistant', text: 'Happy to help! This is a demo conversation for now. You can try the Search and Directions panels to enter a room or plan your next stop.' }])
                  setDraft('')
                }}>
                  <label className="min-w-0 flex-1"><span className="sr-only">Message</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                        event.preventDefault()
                        event.currentTarget.form?.requestSubmit()
                      }
                    }}
                    placeholder="Ask Compass…" rows={2} className={`${INPUT} mt-0 resize-none`} /></label>
                  <button aria-label="Send message" disabled={!draft.trim()} className="mb-1 rounded-lg bg-cardinal p-3 text-white transition hover:bg-cardinal-dark disabled:opacity-40"><Send className="h-4 w-4" /></button>
                </form>
              </div>
            )}
            {notice && <p role="status" className="mt-4 rounded-lg bg-cardinal-50 p-3 text-[12px] leading-relaxed text-cardinal">{notice}</p>}
          </div>
          {active !== 'chat' && <p className="px-5 pb-4 pt-3 text-[11px] text-neutral-400">Preview · AI and routes aren’t connected yet.</p>}
        </aside>
      )}
    </div>
  )
}
