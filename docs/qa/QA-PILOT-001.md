# QA-PILOT-001 — Plano de Validação

Status: DRAFT 0.1

## Testes obrigatórios
- construção determinística de pontos;
- comprimento de curvas independente da tesselação;
- pique por comprimento de arco;
- orientação reversa de costuras parceiras;
- autointerseção e geometria degenerada;
- offsets côncavos/convexos;
- mudanças de margem por aresta;
- escala SVG/PDF;
- quadrado de calibração;
- impressão A4 a 100%;
- validação física do molde antes de alegação de produção.

## Estados
- PASS
- FAIL
- WARNING
- NOT_RUN
- NOT_YET_DEFINED

`NOT_RUN` e `NOT_YET_DEFINED` nunca contam como aprovação.
