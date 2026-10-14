# CONSTRAINTS-V4-001 — Persistência reativa de constraints dirigidas (laboratório)

**Formato:** `0.4.0` **experimental**, incompatível com `0.3.0` sem migração explícita.  
**Status:** motor e interface experimental implementados; validação local completa, CI do PR APP-004 pendente.
**Objetivo:** memorizar constraints e recalculá-las quando o ponto **de origem** mudar, sem confundir esse alcance com um solver paramétrico industrial.

## Documentos e duas geometrias

O `ConstrainedSceneV4` guarda:

- `baseScene`: `SceneProject 0.3.0` validado, **congelado** como estado de partida; entidades têm IDs, grupos, modo e pontos em mm.
- `history`: comandos com revisão monotônica e pré-condições (`ADD_CONSTRAINT`, `REMOVE_CONSTRAINT`, `MOVE_DRIVER`).
- `constraints`: relações dirigidas ativas, verificadas pela reprodução histórica.
- `driverEntities`: posições **autoriais** (antes da projeção).
- `resolvedEntities`: posições calculadas pelo solver a partir dos drivers e regras vigentes.

Essa separação impede que uma constraint temporária apague o desenho autoral. Retirar uma regra restaura a posição do driver, mesmo quando a projeção havia deslocado o ponto. A mudança de uma origem reavalia o destino dependente; movimento direto do destino condicionado é recusado.

## Contratos e validação

1. **Migração apenas explícita:** `migrateV3ToConstrainedV4` exige projeto 0.3 validado; `parseConstrainedV4` recusa versões anteriores/desconhecidas.
2. `ADD_CONSTRAINT` exige ID novo nunca utilizado no histórico; regras com referências inválidas, ciclos e destinos repetidos são recusadas.
3. `REMOVE_CONSTRAINT` exige snapshot integral da regra ativa e não reutiliza ID removido.
4. `MOVE_DRIVER` exige antes/depois finitos, `before` igual ao driver atual e entidade `FREE`; destinos condicionados não são dirigidos manualmente.
5. A importação **reexecuta toda a cadeia** sobre `baseScene` e exige equivalência das restrições, drivers e geometria resolvida serializados. Consistência histórica **não é assinatura digital**.
6. Undo/redo recompõe estados de constraints e geometria após salvar/reabrir; uma nova edição apaga o ramo `redo`.
7. Limites deliberados da POC: **256 eventos**, JSON até 1 MiB, motor de constraints em mm, tolerância **numérica experimental**.

## Limites remanescentes nesta etapa

- Solver simultâneo ou múltiplas regras no mesmo destino: o núcleo dirigido ainda exige uma regra por ponto de destino.
- Adição/remoção de entidades ao documento 0.4 (a composição de `baseScene` permanece fixa). A edição de regras acontece no modo 0.4 isolado; o laboratório 0.3 continua disponível sem substituição.
- Regras de moldes do livro, pences, `SeamPair`, `SeamAllowance`, tangências e exportação industrial.
- Precisão global garantida, calibração de impressão, validação de caimento/toile.

**Gate APP:** experimento; **Gate A:** IN_REVIEW; **Gate B** do PILOT-001: NO-GO.

**Evidência local do APP-004:** 184/184 testes unitários, TypeScript/Vite build PASS e 21/21 E2E Chromium; 11 E2E novos cobrem entrada/migração explícita, regras, drag reativo, rebase após mudança da base, conflitos, serialização, undo/redo, invariância de zoom/pan e layout móvel. O CI remoto ainda precisa confirmar o aceite do PR.

**Próxima ação:** concluir CI e revisão do APP-004; depois, qualquer solver simultâneo com graus de liberdade/conflitos deve ser tratado separadamente na Issue #43. Não usar esta UI ou schema para validar regras de vestuário.
