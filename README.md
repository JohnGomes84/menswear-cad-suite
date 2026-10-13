# Menswear CAD Suite

Suíte CAD paramétrica web para modelagem masculina, com editor avançado e suporte a uso sob medida, ateliê, modelistas e confecções.

## Estado atual

- Documento Mestre: **baseline 1.9 DRAFT**
- Piloto formal: `PILOT-001 — Flat Shirt Core`
- POC geométrica sintética: **incorporada à `main`; 27/27 testes aprovados no GitHub Actions (escopo sintético)**
- Gate A (POC sintética): revisão formal de geometria/QA ainda pendente
- Gate B (aplicação ao `PILOT-001`): **NO-GO**
- Código de produção / implementação web funcional: **bloqueados**
- Saídas iniciais previstas: SVG e PDF
- DXF, gradação, nesting e 3D: fora do primeiro gate

## Princípios

- Kernel CAD paramétrico próprio
- Semântica de vestuário separada da geometria
- Projeto paramétrico versionado como fonte editável
- Validação geométrica, de costura, escala e prova física
- Dependências externas classificadas e auditadas
- Resultados `NOT_RUN` e `NOT_YET_DEFINED` nunca contam como aprovação

## Documento mestre

A fonte única de verdade do projeto é `docs/MASTER-DOCUMENT.md`. Em caso de divergência, ele prevalece sobre minutas, handoffs e documentos especializados.

## Estado operacional

O estado executivo resumido está em `docs/PROJECT-STATUS.md`. As issues #1–#5 bloqueiam o Gate B; a #6 acompanha a POC sintética e a #7 coordena os GO/NO-GO.

## Documentação

- `docs/MASTER-DOCUMENT.md`
- `docs/PROJECT-STATUS.md`
- `docs/00-product-vision.md`
- `docs/01-baseline-v0.5.md` — histórico
- `docs/domain/SPEC-PILOT-001.md`
- `docs/architecture/GEOM-001.md`
- `docs/qa/QA-PILOT-001.md`
- `docs/architecture/PROJECT-FORMAT-001.md`
- `docs/compliance/DEPENDENCIES.md`
- `docs/compliance/SBOM-POC.md`
- `docs/compliance/EXTERNAL-ASSET-REGISTER.md`
- `docs/decisions/ADR-0001-product-scope.md`
- `docs/decisions/ADR-0002-synthetic-poc-scope.md`
