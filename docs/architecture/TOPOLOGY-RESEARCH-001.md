# TOPOLOGY-RESEARCH-001 — Topologia orientada independente de família de roupa

**Versão:** `topology-research/0.1.0` · **Estado:** contrato experimental `RESEARCH_ONLY` · **Unidade canônica:** mm.  
**Âmbito:** todos os métodos do CAD paramétrico; aplicação inaugural ao CH02 de Aldrich.  
**Implementação:** `prototype/web-app/src/topologyResearch.ts`; testes `topologyResearch.test.ts`.

## Problema de engenharia

Uma receita de pontos, um conjunto de traços desenhados, uma peça de tecido e um contorno de corte são **objetos distintos**. A cadeia `sourceStroke → oriented segment → connected source path` comprova apenas **conectividade nominal de comandos**; não resolve curva, união de peças, margem, costura nem perímetro industrial.

### Camadas e fronteiras explícitas

1. **`SOURCE_CONSTRUCTION`**: sequência de comandos *realmente prescritos* na fonte, cada segmento com `sourceCommandId`, sentido `FORWARD`/`REVERSED`, extremos, condição geométrica e método/seção. Traços de dependência do interpretador **não** entram por padrão. Uma cadeia é `OPEN_SOURCE_STROKE_CHAIN` mesmo quando a posição nominal dos extremos se encontra.
2. **Operações de montagem pendentes**: transformações de espelhamento, alinhamento ou composição quando explicitamente documentadas. `DOCUMENTED_NOT_EXECUTED` não altera coordenadas, geometria ou topologia.
3. **`INDUSTRIAL_PERIMETER`**: interface de bloqueio, com `NOT_YET_DEFINED`, sem arestas industriais aceitas. A topologia real só poderá ser derivada após a fonte, a geometria e a validação de fabricação aprovarem a conversão.

### Condições de aceitação do validador

- Cada comando deve pertencer à seção e ao método corretos, ser único e possuir pelo menos dois pontos, com extremos diferentes.
- Para cada segmento, os extremos precisam coincidir com a ordem direta ou **inversa** da sequência de pontos explicitamente indicada na fonte; os pontos intermediários de uma curva são preservados na sequência orientada.
- A extremidade final de cada segmento coincide nominalmente com a inicial do segmento seguinte. Uma lacuna entre comandos falha, mesmo que o desenho pareça contíguo.
- Curvas com só pontos de passagem ficam `CURVE_REQUIREMENTS_PENDING`; retas são `STRAIGHT_ENDPOINTS_ONLY`. **Nenhuma spline é gerada**. A validade nominal não equivale a geometria desenhável em escala.
- Todos os percursos exigem um bloqueio `INDUSTRIAL_PERIMETER/NOT_YET_DEFINED` sem `approvedEdgeIds`. Exceções regionais de margem ficam sem `edgeIds` e com `offsetAllowed=false`.
- A API rejeita campos extras, incluindo `role=CUT_LINE`, `cutReady=true`, espelhamento alegadamente executado e vinculação arbitrária de margens.

### Interface do motor universal

`inspectResearchTopology(input: unknown, source: readonly SourceStroke[]): TopologyResearchReport`

Opera apenas sobre IDs e semântica de origem; não importa Aldrich, FreeSewing, React ou qualquer outro tipo de roupa. É determinística e falha explicitamente em dados ilegais. Retorna cadeias orientadas, quantidade de curvas pendentes e **sempre** `cutReady=false`, `isGeometricallyResolved=false`, `isCutBoundary=false`.

### Limites do algoritmo (deliberados)

Ainda **não** prova: interseções geométricas, tangência, coincidência espacial dos pontos, orientação do polígono, fechamento, zonas externas/internas após transformações, linha de costura versus corte, `SeamPair`, ease, margem, impribilidade, gradação, nesting ou caimento físico. O fato de usar IDs coincidentes comprova conectividade combinatória, não coincidência métrica sob transformações futuras.

Uma versão futura de produção deverá usar outro **gate**, com contornos geometricamente resolvidos e validação independente da fonte e da montagem. É proibida promoção automática de um documento `topology-research/0.1.0` a molde liberado.

## Critérios de evolução

1. Registrar perímetros completos com proveniência visual/textual por trecho; não criar segmento hipotético para fechar cadeia.
2. Modelar transformações de montagem com sistemas de coordenadas, tolerância e provas de correspondência; manter histórico de operações.
3. Aprovar soluções de curva com condições geométricas reproduzíveis e inspeção de modelista.
4. Distinguir linha líquida (`seam_geometry`) e linha de corte (`cut_geometry`) antes de tratar exceções regionais de margens já incluídas.
5. Promover para runtime de produto apenas com QA independente, scale-test 1:1, prova física e avaliação de licenças.
