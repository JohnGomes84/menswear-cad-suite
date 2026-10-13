# Menswear CAD Suite

Suíte CAD paramétrica web para modelagem masculina, com editor avançado e suporte a uso sob medida, ateliê, modelistas e confecções.

## Estado atual

- Baseline de produto: v0.5
- Piloto formal: `PILOT-001 — Flat Shirt Core`
- Código de produção: **bloqueado** até aprovação do gate de domínio/POC
- Saídas iniciais previstas: SVG e PDF
- DXF, gradação, nesting e 3D: fora do primeiro gate

## Princípios

- Kernel CAD paramétrico próprio
- Semântica de vestuário separada da geometria
- Projeto paramétrico versionado como fonte editável
- Validação geométrica, de costura, escala e prova física
- Dependências externas classificadas e auditadas

## Documento mestre

A fonte única de verdade do projeto é `docs/MASTER-DOCUMENT.md`. Em caso de divergência, ele prevalece sobre minutas e documentos anteriores.

## Documentação

- `docs/00-product-vision.md`
- `docs/01-baseline-v0.5.md`
- `docs/domain/SPEC-PILOT-001.md`
- `docs/architecture/GEOM-001.md`
- `docs/qa/QA-PILOT-001.md`
- `docs/architecture/PROJECT-FORMAT-001.md`
- `docs/compliance/DEPENDENCIES.md`
- `docs/decisions/ADR-0001-product-scope.md`
