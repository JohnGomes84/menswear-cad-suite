# SPEC-PILOT-001 — Flat Shirt Core

Status: DRAFT 0.1

## Entradas confirmadas do bloco
- chest
- scye_depth
- back_neck_to_waist
- neck_size
- half_back
- garment_length
- one_piece_sleeve_length
- close_wrist

## Medidas relacionadas, mas não equivalentes por padrão
- `shirt_sleeve_length` não deve alimentar silenciosamente `one_piece_sleeve_length`.
- `wrist_circumference` não deve ser automaticamente tratado como `close_wrist` até validação.

## Regras de modelagem
A matriz ponto-a-ponto será registrada aqui com:
`ID -> fórmula -> entradas -> dependências -> geometria -> margem -> semântica -> SeamPair -> validação`.

## Margens
A margem é propriedade por aresta, não um valor único por peça.

## Estado
Pendente de auditoria ponto-a-ponto contra texto e diagrama da referência técnica.
