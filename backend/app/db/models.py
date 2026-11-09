import datetime
import uuid
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    CheckConstraint
)
from sqlalchemy.orm import relationship
from app.db.base import Base


def get_utc_now():
    return datetime.datetime.now(datetime.timezone.utc)


class FieldModel(Base):
    """Field registry polygon entity matching PC-001..PC-010."""
    __tablename__ = "fields"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    field_id = Column(String(50), unique=True, nullable=False, index=True)  # e.g. "PC-001"
    name = Column(String(100), nullable=False)
    crop = Column(String(100), nullable=False)
    stage = Column(String(100), nullable=False)
    area_acres = Column(Float, nullable=False)
    area_ha = Column(Float, nullable=False)
    geometry_geojson = Column(Text, nullable=False)  # JSON-encoded coordinates string
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    observations = relationship("ObservationModel", back_populates="field", cascade="all, delete-orphan")


class ObservationModel(Base):
    """Time-indexed multi-source field observation fixture."""
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    field_id = Column(String(50), ForeignKey("fields.field_id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    source = Column(String(100), nullable=False)
    variable = Column(String(100), nullable=False, index=True)
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    quality_flag = Column(String(20), nullable=False, default="good")  # "good" or "stale"
    age_days = Column(Integer, nullable=False, default=0)

    field = relationship("FieldModel", back_populates="observations")


class ScenarioModel(Base):
    """Deterministic climate scenario definitions."""
    __tablename__ = "scenarios"

    id = Column(String(100), primary_key=True)  # e.g. "normal_01"
    name = Column(String(200), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    scenario_type = Column(String(50), nullable=False)
    intensity = Column(String(50), nullable=False, default="moderate")
    raw_json = Column(Text, nullable=False)  # Full scenario payload for deterministic replay


class PredictionModel(Base):
    """Stress forecast and crop risk predictions per field."""
    __tablename__ = "predictions"

    prediction_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    field_id = Column(String(50), ForeignKey("fields.field_id"), nullable=False, index=True)
    as_of_date = Column(DateTime, nullable=False, index=True)
    stress_index = Column(Float, nullable=False)
    stress_probability = Column(Float, nullable=False)
    stress_status = Column(String(20), nullable=False)  # "green", "amber", "red"
    horizon_days = Column(Integer, nullable=False, default=3)
    confidence_p10 = Column(Float, nullable=False)
    confidence_p90 = Column(Float, nullable=False)
    recommended_action = Column(String(50), nullable=False)
    model_version = Column(String(50), nullable=False, default="baseline-rule-v1")
    created_at = Column(DateTime, default=get_utc_now, nullable=False)


class WaterPlanModel(Base):
    """Optimized water allocation plans under explicit budget constraints."""
    __tablename__ = "water_plans"

    plan_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    as_of_date = Column(DateTime, nullable=False)
    total_budget = Column(Float, nullable=False)
    total_allocated = Column(Float, nullable=False)
    plan_method = Column(String(50), nullable=False, default="ai")
    scenario_id = Column(String(100), nullable=False, default="normal_01")
    allocations_json = Column(Text, nullable=False)  # List of per-field allocations
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    __table_args__ = (
        CheckConstraint("total_allocated <= total_budget", name="check_budget_conservation"),
    )


class ActionLogModel(Base):
    """Audit trail for recommendations, farmer actions, and manual overrides."""
    __tablename__ = "action_logs"

    event_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    field_id = Column(String(50), ForeignKey("fields.field_id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=get_utc_now, nullable=False)
    recommended_action = Column(String(50), nullable=False)
    action_taken = Column(String(50), nullable=False)
    followed_recommendation = Column(Boolean, nullable=False)
    override_reason = Column(String(100), nullable=True)
    planned_volume_m3 = Column(Float, nullable=True)
    actual_volume_m3 = Column(Float, nullable=True)
    user_role = Column(String(50), nullable=False, default="farmer")
    notes = Column(Text, nullable=True)


class UserModel(Base):
    """Application users with role-based access control."""
    __tablename__ = "users"

    user_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # "farmer", "fpo_manager", "water_manager", "researcher", "admin"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

