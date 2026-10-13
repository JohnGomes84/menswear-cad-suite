from __future__ import annotations

import json
import math
import platform
from pathlib import Path

from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from geometry_poc import CubicBezier, offset_polygon, segment_intersection

OUT = Path(__file__).resolve().parent / "artifacts"
OUT.mkdir(exist_ok=True)

curve = CubicBezier((25.0, 30.0), (35.0, 135.0), (170.0, 145.0), (205.0, 45.0))
reference_length = curve.length(1e-11)
notches = curve.notches([0.25, 0.50, 0.75])

# Synthetic closed contour, deliberately unrelated to any garment block.
outline = [(35, 35), (105, 35), (105, 105), (82, 105), (82, 62), (58, 62), (58, 105), (35, 105)]
shapely_offset = offset_polygon(outline, 4.0)
invalid_offset = offset_polygon([(0, 0), (60, 60), (0, 60), (60, 0)], 3.0)
collapsed_offset = offset_polygon([(0, 0), (40, 0), (40, 30), (0, 30)], -100.0)
reverse_length = curve.reversed().length(1e-11)
degenerate_curve = CubicBezier((4, 7), (4, 7), (4, 7), (4, 7)).validity_status()
crossing_segments = segment_intersection((0, 0), (10, 10), (0, 10), (10, 0))
disjoint_segments = segment_intersection((0, 0), (10, 0), (0, 5), (10, 5))

sweep = []
for eps in [1e-2, 1e-4, 1e-6, 1e-8, 1e-10]:
    approx = curve.length(eps)
    sweep.append({"integration_eps_mm": eps, "length_mm": approx, "absolute_delta_from_1e-11_mm": abs(approx-reference_length)})

flattening = []
for tol in [5.0, 2.0, 1.0, 0.5, 0.25, 0.1, 0.05]:
    points = curve.flatten(tol)
    poly_len = sum(math.dist(a[1], b[1]) for a, b in zip(points, points[1:]))
    flattening.append({
        "flatness_parameter_mm": tol,
        "vertices": len(points),
        "polyline_length_mm": poly_len,
        "length_shortfall_mm": reference_length - poly_len,
    })

report = {
    "poc": "Fase 1.5 — geometria sintética",
    "scope_warning": "Experimento computacional; não valida bloco, caimento, montagem, impressão de produção nem PILOT-001.",
    "units": "mm",
    "environment": {"python": platform.python_version()},
    "curve": {"type": "cubic_bezier", "control_points_mm": [curve.p0, curve.p1, curve.p2, curve.p3], "reference_length_mm": reference_length},
    "orientation_reversal": {"status": "LENGTH_PRESERVED" if abs(reverse_length-reference_length) <= 1e-8 else "MISMATCH", "forward_length_mm": reference_length, "reversed_length_mm": reverse_length},
    "degenerate_curve": degenerate_curve,
    "segment_intersections": {"crossing": crossing_segments, "disjoint": disjoint_segments},
    "integration_sweep": sweep,
    "flattening_sweep": flattening,
    "notches": notches,
    "offset_constant_width_concave": shapely_offset,
    "self_intersecting_input": invalid_offset,
    "excessive_erosion": collapsed_offset,
    "variable_width_offset": {"status": "NOT_IMPLEMENTED", "note": "Este protótipo usa buffer de largura constante; larguras variáveis exigem experimento separado."},
    "production_tolerances": "NOT_SET — os sweeps registram comportamento observado, não tolerâncias aprovadas.",
}
try:
    import shapely
    report["environment"]["shapely"] = shapely.__version__
except ImportError:
    report["environment"]["shapely"] = "NOT_AVAILABLE"

(OUT / "poc_results.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

# SVG diagnostic in physical mm; SVG is an engineering view, not a pattern.
flat = curve.flatten(0.5)
svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="240mm" height="160mm" viewBox="0 0 240 160">',
    '<rect width="240" height="160" fill="white"/>',
    '<g transform="translate(0,160) scale(1,-1)">',
    '<path d="M 25 30 C 35 135 170 145 205 45" fill="none" stroke="#145da0" stroke-width="0.8"/>',
    '<polyline points="' + ' '.join(f'{p[0]:.5f},{p[1]:.5f}' for _, p in flat) + '" fill="none" stroke="#d1495b" stroke-width="0.35" stroke-dasharray="2 1"/>',
]
for n in notches:
    x, y = n["point_mm"]
    tx, ty = n["tangent"]
    nx, ny = -ty, tx
    svg.append(f'<line x1="{x-2*nx:.5f}" y1="{y-2*ny:.5f}" x2="{x+2*nx:.5f}" y2="{y+2*ny:.5f}" stroke="#202020" stroke-width="0.8"/>')
# Render the input polygon and the actual Shapely buffer outline returned by the POC.
svg.append('<polygon points="35,35 105,35 105,105 82,105 82,62 58,62 58,105 35,105" fill="none" stroke="#2a9d8f" stroke-width="0.6"/>')
for ring in shapely_offset.get("outlines_mm", []):
    pts = ' '.join(f'{x:.5f},{y:.5f}' for x, y in ring)
    svg.append(f'<polyline points="{pts}" fill="none" stroke="#e76f51" stroke-width="0.6"/>')
svg.extend(['</g>', '<text x="8" y="12" font-size="4">Blue: Bezier; red dashed: flattening; black: arc-length notches</text>', '<text x="8" y="18" font-size="4">Green: input polygon; orange: Shapely buffer; units: mm</text>', '<text x="8" y="154" font-size="4">POC only — not a garment pattern; SVG viewBox is in mm</text>', '</svg>'])
(OUT / "geometry_diagnostic.svg").write_text("\n".join(svg) + "\n", encoding="utf-8")

# PDF diagnostic at a nominal 1 drawing unit = 1 mm, with a 25 mm calibration ruler.
pdf_path = OUT / "geometry_diagnostic.pdf"
c = canvas.Canvas(str(pdf_path), pagesize=(240*mm, 160*mm), pageCompression=1)
c.setTitle("Fase 1.5 — Diagnóstico geométrico sintético (POC)")
c.setFont("Helvetica", 8)
c.drawString(8*mm, 151*mm, "POC sintetica — Bezier, aproximacao, piques por arco e contorno teste")
c.drawString(8*mm, 145*mm, "Desenho nominal em mm; imprimir a 100%. Nao e molde de vestuario.")
# Curve drawn from the exact cubic controls.
c.setStrokeColorRGB(0.08, 0.36, 0.63)
c.setLineWidth(0.8*mm)
c.bezier(*[v*mm for v in (25,30,35,135,170,145,205,45)])
# Flattened polyline.
c.setStrokeColorRGB(0.82, 0.28, 0.35)
c.setDash(2*mm, 1*mm)
c.setLineWidth(0.25*mm)
for (_, a), (_, b) in zip(flat, flat[1:]):
    c.line(a[0]*mm, a[1]*mm, b[0]*mm, b[1]*mm)
c.setDash()
# Original concave outline (green) and constant-width buffer result (orange).
c.setStrokeColorRGB(0.16, 0.62, 0.56)
c.setLineWidth(0.35*mm)
for points in [outline]:
    path = c.beginPath()
    path.moveTo(points[0][0]*mm, points[0][1]*mm)
    for x, y in points[1:]:
        path.lineTo(x*mm, y*mm)
    path.close()
    c.drawPath(path, stroke=1, fill=0)
c.setStrokeColorRGB(0.90, 0.41, 0.31)
c.setLineWidth(0.35*mm)
for ring in shapely_offset.get("outlines_mm", []):
    path = c.beginPath()
    path.moveTo(ring[0][0]*mm, ring[0][1]*mm)
    for x, y in ring[1:]:
        path.lineTo(x*mm, y*mm)
    c.drawPath(path, stroke=1, fill=0)
# Piques perpendicular to tangent.
c.setStrokeColorRGB(0.1, 0.1, 0.1)
c.setLineWidth(0.6*mm)
for n in notches:
    x, y = n["point_mm"]
    tx, ty = n["tangent"]
    nx, ny = -ty, tx
    c.line((x-2*nx)*mm, (y-2*ny)*mm, (x+2*nx)*mm, (y+2*ny)*mm)
# 25 mm calibration bar.
c.setStrokeColorRGB(0, 0, 0)
c.setLineWidth(0.35*mm)
c.line(10*mm, 12*mm, 35*mm, 12*mm)
c.line(10*mm, 10*mm, 10*mm, 14*mm)
c.line(35*mm, 10*mm, 35*mm, 14*mm)
c.setFont("Helvetica", 7)
c.drawString(10*mm, 7*mm, "25 mm — controle nominal; confirmar sem ajuste a pagina")
c.showPage()
c.save()
print(json.dumps({"results": str(OUT / "poc_results.json"), "svg": str(OUT / "geometry_diagnostic.svg"), "pdf": str(pdf_path), "reference_length_mm": reference_length}, ensure_ascii=False, indent=2))
