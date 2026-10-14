# QA-TOPOLOGY-RESEARCH-001 — oráculos e resultados de percurso

**Escopo:** contrato universal independente de fonte (`topologyResearch.ts`) e fixture CH02 com dados de origem documentados, sem liberação de molde. **Não substitui inspeção do PDF.**

| ID | Caso / invariante | Resultado esperado |
|---|---|---|
| T01 | Quatro caminhos CH02, três segmentos cada | `PASS_RESEARCH_TOPOLOGY_ONLY` |
| T02 | Caminhos 6-7-8-11-9; 13-14-16-18-17; 6-7-8-15-13; 17-19-21-25-24 | Igualdade exata |
| T03 | Oito curvas com posições/condições pendentes | `CURVE_REQUIREMENTS_PENDING` |
| T04 | Fonte inexistente, seção de outro método, IDs duplicados | Rejeitar |
| T05 | Extremo errado, ordem/reversão errada, descontinuidade entre comandos | Rejeitar |
| T06 | `CUT_LINE`, `INDUSTRIAL_PERIMETER` na cadeia ou outras propriedades ocultas | Rejeitar |
| T07 | `cutReady=true`, liberação de perímetro sem fonte | Rejeitar |
| T08 | Exceção de margem associada a `edgeIds` ou offset habilitado | Rejeitar |
| T09 | Espelhamento da peça única falsamente executado | Rejeitar |
| T10 | Fixture genérica não relacionada à calça | Validar, mas `cutReady=false` |

**Nível da evidência:** verificações unitárias de *proveniência e conectividade de IDs*. Mesmo que todos os testes passem, a ausência de curvas resolvidas e contornos fechados impede output industrial.

**Gate seguinte:** geometria metricamente resolvida por curva, perímetro orientado com role por aresta e operação explícita de montagem testada — tudo sujeito à revisão de modelista e QA físico.
