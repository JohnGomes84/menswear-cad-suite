# GARMENT-SEMANTICS-001 — Contrato independente de fornecedor para entidades de vestuário

**Data:** 13/10/2026. **Status:** CONTRATO EXPERIMENTAL EXECUTÁVEL (SEM MOLDES PARA CORTE).  
**Fonte de regras de modelagem:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª edição, PDF fornecido pelo usuário, capítulo 2, páginas PDF **31–34**.  
**Fonte de APIs computacionais:** núcleo próprio `garmentSemantics.ts`; integração externa FreeSewing v4 permanece isolada em `prototype/integration-spike`.

## 1. Objetivo e decisão arquitetural

As regras de cálculo do **livro** continuam em `DraftProgram` e `draftingInterpreter.ts`. A saída geométrica dos sistemas externos (`FreeSewing.Part`, `Path`, SVG etc.) **não fornece, por si só, a semântica de uma peça têxtil**.

O novo contrato `garment-semantic/0.1.0` modela separadamente:

- **Projeto e estágio:** `purpose=RESEARCH_ONLY | SYNTHETIC_ONLY`; `release.cutReady=false` e `release.physicalFit=NOT_RUN`.
- **Peças:** `SemanticPiece`, com `id`, `section`, `status`, pontos em mm, arestas, margens e anotações.
- **Pontos:** `SemanticPoint(id,positionMm)` com coordenadas em milímetros; sem associação à implementação SVG.
- **Arestas:** `SemanticEdge(id,fromId,toId,role,evidenceId)` com papel explícito e referência de origem.
- **Margens:** `AllowanceDeclaration(seamEdgeId,widthMm,treatment,evidenceId)`; tratamento `ALREADY_INCLUDED_IN_BLOCK` **ou** `OFFSET_NEEDED_NOT_EXECUTED` (declaração, não execução).
- **Marcas:** `AnnotationDeclaration` com fio `GRAINLINE(fromId,toId)` ou pique `NOTCH(edgeId,fraction)`.
- **Evidência:** `DraftEvidence` separa `TRACE_DERIVED_NOT_BOOK_LINE` de `SYNTHETIC_FIXTURE` e referencia capítulo, página, método e passo onde aplicável.

### Papéis de aresta (não intercambiáveis)

| Papel | Significado geométrico/industrial | Permissão no método Aldrich auditado |
|---|---|---|
| `DEPENDENCY_CONNECTOR` | Conector **visual** entre ponto calculado e primeira referência da sua fórmula; não necessariamente existe no diagrama | **SIM**, com origem por passo |
| `CONSTRUCTION_LINE` | Linha efetivamente prescrita pela construção do livro | **NÃO**, até mapa de linhas individuais |
| `SEAM_LINE` | Linha que será costurada na montagem | **NÃO**, sem topologia/fonte/costura revisada |
| `CUT_LINE` | Contorno de corte, distinto da costura | **NÃO**, até geometria e margem por aresta |
| `FOLD_LINE` | Referência de dobra da peça/material | **NÃO**, até convenção e source confirmation |
| `HEM_LINE` | Aresta ou referência de barra/bainha | **NÃO**, até convenção de costura/barra |

**Observação:** esses papéis são conceitos de CAD/alfaiataria que o sistema precisa representar. **Sua inclusão no esquema não implica que tenham sido determinados pelo livro para a calça do CH02.**

## 2. Fonte versus hipótese: o que Aldrich efetivamente diz

A abertura do CH02, página PDF **31**, apresenta os blocos planos e declara que há **1 cm de margem de costura incluído nos blocos, com exceção dos trechos identificados como sem margem**. As páginas PDF **32 e 33** fornecem as instruções de ponto/linha das frentes e costas de calças de uma e duas peças. A p.34 contém referências visuais cujo mapeamento integral de curvas/topologia não está validado.

**Implicação de engenharia:** NÃO colocar `widthMm=10` automaticamente em todas as arestas nem aplicar `Path.offset(10)` a contorno parcialmente conhecido. Precisamos identificar cada aresta, distinguir se o traço da obra já representa linha de corte e tratar todas as exceções. [`aldCh02AllowancePolicy.ts`](../../prototype/web-app/src/aldCh02AllowancePolicy.ts) implementa o fato **no nível do bloco**, `nominalIncludedMm=10`, com `edgeMapping=NOT_YET_DEFINED` e decisão **`BLOCKED_UNTIL_SOURCE_EDGE_TOPOLOGY_REVIEW`** para qualquer aresta candidata. Não gera offset.

As instruções textuais também diferenciam:
- Linha de dentro da perna, linhas retas, curvas, espelhamento e posicionamento das partes.
- A execução da **receita parcial de pontos** produz `sourceTrace` e relações geométricas, mas não um mapa autorizado de quais trechos desses pontos são costura, corte ou dobra.

A distinção permite promover informação **conforme a fonte**, sem que o editor ou FreeSewing inventem parte faltante.

## 3. Regras do validador, independentes de FreeSewing

**`validateGarmentSemanticProject(value:unknown)`:** importa dados não confiáveis para cópia normalizada, rejeitando chaves não reconhecidas nos principais objetos; versão, unidade mm, release e status precisam ser explícitos. Os IDs são únicos por domínio; todas as referências de ponto/evidência/aresta precisam existir; coordenadas finitas; arestas não degeneradas; marcas não podem apontar para uma costura inexistente; margens referem **exclusivamente** a uma `SEAM_LINE` e não podem aparecer duas vezes na mesma aresta.

`RESEARCH_ONLY` admite **somente `DEPENDENCY_CONNECTOR` com `TRACE_DERIVED_NOT_BOOK_LINE`**. Margens, piques e fio ficam vazios. Não é permitido alterar `purpose`, `section` ou evidência para escapar do bloqueio.

`SYNTHETIC_ONLY` permite construir desenhos artificiais com os diferentes papéis (`SEAM_LINE`, `CUT_LINE`, `FOLD_LINE`, `HEM_LINE`), anotações e largura de margem, para **testar a integridade do esquema**. Toda a evidência nesse modo é identificada como `SYNTHETIC_FIXTURE`; não há ponte automática para `RESEARCH_ONLY`.

**Os dois estados têm `cutReady=false` e `physicalFit=NOT_RUN` sem exceção.** Essa versão do esquema propositalmente NÃO possui estado de produção.

## 4. Integração real com FreeSewing

O método `createCh02SemanticResearch(method,inputs)` reexecuta o interpretador de Aldrich e cria contêineres semânticos de **pesquisa**, um para a frente e um para as costas, com pontos próprios e conectores de origem por etapa.

O teste `prototype/integration-spike/tests/semanticBridge.test.mjs` compila o TypeScript **existente** para ESM Node e compara cada ponto, traço, comprimento e referência com `Part`/`Point`/`Path` reais do FreeSewing. Nenhum método foi reescrito em JavaScript e nenhum `Part` pode se tornar automaticamente `CUT_LINE`.

A demonstração CLI passa a publicar `out/ch02-semantic-contract.json` (quinto artefato), incluindo `release.cutReady=false`, `physicalFit=NOT_RUN` e bloqueios diagnósticos.

## 5. QA e condições de não liberação

Ver [QA-GARMENT-SEMANTICS-001](../qa/QA-GARMENT-SEMANTICS-001.md). Abrangência inicial:
- Destino e origem de cada ponta de aresta; ausência de duplicações; zero length/NaN/Infinity rejeitados.
- Semântica sintética de costura/corte/dobra/barra separada; exceções de margem no nível de declaração e nenhuma operação de offset executada.
- Piques só sobre arestas `SEAM_LINE/CUT_LINE` **sintéticas** e com fração interior.
- Exemplos de ataque: promoção indevida de `RESEARCH_ONLY` para papel de corte, criação de fio/pique sem fonte, `cutReady=true`, campos extras ocultos, esquemas desconhecidos.
- Cruzamento de pontos/arestas entre a saída semântica e `FreeSewing.Part` real.

**Fora do escopo:** geometria curvilínea de arestas de costura, topologia fechada/correta do bloco, interseções de cantos, fechamento de pences, conformidade de margem real, comprimento de costuras parceiras, encaixe de tecido, impressão 1:1, revisão de modelista e prova física. Uma `SemanticEdge` aqui liga dois pontos como referência e ainda não representa uma spline aprovada.

**Gates:** APP EXPERIMENTAL_ONLY; A IN_REVIEW; B PILOT-001 NO-GO; COMERCIAL NO-GO.

## 6. Próxima prioridade guiada pelo livro

1. **Auditar linha por linha e traço por traço** os contornos CH02 e registrar cada trecho em catálogo de origem (`SOURCE_TEXT` / `SOURCE_DIAGRAM`), sem inferir conexão a partir de `sourceTrace`.
2. Construir a topologia da frente/costas e acordar quais segmentos são **linhas de costura** e **linhas de corte**, incluindo regra de 10 mm já incluídos e trechos isentos.
3. Somente após geometria das curvas fechada e revisada, permitir operações de offset de margem, piques reais e fio, ainda com validação de costuras/caimento.
4. Aplicar a mesma infraestrutura (sem copiar fórmulas) a todos os demais capítulos conforme a auditoria do catálogo integral.

**Não se deve transformar o passo 1 em um algoritmo de adivinhação geométrica.**
