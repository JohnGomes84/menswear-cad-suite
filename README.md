# Menswear CAD Suite

**Produto-alvo:** suíte CAD paramétrica de **modelagem masculina em múltiplas famílias** (calças, camisas, jeans, alfaiataria, sobrepeças, mangas, golas, adaptações e gradação), fundamentada em toda a obra de referência. O piloto de camisa plana é somente um caso de engenharia.

Suíte CAD paramétrica web para modelagem masculina, com editor avançado e suporte a uso sob medida, ateliê, modelistas e confecções.

## Estado atual

- Documento Mestre: **baseline 1.19 DRAFT**
- Piloto formal: `PILOT-001 — Flat Shirt Core`
- POC geométrica sintética: **incorporada à `main`; 27/27 testes aprovados no GitHub Actions (escopo sintético)**
- Gate A (POC sintética): revisão formal de geometria/QA ainda pendente
- Gate B (aplicação ao `PILOT-001`): **NO-GO**
- Fundação experimental do web app: **editor com múltiplos grupos, linhas e curvas sintéticas** em `prototype/web-app`; Gate APP limitado
- Código de produção / implementação web funcional de molde real: **bloqueados**
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

O estado executivo resumido está em `docs/PROJECT-STATUS.md` e o início experimental web está delimitado em `docs/gates/GATE-APP-001.md`. As issues #1–#5 bloqueiam o Gate B; a #6 acompanha a POC sintética e a #7 coordena os GO/NO-GO.

## Documentação

- `prototype/web-app/README.md` — protótipo web isolado, sem molde real
- `prototype/web-app/SCENE-LAB.md` — laboratório multi-entidades 0.2.0
- `docs/architecture/APP-SCENE-002.md` — contrato da cena multi-entidades
- `docs/MASTER-DOCUMENT.md`
- `docs/product/BOOK-COVERAGE-001.md` — inventário dos 14 capítulos, não implementação
- `docs/product/PATTERN-CATALOG-001.json` — 54 assuntos candidatos; 53 TOC_ONLY e 1 TEXT_REVIEWED; todos NOT_STARTED
- `docs/decisions/ADR-0004-full-book-product-coverage.md`
- `docs/gates/GATE-APP-001.md`
- `docs/architecture/APP-FOUNDATION-001.md`
- `docs/qa/QA-APP-001.md`
- `docs/domain/PILOT-001-OPEN-DECISIONS.md`
- `docs/decisions/ADR-0003-experimental-app-foundation.md`
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

## Laboratório transacional — QA atual

Editor multi-entidades com comandos de criar/excluir/mover e arquivo sintético 0.3.0; 50 testes de contrato e 4 E2E Chromium. Não representa moldes de roupas. [Guia](prototype/web-app/SCENE-LAB.md).


## Engenharia CAD em execução

- `src/constraints.ts`: solver **experimental dirigido** para coincidência, horizontalidade, verticalidade e distância, independente de família de roupa.
- `docs/governance/DELIVERY-OPERATING-MODEL.md`: responsabilidades, evidências, gates e operação por PR.
- `docs/architecture/CONSTRAINTS-001.md`: contratos e limites do solver.
- Testes experimentais desta evolução: **65 unitários + 6 E2E Chromium**; nenhum molde real aprovado.


## Auditoria do livro — fora do piloto da camisa

`ALD-CH02-01`: auditoria **textual** do bloco de calças *flat* (uma e duas peças), PDF pp. 31–34, com fixture escalar de amostra. Geometria/diagramas/caimento ainda não aprovados. Veja `docs/domain/RESEARCH-CH02-FLAT-TROUSERS-001.md`.


**Pesquisa de calças CH02:** esqueleto de pontos da frente para blocos flat de uma e duas peças em milímetros, [documentado](docs/domain/CH02-DIAGRAM-001.md) e testado. Sem curva, contorno de corte ou molde aprovado.
