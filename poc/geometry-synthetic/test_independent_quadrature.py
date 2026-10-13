"""Quadratura independente para a POC geométrica sintética.

NÃO valida PILOT-001 nem define tolerância de produção.
A quadratura Gauss-Legendre abaixo é independente da implementação Simpson
em geometry_poc.py, mas ambas usam a derivada matemática da mesma Bézier.
"""
from __future__ import annotations

from math import asinh, cos, pi, sqrt
import unittest

from geometry_poc import CubicBezier


def gauss_legendre_length(curve: CubicBezier, order: int = 128) -> float:
    """Integra ||B'(t)|| em [0,1] com nós/pesos GL calculados separadamente."""
    if order < 4 or order % 2:
        raise ValueError("Ordem deve ser par e >= 4")

    def legendre_and_prev(n: int, x: float) -> tuple[float, float]:
        p0, p1 = 1.0, x
        for j in range(2, n + 1):
            p0, p1 = p1, ((2*j-1)*x*p1-(j-1)*p0)/j
        return p1, p0

    integral = 0.0
    for k in range(1, order // 2 + 1):
        z = cos(pi * (k - 0.25) / (order + 0.5))
        for _ in range(32):
            pn, pn1 = legendre_and_prev(order, z)
            derivative = order * (z * pn - pn1) / (z*z - 1)
            new_z = z - pn / derivative
            if abs(new_z - z) <= 2e-15:
                z = new_z
                break
            z = new_z
        else:
            raise ArithmeticError("Raiz Gauss-Legendre não convergiu")

        pn, pn1 = legendre_and_prev(order, z)
        derivative = order * (z * pn - pn1) / (z*z - 1)
        weight = 2 / ((1 - z*z) * derivative*derivative)
        # Integral em [0,1] recebe metade dos pesos de [-1,1].
        integral += 0.5 * weight * (
            curve.speed((1-z)/2) + curve.speed((1+z)/2)
        )
    return integral


class IndependentNumericalBenchmark(unittest.TestCase):
    def test_quadratic_parabola_has_exact_analytic_arc_length(self):
        # A Bézier cúbica abaixo parametriza exatamente (x,y)=(t,t²).
        curve = CubicBezier(
            (0.0, 0.0),
            (1.0/3.0, 0.0),
            (2.0/3.0, 1.0/3.0),
            (1.0, 1.0),
        )
        analytic = sqrt(5)/2 + asinh(2)/4
        independent = gauss_legendre_length(curve, 128)
        self.assertAlmostEqual(independent, analytic, delta=1e-9)
        self.assertAlmostEqual(curve.length(1e-9), analytic, delta=1e-7)

    def test_inflection_curve_matches_independent_quadrature(self):
        curve = CubicBezier((0,0), (25,95), (80,-95), (110,0))
        gl64 = gauss_legendre_length(curve, 64)
        gl128 = gauss_legendre_length(curve, 128)
        # Tolerâncias aqui testam apenas esta fixture, não o produto.
        self.assertAlmostEqual(gl64, gl128, delta=1e-6)
        self.assertAlmostEqual(curve.length(1e-8), gl128, delta=1e-6)

    def test_original_poc_fixture_matches_independent_quadrature(self):
        curve = CubicBezier((25,30), (35,135), (170,145), (205,45))
        reference = gauss_legendre_length(curve, 128)
        self.assertAlmostEqual(curve.length(1e-8), reference, delta=1e-6)
        self.assertAlmostEqual(curve.reversed().length(1e-8), reference, delta=1e-6)


if __name__ == "__main__":
    unittest.main(verbosity=2)
