# APP-SCENE-003 — Comandos transacionais do esboço

**Estado:** implementação experimental sob revisão; não aprovada para produção.  
**Formato:** `0.3.0`; conversão a partir de `0.2.0` somente com confirmação explícita.

## Contrato

- `ADD_ENTITY`: identidade, grupo, geometria e índice de inserção.
- `REMOVE_ENTITY`: snapshot da entidade removida e índice.
- `MOVE_POINT`: identidade, índice e pontos antes/depois.
- Revisão crescente por evento, histórico reversível e descarte de redo em edição divergente.
- `initialEntities`: estado inicial que permite verificar a reprodução completa de eventos.

Validação reverte do estado atual ao inicial e reexecuta os eventos. Isso identifica inconsistências no histórico e alterações parciais, **não** prova autenticidade criptográfica do documento.

Sem criação de regras de camisa/calça, contornos industriais, margens de costura, offsets de produção ou PDF de corte. A geometria é inteiramente sintética e os grupos não são `PatternPiece` de vestuário.

**Próximo gate:** E2E no navegador, testes cruzados Python↔TS e operações de constraints. Gate B permanece NO-GO.
