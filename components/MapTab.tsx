'use client'

import { useEffect, useRef, useState } from 'react'

const SPOTS_STATIC = [
  { slug: 'ocean_beach_north',  name: 'OB North',       lat: 37.778000, lon: -122.513000 },
  { slug: 'ocean_beach_middle', name: 'OB Middle',       lat: 37.759900, lon: -122.511100 },
  { slug: 'ocean_beach_south',  name: 'OB South',        lat: 37.735000, lon: -122.506000 },
  { slug: 'fort_point',         name: 'Fort Point',      lat: 37.810000, lon: -122.477000 },
  { slug: 'rodeo_beach',        name: 'Rodeo Beach',     lat: 37.832000, lon: -122.537000 },
  { slug: 'bolinas_patch',      name: 'Bolinas Patch',   lat: 37.907500, lon: -122.684400 },
  { slug: 'bolinas_channel',    name: 'Bolinas Channel', lat: 37.905000, lon: -122.687000 },
  { slug: 'stinson',            name: 'Stinson Beach',   lat: 37.900000, lon: -122.643000 },
  { slug: 'muir_beach',         name: 'Muir Beach',      lat: 37.860000, lon: -122.577000 },
  { slug: 'rca',                name: 'RCA',             lat: 37.906000, lon: -122.735000 },
  { slug: 'dillon_beach',       name: 'Dillon Beach',    lat: 38.250000, lon: -122.965000 },
  { slug: 'point_reyes_beach',  name: 'Pt Reyes Beach',  lat: 38.050000, lon: -122.960000 },
  { slug: 'drakes_bay',         name: 'Drakes Bay',      lat: 38.026000, lon: -122.960000 },
  { slug: 'linda_mar',          name: 'Linda Mar',       lat: 37.598000, lon: -122.503000 },
  { slug: 'rockaway',           name: 'Rockaway',        lat: 37.607000, lon: -122.494000 },
  { slug: 'montara',            name: 'Montara',         lat: 37.552000, lon: -122.517000 },
  { slug: 'princeton_jetty',    name: 'Princeton Jetty', lat: 37.499000, lon: -122.482000 },
  { slug: 'dunes_francis',      name: 'Dunes/Francis',   lat: 37.464000, lon: -122.443000 },
  { slug: 'mavericks',          name: 'Mavericks',       lat: 37.495000, lon: -122.500000 },
]

function callColor(call: string) {
  if (call === 'go')       return '#22c55e'
  if (call === 'consider') return '#f59e0b'
  if (call === 'killed')   return '#475569'
  if (call === 'gauge')    return '#1e3a5f'
  return '#475569'
}

function MapInner({ date, onSpotSelect }: { date: string; onSpotSelect: (slug: string) => void }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [scores, setScores] = useState<Record<string, any>>({})
  const [selected, setSelected] = useState<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/spots?date=${date}`)
      .then(r => r.json())
      .then(d => {
        const map: Record<string, any> = {}
        for (const s of d.spots || []) map[s.slug] = s
        setScores(map)
      })
  }, [date])

  useEffect(() => {
    if (!mapInstanceRef.current || !mapRef.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    console.log('Mapbox token:', token ? `${token.slice(0,8)}...` : 'UNDEFINED')
    if (!token) { console.error('NEXT_PUBLIC_MAPBOX_TOKEN not set'); return }

    if (!document.querySelector('link[href*="mapbox-gl"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css'
      document.head.appendChild(link)
    }

    function initMap(tok: string) {
      if (!mapRef.current || mapInstanceRef.current) return
      const mapboxgl = (window as any).mapboxgl
      mapboxgl.accessToken = tok
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-122.65, 37.85],
        zoom: 9.5,
        minZoom: 7,
        maxZoom: 15,
      })
      map.on('load', () => { mapInstanceRef.current = map; setMapLoaded(true) })
      map.on('click', () => setSelected(null))
    }

    if ((window as any).mapboxgl) {
      initMap(token)
    } else {
      const script = document.createElement('script')
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js'
      script.onload = () => initMap(token)
      document.head.appendChild(script)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        setMapLoaded(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return
    const mapboxgl = (window as any).mapboxgl
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    SPOTS_STATIC.forEach(spot => {
      const data = scores[spot.slug]
      const call = data?.call || 'killed'
      const score = Math.round(parseFloat(data?.score) || 0)
      const color = callColor(call)
      const isGauge = data?.gauge_only

      const el = document.createElement('div')
      el.style.cssText = `
        width:${isGauge ? 10 : 34}px;height:${isGauge ? 10 : 34}px;
        background:${color};border-radius:50%;
        border:2px solid rgba(255,255,255,${isGauge ? 0.1 : 0.25});
        display:flex;align-items:center;justify-content:center;
        cursor:pointer;font-size:10px;font-weight:700;
        color:rgba(0,0,0,0.85);box-shadow:0 2px 8px rgba(0,0,0,0.5);
        transition:transform 0.15s ease;opacity:${isGauge ? 0.3 : 1};
      `
      if (!isGauge && score > 0) el.textContent = String(score)
      el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.2)' })
      el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })
      el.addEventListener('click', (e) => { e.stopPropagation(); setSelected({ ...spot, ...data, score }) })
      el.addEventListener('dblclick', (e) => { e.stopPropagation(); onSpotSelect(spot.slug) })

      markersRef.current.push(
        new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([spot.lon, spot.lat])
          .addTo(mapInstanceRef.current)
      )
    })
  }, [mapLoaded, scores, onSpotSelect])

  return (
    <div className="flex flex-col h-full relative">
      <div ref={mapRef} style={{ flex: 1, minHeight: 0 }} />

      {selected && (
        <div className="absolute bottom-12 left-4 right-4 rounded-2xl p-4 z-10"
             style={{ background: 'rgba(8,16,26,0.97)', border: '0.5px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-base font-semibold" style={{ color: 'var(--text-bright)' }}>{selected.name}</div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                {selected.region} · {selected.drive_minutes_estimate}min
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-light" style={{ color: callColor(selected.call || 'killed') }}>
                {selected.score || '—'}
              </div>
              <div className="text-[10px] font-bold uppercase" style={{ color: callColor(selected.call || 'killed') }}>
                {(selected.call || 'killed').toUpperCase()}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { onSpotSelect(selected.slug); setSelected(null) }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--teal)', border: '0.5px solid rgba(6,182,212,0.3)' }}>
              Full breakdown →
            </button>
            <button onClick={() => setSelected(null)}
                    className="px-4 py-2.5 rounded-xl text-sm"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-dim)' }}>
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-3 left-3 rounded-xl px-3 py-2 flex gap-3 z-10"
           style={{ background: 'rgba(8,16,26,0.85)', backdropFilter: 'blur(10px)' }}>
        {[['#22c55e','Go'],['#f59e0b','Consider'],['#475569','No go']].map(([c,l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-dim)' }}>{l}</span>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-center py-1.5" style={{ color: 'var(--text-dim)' }}>
        Tap pin · Double-tap for full breakdown
      </div>
    </div>
  )
}

export default function MapTab({ date, onSpotSelect }: { date: string; onSpotSelect: (slug: string) => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-sm" style={{ color: 'var(--text-dim)' }}>Loading map…</div>
    </div>
  )
  return <MapInner date={date} onSpotSelect={onSpotSelect} />
}
