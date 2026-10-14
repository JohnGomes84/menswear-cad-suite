# CH02-INDUSTRIAL-TOPOLOGY-AUDIT-001 — da geometria de construção à função de vestuário

**Data:** 13/10/2026 · **Estado:** `TEXT_FUNCTION_REVIEWED / DIAGRAM_SCOPE_PARTIAL / NO_CUT`.  
**Fonte primária inspecionada:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª ed., PDF do usuário, pp. 31–34 (texto das construções e diagrama original p. 34).  
**Dados auditáveis:** [CH02-INDUSTRIAL-TOPOLOGY-CANDIDATES-001.json](CH02-INDUSTRIAL-TOPOLOGY-CANDIDATES-001.json).  
**Base existente:** [CH02-SOURCE-LINES-001.json](CH02-SOURCE-LINES-001.json), [CH02-EXPLICIT-STROKES-AUDIT-001.md](CH02-EXPLICIT-STROKES-AUDIT-001.md), [GARMENT-SEMANTICS-001.md](../architecture/GARMENT-SEMANTICS-001.md).

## 1. Objetivo e regra de prova

Prosseguir do registro de 16 comandos explícitos de traçado (8 retas / 8 curvas pendentes), **sem reinterpretar um caminho de construção como aresta pronta para costurar ou cortar**. Esta etapa registra *funções industriais mencionadas pelo livro* e *relações observadas visualmente* que poderão alimentar futura topologia. Não cria ou altera `SemanticEdge`, `SeamPair`, curva, margem, saída de corte ou regra de produção.

Há quatro níveis independentes:
1. `TEXT_EXPLICIT_FUNCTION`: o texto atribui uma função a um conjunto de traçados, por exemplo *costura interna da perna*.
2. `SOURCE_COMMAND`: o texto prescreve reta/curva entre pontos, conforme o registro anterior.
3. `DIAGRAM_OBSERVED`: a imagem mostra a posição/aparência das linhas; pode exigir normalização da topologia e variantes.
4. `INDUSTRIAL_EDGE_APPROVED`: somente quando ponto a ponto, orientação, curva, costura/corte, montagem e margem estiverem reconciliados. **Não atingido**.

Um gráfico de dependência não é um desenho industrial; uma linha explícita do livro tampouco equivale automaticamente a uma linha de corte.

## 2. Achados novos e rastreabilidade do livro

### 2.1 A função da entreperna está nomeada no texto

O livro identifica expressamente os segmentos superiores e inferiores da **costura interna da perna** nas pp. 32–33. Isto sustenta uma *função candidata* ligada aos comandos já registrados, não autoriza uma `SEAM_LINE` executável. `CURVE` continua sem spline aprovada:

| Bloco | Região | Curva superior (comando) | Reta inferior (comando) | Página |
|---|---|---|---|---:|
| Uma peça | Frente | `1P-FRONT_UPPER_INSEAM` (8–11) | `1P-FRONT_LOWER_INSEAM` (9–11) | 32 |
| Uma peça | Costas | `1P-BACK_UPPER_INSEAM` (16–18) | `1P-BACK_LOWER_INSEAM` (17–18) | 32 |
| Duas peças | Frente | `2P-FRONT_UPPER_INSEAM` (8–15) | `2P-FRONT_LOWER_INSEAM` (13–15) | 33 |
| Duas peças | Costas | `2P-BACK_UPPER_INSEAM` (21–25) | `2P-BACK_LOWER_INSEAM` (24–25) | 33 |

Os identificadores do quadro são abreviações de `ALD-CH02-...`, resolvidos integralmente no JSON. **Não** equivalem a comprimentos compatíveis, orientação aprovada, arestas de corte ou margens por trecho. A presença de linha reta desenhável só confirma cálculo de segmento.

### 2.2 Uma peça: traçar, espelhar e reunir as laterais

Nas pp. 32–33, Aldrich ordena traçar contorno posterior (linha mais pesada), contorno anterior (linha pontilhada), espelhar a frente e reunir as laterais. O diagrama p. 34 inclui desenho **intermediário** e desenho da **composição final**, onde a referência central 0–2 aparece internamente entre regiões `back`/`front`.

Implicação: essa referência **não pode ser convertida em corte exterior** por seguir apenas os pontos 0–1–3–2 do desenho de construção. Não declarar automaticamente `FOLD_LINE` nem costura: a operação de espelhamento não foi executada e o papel exato da referência não foi normalizado. O produto final necessita de transformação geométrica, união/topologia de contornos e verificação da aresta efetivamente externa.

### 2.3 Duas peças: diferenciar frente e costas sem fundir os contornos

O diagrama p. 34 usa traçado pontilhado e contínuo para distinguir frente e costas superpostos na **construção**; isto não significa uma peça física única. Os comandos 1–12 (frente) e 18–22 (costas) localizam guias/posições de joelho, mas não são explicitamente nomeados como costuras de união. Não é permitido promovê-los a `SEAM_LINE`, `CUT_LINE` ou `GRAINLINE` sem evidência suplementar.

### 2.4 Margens: exceção de região não é exceção de aresta

A regra geral da p. 31 descreve **10 mm de margem já incluídos**, exceto onde indicado. O diagrama da p. 34 marca ausência de margem na região superior (cintura) e inferior (barra) para os **dois blocos**; o desenho de montagem da peça única repete a informação e não deve gerar eventos de margem duplicados.

Registros preservados:
- `ONE_PIECE:UPPER_WAIST` e `ONE_PIECE:LOWER_HEM`.
- `TWO_PIECE:UPPER_WAIST` e `TWO_PIECE:LOWER_HEM`.

Todos ficam `REGION_CONFIRMED_EDGE_SCOPE_NOT_MAPPED`, com `edgeIds=[]` e `offsetAllowed=false`. Não há prova de que toda uma linha entre pontos específicos esteja abrangida pelo rótulo. **É vedado adicionar 10 mm automaticamente**, ou subtraí-los globalmente para suposta linha líquida.

## 3. Matriz de promoção bloqueada

| Evidência disponível | Pode registrar agora | Não pode registrar ainda |
|---|---|---|
| Texto: costura interna da perna | `INSIDE_LEG_SEAM_TEXT_EXPLICIT` como **candidato** | `SemanticEdge.role=SEAM_LINE` |
| Texto: reta prescrita | `SOURCE_COMMAND`, coordenadas de pontos e comprimento diagnóstico | contorno de corte ou fechamento de peça |
| Texto: curva prescrita | pontos de passagem e cota geométrica da fonte | Bézier/tangente inferida sem validação |
| Diagrama: frente pontilhada/costas contínuas | distinção visual de regiões | classificação automática de todas as arestas |
| Diagrama: composição de uma peça | transformação de espelhamento como requisito | união executada; dobra/corte presumidos |
| Rótulos de margem | quatro regiões de exceção | `edgeId` ou offset industrial definitivo |

**Invariantes:** `cutReady=false`; `physicalFit=NOT_RUN`; `curveGeometry=NOT_RUN`; `sourceExceptionToEdge=NOT_YET_DEFINED`; `seamPair=NOT_RUN`; `pilot001=NO_GO`; `commercial=NO_GO`.

## 4. Critérios verificáveis para o próximo gate

1. Reconstruir **cada percurso orientado** da frente e das costas nas duas famílias e variantes, em camadas separadas: fonte/dedução/industrial, com pontos e ligações suficientes para fechar um contorno **apenas se** a fonte o permitir.
2. Auditar contorno do desenho de construção **versus** contorno do molde após as operações de espelhamento/alinhamento; a referência interna 0–2 deve permanecer distinta de uma borda externa enquanto não houver prova em contrário.
3. Associar a cada aresta proposta uma `sourceCommandId` ou prova explícita de diagrama, função candidata, coordenadas, orientação e grau de certeza; **sem preencher lacunas por interpolação gratuita**.
4. Resolver as quatro chamadas de `no seam allowance` por escopo de aresta/trecho, com método de interpretação e revisão independente; a margem já incluída não deve ser duplicada.
5. Resolver curvas com restrições de fonte, testar continuidade, autofechamento, autointerseção, acabamento, `SeamPair` e folgas; depois QA de escala física e toile com modelista.
6. Reexecutar testes automatizados pertinentes quando houver alteração de código; este PR **não** altera código nem declara testes de integração executados.

## 5. Limites e decisão

A análise fundamenta o inventário de **quatro conjuntos de entreperna** com função textual e **cinco observações complementares**. Ela **não** confirma acabamento de cintura/barra por aresta, papel do eixo final, geometria completa, par de costuras, corte, encaixe ou caimento.

**Decisão documental:** avança o conhecimento e a rastreabilidade do CH02; mantém `ALD-CH02-01=TEXT_REVIEWED/DIAGRAM_PARTIAL`, Gate B `PILOT-001=NO_GO`, produção e comercialização bloqueadas. A camisa `PILOT-001` continua sendo o escopo formal; a investigação da calça CH02 é uma trilha de infraestrutura/pesquisa, não sua substituição.
