'use client'

import { useEffect, useState } from 'react'

export default function LogTab() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Pull recent sessions from all spots
    Promise.all(['/api/spots?date=' + new Date().toISOString().slice(0,10)])
      .then(() => {
        // Sessions come from per-spot detail pages for now
        // This tab shows an aggregate view once sessions exist
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="overflow-y-auto scrollbar-none h-full">
      <div className="p-4 flex flex-col gap-4">

        <div className="text-[10px] font-semibold uppercase tracking-widest px-1" style={{ color: 'var(--text-dim)' }}>
          Session log
        </div>

        {/* Baseline comparison */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(13,26,42,0.9)', border: '0.5px solid rgba(255,255,255,0.07)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-dim)' }}>
            Accuracy vs baselines
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'SwellMind', pct: '—', color: 'var(--teal)' },
              { label: 'Always OB', pct: '—', color: 'var(--text-dim)' },
              { label: 'Surfline', pct: '—', color: 'var(--text-dim)' },
            ].map(({ label, pct, color }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="text-xl font-light mb-1" style={{ color }}>{pct}</div>
                <div className="text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[11px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            Log sessions after you surf to start tracking accuracy. The question worth answering: does SwellMind beat "just go to Ocean Beach every time"?
          </div>
        </div>

        {/* Empty state */}
        <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
          <div className="text-4xl mb-4">🎙️</div>
          <div className="text-[14px] font-medium mb-2" style={{ color: 'var(--text-mid)' }}>No sessions yet</div>
          <div className="text-[12px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            After your next session, send a voice memo to the Telegram bot. The system will extract conditions, compare to the forecast, and start learning.
          </div>
        </div>

        {/* How it works */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(6,182,212,0.05)', border: '0.5px solid rgba(6,182,212,0.15)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--teal)' }}>
            How the loop works
          </div>
          {[
            ['01', 'Run the daily brief', 'Scores all 19 spots, persists the forecast'],
            ['02', 'Go surf', 'Bring your phone'],
            ['03', 'Send a voice memo', '30 seconds from the parking lot — what you found, what it was rated'],
            ['04', 'The system learns', 'Compares prediction to reality, adjusts spot profiles over time'],
          ].map(([num, title, body]) => (
            <div key={num} className="flex gap-3 mb-3 last:mb-0">
              <div className="text-[11px] font-bold flex-shrink-0 mt-0.5" style={{ color: 'var(--teal)', opacity: 0.5 }}>{num}</div>
              <div>
                <div className="text-[12px] font-medium mb-0.5" style={{ color: 'var(--text-mid)' }}>{title}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{body}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-4" />
      </div>
    </div>
  )
}
