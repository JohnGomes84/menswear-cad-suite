"""Pure arithmetic checks for textual CH02 flat-trouser sample.

These tests do NOT reconstruct a garment diagram or approve a pattern.
"""
import json
import unittest
from pathlib import Path

FIXTURE = Path(__file__).resolve().parents[1] / "domain" / "FLAT-TROUSER-SCALAR-FIXTURE-001.json"


class FlatTrouserTextFixtureTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads(FIXTURE.read_text(encoding="utf-8"))

    def test_source_is_text_only_not_diagram_review(self):
        source = self.data["source"]
        self.assertEqual(source["pdfPageRange"], [31, 34])
        self.assertTrue(source["textReviewed"])
        self.assertFalse(source["diagramReviewed"])
        self.assertIn("ARITHMETIC_ONLY", self.data["usage"])

    def test_three_measurements_match_reference_sample(self):
        self.assertEqual(self.data["measurementsMm"],
                         {"seat": 1020, "bodyRise": 282, "insideLeg": 800})

    def test_basic_and_easier_scalar_relations(self):
        m = self.data["measurementsMm"]
        self.assertEqual([v["variant"] for v in self.data["tests"]], ["BASIC", "EASY"])
        for v in self.data["tests"]:
            ex, p = v["expectedMm"], v["parameters"]
            width = m["seat"] / 4 + p["seatExtraMm"]
            with self.subTest(variant=v["variant"]):
                self.assertAlmostEqual(ex["frontRise_0_1"], m["bodyRise"] + p["riseExtraMm"])
                self.assertAlmostEqual(ex["insideLeg_1_2"], m["insideLeg"])
                self.assertAlmostEqual(ex["kneePosition_1_3"], m["insideLeg"] / 2)
                self.assertAlmostEqual(ex["frontSeatWidth_1_4"], width)
                self.assertAlmostEqual(ex["frontFork_4_8"], width / 4 + p["innerForkOffsetMm"])
                self.assertAlmostEqual(ex["onePieceHemReference_2_9"],
                                       width * 2 / 3 + p["hemWidthExtraMm"])
                self.assertAlmostEqual(ex["twoPieceReference_1_9"], width / 2 + 10)

    def test_easy_option_increases_derived_allowances(self):
        simple = self.data["tests"][0]["expectedMm"]
        easy = self.data["tests"][1]["expectedMm"]
        for key in ("frontRise_0_1", "frontSeatWidth_1_4",
                    "frontFork_4_8", "onePieceHemReference_2_9",
                    "twoPieceReference_1_9"):
            with self.subTest(key=key):
                self.assertGreater(easy[key], simple[key])


if __name__ == "__main__":
    unittest.main()
