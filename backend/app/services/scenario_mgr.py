import logging
from typing import Dict, List, Optional, Any
from copy import deepcopy

from app.services.data_loader import data_loader
from app.schemas.scenario import ScenarioDefinition
from app.schemas.observation import ObservationRecord

logger = logging.getLogger(__name__)


class ScenarioManager:
    """Manages deterministic climate scenario perturbations without modifying underlying fixtures."""

    def __init__(self):
        self._active_scenario_id: str = "normal_01"

    @property
    def active_scenario_id(self) -> str:
        return self._active_scenario_id

    @property
    def is_active_scenario_simulated(self) -> bool:
        return self._active_scenario_id != "normal_01"

    def get_scenario(self, scenario_id: str) -> ScenarioDefinition:
        """Fetch scenario definition by ID."""
        scenarios = data_loader.load_scenarios()
        for s in scenarios:
            if s.id == scenario_id:
                return s
        raise ValueError(f"Unknown scenario ID '{scenario_id}'. Available: {[s.id for s in scenarios]}")

    def set_active_scenario(self, scenario_id: str) -> ScenarioDefinition:
        """Set the active simulation scenario (e.g. rainfall_deficit_heat_01)."""
        scenario = self.get_scenario(scenario_id)
        self._active_scenario_id = scenario.id
        logger.info(f"Active scenario set to: {scenario.id} ({scenario.name})")
        return scenario

    def reset_to_baseline(self) -> ScenarioDefinition:
        """Reset the simulation back to nominal baseline (normal_01)."""
        return self.set_active_scenario("normal_01")

    def get_effective_observations(
        self,
        field_id: str,
        base_observations: List[ObservationRecord],
        scenario_id_override: Optional[str] = None
    ) -> List[ObservationRecord]:
        """
        Merge scenario perturbations on top of base observations for a field.
        Returns a cloned list with simulated overrides applied if field is affected.
        """
        target_scenario_id = scenario_id_override or self._active_scenario_id
        if target_scenario_id == "normal_01":
            return base_observations

        scenario = self.get_scenario(target_scenario_id)
        if field_id not in scenario.affected_field_ids:
            return base_observations

        # Clone observations and apply signal modifications
        cloned_obs: List[ObservationRecord] = [deepcopy(obs) for obs in base_observations]
        perturbed_vars = {sig.variable: sig for sig in scenario.changed_input_signals}

        for obs in cloned_obs:
            if obs.variable in perturbed_vars:
                sig = perturbed_vars[obs.variable]
                if sig.replayed_value is not None:
                    obs.value = sig.replayed_value
                elif sig.change_type == "delta":
                    obs.value = obs.value + sig.value
                elif sig.change_type == "multiplier":
                    obs.value = obs.value * sig.value
                else:
                    obs.value = sig.value

                # Mark as simulated
                obs.source = f"simulated_{target_scenario_id}"

        return cloned_obs


scenario_manager = ScenarioManager()

