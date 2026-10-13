# GEOM-001 — Kernel Paramétrico

Status: DRAFT 0.1

## Entidades canônicas
- Point
- Line
- Arc
- Bezier
- Spline
- Path
- Constraint

## Entidades de domínio
- PatternPoint
- SeamEdge
- SeamPair
- Dart
- Notch
- Grainline
- FoldLine
- SeamAllowance

## Regras
- Curvas paramétricas são a fonte canônica.
- Comprimento de costura é calculado sobre a curva original.
- Pique é armazenado por distância acumulada em `SeamEdge`.
- Tesselação serve apenas para renderização/operação auxiliar.
- Offset inválido deve gerar estado de erro/bloqueio.

## Constraints mínimas do piloto
- Coincident
- Horizontal
- Vertical
- FixedDistance
- PointOnCurve
- Symmetry
- Collinear
- Tangent quando necessário

## Edição
- PARAMETRIC
- PARAMETRIC_OVERRIDE
- FREE
