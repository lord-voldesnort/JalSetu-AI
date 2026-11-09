import logging
from typing import Dict, List, Optional, Tuple, Any
from app.services.data_loader import data_loader
from app.services.scenario_mgr import scenario_manager
from app.schemas.assessment import (
    FieldAssessmentResponse,
    SignalContribution,
    DataFreshnessIndicator,
    ClusterAssessmentSummary
)
from app.schemas.field import FieldFeature
from app.schemas.observation import ObservationRecord

logger = logging.getLogger(__name__)


class StressAssessmentEngine:
    """Deterministic, transparent water-stress assessment engine for agriculture field cluster."""

    WEIGHT_SOIL_DRYNESS = 35.0
    WEIGHT_RAIN_DEFICIT = 25.0
    WEIGHT_HEAT_STRESS = 25.0
    WEIGHT_VEG_STRESS = 15.0

    THRESHOLD_LOW = 35.0
    THRESHOLD_MODERATE = 60.0
    THRESHOLD_HIGH = 80.0

    STALE_SATELLITE_THRESHOLD_DAYS = 12
    HEAVY_RAIN_THRESHOLD_MM = 40.0
    SATURATED_SOIL_THRESHOLD = 0.85

    def _extract_signals(self, observations: List[ObservationRecord]) -> Tuple[Dict[str, float], List[DataFreshnessIndicator], List[str]]:
        """Extract key agronomic variables and metadata from observation records."""
        signals: Dict[str, float] = {}
        freshness_table: List[DataFreshnessIndicator] = []
        warnings: List[str] = []

        # Find latest record per variable
        records_by_var: Dict[str, ObservationRecord] = {}
        for obs in observations:
            if obs.variable not in records_by_var or obs.timestamp > records_by_var[obs.variable].timestamp:
                records_by_var[obs.variable] = obs

        for var_name, obs in records_by_var.items():
            signals[var_name] = obs.value
            is_stale = obs.quality_flag == "stale" or obs.age_days > self.STALE_SATELLITE_THRESHOLD_DAYS
            freshness_table.append(
                DataFreshnessIndicator(
                    variable=var_name,
                    source=obs.source,
                    observed_at=obs.timestamp.isoformat(),
                    age_days=obs.age_days,
                    quality_flag=obs.quality_flag,
                    is_stale=is_stale
                )
            )

        return signals, freshness_table, warnings

    def assess_field(
        self,
        field: FieldFeature,
        observations: List[ObservationRecord],
        scenario_id_override: Optional[str] = None
    ) -> FieldAssessmentResponse:
        """Calculate deterministic risk score, drivers, and recommendations for a field."""
        field_id = field.properties.id
        effective_obs = scenario_manager.get_effective_observations(
            field_id=field_id,
            base_observations=observations,
            scenario_id_override=scenario_id_override
        )
        active_scenario = scenario_id_override or scenario_manager.active_scenario_id
        is_simulated = False
        if active_scenario != "normal_01":
            try:
                scen_def = scenario_manager.get_scenario(active_scenario)
                is_simulated = (field_id in scen_def.affected_field_ids)
            except Exception:
                is_simulated = True

        signals, freshness_table, warnings = self._extract_signals(effective_obs)

        # 1. Soil Dryness Component (35 pts max)
        sm = signals.get("soil_moisture_proxy", 0.45)
        dryness_factor = max(0.0, min(1.0, 1.0 - sm))
        soil_points = round(self.WEIGHT_SOIL_DRYNESS * dryness_factor, 1)

        # 2. Rainfall Deficit Component (25 pts max)
        past_rain = signals.get("rainfall_daily", 0.0)
        fc_rain = signals.get("forecast_rainfall", 0.0)
        total_rain = past_rain + fc_rain
        rain_deficit_factor = max(0.0, min(1.0, 1.0 - (total_rain / 25.0)))
        rain_points = round(self.WEIGHT_RAIN_DEFICIT * rain_deficit_factor, 1)

        # 3. Heat Stress Component (25 pts max)
        fc_tmax = signals.get("forecast_tmax", 33.0)
        heat_factor = max(0.0, min(1.0, (fc_tmax - 30.0) / 10.0))
        heat_points = round(self.WEIGHT_HEAT_STRESS * heat_factor, 1)

        # 4. Vegetation Decline Component (15 pts max)
        ndvi = signals.get("ndvi", 0.55)
        trend = signals.get("ndvi_trend_14d", 0.0)
        trend_stress = max(0.0, min(1.0, (-trend + 0.05) / 0.15))
        level_stress = max(0.0, min(1.0, (0.70 - ndvi) / 0.40))
        veg_factor = max(0.0, min(1.0, 0.6 * trend_stress + 0.4 * level_stress))
        veg_points = round(self.WEIGHT_VEG_STRESS * veg_factor, 1)

        raw_score = round(soil_points + rain_points + heat_points + veg_points, 1)
        risk_score = max(0.0, min(100.0, raw_score))
        stress_index = round(risk_score / 100.0, 3)

        # Drivers statements
        drivers = [
            SignalContribution(
                signal_name="Soil Moisture Index",
                observed_value=sm,
                unit="fraction_0_to_1",
                contribution_points=soil_points,
                direction="increases_stress" if sm < 0.40 else "decreases_stress",
                statement=f"Soil moisture index at {sm:.2f} ({'critically dry' if sm < 0.3 else 'moderate context'}) (+{soil_points} pts)"
            ),
            SignalContribution(
                signal_name="Cumulative & Forecast Rain",
                observed_value=total_rain,
                unit="mm",
                contribution_points=rain_points,
                direction="increases_stress" if total_rain < 5.0 else "decreases_stress",
                statement=f"Recent past ({past_rain:.1f} mm) & forecast rain ({fc_rain:.1f} mm) total {total_rain:.1f} mm (+{rain_points} pts)"
            ),
            SignalContribution(
                signal_name="Forecast Maximum Temperature",
                observed_value=fc_tmax,
                unit="deg_C",
                contribution_points=heat_points,
                direction="increases_stress" if fc_tmax > 34.0 else "neutral",
                statement=f"Forecast peak temperature of {fc_tmax:.1f}°C ({'severe heat shock' if fc_tmax >= 38 else 'normal range'}) (+{heat_points} pts)"
            ),
            SignalContribution(
                signal_name="Satellite NDVI Trend",
                observed_value=trend,
                unit="delta",
                contribution_points=veg_points,
                direction="increases_stress" if trend < 0 else "neutral",
                statement=f"14-day vegetation trend is {trend:+.2f} (NDVI={ndvi:.2f}) (+{veg_points} pts)"
            )
        ]

        # Classification
        if risk_score < self.THRESHOLD_LOW:
            risk_level = "Low"
            stress_status = "green"
            recommended_action = "wait"
            action_window = "monitor"
        elif risk_score < self.THRESHOLD_MODERATE:
            risk_level = "Moderate"
            stress_status = "amber"
            recommended_action = "wait"
            action_window = "monitor / watch"
        elif risk_score < self.THRESHOLD_HIGH:
            risk_level = "High"
            stress_status = "red"
            recommended_action = "irrigate_now"
            action_window = "next 24-48h"
        else:
            risk_level = "Critical"
            stress_status = "red"
            recommended_action = "irrigate_now"
            action_window = "next 24h immediate"

        # Check special rules:
        # Rule A: Heavy Rain / Saturated Soil
        if total_rain >= self.HEAVY_RAIN_THRESHOLD_MM or sm >= self.SATURATED_SOIL_THRESHOLD:
            stress_status = "blue"
            recommended_action = "protect_pause"
            action_window = "pause immediate irrigation"
            warnings.append(
                f"Heavy rain signal ({total_rain:.1f} mm) / saturated soil ({sm:.2f}). Pause irrigation to protect crops."
            )

        # Rule B: Stale Satellite Data
        has_stale_satellite = any(f.variable in ["ndvi", "ndvi_trend_14d"] and f.is_stale for f in freshness_table)
        confidence = 0.90
        if has_stale_satellite:
            confidence = 0.60
            warnings.append(
                "Satellite vegetation observation is stale (>12 days old). Low confidence — inspect field before irrigating."
            )
            if recommended_action == "irrigate_now":
                recommended_action = "inspect"
                action_window = "inspect before irrigating"

        # Recommended volume calculation (m3)
        area_acres = field.properties.area_acres
        if recommended_action == "irrigate_now":
            recommended_volume = round(area_acres * (12.0 + 8.0 * (risk_score / 100.0)), 1)
        elif recommended_action == "inspect":
            recommended_volume = round(area_acres * 8.0, 1)
        else:
            recommended_volume = 0.0

        as_of_date = effective_obs[0].timestamp.strftime("%Y-%m-%d") if effective_obs else "2026-10-08"

        return FieldAssessmentResponse(
            field_id=field_id,
            field_name=field.properties.name,
            crop=field.properties.crop,
            stage=field.properties.stage,
            area_acres=area_acres,
            area_ha=field.properties.area_ha or round(area_acres * 0.404686, 3),
            as_of_date=as_of_date,
            risk_score=risk_score,
            stress_index=stress_index,
            risk_level=risk_level,
            stress_status=stress_status,
            recommended_action=recommended_action,
            action_window=action_window,
            recommended_volume_m3=recommended_volume,
            confidence=confidence,
            is_simulated=is_simulated,
            active_scenario=active_scenario,
            drivers=drivers,
            freshness_table=freshness_table,
            warnings=warnings
        )

    def assess_cluster(self, scenario_id_override: Optional[str] = None) -> ClusterAssessmentSummary:
        """Assess all demonstration fields in the cluster."""
        fields_fc = data_loader.load_fields()
        all_obs = data_loader.load_observations()

        obs_by_field: Dict[str, List[ObservationRecord]] = {}
        for o in all_obs:
            obs_by_field.setdefault(o.field_id, []).append(o)

        results: List[FieldAssessmentResponse] = []
        for feat in fields_fc.features:
            field_obs = obs_by_field.get(feat.properties.id, [])
            assessment = self.assess_field(
                field=feat,
                observations=field_obs,
                scenario_id_override=scenario_id_override
            )
            results.append(assessment)

        counts_by_status = {"green": 0, "amber": 0, "red": 0, "blue": 0}
        counts_by_action = {"irrigate_now": 0, "wait": 0, "inspect": 0, "protect_pause": 0}
        total_vol = 0.0

        for r in results:
            counts_by_status[r.stress_status] = counts_by_status.get(r.stress_status, 0) + 1
            counts_by_action[r.recommended_action] = counts_by_action.get(r.recommended_action, 0) + 1
            total_vol += r.recommended_volume_m3

        active_scen = scenario_id_override or scenario_manager.active_scenario_id

        return ClusterAssessmentSummary(
            as_of_date=results[0].as_of_date if results else "2026-10-08",
            active_scenario=active_scen,
            is_simulated=(active_scen != "normal_01"),
            total_fields=len(results),
            counts_by_status=counts_by_status,
            counts_by_action=counts_by_action,
            total_recommended_volume_m3=round(total_vol, 1),
            fields=results
        )


stress_engine = StressAssessmentEngine()
