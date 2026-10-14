# Menswear CAD Suite

**Produto-alvo:** suíte CAD paramétrica de **modelagem masculina em múltiplas famílias** (calças, camisas, jeans, alfaiataria, sobrepeças, mangas, golas, adaptações e gradação), fundamentada em toda a obra de referência. O piloto de camisa plana é somente um caso de engenharia.

Suíte CAD paramétrica web para modelagem masculina, com editor avançado e suporte a uso sob medida, ateliê, modelistas e confecções.

## Prioridade operacional (14/10/2026)

**Congelamento de expansão experimental:** não ampliar novas funcionalidades nos laboratórios CH02, FreeSewing ou editor sem resolver primeiro os bloqueios de domínio/QA. A [PR #57](https://github.com/JohnGomes84/menswear-cad-suite/pull/57) foi mesclada em 14/10/2026 (commit `8f1e1d80`), integrando a baseline 1.29 à `main`; o app contém um workspace CH02 de **pesquisa**, não um molde de produção.

**Marco crítico = [Issue #26](https://github.com/JohnGomes84/menswear-cad-suite/issues/26):** parecer profissional com evidência sobre as pendências do bloco da camisa (#1–#5). Sem decisão formal, **Gate B NO-GO**. [Issue #7](https://github.com/JohnGomes84/menswear-cad-suite/issues/7) mantém **Gate A IN_REVIEW** até revisão geométrica/QA, referência independente e escala física. O pacote de revisão já está em `docs/domain/MODELING-REVIEW-PACKET-001.md`.

Manutenção técnica do spike não altera as regras de modelagem nem autoriza produção. Informações de `npm audit` devem ser verificadas com a CI específica; integração externa permanece isolada e release de segurança pendente.

## Estado atual

- Documento Mestre: **baseline 1.29 DRAFT**, integrada à `main`
- Piloto formal: `PILOT-001 — Flat Shirt Core`
- POC geométrica sintética: **incorporada à `main`; 27/27 testes aprovados no GitHub Actions (escopo sintético)**
- Gate A (POC sintética): revisão formal de geometria/QA ainda pendente
- Gate B (aplicação ao `PILOT-001`): **NO-GO**
- Fundação experimental do web app: editor geométrico sintético e workspace paramétrico de pesquisa CH02; **182/182 unitários, 10/10 E2E Chromium e build PASS** na validação do PR #57
- Código de produção / implementação web funcional de molde real: **bloqueados**
- `npm audit` do pacote web: **0 achados conhecidos** após patches Vite 7.3.7 / Vitest 5.0.4; spike FreeSewing: **10 achados (9 altos, 1 moderado), ISOLATED / NO_RELEASE**
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


**Constraints 0.4:** contrato experimental de persistência/reavaliação de relações dirigidas em `prototype/web-app/src/constrainedSceneV4.ts`, independente de camisas/calças. Testado em 93 casos unitários; **a UI 0.4 ainda é pendente**. [Contrato](docs/architecture/CONSTRAINTS-V4-001.md).


## Motor de instruções do livro (experimento)

Em `prototype/web-app/src/draftingInterpreter.ts`, medidas e expressões paramétricas são executadas conforme uma sequência de passos com rastreabilidade a capítulo e página. Os programas CH02 de frente de calça estão em `aldCh02FlatTrouserProgram.ts` — **não são moldes prontos**. [Contrato e limitações](docs/architecture/PATTERN-INSTRUCTION-001.md). A lógica aplica-se a outros métodos somente quando as suas instruções forem individualmente auditadas.


## Back section e curvas — capítulo 2

Os pontos de pesquisa das costas dos blocos flat de uma e duas peças seguem as instruções da obra em `aldCh02FlatTrouserBackProgram.ts`. As técnicas e condições para desenhar curvas de gancho/entreperna estão especificadas em [CURVES-RESEARCH-001](docs/domain/CURVES-RESEARCH-001.md) e [CH02-CURVE-REQUIREMENTS-001.json](docs/domain/CH02-CURVE-REQUIREMENTS-001.json). **Nenhuma curva de produção foi inventada ou aprovada.**


## Prova vertical com tecnologia reutilizada

A análise de reaproveitamento **de todo o CAD** está documentada em [REUSE-DECISION-001](docs/architecture/REUSE-DECISION-001.md), não apenas de curvas. A [POC independente](prototype/integration-spike/) usa a biblioteca real `@freesewing/core@4.0.0` para converter **coordenadas calculadas pelo interpretador de Aldrich** em guias vetoriais medidos, anotados e entregues como SVG diagnóstico + JSON de rastreabilidade. [CI de integração](https://github.com/JohnGomes84/menswear-cad-suite/actions/workflows/integration-spike.yml): 9 testes, artefatos de pesquisa. Nenhum molde real, anotação de produção, grade ou PDF de corte é liberado.


## Contêineres Part e anotações técnicas — somente POC

A segunda etapa da integração FreeSewing usa os contêineres `Part` para referências calculadas a partir do CH02, com isolamento rigoroso entre conectores de dependência, costura e corte. A macro real `grainline` e o marcador `Snippet(notch)` foram testados **somente em desenho sintético**, sem atribuí-los ao método da obra. [Contrato e limites](docs/architecture/PIECE-ANNOTATION-SEMANTICS-001.md) · [QA](docs/qa/QA-PART-ANNOTATIONS-001.md). `CUT_READY=false` permanece obrigatório.


## Semântica independente de fornecedor — com bloqueios de produção

A [especificação de entidades](docs/architecture/GARMENT-SEMANTICS-001.md) distingue construção, costura, corte, barra, dobra, margem, fio e pique, com proveniência por instrução e esquema próprio `garment-semantic/0.1.0`. Os testes [QA-GARMENT-SEMANTICS-001](docs/qa/QA-GARMENT-SEMANTICS-001.md) impedem rótulos industriais em dados ainda `RESEARCH_ONLY`. O [lab FreeSewing](prototype/integration-spike/) compara coordenadas, arestas e passos e gera o relatório adicional `ch02-semantic-contract.json`. **Aldrich CH02 informa 10 mm de costura já incluídos, com exceções**; nenhuma margem é adicionada automaticamente sem identificar linha real e exceção no diagrama. Não há molde de produção validado.


## Linhas expressamente mandadas desenhar pela obra — capítulo 2

A auditoria [CH02-EXPLICIT-STROKES-AUDIT-001](docs/domain/CH02-EXPLICIT-STROKES-AUDIT-001.md) separa **16 comandos explícitos** da calça plana (8 retas, 8 curvas) dos conectores de cálculo. Os comandos são registrados em [JSON de origem](docs/domain/CH02-SOURCE-LINES-001.json) com páginas, referências e estado. A integração real do FreeSewing gera **somente as retas**; curvas, costuras, cortes, espelhamento e margens continuam não aprovados. O diagrama PDF p.34 possui rótulos de ausência de margem na cintura/barra, porém a abrangência por aresta permanece pendente. [QA](docs/qa/QA-CH02-EXPLICIT-STROKES-001.md).
