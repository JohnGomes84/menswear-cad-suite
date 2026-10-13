# QA-CONSTRAINTS-001 — Testes do solver de constraints genéricas

**Estado:** UNIT_TEST_CANDIDATE; aguarda/acompanha CI do PR. Não valida blocos do livro.

| ID | Cenário | Aceite | Escopo |
|---|---|---|---|
| C-01 | Horizontal / vertical | Coordenada orientada igual, coordenada livre preservada | matemática |
| C-02 | Coincidência entre grupos | Pontos coincidentes; identidades preservadas | modelagem de dados |
| C-03 | Distância euclidiana | Comprimento em mm e orientação original mantida | numérico |
| C-04 | Distância nula | Coincidência | numérico |
| C-05 | Dependências em sequência | Ordem topológica e entrada reordenada com resultado idêntico | determinismo |
| C-06 | Ciclos / auto-dependências | `BLOCKED` explícito | segurança |
| C-07 | Alvo com duas regras | `BLOCKED`, sem solução silenciosa incompleta | semântica |
| C-08 | Comprimento positivo sem direção | `UNDETERMINED_DIRECTION` | geometria |
| C-09 | Coordenada não finita, overflow, referência inexistente | Rejeição explícita, sem geometria inválida exportável | robustez |
| C-10 | Tolerância experimental inválida | Falha explícita | robustez |
| C-11 | Sem constraints | Geometria preservada, movimentos vazios | determinismo |
| C-12 | Objetos de origem | Nenhuma mutação dos dados originais | integridade |

A lista de critérios é contrato experimental, não uma declaração de cobertura industrial. E2E com constraints, persistência e execução de regras do livro ainda `NOT_RUN`.

**Critério para merge:** CI do PR com testes + build TS/Vite `success`, documentação coerente e Gate B ainda explícito como NO-GO.
