import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)

  try {
    const client = await pool.connect()
    try {
      const { rows } = await client.query(`
        SELECT
          s.spot_id, s.slug, s.spot_name, s.region,
          s.latitude, s.longitude,
          s.gauge_only, s.hazard_tier,
          s.bottom_contour_type, s.drive_minutes_estimate,
          COALESCE(f.composite_score, 0) AS score,
          COALESCE(f.rank, 99) AS rank,
          f.regime_id,
          f.wave_data_source,
          f.ens_confidence,
          f.ens_verdict,
          CASE
            WHEN s.gauge_only THEN 'gauge'
            WHEN f.forecast_id IS NULL THEN 'killed'
            WHEN f.composite_score >= 80 THEN 'go'
            WHEN f.composite_score >= 60 THEN 'consider'
            ELSE 'marginal'
          END AS call
        FROM v_spot_effective_profile s
        LEFT JOIN fact_daily_forecasts f
          ON f.spot_id = s.spot_id AND f.target_date = $1
        ORDER BY s.region, s.spot_name
      `, [date])

      return NextResponse.json({ date, spots: rows })
    } finally {
      client.release()
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
