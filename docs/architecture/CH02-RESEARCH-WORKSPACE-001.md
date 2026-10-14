# CH02-RESEARCH-WORKSPACE-001 — interface de pesquisa parametrizada ligada à fonte

**Baseline proposta:** 1.29 DRAFT · **Modalidade:** LAB/RESEARCH_ONLY · **Fonte:** Aldrich, Metric Pattern Cutting for Menswear, 5ª ed., CH02, PDF pp.31–34.

## Problema resolvido

Até a baseline 1.28 a aplicação web tinha editor sintético e motores de cálculo auditados separados do fluxo visível: o interpretador das construções de calça, o registro de traços documentados, a inspeção de topologia e o laboratório isolado de integração FreeSewing. Esta etapa conecta os **motores próprios existentes** a uma tela pesquisável, sem replicar as fórmulas do livro.

## Implementação

- src/Ch02ResearchLab.tsx: tela com seletores ONE_PIECE/TWO_PIECE e BASIC/EASY; entradas em centímetros convertidas a mm; desenho responsivo dos **pontos calculados** e somente **retas explicitamente comandadas** no registro da fonte; seleção por traço e informações de origem; visualização independente de frente e costas.
- src/ch02ResearchViewModel.ts: compõe draftFlatTrouserSectionsResearch, resolveCh02BookLineCommands e inspectResearchTopology. Não transcreve fórmulas nem cria spline; valida entradas e força ausência de promoção industrial.
- src/App.tsx: atalho para a área de pesquisa a partir da tela inicial; o laboratório de cena sintética existente não é afetado.
- src/styles.css: controles e desenho adaptados a janelas pequenas.
- src/ch02ResearchViewModel.test.ts: revisões por método, variante e medida, correspondência com comando da fonte, negativos e impossibilidade de exportação para corte.

### Pipeline executado na interface

entradas em cm → conversão mm → DraftProgram Aldrich → pontos calculados → registro de comandos de traçado CH02 → retas em SVG + âncoras de curvas pendentes → inspeção de caminhos abertos → painel NO-CUT.

**Ponto crítico:** SVG é apenas uma representação em tela sem escala física calibrada. Renderizar uma reta de 9–11 não prova que ela seja aresta industrial, pois seu papel permanece DOCUMENTED_LINE_UNCLASSIFIED. Curvas não são interpoladas nem mostradas como linha falsa. A tela não contém botão funcional de exportação para corte.

### Fronteira com código aberto

A prova real de @freesewing/core@4.0.0 e seu adaptador continua em prototype/integration-spike. Este aplicativo ainda usa o núcleo TypeScript independente do fornecedor para desenhar as retas CH02 em SVG; **não** embute FreeSewing no bundle React, não usa Part.__boundary() e não reivindica integração de produção. Aproveitamento de conceitos/APIs de pacotes terceiros exige validação de licença/transitivas e estabilidade.

## Gates

- Interface de pesquisa: permitido operar em medidas de exemplo/pessoais locais na sessão; sem transmissão configurada pelo novo módulo.
- Costura/corte/margem por aresta: NOT_YET_DEFINED; nenhuma função de produção autorizada.
- CH02: 4 curvas por método ainda sem geometria resolvida; nenhuma borda de peça fechada.
- PILOT-001 — Flat Shirt Core: permanece piloto formal, sem alteração das regras.
- Gate B e comercial: NO_GO.

**Próxima prova útil:** conectar visualmente (sem promover para corte) as demais linhas comprovadas do livro e cruzar as diferenças entre vistas de construção e montagem da peça única; em paralelo, levar o mesmo pipeline de interface a um protótipo de camisa quando os comandos da fonte específica forem auditados.