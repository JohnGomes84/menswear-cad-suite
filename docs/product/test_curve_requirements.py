"""Validate declarative curve constraints against source-reviewed CH02 requirements.

This QA validates wording and applicability, not the spline or physical fit.
"""
import json
import unittest
from pathlib import Path

REGISTRY = Path(__file__).resolve().parents[1] / "domain" / "CH02-CURVE-REQUIREMENTS-001.json"

EXPECTED = {
    ("ONE_PIECE", "FRONT", "CROTCH"): (("6", "7", "8"), 30, 32.5, 32),
    ("ONE_PIECE", "BACK", "CROTCH"): (("13", "14", "16"), 55, 60, 32),
    ("TWO_PIECE", "FRONT", "CROTCH"): (("6", "7", "8"), 30, 32.5, 33),
    ("TWO_PIECE", "BACK", "CROTCH"): (("17", "19", "21"), 55, 60, 33),
    ("ONE_PIECE", "FRONT", "INSEAM"): (("8", "11"), 10, ("9", "11"), 32),
    ("ONE_PIECE", "BACK", "INSEAM"): (("16", "18"), 20, ("17", "18"), 32),
    ("TWO_PIECE", "FRONT", "INSEAM"): (("8", "15"), 10, ("13", "15"), 33),
    ("TWO_PIECE", "BACK", "INSEAM"): (("21", "25"), 20, ("24", "25"), 33),
}

class CurveRequirementsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads(REGISTRY.read_text(encoding="utf-8"))

    def test_registry_is_research_only_and_no_rendered_geometry(self):
        d = self.data
        self.assertEqual(d["units"], "mm")
        self.assertEqual(d["purpose"], "RESEARCH_ONLY")
        self.assertEqual(len(d["rules"]), 8)
        for r in d["rules"]:
            self.assertEqual(r["geometryStatus"], "AMBIGUOUS_GEOMETRY_DO_NOT_RENDER")
            self.assertEqual(r["sourceReview"], "TEXT_REVIEWED_DIAGRAM_PARTIAL")
            self.assertFalse(any(k in r for k in ("controlPoints", "bezier", "cutContour")))

    def test_unique_id_and_complete_source(self):
        ids = [r["ruleId"] for r in self.data["rules"]]
        self.assertEqual(len(ids), len(set(ids)))
        for r in self.data["rules"]:
            self.assertEqual(r["sourceRef"]["chapter"], 2)
            self.assertIn(r["sourceRef"]["pdfPage"], (32, 33))
            self.assertGreaterEqual(len(r["pending"]), 3)

    def test_crotch_constraints_reflect_printed_chapter_directions(self):
        rules = [r for r in self.data["rules"] if r["kind"]=="CROTCH"]
        self.assertEqual(len(rules), 4)
        for r in rules:
            key = r["method"], r["section"], r["kind"]
            path, basic, easy, page = EXPECTED[key]
            with self.subTest(key=key):
                self.assertEqual(tuple(r["pointPath"]), path)
                self.assertEqual(r["referencePoint"], "4")
                self.assertEqual(r["distanceBasicMm"], basic)
                self.assertEqual(r["distanceEasyMm"], easy)
                self.assertEqual(r["sourceRef"]["pdfPage"], page)

    def test_inseam_constraints_reflect_printed_chapter(self):
        rules = [r for r in self.data["rules"] if r["kind"]=="INSEAM"]
        self.assertEqual(len(rules), 4)
        for r in rules:
            key = r["method"], r["section"], r["kind"]
            path, depth, companion, page = EXPECTED[key]
            with self.subTest(key=key):
                self.assertEqual(tuple(r["pointPath"]), path)
                self.assertEqual(r["inwardDepthMm"], depth)
                self.assertEqual(tuple(r["straightCompanion"]), companion)
                self.assertEqual(r["sourceRef"]["pdfPage"], page)

    def test_all_methods_have_both_crotch_and_inseam(self):
        groups = {(r["method"], r["section"], r["kind"]) for r in self.data["rules"]}
        self.assertEqual(groups, set(EXPECTED))

if __name__ == "__main__":
    unittest.main()
