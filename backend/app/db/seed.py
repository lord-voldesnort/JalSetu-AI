import json
import logging
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.models import FieldModel, ObservationModel, ScenarioModel
from app.services.data_loader import data_loader

logger = logging.getLogger(__name__)


def init_db(db: Session = None) -> None:
    """Create database tables if they do not exist."""
    Base.metadata.create_all(bind=engine)


def seed_database(db: Session) -> dict:
    """Populate database with fixtures from fields.geojson, observations.json, scenarios.json idempotently."""
    init_db(db)

    # 1. Seed Fields
    fields_data = data_loader.load_fields()
    fields_created = 0
    fields_existing = 0

    for feat in fields_data.features:
        p = feat.properties
        existing = db.query(FieldModel).filter(FieldModel.field_id == p.id).first()
        if existing:
            existing.name = p.name
            existing.crop = p.crop
            existing.stage = p.stage
            existing.area_acres = p.area_acres
            existing.area_ha = p.area_ha or round(p.area_acres * 0.404686, 3)
            existing.geometry_geojson = json.dumps(feat.geometry.coordinates)
            fields_existing += 1
        else:
            new_field = FieldModel(
                field_id=p.id,
                name=p.name,
                crop=p.crop,
                stage=p.stage,
                area_acres=p.area_acres,
                area_ha=p.area_ha or round(p.area_acres * 0.404686, 3),
                geometry_geojson=json.dumps(feat.geometry.coordinates)
            )
            db.add(new_field)
            fields_created += 1

    db.commit()

    # 2. Seed Observations (if empty for fields)
    obs_data = data_loader.load_observations()
    obs_count = db.query(ObservationModel).count()
    obs_created = 0

    if obs_count == 0:
        obs_models = [
            ObservationModel(
                field_id=o.field_id,
                timestamp=o.timestamp,
                source=o.source,
                variable=o.variable,
                value=o.value,
                unit=o.unit,
                quality_flag=o.quality_flag,
                age_days=o.age_days
            )
            for o in obs_data
        ]
        db.bulk_save_objects(obs_models)
        db.commit()
        obs_created = len(obs_models)

    # 3. Seed Scenarios
    scenarios_data = data_loader.load_scenarios()
    scenarios_created = 0

    for s in scenarios_data:
        existing_scen = db.query(ScenarioModel).filter(ScenarioModel.id == s.id).first()
        if not existing_scen:
            db.add(
                ScenarioModel(
                    id=s.id,
                    name=s.name,
                    title=s.title,
                    description=s.description,
                    scenario_type=s.scenario_type,
                    intensity=s.intensity or "moderate",
                    raw_json=s.model_dump_json()
                )
            )
            scenarios_created += 1

    db.commit()

    summary = {
        "fields_loaded": fields_created + fields_existing,
        "fields_created": fields_created,
        "observations_loaded": obs_created if obs_created > 0 else obs_count,
        "scenarios_loaded": len(scenarios_data),
        "scenarios_created": scenarios_created
    }
    return summary


if __name__ == "__main__":
    db = SessionLocal()
    try:
        res = seed_database(db)
        print(f"Database seeded successfully: {res}")
    finally:
        db.close()

