# FreeSewing — prova de integração vertical (somente pesquisa)

**Estado:** POC isolada, **NÃO APTA PARA CORTE**.  
**Método de origem:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª ed., capítulo 2 (texto PDF pp. 32–33; diagrama p.34).  
**Tecnologia existente efetivamente executada:** `@freesewing/core@4.0.0`, com `Point` e `Path`.  
**Não é:** implementação do Titan, editor de moda, peça completa, PDF de plotter ou prova física.

## Encadeamento que a CI verifica

1. **Medidas:** `seatMm`, `bodyRiseMm`, `insideLegMm` em mm, variantes `BASIC`/`EASY` e métodos `ONE_PIECE`/`TWO_PIECE`.
2. **Receita da obra:** o código existente de `prototype/web-app/src/aldCh02FlatTrouser[Back]Program.ts` é compilado com esbuild, **sem transcrever um segundo conjunto de fórmulas**.
3. **Execução de instruções:** `draftingInterpreter.ts` determina posições e sequência com `sourceTrace` (página/etapa/dependências).
4. **Geometria de terceiro:** `Point` e `Path.move/line/length/asPathstring` do FreeSewing criam e medem as **linhas-guia retas**.
5. **Estrutura:** os identificadores frente/costas são transportados por `new Part()` e `asRenderProps()` do FreeSewing como **contêineres de referências e dependências**, não como `PatternPiece`, `SeamEdge` ou `CutEdge` prontos.
6. **Anotações diagnósticas:** `Point.addText` do FreeSewing rotula pontos. O plugin real `@freesewing/plugin-annotations` executa a macro `grainline` e o objeto `Snippet(notch)` **apenas numa fixture sintética independente da obra**. Nenhum fio/pique técnico é publicado nos contêineres CH02.
7. **Verificações:** entradas válidas, cadeia de proveniência, referências, cotas textuais, sentidos do diagrama, comprimento dos segmentos via biblioteca externa; **trueing e caimento ainda NOT_RUN**.
8. **Saída:** `out/ch02-guides.svg`, `out/ch02-diagnostics.json`, `out/ch02-construction-components.json` (FreeSewing Part), `out/synthetic-annotation-api-proof.json` (somente sintético), `out/ch02-semantic-contract.json` (semântica) e `out/ch02-book-command-geometry.json` / `out/ch02-book-command-lines.svg` (retas realmente prescritas pela obra; sem curvas/cortes). O SVG usa dimensões de visualização em pixels, não é impressão em escala 1:1. O contrato proíbe explicitamente `CUT_CONTOUR`, `SEAM_ALLOWANCE`, `SEAM_PAIR`, `NOTCH_PLACEMENT`, `SIZE_GRADING`, `NESTING`, `PRINT_1_TO_1` e `PRODUCTION_RELEASE`.

## Executar com Node 22

Da raiz do repositório:

```bash
npm ci --prefix prototype/web-app
npm ci --prefix prototype/integration-spike --ignore-scripts
npm test --prefix prototype/integration-spike
npm run demo --prefix prototype/integration-spike
```

**Correção operacional:** os comandos `npm test` e `npm run demo` agora geram automaticamente os três módulos ESM do interpretador original (`aldch02.mjs`, `garmentSemantics.mjs`, `ch02BookLines.mjs`) por meio do script `pretest/predemo`. Ainda é obrigatório instalar a toolchain do web app para dispor de `esbuild`; uma mensagem explícita informa quando essa instalação está ausente. Arquivos `generated/` não devem ser versionados.

A CI usa Node 22 e executa **34 testes** (baseline 1.26), publicando sete arquivos de pesquisa. A correção do roteiro não muda regras de modelagem, método, curvas, API externa ou status de corte. Os testes de segurança/supply chain devem ser verificados separadamente; a existência de CI verde não resolve vulnerabilidades de pacotes.

## Por que a POC é isolada

- Nenhuma dependência nova foi adicionada ao aplicativo web existente.
- O formato nativo de projetos 0.1/0.2/0.3/0.4 não foi reescrito; apenas um **adaptador descartável de interoperabilidade** lê a saída do interpretador.
- O pacote FreeSewing 4.0.0 exigiu adicionar explicitamente `@freesewing/config@4.0.0`: o plugin de anotações o importa em runtime sem declará-lo como dependência, no estado inspecionado. **É um risco de empacotamento real**, não uma garantia de suporte industrial.
- Versões diretas e transitivas agora são fixadas em **`package-lock.json`**, materializado no GitHub Actions a partir da instalação efetiva do core 4.0.0. A CI usa `npm ci` para reprodutibilidade. **Ainda são obrigatórias** auditoria de licença (o transitivo `hooks@0.3.2` não declara licença no lockfile), segurança, compatibilidade de API e atualização de upstream antes de promover ao aplicativo principal.
- FreeSewing é MIT; manter atribuições e avisos em qualquer redistribuição. Bibliotecas GPL e softwares proprietários permanecem somente como referências técnicas até decisão jurídica de integração.

## Próximo critério para expansão

A integração de **anotações, perfis, regras de peça, exportação PDF e encaixe** será tratada individualmente. Cada camada precisa demonstrar uma API utilizável, fixtures, limites do método e testes antes de ser integrada. A biblioteca de métodos Aldrich permanece independente de FreeSewing.

Ver `docs/architecture/REUSE-DECISION-001.md` e `docs/qa/QA-REUSE-001.md`.


## Regra de segurança da semântica de linhas

Os conectores derivados do primeiro ponto de referência da instrução recebem `DEPENDENCY_CONNECTOR_NOT_BOOK_LINE`, pois **não se pode afirmar que estejam desenhados no livro**. O módulo [partBridge](src/partBridge.mjs) identifica-os como `CONSTRUCTION_TRACE`, nunca como costura, corte, fio, pique, dobra ou margem. Antes da adoção em produção, substituir a API interna `Part.__boundary()` por uma API estável e verificar o comportamento completo de renderização e exportação do plugin de anotações. [Especificação](../../docs/architecture/PIECE-ANNOTATION-SEMANTICS-001.md).


## Contrato semântico próprio e margens CH02

O quinto arquivo `ch02-semantic-contract.json` contém entidades `SemanticPiece/SemanticEdge` e evidências rastreadas ao livro, cada conector representando **somente uma dependência**. O algoritmo é próprio e agnóstico ao FreeSewing. Testes cruzados reconciliam posições e comprimentos com `Part` nativo. Não há `SEAM_LINE`, `CUT_LINE`, fio ou pique da obra nesta saída. A regra de 10 mm de margem **já incluída** no bloco de Aldrich PDF p.31 está em `aldCh02AllowancePolicy.ts`, mas com exceções ainda não mapeadas por aresta; qualquer offset é bloqueado. Ver [especificação](../../docs/architecture/GARMENT-SEMANTICS-001.md).


## Linhas de fonte e desenho externo, sem fabricação

`src/bookCommandBridge.mjs` lê as instruções `join/draw` auditadas na p.32–33 da obra (`CH02-SOURCE-LINES-001.json`): calcula pontos pelo interpretador, liga **somente 8 retas expressamente prescritas** via FreeSewing `Point/Path`, e publica SVG/JSON de diagnóstico. As 8 curvas permanecem exigências geométricas não resolvidas, `curveGenerated=false`. Não representa a peça completa; as observações de `no seam allowance` da figura p.34 permanecem regionais. A nova saída está isolada do antigo gráfico de conectores de dependência, que não equivale a traços literais do livro. [Auditoria de comandos](../../docs/domain/CH02-EXPLICIT-STROKES-AUDIT-001.md).
