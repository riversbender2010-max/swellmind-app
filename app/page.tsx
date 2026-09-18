'use client'

import { useState, useEffect } from 'react'
import RankedTab from '@/components/RankedTab'
import MapTab from '@/components/MapTab'
import SpotTab from '@/components/SpotTab'
import LogTab from '@/components/LogTab'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function nextNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

const TABS = [
  { id: 'ranked', label: 'Ranked',  icon: '≡' },
  { id: 'map',    label: 'Map',     icon: '◎' },
  { id: 'spot',   label: 'Spot',    icon: '∿' },
  { id: 'log',    label: 'Log',     icon: '◷' },
]

export default function Home() {
  const [tab, setTab]           = useState('ranked')
  const [date, setDate]         = useState('')
  const [days, setDays]         = useState<string[]>([])
  const [time, setTime]         = useState('')
  const [spotSlug, setSpotSlug] = useState<string | null>(null)
  const [mounted, setMounted]   = useState(false)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    setDate(today)
    setDays(Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i)
      return d.toISOString().slice(0, 10)
    }))
    setTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
    setMounted(true)
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  const handleSpotSelect = (slug: string) => {
    setSpotSlug(slug)
    setTab('spot')
  }

  if (!mounted) return (
    <div className="flex items-center justify-center min-h-screen">
      <div style={{ color: 'var(--teal)', fontSize: 28 }}>〜</div>
    </div>
  )

  const todayStr = days[0] || ''

  return (
    <div className="flex flex-col min-h-screen pb-[76px]">

      {/* Status bar */}
      <div className="flex items-center justify-between px-6 h-11 text-xs font-medium"
           style={{ color: 'var(--text-dim)' }}>
        <span>{time}</span>
        <span style={{ color: 'var(--teal)', fontWeight: 600 }}>SwellMind</span>
        <span>Marin, CA</span>
      </div>

      {/* Day strip — shared across all tabs */}
      <div className="px-4 pb-3 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {days.map((d) => (
            <button
              key={d}
              onClick={() => setDate(d)}
              className="flex-shrink-0 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all"
              style={{
                minWidth: 52, height: 60,
                background: date === d ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.04)',
                border: `0.5px solid ${date === d ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: date === d ? 'var(--teal)' : 'var(--text-dim)' }}>
                {d === todayStr ? 'Today' : new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <DayScore date={d} active={date === d} />
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {date && tab === 'ranked' && <RankedTab date={date} onSpotSelect={handleSpotSelect} />}
        {date && tab === 'map'    && <MapTab    date={date} onSpotSelect={handleSpotSelect} />}
        {date && tab === 'spot'   && <SpotTab   date={date} slug={spotSlug} onBack={() => setTab('ranked')} />}
        {tab === 'log'    && <LogTab />}
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all"
            style={{ background: tab === t.id ? 'rgba(255,255,255,0.06)' : 'transparent' }}
          >
            <span className="text-xl" style={{ color: tab === t.id ? 'var(--teal)' : 'var(--text-dim)' }}>
              {t.icon}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: tab === t.id ? 'var(--teal)' : 'var(--text-dim)' }}>
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function DayScore({ date, active }: { date: string; active: boolean }) {
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/forecast?date=${date}`)
      .then(r => r.json())
      .then(d => {
        const top = d.forecasts?.[0]?.composite_score
        setScore(top ? Math.round(top) : null)
      })
      .catch(() => setScore(null))
  }, [date])

  const color = score === null ? 'var(--text-dim)'
    : score >= 80 ? 'var(--go)'
    : score >= 60 ? 'var(--amber)'
    : 'var(--text-dim)'

  return (
    <span className="text-lg font-light" style={{ color }}>
      {score ?? '—'}
    </span>
  )
}
