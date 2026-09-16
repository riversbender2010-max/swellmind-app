import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)
  const { slug } = params

  try {
    const client = await pool.connect()
    try {
      // Spot profile
      const { rows: [spot] } = await client.query(`
        SELECT * FROM v_spot_effective_profile WHERE slug = $1
      `, [slug])

      if (!spot) {
        return NextResponse.json({ error: 'spot not found' }, { status: 404 })
      }

      // Today's forecast
      const { rows: [forecast] } = await client.query(`
        SELECT f.*, s.spot_name, s.slug
        FROM fact_daily_forecasts f
        JOIN v_spot_effective_profile s ON s.spot_id = f.spot_id
        WHERE s.slug = $1 AND f.target_date = $2
      `, [slug, date])

      // Last 20 sessions
      const { rows: sessions } = await client.query(`
        SELECT
          s.session_id, s.target_date, s.wave_quality_rating,
          s.observed_height_ft, s.tide_evaluation,
          s.crowd_factor, s.general_notes,
          s.forecast_rank_of_spot, s.ranking_was_correct,
          f.composite_score AS predicted_score,
          f.regime_id
        FROM fact_user_sessions s
        LEFT JOIN fact_daily_forecasts f ON f.forecast_id = s.associated_forecast_id
        WHERE s.spot_id = $1
        ORDER BY s.target_date DESC
        LIMIT 20
      `, [spot.spot_id])

      // Accuracy stats
      const { rows: [accuracy] } = await client.query(`
        SELECT
          COUNT(*) AS total_sessions,
          ROUND(AVG(wave_quality_rating)::numeric, 1) AS avg_quality,
          COUNT(*) FILTER (WHERE ranking_was_correct) AS correct_rankings,
          COUNT(*) FILTER (WHERE ranking_was_correct IS NOT NULL) AS ranked_sessions
        FROM fact_user_sessions
        WHERE spot_id = $1
      `, [spot.spot_id])

      return NextResponse.json({ spot, forecast, sessions, accuracy })
    } finally {
      client.release()
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
