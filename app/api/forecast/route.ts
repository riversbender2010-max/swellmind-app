import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)

  try {
    const client = await pool.connect()
    try {
      const { rows } = await client.query(`
        SELECT
          f.forecast_id, f.target_date, f.rank, f.composite_score,
          f.predicted_quality_score, f.tide_ft_at_window,
          f.swell_angle_used_deg, f.period_used_s, f.onshore_wind_kt,
          f.score_breakdown, f.wave_data_source, f.mop_station_id,
          f.regime_id, f.ens_hs_spread_ft, f.ens_tp_spread_s,
          f.ens_dp_spread_deg, f.ens_confidence, f.ens_verdict,
          f.advisory_only, f.data_warnings, f.unicorn_flag,
          f.gfs_hs_ft, f.ecmwf_hs_ft, f.optimal_window_start,
          f.optimal_window_end, f.drive_minutes, f.crowd_density_score,
          s.spot_name, s.slug, s.region, s.agent_domain,
          s.latitude, s.longitude, s.hazard_tier, s.recommendable,
          s.gauge_only, s.drive_minutes_estimate, s.bottom_contour_type,
          s.hazard_notes, s.shore_normal_deg, s.mop_coverage,
          s.n_sessions, s.effective_confidence, s.overload_height_ft,
          s.skill_ceiling_ft, s.period_min, s.period_max,
          s.swell_angle_min, s.swell_angle_max, s.tide_floor,
          s.tide_ceiling, s.min_working_height_ft, s.max_working_height_ft
        FROM fact_daily_forecasts f
        JOIN v_spot_effective_profile s ON s.spot_id = f.spot_id
        WHERE f.target_date = $1
        ORDER BY f.rank ASC
      `, [date])

      const { rows: kills } = await client.query(`
        SELECT s.slug, s.spot_name, s.region, s.latitude, s.longitude,
               s.gauge_only, s.recommendable, s.mop_coverage
        FROM v_spot_effective_profile s
        WHERE s.spot_id NOT IN (
          SELECT spot_id FROM fact_daily_forecasts WHERE target_date = $1
        )
        AND NOT s.gauge_only
        ORDER BY s.spot_name
      `, [date])

      return NextResponse.json({
        date,
        regime: rows[0]?.regime_id || null,
        forecasts: rows,
        killed: kills,
        generated_at: new Date().toISOString(),
      })
    } finally {
      client.release()
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
