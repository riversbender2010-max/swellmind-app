'use client'

import { useEffect, useState } from 'react'

const LAT_MIN = 37.384, LAT_MAX = 38.300
const LON_MIN = -123.015, LON_MAX = -122.413
const W = 340, H = 500

function toSVG(lat: number, lon: number) {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * W
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
}

function pinColor(call: string) {
  if (call === 'go')       return '#22c55e'
  if (call === 'consider') return '#f59e0b'
  if (call === 'killed')   return '#334155'
  if (call === 'gauge')    return '#1a3a5f'
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

  useEffect(() => {
    setLoading(true)
    fetch(`/api/spots?date=${date}`)
      .then(r => r.json())
      .then(d => { setSpots(d.spots || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [date])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-hidden px-4 pt-3">
        <div className="rounded-2xl overflow-hidden"
             style={{ background: '#060e18', border: '0.5px solid rgba(255,255,255,0.08)' }}>
          {loading && (
            <div className="flex items-center justify-center h-48">
              <span className="text-sm" style={{ color: 'var(--text-dim)' }}>Loading…</span>
            </div>
          )}
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
            <rect width={W} height={H} fill="#060e18" />

            {/* Ocean fill west of coast */}
            <rect x="0" y="0" width="220" height={H} fill="#08141e" opacity="0.6" />

            {/* Rough coastline */}
            <path
              d="M 310,0 C 305,30 308,60 300,90 C 292,120 295,150 285,180 C 275,210 278,240 268,270 C 258,300 262,330 252,360 C 242,390 248,420 238,450 C 228,480 232,500 222,500"
              stroke="#0d2540" strokeWidth="28" fill="none" />
            <path
              d="M 310,0 C 305,30 308,60 300,90 C 292,120 295,150 285,180 C 275,210 278,240 268,270 C 258,300 262,330 252,360 C 242,390 248,420 238,450 C 228,480 232,500 222,500"
              stroke="#0a1e30" strokeWidth="12" fill="none" />

            {/* Point Reyes headland */}
            <ellipse cx="35" cy="140" rx="55" ry="30" fill="#08141e" opacity="0.8" />

            {/* Region labels */}
            <text x="12" y="45" fill="rgba(255,255,255,0.12)" fontSize="8" fontWeight="600" letterSpacing="1.5">MARIN</text>
            <text x="12" y="290" fill="rgba(255,255,255,0.12)" fontSize="8" fontWeight="600" letterSpacing="1.5">SAN FRANCISCO</text>
            <text x="12" y="420" fill="rgba(255,255,255,0.12)" fontSize="8" fontWeight="600" letterSpacing="1.5">SAN MATEO</text>

            {/* Grid */}
            {[0.2,0.4,0.6,0.8].map(f => (
              <line key={f} x1={0} y1={H*f} x2={W} y2={H*f}
                    stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
            ))}

            {/* Spot pins */}
            {spots.map((s: any) => {
              const { x, y } = toSVG(parseFloat(s.latitude), parseFloat(s.longitude))
              const color = pinColor(s.call)
              const isSelected = selected?.slug === s.slug
              const score = Math.round(s.score || 0)
              const isGauge = s.gauge_only

              return (
                <g key={s.slug} onClick={() => setSelected(selected?.slug === s.slug ? null : s)}
                   style={{ cursor: 'pointer' }}>
                  {s.call === 'go' && !isGauge && (
                    <circle cx={x} cy={y} r="16" fill="none"
                            stroke="#22c55e" strokeWidth="0.5" opacity="0.25" />
                  )}
                  <circle cx={x} cy={y} r={isSelected ? 12 : 9}
                          fill={color}
                          opacity={isGauge ? 0.25 : isSelected ? 1 : 0.85}
                          stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.5)'}
                          strokeWidth={isSelected ? 1.5 : 0.5} />
                  {score > 0 && !isGauge && (
                    <text x={x} y={y + 3.5} textAnchor="middle"
                          fill="rgba(0,0,0,0.85)" fontSize="7" fontWeight="700">
                      {score}
                    </text>
                  )}
                  <text x={x + 13} y={y + 4}
                        fill={isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'}
                        fontSize="7.5" fontWeight={isSelected ? '600' : '400'}>
                    {s.spot_name
                      .replace(' State Beach','')
                      .replace(' Beach','')
                      .replace(' Jetty','')
                      .replace('Ocean ','OB ')
                      .replace('Point Reyes','Pt Reyes')}
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
               style={{ background: 'rgba(13,26,42,0.98)', border: '0.5px solid rgba(255,255,255,0.12)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-base font-semibold" style={{ color: 'var(--text-bright)' }}>
                  {selected.spot_name}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                  {selected.region} · {selected.drive_minutes_estimate}min drive
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-light" style={{ color: scoreColor(selected.score || 0) }}>
                  {Math.round(selected.score) || '—'}
                </div>
                <div className="text-[10px] font-bold uppercase" style={{ color: scoreColor(selected.score || 0) }}>
                  {selected.call?.toUpperCase()}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { onSpotSelect(selected.slug); setSelected(null) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--teal)', border: '0.5px solid rgba(6,182,212,0.3)' }}>
                Full breakdown →
              </button>
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2.5 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)' }}>
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-4 pb-3 flex gap-4 flex-shrink-0">
        {[['#22c55e','Go'],['#f59e0b','Consider'],['#334155','No go']].map(([c,l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c }} />
            <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
