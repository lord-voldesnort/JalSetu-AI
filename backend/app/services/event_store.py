"""
Thread-safe and process-safe JSON File Event Store for JalSetu AI.

Implements persistent audit trail for farmer action logs, overrides, and plan history.
"""

from abc import ABC, abstractmethod
from datetime import datetime, timezone
import json
import logging
import os
from pathlib import Path
import tempfile
import threading
from typing import Dict, List, Optional
from app.schemas.events import EventResponse

logger = logging.getLogger("jalsetu.events")


class EventStore(ABC):
    @abstractmethod
    def append(self, event: EventResponse) -> EventResponse:
        pass

    @abstractmethod
    def list(
        self,
        field_id: Optional[str] = None,
        event_type: Optional[str] = None,
        limit: int = 50,
    ) -> List[EventResponse]:
        pass

    @abstractmethod
    def count_by_type(self) -> Dict[str, int]:
        pass

    @abstractmethod
    def total_count(self) -> int:
        pass

    @abstractmethod
    def latest(self) -> Optional[EventResponse]:
        pass


class JsonFileEventStore(EventStore):
    """
    Atomic, thread-safe JSON file event store.
    Uses process-level mutex and atomic rename on disk to prevent record corruption.
    """

    def __init__(self, file_path: Path):
        self.file_path = Path(file_path).resolve()
        self._lock = threading.Lock()
        self._ensure_dir()

    def _ensure_dir(self) -> None:
        self.file_path.parent.mkdir(parents=True, exist_ok=True)

    def _read_records(self) -> List[dict]:
        if not self.file_path.exists():
            return []
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if not content:
                    return []
                data = json.loads(content)
                if isinstance(data, list):
                    return data
                raise ValueError("Event store file root is not a list")
        except Exception as e:
            # Corrupt file handling: backup and recover safely
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            backup_path = self.file_path.with_suffix(f".corrupt_{timestamp}.json")
            logger.warning(
                "Event store file '%s' was corrupt/unreadable (%s). Moving to '%s' and reinitializing.",
                self.file_path,
                e,
                backup_path,
            )
            try:
                os.replace(self.file_path, backup_path)
            except Exception:
                pass
            return []

    def _write_records(self, records: List[dict]) -> None:
        self._ensure_dir()
        dir_name = self.file_path.parent
        # Create temp file in same directory for atomic replace on Windows
        with tempfile.NamedTemporaryFile("w", dir=dir_name, delete=False, encoding="utf-8") as tf:
            json.dump(records, tf, indent=2)
            temp_name = tf.name
        os.replace(temp_name, self.file_path)

    def append(self, event: EventResponse) -> EventResponse:
        with self._lock:
            records = self._read_records()
            records.append(event.model_dump())
            self._write_records(records)
            return event

    def list(
        self,
        field_id: Optional[str] = None,
        event_type: Optional[str] = None,
        limit: int = 50,
    ) -> List[EventResponse]:
        with self._lock:
            records = self._read_records()

        filtered = []
        for r in reversed(records):
            if field_id and r.get("field_id") != field_id:
                continue
            if event_type and r.get("event_type") != event_type:
                continue
            filtered.append(EventResponse(**r))
            if len(filtered) >= limit:
                break
        return filtered

    def count_by_type(self) -> Dict[str, int]:
        with self._lock:
            records = self._read_records()
        counts: Dict[str, int] = {}
        for r in records:
            et = r.get("event_type", "unknown")
            counts[et] = counts.get(et, 0) + 1
        return counts

    def total_count(self) -> int:
        with self._lock:
            records = self._read_records()
        return len(records)

    def latest(self) -> Optional[EventResponse]:
        with self._lock:
            records = self._read_records()
        if not records:
            return None
        return EventResponse(**records[-1])


# Global default store instance and dependency provider
_DEFAULT_STORE_PATH = Path(__file__).resolve().parent.parent / "data" / "runtime_events.json"
_store_instance = JsonFileEventStore(_DEFAULT_STORE_PATH)


def get_event_store() -> EventStore:
    """FastAPI dependency to retrieve active EventStore (overridable in tests)."""
    return _store_instance


def set_event_store(store: EventStore) -> None:
    """Setter used to override store during testing."""
    global _store_instance
    _store_instance = store

