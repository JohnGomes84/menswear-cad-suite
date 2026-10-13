# Gate A — revisão de engenharia da POC sintética

**Estado:** IN_REVIEW; decisão final GO/NO-GO não emitida.  
**Escopo:** somente mecanismos geométricos genéricos. Nunca extrapolar a aprovação para o `PILOT-001`.

## Evidências disponíveis

- Implementação e relatório em `poc/geometry-synthetic/`.
- 14 testes originais reportados como PASS em execuções anteriores.
- Casos adicionais independentes propostos em `test_geometry_regression.py`: 3-4-5 analítico, parametrização não uniforme, invariância por translação/escala, derivada nula na origem, interseções de extremidade/sobreposição e join style inválido.
- Workflow proposto para executar a suíte, gerar artefatos e comparar hashes dentro do mesmo runner.
- Referência da curva geral atual é numérica calculada pelo próprio integrador; **não** é benchmark matemático independente.

## Checklist de aceite técnico

| Critério | Evidência requerida | Estado antes da CI |
|---|---|---|
| Testes legados | 14 testes, sem regressões | PASS_REPORT (não reexecutado nesta revisão) |
| Novas fixtures analíticas | linha de comprimento conhecido independente do integrador | NOT_RUN |
| Invariância geométrica | translação, escala, sentido, parâmetros | NOT_RUN |
| Entrada degenerada | erro/diagnóstico explícito | NOT_RUN |
| Interseções tangenciais/colineares | classificação e contorno | NOT_RUN |
| Offsets difíceis | split, colapso e auto-interseção em casos adicionais | NOT_YET_DEFINED |
| Limite de recursão do integrador | sinalização de não convergência em vez de precisão presumida | NOT_YET_DEFINED |
| Limite de subdivisão da tesselação | sinalização de erro/tolerância não atendida | NOT_YET_DEFINED |
| PDF em escala física | imprimir régua, medir e registrar leitor/impressora | NOT_RUN |
| Revisão de geometria e QA | aprovação explícita baseada em evidências | NOT_RUN |

## Riscos identificados no código

1. `_adaptive_simpson` pode encerrar ao esgotar `depth` e retornar número sem indicar se satisfez `eps`. Não afirmar que sempre garante erro máximo de `eps`.
2. `flatten` encerra ao atingir `max_depth` mesmo se `flatness > tolerance_mm`; não há sinalização de tolerância insatisfeita.
3. `validity_status` só mede comprimento quase nulo; não testa cuspidez, loops, sobreposição, auto-interseção nem aptidão para offset.
4. `offset_polygon` faz buffer poligonal constante; não implementa largura por aresta nem linha líquida/linha de corte.
5. PDF diagnóstico só comprova dimensões nominais do arquivo. Não comprova impressão em escala real.

## Critério de fechamento

A Issue #6 poderá obter **GO para conclusão da POC sintética** após execução reprodutível da CI, verificação dos riscos críticos, benchmark independente e revisão formal documentada. Pode-se emitir GO **com limitações explicitamente aceitas** se a decisão estabelecer que as falhas permanecem fora do contrato da POC, mas não as apagar. A Issue #7 registra a decisão.

Gate B (`PILOT-001`) permanece **NO-GO**.
