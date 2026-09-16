'use client'

import { useEffect, useState } from 'react'

// Bounding box for the coverage area
// Lat: 37.46 (HMB) to 38.27 (Dillon)
// Lon: -123.00 (Point Reyes) to -122.44 (inland)
const LAT_MIN = 37.46, LAT_MAX = 38.27
const LON_MIN = -123.00, LON_MAX = -122.44

function toSVG(lat: number, lon: number, w: number, h: number) {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * w
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * h
  return { x, y }
}

function pinColor(call: string) {
  if (call === 'go')      return '#22c55e'
  if (call === 'consider') return '#f59e0b'
  if (call === 'killed')   return '#334155'
  if (call === 'gauge')    return '#1e3a5f'
  return '#4a6a85'
}

function scoreColor(score: number) {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  return '#4a6a85'
}

export default function MapTab({ date, onSpotSelect }: { date: string; onSpotSelect: (slug: string) => void }) {
  const [spots, setSpots] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const W = 340, H = 480

  useEffect(() => {
    setLoading(true)
    fetch(`/api/spots?date=${date}`)
      .then(r => r.json())
      .then(d => { setSpots(d.spots || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [date])

  const handlePin = (spot: any) => {
    setSelected(selected?.slug === spot.slug ? null : spot)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Map SVG */}
      <div className="flex-1 overflow-hidden px-4 pt-4">
        <div className="rounded-2xl overflow-hidden relative"
             style={{ background: '#081220', border: '0.5px solid rgba(255,255,255,0.08)' }}>

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <span className="text-sm" style={{ color: 'var(--text-dim)' }}>Loading…</span>
            </div>
          )}

          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
            {/* Ocean background */}
            <rect width={W} height={H} fill="#081220" />

            {/* Rough coastline hint — decorative lines */}
            <path d="M 200,0 C 185,60 195,120 180,180 C 165,240 170,300 155,360 C 140,420 145,460 130,480"
                  stroke="#0f2a45" strokeWidth="40" fill="none" />
            <path d="M 200,0 C 185,60 195,120 180,180 C 165,240 170,300 155,360 C 140,420 145,460 130,480"
                  stroke="#0d1e30" strokeWidth="20" fill="none" />

            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map(f => (
              <line key={f} x1={0} y1={H*f} x2={W} y2={H*f}
                    stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            ))}

            {/* Region labels */}
            <text x="8" y="40" fill="rgba(255,255,255,0.1)" fontSize="9" fontWeight="500" letterSpacing="1">MARIN</text>
            <text x="8" y="200" fill="rgba(255,255,255,0.1)" fontSize="9" fontWeight="500" letterSpacing="1">SF</text>
            <text x="8" y="380" fill="rgba(255,255,255,0.1)" fontSize="9" fontWeight="500" letterSpacing="1">SAN MATEO</text>

            {/* Spot pins */}
            {spots.map((s: any) => {
              const { x, y } = toSVG(parseFloat(s.latitude), parseFloat(s.longitude), W, H)
              const color = pinColor(s.call)
              const isSelected = selected?.slug === s.slug
              const score = Math.round(s.score)

              return (
                <g key={s.slug} onClick={() => handlePin(s)} style={{ cursor: 'pointer' }}>
                  {/* Pulse ring for GO spots */}
                  {s.call === 'go' && (
                    <circle cx={x} cy={y} r="14" fill="none"
                            stroke="#22c55e" strokeWidth="0.5" opacity="0.3" />
                  )}
                  {/* Pin circle */}
                  <circle cx={x} cy={y} r={isSelected ? 11 : 8}
                          fill={color} opacity={s.gauge_only ? 0.3 : 0.9}
                          stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.4)'} strokeWidth={isSelected ? 1.5 : 0.5} />
                  {/* Score inside pin */}
                  {score > 0 && !s.gauge_only && (
                    <text x={x} y={y+3.5} textAnchor="middle"
                          fill="rgba(0,0,0,0.8)" fontSize="7" fontWeight="700">
                      {score}
                    </text>
                  )}
                  {/* Name label */}
                  <text x={x + 12} y={y + 4} fill="rgba(255,255,255,0.5)" fontSize="8" fontWeight="500">
                    {s.spot_name.replace(' Beach','').replace(' State','').replace(' Jetty','')}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Selected spot card */}
      {selected && (
        <div className="px-4 py-3 flex-shrink-0">
          <div className="rounded-2xl p-4"
               style={{ background: 'rgba(13,26,42,0.95)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-base font-semibold" style={{ color: 'var(--text-bright)' }}>{selected.spot_name}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                  {selected.region} · {selected.drive_minutes_estimate}min
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-light" style={{ color: scoreColor(selected.score) }}>
                  {Math.round(selected.score) || '—'}
                </div>
                <div className="text-[10px] font-bold uppercase" style={{ color: scoreColor(selected.score) }}>
                  {selected.call.toUpperCase()}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { onSpotSelect(selected.slug); setSelected(null) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--teal)', border: '0.5px solid rgba(6,182,212,0.3)' }}>
                Full breakdown →
              </button>
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2.5 rounded-xl text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)' }}>
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-4 pb-4 flex gap-4 flex-shrink-0">
        {[['#22c55e','Go'],['#f59e0b','Consider'],['#334155','No go'],['#1e3a5f','Gauge']].map(([c,l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
