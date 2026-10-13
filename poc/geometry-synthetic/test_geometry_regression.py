"""Casos adicionais de regressão da POC sintética; não validam o PILOT-001."""
import math
import unittest

from geometry_poc import CubicBezier, _adaptive_simpson, offset_polygon, segment_intersection


class IndependentCurveFixtures(unittest.TestCase):
    def test_three_four_five_line_has_analytic_length(self):
        # B(t) = (3t, 4t) for the cubic controls below; L = 5 mm.
        curve = CubicBezier((0, 0), (1, 4/3), (2, 8/3), (3, 4))
        self.assertAlmostEqual(curve.length(1e-10), 5.0, places=8)
        midpoint, tangent = curve.point_at_arc_length(2.5)
        self.assertAlmostEqual(midpoint[0], 1.5, places=7)
        self.assertAlmostEqual(midpoint[1], 2.0, places=7)
        self.assertAlmostEqual(tangent[0], 3/5, places=7)
        self.assertAlmostEqual(tangent[1], 4/5, places=7)

    def test_collinear_nonuniform_parameterization_uses_arc_not_t(self):
        curve = CubicBezier((0, 0), (5, 0), (90, 0), (100, 0))
        self.assertAlmostEqual(curve.length(), 100, places=6)
        point, tangent = curve.point_at_arc_length(75)
        self.assertAlmostEqual(point[0], 75, places=5)
        self.assertAlmostEqual(point[1], 0, places=7)
        self.assertAlmostEqual(tangent[0], 1, places=7)

    def test_translation_does_not_change_length_or_unit_tangent(self):
        curve = CubicBezier((0, 0), (15, 50), (65, 50), (80, 0))
        moved = CubicBezier((19, -33), (34, 17), (84, 17), (99, -33))
        s = 0.41 * curve.length()
        original_point, original_tangent = curve.point_at_arc_length(s)
        moved_point, moved_tangent = moved.point_at_arc_length(s)
        self.assertAlmostEqual(moved.length(), curve.length(), places=6)
        self.assertAlmostEqual(moved_point[0] - original_point[0], 19, places=6)
        self.assertAlmostEqual(moved_point[1] - original_point[1], -33, places=6)
        for u, v in zip(original_tangent, moved_tangent):
            self.assertAlmostEqual(u, v, places=6)

    def test_positive_uniform_scaling_preserves_arc_fraction(self):
        curve = CubicBezier((2, 3), (8, 36), (43, 36), (61, 1))
        scaled = CubicBezier((6, 9), (24, 108), (129, 108), (183, 3))
        f = 0.63
        point, tangent = curve.point_at_arc_length(curve.length() * f)
        bigger_point, bigger_tangent = scaled.point_at_arc_length(scaled.length() * f)
        self.assertAlmostEqual(scaled.length() / curve.length(), 3, places=6)
        self.assertAlmostEqual(bigger_point[0], 3 * point[0], places=5)
        self.assertAlmostEqual(bigger_point[1], 3 * point[1], places=5)
        for u, v in zip(tangent, bigger_tangent):
            self.assertAlmostEqual(u, v, places=6)

    def test_zero_endpoint_derivative_recovers_defined_forward_tangent(self):
        curve = CubicBezier((0, 0), (0, 0), (10, 0), (30, 0))
        point, tangent = curve.point_at_arc_length(0)
        self.assertEqual(point, (0, 0))
        self.assertAlmostEqual(tangent[0], 1, places=7)
        self.assertAlmostEqual(tangent[1], 0, places=7)

    def test_degenerate_near_zero_length_status_is_explicit(self):
        curve = CubicBezier((0, 0), (0, 0), (1e-10, 0), (1e-10, 0))
        self.assertEqual(curve.validity_status(min_length_mm=1e-9)["status"], "INVALID_DEGENERATE")


class ExplicitNumericalFailureTests(unittest.TestCase):
    def test_integration_raises_when_recursion_budget_is_exhausted(self):
        with self.assertRaisesRegex(ArithmeticError, "não convergiu"):
            _adaptive_simpson(lambda t: t**4, 0.0, 1.0, 1e-16, depth=0)

    def test_flatten_raises_when_subdivision_budget_is_exhausted(self):
        curve = CubicBezier((0, 0), (0, 100), (100, 100), (100, 0))
        with self.assertRaisesRegex(ArithmeticError, "não atingiu a tolerância"):
            curve.flatten(tolerance_mm=1e-7, max_depth=1)

    def test_nonfinite_integrand_is_rejected(self):
        curve = CubicBezier((1e308, 0), (-1e308, 0), (1e308, 0), (-1e308, 0))
        with self.assertRaisesRegex(ArithmeticError, "não finito"):
            curve.length()

    def test_invalid_integration_budget_is_rejected(self):
        with self.assertRaises(ValueError):
            _adaptive_simpson(lambda t: t, 0.0, 1.0, 0.0)
        with self.assertRaises(ValueError):
            _adaptive_simpson(lambda t: t, 0.0, 1.0, 1e-6, depth=-1)


class TopologyFixtures(unittest.TestCase):
    def test_segments_touch_at_endpoint(self):
        result = segment_intersection((0, 0), (10, 0), (10, 0), (10, 10))
        self.assertEqual(result["status"], "POINT")
        self.assertAlmostEqual(result["coordinates_mm"][0][0], 10.0)
        self.assertAlmostEqual(result["coordinates_mm"][0][1], 0.0)

    def test_collinear_segments_overlap(self):
        result = segment_intersection((0, 0), (20, 0), (10, 0), (30, 0))
        self.assertEqual(result["status"], "OVERLAP")

    def test_invalid_join_style_is_rejected(self):
        with self.assertRaises(ValueError):
            offset_polygon([(0, 0), (20, 0), (20, 10), (0, 10)], 2, join_style="unsupported")


if __name__ == "__main__":
    unittest.main(verbosity=2)
