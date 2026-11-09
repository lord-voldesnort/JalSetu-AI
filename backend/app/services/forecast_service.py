import datetime
import logging
from typing import List, Optional

from app.services.data_loader import data_loader
from app.services.stress_engine import stress_engine
from app.schemas.forecast import FieldForecastResponse, DailyForecastPoint

logger = logging.getLogger(__name__)


class ForecastService:
    """Service producing transparent deterministic 3-7 day daily projections."""

    def generate_forecast(
        self,
        field_id: str,
        horizon_days: int = 3,
        scenario_id_override: Optional[str] = None
    ) -> FieldForecastResponse:
        if horizon_days < 3 or horizon_days > 7:
            raise ValueError("Forecast horizon must be between 3 and 7 days.")

        # Find field
        fields_fc = data_loader.load_fields()
        target_feat = next((f for f in fields_fc.features if f.properties.id == field_id), None)
        if not target_feat:
            raise ValueError(f"Field '{field_id}' does not exist.")

        all_obs = data_loader.load_observations()
        field_obs = [o for o in all_obs if o.field_id == field_id]

        assessment = stress_engine.assess_field(
            field=target_feat,
            observations=field_obs,
            scenario_id_override=scenario_id_override
        )

        base_date = datetime.date.fromisoformat(assessment.as_of_date)
        signals = {d.signal_name: d.observed_value for d in assessment.drivers}
        tmax = signals.get("Forecast Maximum Temperature", 34.0)
        fc_rain = signals.get("Cumulative & Forecast Rain", 0.0)
        base_sm = signals.get("Soil Moisture Index", 0.45)

        points: List[DailyForecastPoint] = []
        for offset in range(1, horizon_days + 1):
            cur_date = base_date + datetime.timedelta(days=offset)

            # Daily depletion rate based on heat and rain relief
            evap_depletion = 0.025 + max(0.0, (tmax - 32.0) * 0.005)
            projected_sm = max(0.10, min(1.0, base_sm - (offset * evap_depletion) + (fc_rain / (offset * 30.0 + 1.0))))

            # Projected risk score
            score_delta = (offset * 3.5) if fc_rain < 5.0 else (-offset * 2.0)
            proj_score = max(0.0, min(100.0, round(assessment.risk_score + score_delta, 1)))
            proj_index = round(proj_score / 100.0, 3)

            # Status
            if assessment.recommended_action == "protect_pause":
                proj_status = "blue"
            elif proj_score < 35.0:
                proj_status = "green"
            elif proj_score < 60.0:
                proj_status = "amber"
            else:
                proj_status = "red"

            # Uncertainty spread expands with horizon
            uncertainty = 5.0 + offset * 1.5
            p10 = max(0.0, round(proj_score - uncertainty, 1))
            p90 = min(100.0, round(proj_score + uncertainty, 1))

            points.append(
                DailyForecastPoint(
                    day_offset=offset,
                    date=cur_date.isoformat(),
                    projected_risk_score=proj_score,
                    projected_stress_index=proj_index,
                    projected_status=proj_status,
                    projected_soil_moisture=round(projected_sm, 3),
                    forecast_tmax=tmax,
                    forecast_rainfall=round(fc_rain / offset, 1),
                    confidence_p10=p10,
                    confidence_p90=p90
                )
            )

        freshness_warning = None
        if any(f.is_stale for f in assessment.freshness_table):
            freshness_warning = "Input observations contain stale satellite data (>12 days old); projection uncertainty is elevated."

        influencing_inputs = [
            f"Forecast Peak Temperature: {tmax:.1f}°C",
            f"Forecast Rainfall: {fc_rain:.1f} mm",
            f"Current Soil Moisture Index: {base_sm:.2f}",
            f"Crop Growth Stage: {target_feat.properties.stage}"
        ]

        return FieldForecastResponse(
            field_id=field_id,
            field_name=target_feat.properties.name,
            horizon_days=horizon_days,
            as_of_date=assessment.as_of_date,
            daily_projections=points,
            influencing_inputs=influencing_inputs,
            data_freshness_warning=freshness_warning
        )


forecast_service = ForecastService()

