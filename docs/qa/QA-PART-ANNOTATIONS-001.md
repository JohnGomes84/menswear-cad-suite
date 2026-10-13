# QA-PART-ANNOTATIONS-001 — FreeSewing Part e anotações

**Estado:** TESTADO COMO LABORATÓRIO; **SEM APROVAÇÃO PARA CORTE**. Fonte de modelagem: Aldrich, 5ª ed., CH02, PDF pp.32–34 (texto e diagrama parcialmente auditados). Tecnologia real: FreeSewing 4.0.0.

## Matriz de verificação

| Verificação | Critério auditado |
|---|---|
| FreeSewing Part real | Dois grupos, FRONT/BACK, construídos com `new Part()` e `asRenderProps()` |
| Pontos e etiquetas | Coordenadas derivadas da receita do livro preservadas em `Point`, identificadores em `Point.addText` |
| Paths externos | `Path.move/line/length/asPathstring` reproduzem as referências e cotas testadas |
| Proveniência | Cada traço aponta para `sourceStepId` já executado; conectores **NÃO** são necessariamente linhas do livro |
| Variação | ONE_PIECE, TWO_PIECE, BASIC, EASY e medidas personalizadas |
| Bloqueio industrial | SEAM_LINE, CUT_LINE, CUT_ON_FOLD, GRAINLINE, SEAM_ALLOWANCE, PRODUCTION_NOTCH continuam bloqueados no CH02 |
| Plugin de anotações | Em `Design` **inteiramente sintético**, `macro(grainline)` real e `Snippet(notch)` |
| Isolamento | Depois da fixture sintética, peças CH02 continuam sem fio, pique, costura e corte |
| Entradas negativas | Dados inválidos falham; `assertResearchRole` impede reclassificação arbitrária |
| Reprodução | `npm ci` e arquivo de lock; relatórios SVG/JSON separados para CH02 e a fixture sintética |

[CI #38483547096](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38483547096): **21/21 testes PASS**. A alteração subsequente dos rótulos de conectores deverá passar novamente na CI do PR.

## Divergências e fronteiras

**GEO-01:** a referência inicial de uma fórmula pode não ser uma linha traçada por Aldrich. Renomeada a categoria de conector para `DEPENDENCY_CONNECTOR_NOT_BOOK_LINE`, sem apresentá-la como costura ou desenho canônico do livro.

**LIB-01:** a POC usa `Part.__boundary()` para preparar `asRenderProps()`. Como a API começa com duplo sublinhado, é **interna e arriscada**; precisa de alternativa pública antes de ser considerada integração de produção.

**PLUG-01:** a macro `grainline` do plugin modifica a estrutura de cutlist. Foi invocada **somente em padrão sintético**; nunca aplicar no CH02 sem confirmar fio no método ou revisão profissional.

**PLUG-02:** `Snippet('notch')` foi testado como objeto da biblioteca em fixture sintética; **não comprova** a posição de piques em costuras nem a integração completa das defs SVG do plugin.

**LEGAL-01:** o transitivo `hooks@0.3.2` permanece sem metadado de licença no lockfile. Auditoria jurídica/segurança pendente.

**METHOD-01:** o livro não foi integralmente modelado; não há curvas prontas, fechamento de contorno, margens, conferência de costura, gradação, calibração física ou vestibilidade.

## Gates

Passagem numérica dos objetos FreeSewing e do plugin sintético **não promove** o método Aldrich para corte. Os grupos do CH02 são `CONSTRUCTION_GROUP_NOT_GARMENT_PIECE` e `CUT_READY=false`.

APP EXPERIMENTAL_ONLY; geometria A IN_REVIEW; B PILOT-001 NO-GO; comercial NO-GO.
