# APP-SCENE-002 — Contrato experimental de múltiplas entidades

**Estado:** IMPLEMENTED_IN_EXPERIMENTAL_BRANCH; review and CI required.
**Referência:** `APP-FOUNDATION-001`, ADR-0003, ADR-0004 e `GATE-APP-001`.

## Objetivo
Demonstrar que o app aceita múltiplos segmentos e curvas e associa entidades a grupos separados, preservando IDs, unidade física canônica, eventos e limites de edição. Isso é um primeiro teste horizontal de CAD que não depende da família de camisa.

## Domínio
- `SketchPiece` é grupo lógico, ainda não `PatternPiece` de vestuário.
- `SketchEntity` tem `LINE` ou `CUBIC_BEZIER`, ID, `pieceId`, modo e pontos em mm.
- Histórico tem `MOVE_POINT` linear, com revisão global e valores antes/depois; validado na importação antes de construir undo.
- `formatVersion:"0.2.0"` é exclusivo do protótipo multi-entidades. Importações 0.1 são rejeitadas, mantendo editor legado intacto.

## Limitações de engenharia
1. Inserção/remoção de entidade, transforms, constraints e referências entre peças ainda não estão implementados.
2. Nenhuma curva pode ser interpretada automaticamente como cava, gancho, decote, linha de costura ou corte.
3. Sem validação física, exportação de moldes, regra de gradação, composição de contorno nem geometria industrial.
4. Testes unitários e build não substituem verificação de interação e desenho em browser real.

## Critério para próximo gate horizontal
Adicionar `ADD_ENTITY`/`REMOVE_ENTITY` transacionais, links geométricos entre entidades, histórico completo de regras e proveniência, além de teste end-to-end de viewport e seleção. Separar `PatternPiece` do grupo lógico apenas quando houver contrato de costura validado.
