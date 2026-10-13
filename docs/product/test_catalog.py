import json
import tempfile
import unittest
from pathlib import Path
from validate_catalog import REGISTRY, validate


class CatalogContractTest(unittest.TestCase):
    def test_all_chapters_present(self):
        doc = validate()
        self.assertEqual({m["chapter"] for m in doc["methods"]}, set(range(1, 15)))

    def test_no_implementation_claim_in_discovery(self):
        doc = validate()
        self.assertTrue(all(m["implementation"] == "NOT_STARTED" for m in doc["methods"]))
        reviewed = [m for m in doc["methods"] if m["sourceVerification"] == "TEXT_REVIEWED"]
        self.assertEqual([m["methodId"] for m in reviewed], ["ALD-CH02-01"])
        self.assertEqual(reviewed[0]["sourceLocation"]["methodPdfPageRange"], [31, 34])
        self.assertTrue(all(m["geometrySpecification"] == "NOT_YET_DEFINED" for m in doc["methods"]))
        self.assertTrue(all(m["modelValidation"] == "NOT_RUN" for m in doc["methods"]))
        self.assertEqual(reviewed[0]["diagramReview"], "PARTIAL_FRONT_BACK_GUIDES")
        self.assertEqual(reviewed[0]["geometrySpecification"], "NOT_YET_DEFINED")

    def test_rejects_duplicate_id(self):
        doc = json.loads(REGISTRY.read_text(encoding="utf-8"))
        doc["methods"][1]["methodId"] = doc["methods"][0]["methodId"]
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "catalog.json"
            path.write_text(json.dumps(doc), encoding="utf-8")
            with self.assertRaises(AssertionError):
                validate(path)

    def test_rejects_unverified_implementation_claim(self):
        doc = json.loads(REGISTRY.read_text(encoding="utf-8"))
        doc["methods"][0]["implementation"] = "IMPLEMENTED"
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "catalog.json"
            path.write_text(json.dumps(doc), encoding="utf-8")
            with self.assertRaises(AssertionError):
                validate(path)


if __name__ == "__main__":
    unittest.main()
