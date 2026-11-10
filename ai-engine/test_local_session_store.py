import tempfile
import unittest
from pathlib import Path
from uuid import uuid4

from local_session_store import (
    LocalSessionStore,
    LocalSessionStoreError,
)


class LocalSessionStoreTests(unittest.TestCase):

    def setUp(self):
        self.temp_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_directory.cleanup)

        self.database_path = (
            Path(self.temp_directory.name) / "movexa_test.db"
        )

        self.store = LocalSessionStore(self.database_path)

        self.patient_id = str(uuid4())
        self.prescription_id = str(uuid4())
        self.backend_session_id = str(uuid4())

        self.session_id = self.store.create_session(
            patient_id=self.patient_id,
            prescription_id=self.prescription_id,
        )

        self.repetition = {
            "rep_number": 1,
            "assessment_status": "ASSESSED",
            "min_knee_angle": 100.0,
            "max_knee_angle": 165.0,
            "rom_degrees": 65.0,
            "duration_seconds": 1.4,
            "sample_count": 8,
        }

    def finish_session(self):
        self.store.finish_session(
            self.session_id,
            "COMPLETED",
            {
                "total_reps": 1,
                "duration_seconds": 10.0,
            },
        )

    def test_creates_local_session(self):
        session = self.store.get_session(self.session_id)

        self.assertIsNotNone(session)
        self.assertEqual(session["client_session_id"], self.session_id)
        self.assertEqual(session["patient_id"], self.patient_id)
        self.assertEqual(session["prescription_id"], self.prescription_id)
        self.assertEqual(session["status"], "IN_PROGRESS")
        self.assertEqual(session["sync_status"], "PENDING")

    def test_saves_repetition(self):
        self.store.save_repetition(
            self.session_id,
            self.repetition,
        )

        session = self.store.get_session(self.session_id)

        self.assertEqual(
            session["repetitions_data"],
            [self.repetition],
        )

    def test_rejects_duplicate_repetition_number(self):
        self.store.save_repetition(
            self.session_id,
            self.repetition,
        )

        with self.assertRaises(LocalSessionStoreError):
            self.store.save_repetition(
                self.session_id,
                self.repetition,
            )

    def test_rejects_repetition_for_unknown_session(self):
        with self.assertRaises(LocalSessionStoreError):
            self.store.save_repetition(
                str(uuid4()),
                self.repetition,
            )

    def test_rejects_invalid_repetition_number(self):
        invalid = dict(self.repetition)
        invalid["rep_number"] = 0

        with self.assertRaises(LocalSessionStoreError):
            self.store.save_repetition(
                self.session_id,
                invalid,
            )

    def test_rejects_invalid_assessment_status(self):
        invalid = dict(self.repetition)
        invalid["assessment_status"] = "INVALID"

        with self.assertRaises(LocalSessionStoreError):
            self.store.save_repetition(
                self.session_id,
                invalid,
            )

    def test_rejects_rom_for_unassessed_repetition(self):
        invalid = dict(self.repetition)
        invalid["assessment_status"] = "UNABLE_TO_ASSESS"

        with self.assertRaises(LocalSessionStoreError):
            self.store.save_repetition(
                self.session_id,
                invalid,
            )

    def test_finishes_session(self):
        self.finish_session()

        session = self.store.get_session(self.session_id)

        self.assertEqual(session["status"], "COMPLETED")
        self.assertIsNotNone(session["completed_at"])
        self.assertEqual(
            session["session_summary"]["total_reps"],
            1,
        )

    def test_rejects_unsupported_terminal_status(self):
        with self.assertRaises(LocalSessionStoreError):
            self.store.finish_session(
                self.session_id,
                "SUCCESS",
            )

    def test_rejects_repetition_after_session_completion(self):
        self.finish_session()

        with self.assertRaises(LocalSessionStoreError):
            self.store.save_repetition(
                self.session_id,
                self.repetition,
            )

    def test_pending_sessions_only_include_finished_sessions(self):
        self.finish_session()

        pending = self.store.get_pending_sessions()

        self.assertEqual(len(pending), 1)
        self.assertEqual(
            pending[0]["client_session_id"],
            self.session_id,
        )

    def test_session_survives_store_reinitialization(self):
        self.store.save_repetition(
            self.session_id,
            self.repetition,
        )
        self.finish_session()

        reopened_store = LocalSessionStore(self.database_path)
        session = reopened_store.get_session(self.session_id)

        self.assertEqual(session["status"], "COMPLETED")
        self.assertEqual(
            session["repetitions_data"],
            [self.repetition],
        )

    def test_marks_finished_session_as_synchronized(self):
        self.store.save_repetition(
            self.session_id,
            self.repetition,
        )
        self.finish_session()

        self.store.mark_session_synced(
            self.session_id,
            self.backend_session_id,
        )

        session = self.store.get_session(self.session_id)

        self.assertEqual(session["sync_status"], "SYNCED")
        self.assertEqual(
            session["backend_session_id"],
            self.backend_session_id,
        )
        self.assertIsNotNone(session["synced_at"])
        self.assertEqual(self.store.get_pending_sessions(), [])

    def test_cannot_synchronize_session_before_completion(self):
        with self.assertRaises(LocalSessionStoreError):
            self.store.mark_session_synced(
                self.session_id,
                self.backend_session_id,
            )

    def test_rejects_invalid_patient_uuid(self):
        with self.assertRaises(LocalSessionStoreError):
            self.store.create_session(
                patient_id="invalid",
                prescription_id=self.prescription_id,
            )

    def test_rejects_duplicate_client_session_id(self):
        with self.assertRaises(LocalSessionStoreError):
            self.store.create_session(
                patient_id=self.patient_id,
                prescription_id=self.prescription_id,
                client_session_id=self.session_id,
            )


if __name__ == "__main__":
    unittest.main(verbosity=2)
