import math
import unittest

from geometry_poc import CubicBezier, offset_polygon, segment_intersection


class BezierTests(unittest.TestCase):
    def test_straight_cubic_has_exact_length(self):
        curve = CubicBezier((0, 0), (10, 0), (20, 0), (30, 0))
        self.assertAlmostEqual(curve.length(), 30.0, places=7)

    def test_curved_bezier_longer_than_chord(self):
        curve = CubicBezier((0, 0), (0, 80), (100, 80), (100, 0))
        self.assertGreater(curve.length(), 100.0)

    def test_reversed_orientation_preserves_geometry_and_maps_arc(self):
        curve = CubicBezier((0, 0), (0, 80), (100, 80), (100, 0))
        reverse = curve.reversed()
        length = curve.length()
        self.assertAlmostEqual(reverse.length(), length, places=8)
        p_forward, tangent_forward = curve.point_at_arc_length(0.37 * length)
        p_reverse, tangent_reverse = reverse.point_at_arc_length(0.63 * length)
        self.assertAlmostEqual(p_forward[0], p_reverse[0], places=7)
        self.assertAlmostEqual(p_forward[1], p_reverse[1], places=7)
        self.assertAlmostEqual(tangent_forward[0], -tangent_reverse[0], places=7)
        self.assertAlmostEqual(tangent_forward[1], -tangent_reverse[1], places=7)

    def test_zero_length_curve_is_detected_as_degenerate(self):
        curve = CubicBezier((4, 7), (4, 7), (4, 7), (4, 7))
        self.assertEqual(curve.validity_status()["status"], "INVALID_DEGENERATE")
        self.assertEqual(curve.length(), 0.0)
        with self.assertRaises(ValueError):
            curve.point_at_arc_length(0)

    def test_arc_length_endpoints_and_bounds(self):
        curve = CubicBezier((0, 0), (0, 80), (100, 80), (100, 0))
        length = curve.length()
        p0, t0 = curve.point_at_arc_length(0)
        p1, t1 = curve.point_at_arc_length(length)
        self.assertEqual(p0, curve.p0)
        self.assertEqual(p1, curve.p3)
        self.assertAlmostEqual(math.hypot(*t0), 1.0, places=8)
        self.assertAlmostEqual(math.hypot(*t1), 1.0, places=8)
        with self.assertRaises(ValueError):
            curve.point_at_arc_length(length + 1e-6)
        with self.assertRaises(ValueError):
            curve.point_at_arc_length(-1)

    def test_discretization_refines_chord_length(self):
        curve = CubicBezier((0, 0), (0, 100), (100, 100), (100, 0))
        coarse = curve.flatten(5.0)
        fine = curve.flatten(0.1)
        coarse_len = sum(math.dist(a[1], b[1]) for a, b in zip(coarse, coarse[1:]))
        fine_len = sum(math.dist(a[1], b[1]) for a, b in zip(fine, fine[1:]))
        self.assertGreater(len(fine), len(coarse))
        self.assertGreaterEqual(fine_len + 1e-8, coarse_len)
        self.assertLessEqual(fine_len, curve.length() + 1e-5)

    def test_notch_semantics_do_not_depend_on_flattening(self):
        curve = CubicBezier((0, 0), (0, 100), (100, 100), (100, 0))
        before = curve.notches([0.25, 0.5, 0.75])
        curve.flatten(2.0)
        curve.flatten(0.05)
        after = curve.notches([0.25, 0.5, 0.75])
        for a, b in zip(before, after):
            self.assertEqual(a["arc_length_mm"], b["arc_length_mm"])
            self.assertEqual(a["point_mm"], b["point_mm"])

    def test_invalid_inputs_are_rejected(self):
        curve = CubicBezier((0, 0), (0, 1), (1, 1), (1, 0))
        with self.assertRaises(ValueError):
            curve.length(0)
        with self.assertRaises(ValueError):
            curve.flatten(0)
        with self.assertRaises(ValueError):
            curve.notches([1.1])


class OffsetTests(unittest.TestCase):
    def test_segment_intersections_and_disjoint_case(self):
        crossing = segment_intersection((0, 0), (10, 10), (0, 10), (10, 0))
        self.assertEqual(crossing["status"], "POINT")
        self.assertAlmostEqual(crossing["coordinates_mm"][0][0], 5.0)
        self.assertAlmostEqual(crossing["coordinates_mm"][0][1], 5.0)
        disjoint = segment_intersection((0, 0), (10, 0), (0, 5), (10, 5))
        self.assertEqual(disjoint["status"], "NONE")
        degenerate = segment_intersection((1, 1), (1, 1), (0, 0), (2, 2))
        self.assertEqual(degenerate["status"], "DEGENERATE_INPUT")

    def test_convex_constant_offset(self):
        result = offset_polygon([(0, 0), (100, 0), (100, 60), (0, 60)], 5)
        self.assertEqual(result["status"], "VALID")
        self.assertGreater(result["output_area_mm2"], result["input_area_mm2"])
        self.assertTrue(result["outlines_mm"])
        self.assertGreater(len(result["outlines_mm"][0]), 4)

    def test_concave_polygon_offset(self):
        u_shape = [(0, 0), (80, 0), (80, 70), (55, 70), (55, 25), (25, 25), (25, 70), (0, 70)]
        result = offset_polygon(u_shape, 4)
        self.assertEqual(result["status"], "VALID")
        self.assertGreater(result["output_area_mm2"], result["input_area_mm2"])
        self.assertTrue(result["outlines_mm"])

    def test_self_intersection_is_reported_not_silently_repaired(self):
        bowtie = [(0, 0), (60, 60), (0, 60), (60, 0)]
        result = offset_polygon(bowtie, 3)
        self.assertEqual(result["status"], "INVALID_INPUT")

    def test_excessive_erosion_is_reported_as_invalid_result(self):
        rectangle = [(0, 0), (40, 0), (40, 30), (0, 30)]
        result = offset_polygon(rectangle, -100)
        self.assertEqual(result["status"], "INVALID_RESULT")
        self.assertTrue(result["is_empty"])

    def test_nonfinite_offset_is_rejected(self):
        with self.assertRaises(ValueError):
            offset_polygon([(0, 0), (20, 0), (20, 10)], float("nan"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
