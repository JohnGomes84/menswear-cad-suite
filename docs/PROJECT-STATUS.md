# Project Status — Menswear CAD Suite

**Data:** 13/10/2026  
**Fonte de verdade:** `docs/MASTER-DOCUMENT.md`  
**Baseline corrente:** 1.8 DRAFT

## Situação executiva

O projeto possui base suficiente para continuar a engenharia controlada. A POC geométrica sintética foi incorporada à `main` e registra 14/14 testes aprovados para mecanismos genéricos. Isso não valida o molde real.

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
