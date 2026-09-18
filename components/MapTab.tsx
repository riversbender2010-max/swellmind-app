'use client'

import { useEffect, useRef, useState } from 'react'

const SPOTS = [
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
  { slug: 'point_reyes_beach',  name: 'Pt Reyes',        lat: 38.050000, lon: -122.960000 },
  { slug: 'drakes_bay',         name: 'Drakes Bay',      lat: 38.026000, lon: -122.960000 },
  { slug: 'linda_mar',          name: 'Linda Mar',       lat: 37.598000, lon: -122.503000 },
  { slug: 'rockaway',           name: 'Rockaway',        lat: 37.607000, lon: -122.494000 },
  { slug: 'montara',            name: 'Montara',         lat: 37.552000, lon: -122.517000 },
  { slug: 'princeton_jetty',    name: 'Princeton Jetty', lat: 37.499000, lon: -122.482000 },
  { slug: 'dunes_francis',      name: 'Dunes/Francis',   lat: 37.464000, lon: -122.443000 },
  { slug: 'mavericks',          name: 'Mavericks',       lat: 37.495000, lon: -122.500000 },
]

function pinColor(call: string) {
  if (call === 'go')       return '#22c55e'
  if (call === 'consider') return '#f59e0b'
  return '#475569'
}

export default function MapTab({ date, onSpotSelect }: {
  date: string
  onSpotSelect: (slug: string) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapReady = useRef(false)
  const markers = useRef<any[]>([])
  const [scores, setScores] = useState<Record<string, any>>({})
  const [selected, setSelected] = useState<any>(null)
  const [status, setStatus] = useState('Loading map...')

  // fetch scores
  useEffect(() => {
    fetch(`/api/spots?date=${date}`)
      .then(r => r.json())
      .then(d => {
        const m: Record<string, any> = {}
        for (const s of d.spots || []) m[s.slug] = s
        setScores(m)
      })
      .catch(() => {})
  }, [date])

  // init map
  useEffect(() => {
    if (mapReady.current) return
    const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    console.log('[SwellMind] Mapbox token present:', !!TOKEN, TOKEN?.slice(0, 10))

    if (!TOKEN) {
      setStatus('Map unavailable — token not configured')
      return
    }

    // load CSS
    const cssId = 'mapbox-css'
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link')
      link.id = cssId
      link.rel = 'stylesheet'
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css'
      document.head.appendChild(link)
    }

    function boot() {
      if (!mapRef.current || mapReady.current) return
      mapReady.current = true
      const mgl = (window as any).mapboxgl
      mgl.accessToken = TOKEN

      const map = new mgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-122.65, 37.85],
        zoom: 9.5,
      })

      map.on('load', () => {
        setStatus('')
        map.on('click', () => setSelected(null))

        SPOTS.forEach(spot => {
          const data = scores[spot.slug] || {}
          const call = data.call || 'killed'
          const score = Math.round(parseFloat(data.score) || 0)
          const isGauge = data.gauge_only
          const color = pinColor(call)

          const el = document.createElement('div')
          Object.assign(el.style, {
            width: isGauge ? '10px' : '34px',
            height: isGauge ? '10px' : '34px',
            background: color,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: '700',
            color: 'rgba(0,0,0,0.85)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            opacity: isGauge ? '0.3' : '1',
          })
          if (!isGauge && score > 0) el.textContent = String(score)
          el.onclick = (e) => { e.stopPropagation(); setSelected({ ...spot, ...data, score }) }

          new mgl.Marker({ element: el, anchor: 'center' })
            .setLngLat([spot.lon, spot.lat])
            .addTo(map)
          markers.current.push(el)
        })
      })
    }

    if ((window as any).mapboxgl) {
      boot()
    } else {
      const s = document.createElement('script')
      s.src = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js'
      s.onload = boot
      document.head.appendChild(s)
    }
  }, [scores])

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '560px' }}>
      {status && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, color: '#4a6a85', fontSize: 14 }}>
          {status}
        </div>
      )}

      <div ref={mapRef} style={{ flex: 1, minHeight: 0, height: '480px' }} />

      {selected && (
        <div style={{
          position: 'absolute', bottom: 40, left: 16, right: 16,
          background: 'rgba(8,16,26,0.97)', border: '0.5px solid rgba(255,255,255,0.12)',
          borderRadius: 16, padding: 16, zIndex: 10, backdropFilter: 'blur(20px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ color: '#f0f4f8', fontSize: 16, fontWeight: 600 }}>{selected.name}</div>
              <div style={{ color: '#4a6a85', fontSize: 11, marginTop: 2 }}>
                {selected.region} · {selected.drive_minutes_estimate}min
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: pinColor(selected.call || 'killed'), fontSize: 24, fontWeight: 300 }}>
                {selected.score || '—'}
              </div>
              <div style={{ color: pinColor(selected.call || 'killed'), fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                {(selected.call || '—').toUpperCase()}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { onSpotSelect(selected.slug); setSelected(null) }}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: '0.5px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.15)', color: '#06b6d4', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Full breakdown →
            </button>
            <button onClick={() => setSelected(null)}
                    style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#4a6a85', cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, padding: '8px 16px', flexShrink: 0 }}>
        {[['#22c55e','Go'],['#f59e0b','Consider'],['#475569','No go']].map(([c,l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            <span style={{ color: '#4a6a85', fontSize: 10 }}>{l}</span>
          </div>
        ))}
        <span style={{ color: '#4a6a85', fontSize: 10, marginLeft: 'auto' }}>Tap for details</span>
      </div>
    </div>
  )
}
