'use client'

import { useEffect, useState } from 'react'

const REGIME_NAMES: Record<string, string> = {
  R1: 'Small NW groundswell', R2: 'Moderate NW groundswell',
  R3: 'Large NW groundswell',  R4: 'Extra-large NW — advisory only',
  R5: 'NW wind blown out',     R6: 'South wind, pre-frontal',
  R7: 'Small SW groundswell',  R8: 'Moderate SW groundswell',
  R9: 'Short-period windswell', R10: 'Post-storm runoff',
}

const REGIME_ADVICE: Record<string, string> = {
  R1: 'Classic fall morning. OB is on. Check the bars before committing to a spot.',
  R2: 'Worth planning around. Paddle out shifts north above 6ft.',
  R3: 'Solid. Fort Point and Princeton are the calls. OB North for the committed.',
  R4: 'Above the ceiling. Advisory only — your call, not the system\'s.',
  R5: 'NW wind rules out exposed breaks. Princeton is the shelter call.',
  R6: 'South wind turns Linda Mar offshore. Everything else suffers.',
  R7: 'South swell. OB won\'t see it. Rodeo and Bolinas are the play.',
  R8: 'South swell with size. Bolinas and the San Mateo coast.',
  R9: 'Short-period junk. Rodeo may have a buried south pulse — check the MOP.',
  R10: 'Recent rain. Lagoon and creek mouths penalised for 72 hours.',
}

function callColor(score: number) {
  if (score >= 80) return 'var(--go)'
  if (score >= 60) return 'var(--amber)'
  return 'var(--text-dim)'
}

function callLabel(score: number, advisory: boolean) {
  if (advisory) return 'ADVISORY'
  if (score >= 80) return 'GO'
  if (score >= 60) return 'CONSIDER'
  return 'MARGINAL'
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] uppercase tracking-wide text-right flex-shrink-0"
            style={{ color: 'var(--text-dim)', width: 34 }}>{label}</span>
      <div className="flex-1 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full score-bar-fill" style={{ width: `${Math.min(value,100)}%`, background: color }} />
      </div>
      <span className="text-[9px] flex-shrink-0" style={{ color: 'var(--text-dim)', width: 20, textAlign: 'right' }}>
        {Math.round(value)}
      </span>
    </div>
  )
}

function EnsembleBar({ gfs, ecmwf, verdict, confidence }: any) {
  if (!gfs && !ecmwf) return null
  const max = Math.max(gfs || 0, ecmwf || 0, 1)
  const vColor = verdict === 'strong' ? 'var(--go)' : verdict === 'divergent' ? 'var(--red)' : 'var(--amber)'
  return (
    <div className="rounded-xl p-3 mb-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>MOP ensemble</span>
        <span className="text-[9px] font-semibold" style={{ color: vColor }}>
          {verdict || 'single member'} · {confidence ? `${(confidence*100).toFixed(0)}%` : '—'}
        </span>
      </div>
      <div className="h-[5px] rounded-full relative mb-1" style={{ background: 'rgba(255,255,255,0.08)' }}>
        {gfs && <div className="absolute h-full rounded-full" style={{ left:0, width:`${(gfs/max)*100}%`, background:'var(--teal)', opacity:0.9 }} />}
        {ecmwf && <div className="absolute h-full rounded-full" style={{ left:`${gfs?(gfs/max)*4:0}%`, width:`${(ecmwf/max)*100}%`, background:'#a78bfa', opacity:0.6 }} />}
      </div>
      <div className="flex justify-between">
        <span className="text-[9px]" style={{ color: 'var(--text-dim)' }}>GFS {gfs?.toFixed(1)}ft</span>
        <span className="text-[9px]" style={{ color: 'var(--text-dim)' }}>ECMWF {ecmwf?.toFixed(1)}ft</span>
      </div>
    </div>
  )
}

function Tag({ children, variant }: { children: React.ReactNode; variant: 'teal' | 'green' | 'amber' | 'red' }) {
  const styles = {
    teal:  { color: 'var(--teal)',  bg: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.25)' },
    green: { color: 'var(--go)',    bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)' },
    amber: { color: 'var(--amber)', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
    red:   { color: 'var(--red)',   bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)' },
  }[variant]
  return (
    <span className="text-[10px] font-medium px-2 py-[3px] rounded-full border"
          style={{ color: styles.color, background: styles.bg, borderColor: styles.border }}>
      {children}
    </span>
  )
}

function SpotCard({ f, onClick }: { f: any; onClick: () => void }) {
  const score = Math.round(parseFloat(f.composite_score) || 0)
  const breakdown = f.score_breakdown || {}
  const color = callColor(score)
  const accentClass = score >= 80 ? 'card-go' : score >= 60 ? 'card-amber' : 'card-dim'
  const warnings: string[] = f.data_warnings || []

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.99] ${accentClass}`}
      style={{ background: 'rgba(13,26,42,0.9)', border: '0.5px solid rgba(255,255,255,0.07)' }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[16px] font-semibold" style={{ color: 'var(--text-bright)' }}>
              {f.spot_name}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{f.region}</span>
              <span style={{ color: 'var(--text-dim)' }}>·</span>
              <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{f.bottom_contour_type?.replace('_',' ')}</span>
              <span style={{ color: 'var(--text-dim)' }}>·</span>
              <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{f.drive_minutes_estimate}min</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[28px] font-light leading-none" style={{ color: 'var(--text-bright)' }}>{score}</div>
            <div className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color }}>
              {callLabel(score, f.advisory_only)}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Score',  val: `${score}/100` },
            { label: 'Period', val: f.period_used_s ? `${parseFloat(f.period_used_s).toFixed(1)}s` : '—' },
            { label: 'Tide',   val: f.tide_ft_at_window != null ? `${parseFloat(f.tide_ft_at_window).toFixed(1)}ft` : '—' },
            { label: 'Wind',   val: f.onshore_wind_kt != null ? `${parseFloat(f.onshore_wind_kt).toFixed(1)}kt` : '—' },
          ].map(s => (
            <div key={s.label} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="text-[9px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-dim)' }}>{s.label}</div>
              <div className="text-[13px] font-medium" style={{ color: 'var(--text-bright)' }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Score bars */}
        {Object.keys(breakdown).length > 0 && (
          <div className="flex flex-col gap-1.5 mb-3">
            {['swell_angle','period','size','tide','wind'].map(k => (
              breakdown[k] !== undefined && (
                <ScoreBar
                  key={k}
                  label={k === 'swell_angle' ? 'Angle' : k.charAt(0).toUpperCase() + k.slice(1)}
                  value={breakdown[k]}
                  color={breakdown[k] >= 80 ? 'var(--go)' : breakdown[k] >= 50 ? 'var(--amber)' : 'var(--red)'}
                />
              )
            ))}
          </div>
        )}

        {/* Ensemble */}
        <EnsembleBar
          gfs={f.gfs_hs_ft} ecmwf={f.ecmwf_hs_ft}
          verdict={f.ens_verdict} confidence={f.ens_confidence}
        />

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {f.wave_data_source === 'mop_ensemble' && <Tag variant="teal">MOP ensemble</Tag>}
          {f.wave_data_source === 'buoy_propagation' && <Tag variant="amber">Buoy propagation</Tag>}
          {f.optimal_window_start && (
            <Tag variant="green">
              {new Date(f.optimal_window_start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}–
              {new Date(f.optimal_window_end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </Tag>
          )}
          {f.ens_confidence && f.ens_confidence < 0.4 && <Tag variant="amber">Low model confidence</Tag>}
          {f.hazard_tier === 3 && <Tag variant="red">Tier 3 — your call</Tag>}
          {f.n_sessions < 5 && <Tag variant="amber">Seeded profile · {f.n_sessions} sessions</Tag>}
          {warnings.length > 0 && <Tag variant="red">{warnings.length} warning{warnings.length > 1 ? 's' : ''}</Tag>}
        </div>
      </div>
    </button>
  )
}

export default function RankedTab({ date, onSpotSelect }: { date: string; onSpotSelect: (slug: string) => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    // Try /api/forecast first, fall back to /api/spots
    fetch(`/api/forecast?date=${date}`)
      .then(r => r.json())
      .then(d => {
        // Handle both response shapes
        if (d.forecasts) {
          setData(d)
        } else if (d.spots) {
          // /api/forecast is returning spots format — normalize it
          const ranked = d.spots
            .filter((s: any) => s.call !== 'gauge' && s.call !== 'killed' && s.score > 0)
            .sort((a: any, b: any) => b.score - a.score)
          const killed = d.spots.filter((s: any) => s.call === 'killed')
          setData({ date: d.date, regime: ranked[0]?.regime_id || null, forecasts: ranked, killed })
        }
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [date])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-4xl font-light mb-2" style={{ color: 'var(--teal)' }}>⟳</div>
        <div className="text-sm" style={{ color: 'var(--text-dim)' }}>Fetching conditions…</div>
      </div>
    </div>
  )

  if (error) return (
    <div className="p-6 text-center" style={{ color: 'var(--red)' }}>
      Failed to load — {error}
    </div>
  )

  if (!data) return null

  const regime = data.regime
  const forecasts = data.forecasts || []
  const killed = data.killed || []

  return (
    <div className="overflow-y-auto scrollbar-none h-full">
      <div className="p-4 flex flex-col gap-3">

        {/* Regime headline */}
        {regime && (
          <div className="rounded-2xl p-4"
               style={{ background: 'rgba(6,182,212,0.06)', border: '0.5px solid rgba(6,182,212,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--teal)' }}>
                {regime}
              </span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-mid)' }}>
                {REGIME_NAMES[regime]}
              </span>
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              {REGIME_ADVICE[regime]}
            </p>
          </div>
        )}

        {/* No data state */}
        {forecasts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🌊</div>
            <div className="text-base font-medium mb-2" style={{ color: 'var(--text-mid)' }}>No forecast yet</div>
            <div className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Run <code className="font-mono text-xs">python3 scripts/daily_brief.py</code> to generate one
            </div>
          </div>
        )}

        {/* Ranked spots */}
        {forecasts.length > 0 && (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-widest px-1" style={{ color: 'var(--text-dim)' }}>
              {forecasts.length} spots ranked
            </div>
            {forecasts.map((f: any) => (
              <SpotCard key={f.forecast_id} f={f} onClick={() => onSpotSelect(f.slug)} />
            ))}
          </>
        )}

        {/* Killed spots — only show if they have a real reason */}
        {killed.filter((s: any) => !s.gauge_only).length > 0 && (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-widest px-1 mt-2" style={{ color: 'var(--text-dim)' }}>
              Not viable today
            </div>
            {killed.filter((s: any) => !s.gauge_only).map((s: any) => (
              <button
                key={s.slug}
                onClick={() => onSpotSelect(s.slug)}
                className="w-full text-left rounded-xl px-4 py-3 flex items-center justify-between transition-all active:scale-[0.99]"
                style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', opacity: 0.6 }}
              >
                <div>
                  <div className="text-[13px] font-medium" style={{ color: 'var(--text-dim)' }}>{s.spot_name}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)', opacity: 0.7 }}>{s.region}</div>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full"
                      style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '0.5px solid rgba(239,68,68,0.2)' }}>
                  Killed
                </span>
              </button>
            ))}
          </>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
