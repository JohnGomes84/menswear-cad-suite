# PIECE-ANNOTATION-SEMANTICS-001 — Objetos de peça, guias e anotações segregadas

**Data:** 13/10/2026. **Estado:** PROVA EXPERIMENTAL RESEARCH_ONLY.  
**Fonte do método demonstrado:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª edição, capítulo 2, PDF pp.32–34. As instruções auditadas produzem **pontos de pesquisa**, não peças para corte.  
**Biblioteca inspecionada e executada:** `@freesewing/core@4.0.0`, incluindo `Part`, `Point`, `Path`, `Design` e `Snippet`; `@freesewing/plugin-annotations@4.0.0` no **exemplo sintético separado**.

## 1. A separação crítica

A especificação do livro determina as instruções de construção e as medidas. **Um objeto `Part` do FreeSewing é um contêiner computacional, não prova automática de que o desenho seja peça têxtil utilizável.**

| Categoria | Semântica | CH02 nesta versão |
|---|---|---|
| `CONSTRUCTION_TRACE` | Conector que mostra dependência entre ponto e sua primeira referência; **não necessariamente linha explicitamente desenhada no livro** | **PERMITIDO**, baseado no `sourceTrace` |
| `SEAM_LINE` | Linha costurada, com geometria/função de montagem verificadas | **BLOQUEADO** |
| `CUT_LINE` | Perímetro preparado para corte | **BLOQUEADO** |
| `SEAM_ALLOWANCE` | Margem específica da aresta, distinguindo costura/corte | **BLOQUEADO** |
| `GRAINLINE` | Direção do fio definida e validada para a peça | **BLOQUEADO** |
| `CUT_ON_FOLD` | Restrição real de dobra para posicionar no tecido | **BLOQUEADO** |
| `PRODUCTION_NOTCH` | Pique aprovado em aresta de montagem | **BLOQUEADO** |

`prototype/integration-spike/src/pipeline.mjs` foi corrigido para identificar os conectores como `DEPENDENCY_CONNECTOR_NOT_BOOK_LINE`, em vez de afirmar que são guias de traçado literal da obra. É uma **distinção factual importante**: o primeiro ponto referenciado por uma fórmula pode não estar unido por uma linha no diagrama.

## 2. Implementação efetivamente executada

O módulo [partBridge.mjs](../../prototype/integration-spike/src/partBridge.mjs) recebe a saída do interpretador de Aldrich em mm, já validada como `RESEARCH_ONLY`. Para os grupos **frente** e **costas**:

1. Constrói dois objetos `new Part()` do FreeSewing, rotulados `CONSTRUCTION_GROUP_NOT_GARMENT_PIECE`.
2. Insere os pontos calculados como `new Point(x,y)`, com numeração via `Point.addText`.
3. Reconstitui conectores **somente** dos passos do `sourceTrace` usando `new Path().move(...).line(...)`.
4. Calcula comprimentos via `Path.length()` e verifica correspondência com os valores da integração anterior.
5. Serializa os dados por `Part.asRenderProps()` e disponibiliza um manifesto com `roleInventory` e `gates.CUT_READY=false`, sem `SEAM_LINE`, `CUT_LINE`, margens, piques reais ou fio.
6. A conversão de `Part` para render props exige nesta versão `Part.__boundary()`, **API interna**. A POC valida o comportamento mas classifica essa chamada como `experimentalInternalApi`; não aprovar sua utilização em integração permanente sem interface estável.

O resultado é `out/ch02-construction-components.json`. Não é molde e não possui `PatternPiece` validado.

## 3. Teste REAL do plugin de anotações — independente da obra

O método `createSyntheticAnnotationProof()` constrói um `Design` FreeSewing com uma peça **SINTÉTICA** e carrega `annotationsPlugin`:

- `macro("grainline", {from,to})` executa a macro real do plugin e insere um `Path` com marcadores `grainlineFrom/grainlineTo`.
- `new Snippet("notch",anchor)` cria um marcador de pique do próprio FreeSewing na **fixture artificial**. Isso demonstra a API de `Snippet`, mas não valida a montagem de uma peça do livro nem prova renderização completa dos SVG defs.
- A execução cria `out/synthetic-annotation-api-proof.json`, com status explícito `SYNTHETIC_ONLY_DO_NOT_PROMOTE`.
- **Nenhum marcador de fio ou pique sintético aparece no JSON/Part do capítulo 2.** A técnica usada não se torna automaticamente regra de Aldrich.

A macro real possui efeitos colaterais na estrutura de `cutlist` de FreeSewing. Por isso, sua ativação futura exigirá um **contrato de status de peça**: somente criar fio/corte após auditar referência e montagem. Não se deve chamar o plugin de forma generalizada nos métodos ainda `TOC_ONLY`.

## 4. Fonte, tecnologia e status não se confundem

- **Livro:** fonte autoritativa de medidas, fórmulas, pontos e convenções de cada método. O sistema não inventa direção do fio, piques ou perímetro para completar diagramas.
- **FreeSewing:** tecnologia de objeto, ponto, caminho e macro; **a API não substitui as regras de modelagem**.
- **Nossa camada:** repositório de relações verificadas, rótulos, gates e formato nativo independente do fornecedor.

A liberação de `SEAM_LINE` demanda topologia e curvas verificadas; de `CUT_LINE`, desenho de margens/junções por aresta; de `GRAINLINE` e piques, determinação na fonte ou parecer profissional auditável. Ainda falta *trueing*, impressão 1:1, gradação, encaixe e toile.

## 5. Aceite da etapa

[CI de branch #38483547096](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38483547096) executou **21/21 testes PASS** antes da precisão de nomenclatura dos conectores. As execuções posteriores do PR devem confirmar as mudanças finais. Os contratos completos e os bloqueios estão em [QA-PART-ANNOTATIONS-001](../qa/QA-PART-ANNOTATIONS-001.md).

**Gates:** APP experimental, geometria A IN_REVIEW, modelagem B NO-GO, comercial NO-GO.
