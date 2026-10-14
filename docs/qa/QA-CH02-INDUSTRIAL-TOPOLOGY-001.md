# QA-CH02-INDUSTRIAL-TOPOLOGY-001 — auditoria de evidências e bloqueios

**Data:** 13/10/2026 · **Tipo:** revisão documental do livro e do diagrama.  
**Artefatos:** [auditoria](../domain/CH02-INDUSTRIAL-TOPOLOGY-AUDIT-001.md) e [registro estruturado](../domain/CH02-INDUSTRIAL-TOPOLOGY-CANDIDATES-001.json).  
**Fonte:** Aldrich, 5ª ed., PDF do usuário, pp. 31–34.  
**Regra:** `PASS_DOC` é *somente* consistência de citação/interpretação, nunca `PASS_GEOMETRY`, `PASS_FIT` ou autorização industrial.

| ID | Verificação / oráculo | Resultado |
|---|---|---|
| QA-EDGE-001 | p. 32 nomeia *inside leg seam* para frente e costas de uma peça; quatro comandos no registro anterior resolvem dois percursos candidatos | `PASS_DOC` |
| QA-EDGE-002 | p. 33 nomeia *inside leg seam* para frente e costas de duas peças; quatro comandos no registro anterior resolvem dois percursos candidatos | `PASS_DOC` |
| QA-EDGE-003 | pp. 32–33 ordenam traçar posterior/anterior, espelhar frente e reunir laterais; diagrama p. 34 exibe construção e composição | `PASS_DOC` |
| QA-EDGE-004 | p. 34 apresenta distinção gráfica de frente/costas e guias que não devem ser confundidas com toda linha industrial | `PASS_DOC` |
| QA-EDGE-005 | p. 31 explicita 1 cm já incluído, exceto regiões de exclusão; p. 34 mostra cintura/barra dos dois métodos | `PASS_DOC_REGION_ONLY` |
| QA-EDGE-006 | Quatro identificadores de exceção mantêm `edgeIds=[]` e `offsetAllowed=false` | `PASS_DOC_REGISTER` |
| QA-EDGE-007 | Identificadores de comandos associados aos percursos de entreperna existem em `CH02-SOURCE-LINES-001.json` | `PASS_DOC_CROSS_REFERENCE` |
| QA-EDGE-008 | Nenhuma `SemanticEdge` do método foi promovida, nenhum offset/SeamPair/curve/cut foi executado nesta entrega | `PASS_DOC_SCOPE` |
| QA-EDGE-009 | Orientação, conectividade, fechamento e autointerseção de cada contorno | `NOT_RUN` |
| QA-EDGE-010 | Correspondência integral de costuras e ease/trueing | `NOT_RUN` |
| QA-EDGE-011 | Contornos `seam_geometry` e `cut_geometry` por aresta, incluindo exceções | `NOT_YET_DEFINED` |
| QA-EDGE-012 | Espelhamento executado, escala física e toile com modelista | `NOT_RUN` |

## Oráculos negativos obrigatórios

Uma implementação futura **deve falhar** se: (a) promover qualquer `DEPENDENCY_CONNECTOR` a traço do livro; (b) assumir que `DOCUMENTED_LINE_UNCLASSIFIED` é borda de corte; (c) mapear `no seam allowance` para aresta sem proveniência; (d) adicionar 10 mm onde o bloco já os inclui; (e) classificar o eixo interno da composição de uma peça como borda externa; (f) afirmar `cutReady=true` sem curva, percurso fechado, costura e validação física.

**O que foi executado nesta etapa:** leitura textual/visual da fonte, correspondência manual dos quatro conjuntos de entreperna com IDs já existentes e registro documental em JSON/Markdown. Nenhum teste Vitest/Node foi rodado nesta revisão; totais de CI de PRs anteriores não são nova evidência.

**Gate documental:** `PASS_DOC_PARTIAL`. **Gate geométrico:** `NO_GO`. **Gate B PILOT-001:** `NO_GO`. **Comercial:** `NO_GO`.

**Ordem seguinte:** revisar linha a linha os trajetos fechados em camadas de construção/composição, confirmar escopo de margem com especialista e executar provas de geometria independentes antes de decidir operações de contorno/costura.
