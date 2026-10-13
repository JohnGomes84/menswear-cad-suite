# ADR-0002 — Escopo e autoridade da POC geométrica sintética

Status: Accepted  
Data: 13/10/2026

## Contexto

A especificação do `PILOT-001 — Flat Shirt Core` ainda possui questões de domínio abertas, mas parte do kernel geométrico pode ser validada sem depender de regras específicas do molde.

## Decisão

A POC geométrica sintética está autorizada antes do fechamento completo do domínio do `PILOT-001`.

Ela poderá testar apenas mecanismos genéricos e independentes do molde, incluindo:

- curvas paramétricas controladas;
- comprimento de arco;
- `point_at_arc_length`;
- discretização adaptativa;
- reversão de orientação;
- offsets;
- interseções e autointerseções;
- detecção de degenerações;
- exportação diagnóstica SVG/PDF;
- medição de erro e reprodutibilidade.

## Limite de autoridade

A aprovação da POC sintética **não** valida:

- fórmulas do `PILOT-001`;
- coordenadas/pontos do bloco;
- curvas específicas de cava ou manga;
- mapa de margens;
- `SeamPair`;
- `AssemblyEase`;
- piques funcionais do molde;
- caimento;
- aptidão para corte ou produção.

## Consequência

O projeto passa a trabalhar em dois fluxos paralelos:

1. POC geométrica sintética, para reduzir risco técnico do kernel.
2. Consolidação do domínio do `PILOT-001`, para desbloquear sua validação específica.

Código de produção e implementação web funcional permanecem bloqueados.
