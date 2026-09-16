'use client'

import { useEffect, useState } from 'react'

function TideCurve({ sessions }: { sessions: any[] }) {
  if (!sessions.length) return null
  const heights = sessions.map(s => s.observed_height_ft || 0).filter(Boolean)
  if (!heights.length) return null
  const max = Math.max(...heights), min = Math.min(...heights, 0)
  const W = 300, H = 60
  const pts = heights.map((h, i) => {
    const x = (i / (heights.length - 1)) * W
    const y = H - ((h - min) / (max - min + 0.1)) * H
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <div className="px-3 pt-3 pb-1">
        <div className="text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>Session heights (logged)</div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <polyline points={pts} fill="none" stroke="var(--teal)" strokeWidth="1.5" />
        {heights.map((h, i) => {
          const x = (i / (heights.length - 1)) * W
          const y = H - ((h - min) / (max - min + 0.1)) * H
          return <circle key={i} cx={x} cy={y} r="3" fill="var(--teal)" />
        })}
      </svg>
    </div>
  )
}

function AccuracyRing({ correct, total }: { correct: number; total: number }) {
  if (!total) return null
  const pct = Math.round((correct / total) * 100)
  const r = 28, circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--teal)" strokeWidth="5"
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                transform="rotate(-90 36 36)" />
        <text x="36" y="40" textAnchor="middle" fill="var(--text-bright)" fontSize="16" fontWeight="300">
          {pct}%
        </text>
      </svg>
      <div>
        <div className="text-[13px] font-medium" style={{ color: 'var(--text-bright)' }}>Ranking accuracy</div>
        <div className="text-[11px] mt-1" style={{ color: 'var(--text-dim)' }}>
          {correct} correct of {total} ranked sessions
        </div>
      </div>
    </div>
  )
}

export default function SpotTab({
  date, slug, onBack
}: { date: string; slug: string | null; onBack: () => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setData(null)
    fetch(`/api/spot/${slug}?date=${date}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug, date])

  if (!slug) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="text-5xl">📍</div>
      <div className="text-sm" style={{ color: 'var(--text-dim)' }}>Tap a spot on the Ranked or Map tab</div>
    </div>
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm" style={{ color: 'var(--text-dim)' }}>Loading…</div>
    </div>
  )

  if (!data) return null

  const { spot, forecast, sessions, accuracy } = data
  const breakdown = forecast?.score_breakdown || {}

  return (
    <div className="overflow-y-auto scrollbar-none h-full">
      <div className="p-4 flex flex-col gap-3">

        {/* Back + header */}
        <div>
          <button onClick={onBack} className="text-[11px] font-medium mb-3 transition-all"
                  style={{ color: 'var(--teal)' }}>
            ← Back to ranked
          </button>
          <div className="text-2xl font-semibold" style={{ color: 'var(--text-bright)' }}>{spot.spot_name}</div>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{spot.region}</span>
            <span style={{ color: 'var(--text-dim)' }}>·</span>
            <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{spot.bottom_contour_type?.replace('_',' ')}</span>
            <span style={{ color: 'var(--text-dim)' }}>·</span>
            <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{spot.drive_minutes_estimate}min</span>
            {spot.hazard_tier === 3 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '0.5px solid rgba(239,68,68,0.2)' }}>
                Tier 3
              </span>
            )}
          </div>
        </div>

        {/* Today's forecast */}
        {forecast ? (
          <>
            <div className="rounded-2xl p-4"
                 style={{ background: 'rgba(13,26,42,0.9)', border: '0.5px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>
                  Today · {date}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-light" style={{ color: 'var(--text-bright)' }}>
                    {Math.round(forecast.composite_score)}
                  </div>
                  <div className="text-[10px] font-bold uppercase"
                       style={{ color: forecast.composite_score >= 80 ? 'var(--go)' : forecast.composite_score >= 60 ? 'var(--amber)' : 'var(--text-dim)' }}>
                    {forecast.composite_score >= 80 ? 'GO' : forecast.composite_score >= 60 ? 'CONSIDER' : 'MARGINAL'}
                  </div>
                </div>
              </div>

              {/* Score breakdown bars */}
              <div className="flex flex-col gap-2.5 mb-4">
                {Object.entries(breakdown)
                  .filter(([k]) => ['swell_angle','period','size','tide','wind'].includes(k))
                  .map(([k, v]: any) => (
                    <div key={k} className="flex items-center gap-3">
                      <div className="text-[10px] uppercase tracking-wide text-right flex-shrink-0"
                           style={{ color: 'var(--text-dim)', width: 42 }}>
                        {k === 'swell_angle' ? 'Angle' : k.charAt(0).toUpperCase() + k.slice(1)}
                      </div>
                      <div className="flex-1 h-[4px] rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full transition-all"
                             style={{
                               width: `${Math.min(v, 100)}%`,
                               background: v >= 80 ? 'var(--go)' : v >= 50 ? 'var(--amber)' : 'var(--red)'
                             }} />
                      </div>
                      <div className="text-[11px] font-medium flex-shrink-0"
                           style={{ color: v >= 80 ? 'var(--go)' : v >= 50 ? 'var(--amber)' : 'var(--red)', width: 24, textAlign: 'right' }}>
                        {Math.round(v)}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Ensemble */}
              {(forecast.gfs_hs_ft || forecast.ecmwf_hs_ft) && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex justify-between mb-2">
                    <span className="text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>Model ensemble spread</span>
                    <span className="text-[9px] font-semibold" style={{
                      color: forecast.ens_verdict === 'strong' ? 'var(--go)' : forecast.ens_verdict === 'divergent' ? 'var(--red)' : 'var(--amber)'
                    }}>{forecast.ens_verdict} · {forecast.ens_confidence ? `${(forecast.ens_confidence*100).toFixed(0)}% conf` : ''}</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 text-center p-2 rounded-lg" style={{ background: 'rgba(6,182,212,0.08)' }}>
                      <div className="text-[9px] mb-1" style={{ color: 'var(--teal)' }}>GFS</div>
                      <div className="text-base font-light" style={{ color: 'var(--text-bright)' }}>
                        {forecast.gfs_hs_ft?.toFixed(1)}ft
                      </div>
                    </div>
                    <div className="flex-1 text-center p-2 rounded-lg" style={{ background: 'rgba(167,139,250,0.08)' }}>
                      <div className="text-[9px] mb-1" style={{ color: '#a78bfa' }}>ECMWF</div>
                      <div className="text-base font-light" style={{ color: 'var(--text-bright)' }}>
                        {forecast.ecmwf_hs_ft?.toFixed(1)}ft
                      </div>
                    </div>
                    <div className="flex-1 text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="text-[9px] mb-1" style={{ color: 'var(--text-dim)' }}>Spread</div>
                      <div className="text-base font-light" style={{ color: 'var(--text-bright)' }}>
                        {forecast.ens_hs_spread_ft?.toFixed(1)}ft
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile info */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Swell window', val: `${spot.swell_angle_min}–${spot.swell_angle_max}°` },
                { label: 'Period range', val: `${spot.period_min}–${spot.period_max}s` },
                { label: 'Tide window', val: `${spot.tide_floor}–${spot.tide_ceiling}ft` },
                { label: 'MOP coverage', val: spot.mop_coverage },
                { label: 'Logged sessions', val: spot.n_sessions },
                { label: 'Profile confidence', val: `${Math.round((spot.effective_confidence || 0) * 100)}%` },
              ].map(({ label, val }) => (
                <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="text-[9px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-dim)' }}>{label}</div>
                  <div className="text-[13px] font-medium" style={{ color: 'var(--text-bright)' }}>{val}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(13,26,42,0.9)', border: '0.5px solid rgba(255,255,255,0.07)' }}>
            <div className="text-sm mb-1" style={{ color: 'var(--text-dim)' }}>No forecast for this date</div>
            <div className="text-[11px]" style={{ color: 'var(--text-dim)', opacity: 0.6 }}>Run the daily brief script to generate one</div>
          </div>
        )}

        {/* Hazard notes */}
        {spot.hazard_notes && (
          <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.05)', border: '0.5px solid rgba(239,68,68,0.15)' }}>
            <div className="text-[9px] uppercase tracking-wide mb-1.5" style={{ color: 'var(--red)' }}>Hazard notes</div>
            <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              {spot.hazard_notes.slice(0, 200)}{spot.hazard_notes.length > 200 ? '…' : ''}
            </div>
          </div>
        )}

        {/* Accuracy */}
        {accuracy && parseInt(accuracy.total_sessions) > 0 && (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-widest px-1" style={{ color: 'var(--text-dim)' }}>
              Your history at this spot
            </div>
            <AccuracyRing
              correct={parseInt(accuracy.correct_rankings) || 0}
              total={parseInt(accuracy.ranked_sessions) || 0}
            />
          </>
        )}

        {/* Session log */}
        {sessions.length > 0 && (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-widest px-1" style={{ color: 'var(--text-dim)' }}>
              {sessions.length} logged sessions
            </div>
            <TideCurve sessions={sessions} />
            {sessions.map((s: any) => (
              <div key={s.session_id} className="rounded-xl px-4 py-3"
                   style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium" style={{ color: 'var(--text-mid)' }}>
                    {new Date(s.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-2">
                    {s.predicted_score && (
                      <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                        pred {Math.round(s.predicted_score)}
                      </span>
                    )}
                    <span className="text-[13px] font-medium" style={{
                      color: s.wave_quality_rating >= 7 ? 'var(--go)' : s.wave_quality_rating >= 5 ? 'var(--amber)' : 'var(--text-dim)'
                    }}>
                      {s.wave_quality_rating}/10
                    </span>
                  </div>
                </div>
                {s.general_notes && (
                  <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                    {s.general_notes.slice(0, 100)}{s.general_notes.length > 100 ? '…' : ''}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {sessions.length === 0 && (
          <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
              No sessions logged yet. Voice memo after your next session to start the loop.
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
