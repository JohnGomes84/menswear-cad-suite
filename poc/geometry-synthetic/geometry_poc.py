"""POC experimental de geometria 2D. Não contém regras de vestuário nem é código de produção."""
from __future__ import annotations

from dataclasses import dataclass
from math import hypot, isfinite, sqrt
from typing import Callable, Iterable, Sequence

Point = tuple[float, float]


def _add(a: Point, b: Point) -> Point:
    return a[0] + b[0], a[1] + b[1]


def _sub(a: Point, b: Point) -> Point:
    return a[0] - b[0], a[1] - b[1]


def _mul(a: Point, k: float) -> Point:
    return a[0] * k, a[1] * k


def _norm(a: Point) -> float:
    return hypot(a[0], a[1])


def _distance_point_segment(p: Point, a: Point, b: Point) -> float:
    ab = _sub(b, a)
    denom = ab[0] * ab[0] + ab[1] * ab[1]
    if denom == 0:
        return _norm(_sub(p, a))
    t = max(0.0, min(1.0, ((_sub(p, a)[0] * ab[0]) + (_sub(p, a)[1] * ab[1])) / denom))
    return _norm(_sub(p, _add(a, _mul(ab, t))))


def _simpson(f: Callable[[float], float], a: float, b: float) -> float:
    c = (a + b) / 2
    fa, fc, fb = f(a), f(c), f(b)
    if not all(isfinite(x) for x in (fa, fc, fb)):
        raise ArithmeticError("Integrando não finito; comprimento não confiável")
    estimate = (b - a) * (fa + 4 * fc + fb) / 6
    if not isfinite(estimate):
        raise ArithmeticError("Overflow na quadratura; comprimento não confiável")
    return estimate


def _adaptive_simpson(f: Callable[[float], float], a: float, b: float,
                      eps: float, depth: int = 24) -> float:
    if not isfinite(eps) or eps <= 0:
        raise ValueError("eps deve ser positivo e finito")
    if depth < 0:
        raise ValueError("depth deve ser não negativo")
    if a == b:
        return 0.0
    whole = _simpson(f, a, b)

    def recurse(lo: float, hi: float, estimate: float, tol: float, remaining: int) -> float:
        mid = (lo + hi) / 2
        left = _simpson(f, lo, mid)
        right = _simpson(f, mid, hi)
        delta = left + right - estimate
        if not isfinite(delta):
            raise ArithmeticError("Erro de integração não finito")
        if abs(delta) <= 15 * tol:
            return left + right + delta / 15
        if remaining <= 0:
            raise ArithmeticError("Integração não convergiu no limite de recursão configurado")
        return recurse(lo, mid, left, tol / 2, remaining - 1) + recurse(mid, hi, right, tol / 2, remaining - 1)

    return recurse(a, b, whole, eps, depth)


@dataclass(frozen=True)
class CubicBezier:
    """Curva cúbica com coordenadas cartesianas em mm."""
    p0: Point
    p1: Point
    p2: Point
    p3: Point

    def __post_init__(self) -> None:
        for point in (self.p0, self.p1, self.p2, self.p3):
            if len(point) != 2 or not all(isfinite(v) for v in point):
                raise ValueError("Pontos devem ter duas coordenadas finitas em mm")

    def point(self, t: float) -> Point:
        if not 0.0 <= t <= 1.0:
            raise ValueError("t deve estar no domínio [0, 1]")
        u = 1 - t
        return (
            u**3*self.p0[0] + 3*u*u*t*self.p1[0] + 3*u*t*t*self.p2[0] + t**3*self.p3[0],
            u**3*self.p0[1] + 3*u*u*t*self.p1[1] + 3*u*t*t*self.p2[1] + t**3*self.p3[1],
        )

    def derivative(self, t: float) -> Point:
        if not 0.0 <= t <= 1.0:
            raise ValueError("t deve estar no domínio [0, 1]")
        u = 1 - t
        return (
            3*u*u*(self.p1[0]-self.p0[0]) + 6*u*t*(self.p2[0]-self.p1[0]) + 3*t*t*(self.p3[0]-self.p2[0]),
            3*u*u*(self.p1[1]-self.p0[1]) + 6*u*t*(self.p2[1]-self.p1[1]) + 3*t*t*(self.p3[1]-self.p2[1]),
        )

    def speed(self, t: float) -> float:
        return _norm(self.derivative(t))

    def reversed(self) -> "CubicBezier":
        """Retorna a mesma curva com orientação paramétrica invertida."""
        return CubicBezier(self.p3, self.p2, self.p1, self.p0)

    def validity_status(self, min_length_mm: float = 1e-9) -> dict[str, object]:
        """Diagnóstico experimental de degeneração por comprimento quase nulo."""
        if not isfinite(min_length_mm) or min_length_mm < 0:
            raise ValueError("min_length_mm deve ser finito e não negativo")
        length = self.length()
        return {
            "status": "INVALID_DEGENERATE" if length <= min_length_mm else "VALID",
            "length_mm": length,
            "min_length_mm": min_length_mm,
        }

    def length(self, eps_mm: float = 1e-8) -> float:
        if not isfinite(eps_mm) or eps_mm <= 0:
            raise ValueError("eps_mm deve ser positivo e finito")
        return _adaptive_simpson(self.speed, 0.0, 1.0, eps_mm)

    def point_at_arc_length(self, s_mm: float, eps_mm: float = 1e-8) -> tuple[Point, Point]:
        """Retorna (ponto, tangente unitária) na distância acumulada s."""
        total = self.length(eps_mm)
        if not isfinite(s_mm) or s_mm < 0 or s_mm > total:
            raise ValueError(f"s_mm deve estar em [0, {total:.12g}]")
        if s_mm == 0:
            t = 0.0
        elif s_mm == total:
            t = 1.0
        else:
            lo, hi = 0.0, 1.0
            for _ in range(56):
                mid = (lo + hi) / 2
                partial = _adaptive_simpson(self.speed, 0.0, mid, max(eps_mm / 4, 1e-12))
                if partial < s_mm:
                    lo = mid
                else:
                    hi = mid
            t = (lo + hi) / 2
        tangent = self.derivative(t)
        mag = _norm(tangent)
        if mag <= 1e-14:
            dt = 1e-7
            before = self.point(max(0.0, t - dt))
            after = self.point(min(1.0, t + dt))
            tangent = _sub(after, before)
            mag = _norm(tangent)
        if mag <= 1e-14:
            raise ValueError("Tangente indefinida no ponto solicitado")
        return self.point(t), (tangent[0] / mag, tangent[1] / mag)

    def flatten(self, tolerance_mm: float = 0.25, max_depth: int = 20) -> list[tuple[float, Point]]:
        """Aproxima a curva por segmentos; devolve pares (t, ponto), extremos incluídos."""
        if not isfinite(tolerance_mm) or tolerance_mm <= 0:
            raise ValueError("tolerance_mm deve ser positivo e finito")
        if max_depth < 1:
            raise ValueError("max_depth deve ser >= 1")
        out: list[tuple[float, Point]] = [(0.0, self.p0)]

        def split(p0: Point, p1: Point, p2: Point, p3: Point,
                  t0: float, t1: float, depth: int) -> None:
            flatness = max(_distance_point_segment(p1, p0, p3), _distance_point_segment(p2, p0, p3))
            if flatness <= tolerance_mm:
                out.append((t1, p3))
                return
            if depth >= max_depth:
                raise ArithmeticError("Discretização não atingiu a tolerância antes do limite de subdivisão")
            p01 = _mul(_add(p0, p1), 0.5)
            p12 = _mul(_add(p1, p2), 0.5)
            p23 = _mul(_add(p2, p3), 0.5)
            p012 = _mul(_add(p01, p12), 0.5)
            p123 = _mul(_add(p12, p23), 0.5)
            p0123 = _mul(_add(p012, p123), 0.5)
            tm = (t0 + t1) / 2
            split(p0, p01, p012, p0123, t0, tm, depth + 1)
            split(p0123, p123, p23, p3, tm, t1, depth + 1)

        split(self.p0, self.p1, self.p2, self.p3, 0.0, 1.0, 0)
        return out

    def notches(self, fractions: Iterable[float]) -> list[dict[str, object]]:
        total = self.length()
        result = []
        for fraction in fractions:
            if not 0 <= fraction <= 1:
                raise ValueError("frações de pique devem estar em [0, 1]")
            s = total * fraction
            point, tangent = self.point_at_arc_length(s)
            result.append({"fraction": fraction, "arc_length_mm": s, "point_mm": point, "tangent": tangent})
        return result


def segment_intersection(a0: Point, a1: Point, b0: Point, b1: Point) -> dict[str, object]:
    """Classifica interseção de dois segmentos; Shapely é somente auxiliar da POC."""
    try:
        import shapely
        from shapely.geometry import LineString
    except ImportError as exc:
        raise RuntimeError("Shapely não instalado; interseção auxiliar indisponível") from exc
    points = (a0, a1, b0, b1)
    if any(len(point) != 2 or not all(isfinite(v) for v in point) for point in points):
        raise ValueError("extremos devem ter duas coordenadas finitas em mm")
    if a0 == a1 or b0 == b1:
        return {"status": "DEGENERATE_INPUT", "shapely_version": shapely.__version__}
    geom = LineString([a0, a1]).intersection(LineString([b0, b1]))
    if geom.is_empty:
        return {"status": "NONE", "geometry_type": geom.geom_type, "shapely_version": shapely.__version__}
    if geom.geom_type == "Point":
        coords = [[float(geom.x), float(geom.y)]]
        status = "POINT"
    elif geom.geom_type == "MultiPoint":
        coords = [[float(point.x), float(point.y)] for point in geom.geoms]
        status = "MULTIPOINT"
    elif geom.geom_type in {"LineString", "MultiLineString"}:
        coords = [[[float(x), float(y)] for x, y in line.coords] for line in (geom.geoms if hasattr(geom, "geoms") else [geom])]
        status = "OVERLAP"
    else:
        coords = []
        status = "COMPLEX"
    return {"status": status, "geometry_type": geom.geom_type, "coordinates_mm": coords, "shapely_version": shapely.__version__}


def offset_polygon(points: Sequence[Point], distance_mm: float, join_style: str = "mitre") -> dict[str, object]:
    """Avalia buffer poligonal de largura constante em Shapely; auxiliar experimental."""
    try:
        import shapely
        from shapely.geometry import Polygon
    except ImportError as exc:
        raise RuntimeError("Shapely não instalado; offset auxiliar indisponível") from exc
    if len(points) < 3:
        raise ValueError("polígono exige pelo menos três pontos")
    if not isfinite(distance_mm):
        raise ValueError("distance_mm deve ser finito")
    if any(len(point) != 2 or not all(isfinite(v) for v in point) for point in points):
        raise ValueError("vértices devem ter duas coordenadas finitas em mm")
    poly = Polygon(points)
    if not poly.is_valid or poly.area <= 0:
        return {"status": "INVALID_INPUT", "is_valid": bool(poly.is_valid), "area_mm2": float(poly.area), "shapely_version": shapely.__version__}
    if join_style not in {"round", "mitre", "bevel"}:
        raise ValueError("join_style deve ser round, mitre ou bevel")
    result = poly.buffer(distance_mm, join_style=join_style, quad_segs=8)
    polygons = list(result.geoms) if hasattr(result, "geoms") else [result]
    outlines_mm = [
        [[float(x), float(y)] for x, y in polygon.exterior.coords]
        for polygon in polygons
        if polygon.geom_type == "Polygon"
    ]
    return {
        "status": "VALID" if result.is_valid and not result.is_empty else "INVALID_RESULT",
        "input_area_mm2": float(poly.area),
        "output_area_mm2": float(result.area),
        "output_type": result.geom_type,
        "components": len(result.geoms) if hasattr(result, "geoms") else 1,
        "is_valid": bool(result.is_valid),
        "is_empty": bool(result.is_empty),
        "distance_mm": float(distance_mm),
        "join_style": join_style,
        "shapely_version": shapely.__version__,
        "outlines_mm": outlines_mm,
    }
