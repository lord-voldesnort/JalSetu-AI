import pytest
from app.services.forecast_service import forecast_service


def test_forecast_horizon_validity():
    """Verify that forecast service accepts horizons 3..7 and rejects invalid horizons."""
    fc3 = forecast_service.generate_forecast("PC-001", horizon_days=3)
    assert fc3.horizon_days == 3
    assert len(fc3.daily_projections) == 3

    fc7 = forecast_service.generate_forecast("PC-001", horizon_days=7)
    assert fc7.horizon_days == 7
    assert len(fc7.daily_projections) == 7

    with pytest.raises(ValueError):
        forecast_service.generate_forecast("PC-001", horizon_days=2)

    with pytest.raises(ValueError):
        forecast_service.generate_forecast("PC-001", horizon_days=8)


def test_forecast_uncertainty_bounds():
    """Verify that daily projections maintain p10 <= projected <= p90."""
    fc = forecast_service.generate_forecast("PC-002", horizon_days=5)
    for p in fc.daily_projections:
        assert p.confidence_p10 <= p.projected_risk_score <= p.confidence_p90
        assert 0.0 <= p.projected_risk_score <= 100.0
        assert 0.0 <= p.projected_soil_moisture <= 1.0


def test_forecast_unknown_field_raises_error():
    """Verify that querying a non-existent field raises ValueError."""
    with pytest.raises(ValueError, match="does not exist"):
        forecast_service.generate_forecast("UNKNOWN_FIELD_999", horizon_days=3)

