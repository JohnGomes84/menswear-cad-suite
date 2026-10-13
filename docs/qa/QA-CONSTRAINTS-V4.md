# QA-CONSTRAINTS-V4 — Plano e evidência do overlay 0.4

**Fonte:** `prototype/web-app/src/constrainedSceneV4.test.ts`.  
**Tipo:** testes de laboratório sintético; sem desenho de molde validado.  
**Status:** [CI web #38468690640](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38468690640) **93/93 testes PASS e build TypeScript/Vite aprovado**. Testes do overlay são unitários; ainda **NOT_RUN** para UI/E2E 0.4.

| Grupo | Aceite |
|---|---|
| Versionamento | Criar `0.4` só após migração explícita de projeto validado `0.3`; versão antiga rejeitada |
| Persistência | Roundtrip de JSON restaura regras, geometria dirigida e histórico |
| Reatividade | Alterar driver altera destino ligado; `driverEntities` mantém autoria |
| Reversibilidade | Undo/redo após importação, inclusive remoção de regra |
| Arestas difíceis | Ciclos, duas regras no mesmo alvo, ID reutilizado e distância sem orientação são bloqueados |
| Integridade | Rejeitar alterações parciais no resultado calculado ou no histórico |
| Segurança | Comandos desconhecidos, versões estranhas e referências inválidas não são executados |
| Limites | Uma regra por alvo, nenhuma edição de entidades no overlay e nenhuma validação industrial |

Os casos positivos da suíte não autorizam status `VALIDATED` de nenhum método do livro. `SOLVED` da geometria dirigida indica apenas que as relações matemáticas definidas para o experimento foram satisfeitas.
