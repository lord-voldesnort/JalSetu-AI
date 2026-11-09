import os
import sys
from pathlib import Path

# Add backend directory to sys.path so app imports resolve
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.db.session import SessionLocal
from app.db.seed import seed_database

if __name__ == "__main__":
    print("=== JalSetu AI: Seeding Database ===")
    db = SessionLocal()
    try:
        results = seed_database(db)
        print(f"✔ Fields: {results['fields_loaded']} loaded (new: {results['fields_created']})")
        print(f"✔ Observations: {results['observations_loaded']} loaded")
        print(f"✔ Scenarios: {results['scenarios_loaded']} loaded (new: {results['scenarios_created']})")
        print("=== Database Seeding Complete ===")
    finally:
        db.close()

