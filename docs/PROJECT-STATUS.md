# Project Status — Menswear CAD Suite

**Data:** 13/10/2026  
**Fonte de verdade:** `docs/MASTER-DOCUMENT.md`  
**Baseline corrente:** 1.20 DRAFT (auditoria textual inicial de calça plana)

## Situação executiva

O projeto possui base suficiente para continuar a engenharia controlada. A POC geométrica sintética foi incorporada à `main` e registra 27/27 testes aprovados em CI para mecanismos genéricos. Isso não valida o molde real.

### Gate A — POC geométrica sintética
**Estado:** evidência técnica existente; revisão formal de geometria/QA ainda pendente.

Escopo validado apenas experimentalmente:
- Bézier cúbica sintética;
- comprimento de arco;
- `point_at_arc_length`;
- reversão de orientação;
- piques derivados de arco;
- discretização;
- interseções/degenerações;
- offsets sintéticos com Shapely;
- artefatos SVG/PDF diagnósticos.

### Gate B — aplicação ao PILOT-001
**Estado:** **NO-GO**.

Bloqueios rastreados:
1. Issue #1 — protocolo `one_piece_sleeve_length`;
2. Issue #2 — semântica de `close_wrist`;
3. Issue #3 — mapa de margens e junções;
4. Issue #4 — matriz geométrica/curvas/frente-costas;
5. Issue #5 — `SeamPair` e `AssemblyEase`;
6. revisão integrada das especificações e aplicação das evidências da POC ao domínio.

## Direção de trabalho

A prioridade não é ampliar pesquisa genérica. A prioridade é:
1. fechar decisões de modelagem das Issues #1–#5;
2. concluir a revisão formal do Gate A;
3. congelar contratos mínimos de `SeamEdge`, `SeamPair`, curvas, margens e formato;
4. só então abrir a POC geométrica específica do `PILOT-001`.

Frontend, autenticação, banco, editor final, gradação, DXF, nesting e 3D permanecem fora da execução atual.

## Governança

- Mudanças de regra ou geometria devem atualizar o Documento Mestre ou ADR correspondente.
- Documentos especializados não podem contradizer o Documento Mestre.
- Pesquisa deve distinguir claramente: evidência da fonte, inferência, proposta e decisão aprovada.
- Resultados documentais (`PASS_DOC`) não equivalem a execução do motor.
- POC sintética não equivale a validação do `PILOT-001`.
- Nenhuma tolerância física/comercial deve ser inventada antes de evidência de POC/impressão/toile.

## Avanço verificado nesta rodada — 13/10/2026

- PR #17: sincronização documental e de compliance; **MERGED**.
- PR #18: 9 testes adicionais e workflow de GitHub Actions; **MERGED**. 23/23 testes PASS_CI.
- PR #19: falha explícita em não convergência/overflow e limite de tesselação; **MERGED**. 27/27 testes PASS_CI.
- Evidência: [workflow #38454065254](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38454065254), sucesso com 27 testes; também passaram checks nominais dos artefatos e hashes iguais no mesmo runner.
- Gate A: **IN_REVIEW**, aguardando revisão formal e análise dos limites de precisão/calibração física.
- Gate B: **NO-GO**, sem golden case ou validação de cava/manga.


## Gate experimental web — proposta de início de implementação isolada

A base para um shell web com curvas sintéticas foi formalizada em `docs/gates/GATE-APP-001.md`, `docs/architecture/APP-FOUNDATION-001.md` e `docs/decisions/ADR-0003-experimental-app-foundation.md`. Esse escopo é **independente** do bloco Aldrich e não altera Gate B = NO-GO.

- TypeScript strict + React + Vite + viewport SVG como escolhas iniciais de engenharia, revisáveis.
- Contratos e requisitos de projeto sintético/undo/redo/validação em `docs/qa/QA-APP-001.md`.
- Nenhum app funcional ou schema de produção criado por esta decisão; critérios QA-APP seguem `NOT_RUN`.
- Integração com `PILOT-001`, dados pessoais, backend e exportação para corte permanecem bloqueadas.

## Pesquisa numérica complementar

Foi incluído na branch de pesquisa um benchmark Gauss-Legendre independente do integrador Simpson e um fixture matemático analítico de parábola. A primeira execução em CI da branch passou **30/30 testes**; merge e testes pós-merge ainda precisam ser confirmados.

## Fundação experimental do web app — implementação inicial

Foi criado na branch `prototype/web-shell-synthetic` um shell TypeScript/React/Vite/SVG em `prototype/web-app`. O editor usa **exclusivamente** uma curva Bézier sintética, suporta seleção/arraste de quatro pontos, zoom/pan, undo/redo em memória, JSON versionado (`0.1.0`) e avisos de proibição de corte.

A suíte inicial registra **8 testes de contrato PASS_CI** e build Vite/TypeScript bem-sucedido na [execução #38457022142](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38457022142). A árvore npm foi fixada em `package-lock.json`; a execução final com `npm ci` deverá ser confirmada antes do merge. O histórico de desfazer **não** é reconstituído após reabrir o JSON (embora os eventos sejam persistidos); comprimento de arco TS e `SeamPair` não estão implementados. Isso não libera Gate B ou release.

## Adaptador geométrico browser-side — revisão experimental

Na branch de engenharia `feat/ts-generic-geometry-adapter` foi implementada uma função Bézier em TypeScript independente da renderização SVG, com comprimento de arco e piques sintéticos por distância acumulada. A cobertura inclui 11 testes de fixture analítica, comparação estática com o benchmark Python, invariâncias e falhas explícitas. A UI mostra resultado em mm como *POC* e mantém `PILOT-001` como `NOT_YET_DEFINED`.

O adaptador ainda exige CI final, tratamento de curvas adversariais, política formal de erro e teste de interação no navegador. Não inclui `SeamEdge` real ou qualquer `SeamPair` do bloco da camisa, calça ou alfaiataria.

## Histórico do editor: restauração de sessões sintéticas

Na branch `fix/web-persisted-undo-history`, `createEditor` passa a validar a cadeia linear de eventos do projeto sintético e reconstruir snapshots de undo ao importar JSON. A suíte web passou em [CI #38459723728](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38459723728) com **23/23 testes** e compilação aprovada. O formato 0.1.0 **não** guarda estados anteriores de QA nem eventos paramétricos complexos; eles continuam fora do contrato aprovado.

## Iteração seguinte — catálogo verificável + editor multi-entidades (13/10/2026)

- [PR #34](https://github.com/JohnGomes84/menswear-cad-suite/pull/34) **MERGED**: `PATTERN-CATALOG-001.json`, 54 assuntos candidatos dos 14 capítulos do livro, validador/testes; conteúdo ainda `TOC_ONLY`.
- [PR #35](https://github.com/JohnGomes84/menswear-cad-suite/pull/35) **MERGED**: `SceneProject 0.2.0` com 2 grupos de esboço e 3 entidades geométricas, seleção/edição, movimentos reversíveis e arquivo sintético versionado. A cena não representa moldes reais.
- [CI #38461298308](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38461298308): **35 testes web PASS + build Vite/TypeScript**.
- [CI do catálogo](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38461068500): validou capítulos/IDs/status.
- Estado dos gates: APP experimental, A IN_REVIEW, B NO-GO.
- Pendências mais próximas: edição `ADD_ENTITY`/`REMOVE_ENTITY` com undo/redo, testes E2E reais de interação, auditoria método a método do livro e bloqueios de modelagem #1–#5.


## Execução browser e transações de entidades — 13/10/2026

PR #39 integrado com `ADD_ENTITY`, `REMOVE_ENTITY` e `MOVE_POINT`, JSON 0.3 e undo/redo entre sessões. [CI unitária #38463463286](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38463463286) passou **50/50 testes e build**. [CI Chromium #38463489072](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38463489072) passou **4/4 E2E** em branch de QA. Gate A IN_REVIEW e Gate B NO-GO.

## QA de navegador — fechamento do ciclo experimental

PR #41 integrado; [CI Chromium #38464138662](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38464138662) passou em **5/5 E2E**, incluindo contraste mínimo de 4,5:1 no aviso de não utilização para corte. Não representa auditoria de acessibilidade completa, prova física ou liberação do PILOT-001.


## Núcleo de constraints e operação multi-frente — rodada experimental

- Contrato de trabalho: `docs/governance/DELIVERY-OPERATING-MODEL.md` + templates de engenharia, modelagem e PR.
- `prototype/web-app/src/constraints.ts`: coincidência, horizontalidade, verticalidade e distância, uma constraint dirigida por alvo e DAG; projeção imutável, sem solver industrial.
- UI experimental: alinhar horizontal/vertical uma linha selecionada, com undo/redo pela movimentação de ponto; a regra não é persistida.
- [CI #38465429034](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38465429034): **65/65 testes PASS e build**.
- [CI E2E #38465429112](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38465429112): **6/6 cenários Chromium PASS**.
- Issues: #43 (constraints persistentes e simultâneas), #44 (primeiro método de calça do capítulo 2).
- O catálogo continua TOC_ONLY, a execução física do PDF não foi realizada, Gate B permanece NO-GO.


## Início efetivo de análise de outra família do livro — CH02

O registro `ALD-CH02-01` recebeu estado **TEXT_REVIEWED** com fonte em pp. 31–34 do PDF, documento `docs/domain/RESEARCH-CH02-FLAT-TROUSERS-001.md` e fixture aritmética para variantes básica/folgada. **53 registros** continuam `TOC_ONLY`; nenhum bloco real foi implementado ou validado. Diagramas e provas de modelagem ainda pendentes na Issue #44. Gate B PILOT-001 permanece NO-GO.


## Primeiro esqueleto coordenado de calça CH02

O diagrama da página 34 do livro foi inspecionado visualmente, permitindo orientar frente de calças flat de uma e duas peças. `src/flatTrouserResearch.ts` calcula apenas pontos/linhas auxiliares em mm, sem contorno ou curva aprovada. Documento `docs/domain/CH02-DIAGRAM-001.md`, catálogo marcado `PARTIAL_FRONT_GRID`. [CI #38467502627](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38467502627): **73/73 testes + build PASS**. Fonte e geometria parcial, prova de modelista/física pendente. Gate B NO-GO.


## Contrato 0.4 de constraints dirigidas persistentes

O motor de documento experimental `constrainedSceneV4.ts` separa drivers e coordenadas resolvidas, grava regras dirigidas com eventos e reconstrói undo/redo entre sessões. A mudança de origem reavalia o destino. [CI #38468690640](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38468690640): **93/93 testes web e build PASS**. **UI e E2E do schema 0.4 ainda não implementados**; o atual SceneLab segue com 0.3 e alinhamentos pontuais. Solver simultâneo e regras da obra continuam bloqueados/pendentes.
