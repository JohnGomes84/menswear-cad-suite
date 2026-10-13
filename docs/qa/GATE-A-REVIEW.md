# Gate A — revisão de engenharia da POC sintética

**Estado:** IN_REVIEW; decisão final GO/NO-GO não emitida.  
**Escopo:** somente mecanismos geométricos genéricos. Nunca extrapolar a aprovação para o `PILOT-001`.

## Evidências disponíveis

- Implementação e relatório em `poc/geometry-synthetic/`.
- 14 testes originais reportados como PASS em execuções anteriores e novamente verificados em CI.
- Casos adicionais independentes propostos em `test_geometry_regression.py`: 3-4-5 analítico, parametrização não uniforme, invariância por translação/escala, derivada nula na origem, interseções de extremidade/sobreposição e join style inválido.
- Workflow proposto para executar a suíte, gerar artefatos e comparar hashes dentro do mesmo runner.
- Referência da curva geral atual é numérica calculada pelo próprio integrador; **não** é benchmark matemático independente.

## Checklist de aceite técnico

| Critério | Evidência requerida | Estado antes da CI |
|---|---|---|
| Testes legados | 14 testes, sem regressões | PASS_CI — 2026-10-13 |
| Novas fixtures analíticas | linha de comprimento conhecido independente do integrador | PASS_CI — 2026-10-13 |
| Invariância geométrica | translação, escala, sentido, parâmetros | PASS_CI — 2026-10-13 |
| Entrada degenerada | erro/diagnóstico explícito | PASS_CI nos casos cobertos |
| Interseções tangenciais/colineares | classificação e contorno | PASS_CI para toque terminal/sobreposição |
| Offsets difíceis | split, colapso e auto-interseção em casos adicionais | NOT_YET_DEFINED |
| Limite de recursão do integrador | sinalização de não convergência em vez de precisão presumida | PASS_CI (PR #19; sem garantia global de erro) |
| Limite de subdivisão da tesselação | sinalização de erro/tolerância não atendida | PASS_CI (PR #19; sem garantia global de erro) |
| PDF em escala física | imprimir régua, medir e registrar leitor/impressora | NOT_RUN |
| Revisão de geometria e QA | aprovação explícita baseada em evidências | NOT_RUN |

## Execução verificada no GitHub Actions

- [Run push #38453619464](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38453619464): **SUCCESS**, 23 testes executados, `OK`.
- [Run PR #38453659870](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38453659870): **SUCCESS**.
- Estrutura do JSON, largura/altura nominal SVG e cabeçalho PDF: **PASS_CI**.
- Duas gerações consecutivas no mesmo runner produziram hashes idênticos: **PASS_CI** para reprodutibilidade restrita ao mesmo ambiente.
- Nenhuma impressão física foi medida; testes com geometria analítica não abrangem a garantia geral de erro do integrador.

## Riscos identificados no código

1. **Mitigado no PR #19:** `_adaptive_simpson` agora sinaliza recursão esgotada e erro não finito. O estimador Simpson ainda exige validação independente antes de estabelecer contrato global de erro.
2. **Mitigado no PR #19:** `flatten` agora sinaliza `max_depth` atingido sem satisfazer `flatness`; a relação entre flatness dos controles e desvio máximo global ainda não está comprovada.
3. `validity_status` só mede comprimento quase nulo; não testa cuspidez, loops, sobreposição, auto-interseção nem aptidão para offset.
4. `offset_polygon` faz buffer poligonal constante; não implementa largura por aresta nem linha líquida/linha de corte.
5. PDF diagnóstico só comprova dimensões nominais do arquivo. Não comprova impressão em escala real.

## Critério de fechamento

A Issue #6 poderá obter **GO para conclusão da POC sintética** após execução reprodutível da CI, verificação dos riscos críticos, benchmark independente e revisão formal documentada. Pode-se emitir GO **com limitações explicitamente aceitas** se a decisão estabelecer que as falhas permanecem fora do contrato da POC, mas não as apagar. A Issue #7 registra a decisão.

Gate B (`PILOT-001`) permanece **NO-GO**.

## Revisão incremental — PR #19

- [Workflow #38454065254](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38454065254): **SUCCESS**, 27 testes, `OK`.
- [PR #19](https://github.com/JohnGomes84/menswear-cad-suite/pull/19): incorporado à `main`; tratamento explícito de não convergência, overflow e limites de tesselação.
- Falha explícita foi comprovada nos cenários testados. Cota geral de precisão, quadratura independente de uma curva complexa e escala medida em papel continuam pendentes.
- Este documento representa avaliação técnica baseada em código e CI; não equivale a aprovação independente de modelagem ou QA de produção.
