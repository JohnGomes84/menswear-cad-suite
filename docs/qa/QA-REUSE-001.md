# QA-REUSE-001 — Prova de interoperabilidade de ponta a ponta

**Cenário:** fonte do livro → medidas → motor de instruções → FreeSewing → grupos de referência → diagnóstico SVG/JSON.  
**Status:** **9/9 TESTES INTEGRAÇÃO PASS** em [Actions #38480789883](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38480789883).  
**Classificação:** `PROVEN_RESEARCH_INTEGRATION` — não apto à produção ou corte.

| ID | Verificação | Evidência automatizada | Resultado |
|---|---|---|---|
| RI-01 | Instalar FreeSewing 4.0.0 e carregar `Point/Path` reais | Integração Node 22 com npm | PASS após adicionar config dependente |
| RI-02 | Compilar sem duplicar método CH02 existente | esbuild de `flatTrouserBackResearch.ts`, `aldCh02...`, `draftingInterpreter.ts` | PASS |
| RI-03 | Tamanho básico, calça duas peças | 26 pontos, 16 frente, 10 costas, fórmulas de rise/inseam/quadril | PASS |
| RI-04 | Tamanho básico, calça uma peça | 19 pontos, 12 frente, 7 costas | PASS |
| RI-05 | Variante EASY | Acréscimos de folga e pontos recalculados | PASS |
| RI-06 | Medidas corporais diferentes | Geometria dependente recalculada, IDs preservados | PASS |
| RI-07 | API externa para geometria | `new Point`, `new Path().move().line().length().asPathstring()` | PASS |
| RI-08 | Prova de proveniência | Todos os passos com capítulo/página, referências precedentes, pointIds | PASS |
| RI-09 | Saída segura | SVG e JSON com pesquisa explícita, sem perímetro fechado, margem, piques, corte nem impressão 1:1 | PASS |
| RI-10 | Entradas inválidas e resultado determinístico | Negativos/NaN/missing/extra, repetição de método | PASS |
| RI-11 | CI artifacts | `out/ch02-guides.svg` + `ch02-diagnostics.json` publicados temporariamente | PASS |

Os nomes de verificação cobrem 9 casos programáticos `node:test` (alguns verificam múltiplos contratos). O status desta QA comprova **somente o caminho de construção parcial**.

## Divergências observadas

**D-01 — EMPACOTAMENTO FreeSewing v4:** a primeira execução CI falhou em `ERR_MODULE_NOT_FOUND: @freesewing/config` importado pelo `plugin-annotations/src/logo.mjs`, embora o manifesto desse plugin não o declare. A segunda execução adicionou `@freesewing/config@4.0.0` explicitamente no isolamento e passou. Antes de usar o core no aplicativo principal, inspecionar fixes da upstream, incompatibilidades transitivas e trilha de licença.

**D-02 — Determinismo de dependências:** a POC usa versões diretas `4.0.0` e instalação `--no-package-lock` apenas experimental; **a cadeia transitiva não está travada**. Não promover a release ou instalar no web-app até gerar lockfile, SBOM/check de licenças e política de atualização.

**D-03 — Integração limitada:** somente `Point`/`Path` do FreeSewing estão testados. `Part`, plugin de anotações, `PatternDrafter`, geração de PDF e bin packing não foram integrados nem aprovados, ainda que as APIs tenham sido lidas no código. SVG final usa renderização diagnóstica própria **a partir do Path externo**, não o renderer FreeSewing de projeto completo.

**D-04 — Modelagem real incompleta:** embora pontos sejam rastreáveis, continuam ausentes contornos, curvas resolvidas, costuras parceiras, margins por aresta, trueing, pences, grades, piques de costura reais e prova de roupa. Isso não é um `PatternPiece` nem modelo de produção.

**D-05 — Impressão física:** SVG é explicitamente dimensionado em **pixels de visualização**, não tem escala 1:1 certificada. Nenhum teste de escala física, tracejado de impressão ou QR de calibração foi executado.

## Próximos critérios de aceitação

- **Dependências:** instalação fixa por lock + auditoria licenças/segurança; mapeamento de APIs estáveis e regressão.
- **Medições:** protocolos CH1/13 completos por entrada corporal, validação antropométrica e multiplicidade de perfis; atualmente são três medidas textuais de exemplo.
- **Semântica de vestuário:** construir uma estrutura `Piece/SewingEdge/CutEdge/Fold/Grainline` tipada e testada; não tratar guias como costuras.
- **Validação:** grade de casos positivos/negativos/extremos; testes de curvas paramétricas com procedimentos de Aldrich, costuras amigas e tolerâncias documentadas.
- **Saídas:** imprimir quadrado físico 1:1 com escala auditada; PDF paginado e DXF interoperável.
- **Aprovação:** modelista, toile, revisão jurídica/licença comercial e gate de release.

**Gate APP:** GO_EXPERIMENTAL_ONLY; Gate A: IN_REVIEW; Gate B: NO-GO; release: NO-GO.
