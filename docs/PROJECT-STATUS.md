# Project Status — Menswear CAD Suite

**Data:** 13/10/2026  
**Fonte de verdade:** `docs/MASTER-DOCUMENT.md`  
**Baseline corrente:** 1.10 DRAFT (proposta nesta branch)

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
