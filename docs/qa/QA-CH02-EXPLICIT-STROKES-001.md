# QA-CH02-EXPLICIT-STROKES-001 — Instruções de traçado e representação FreeSewing

**Status:** REVIEWED_TEXT_COMMANDS, DIAGRAM_PARTIAL, NO_CUT.  
**Fonte:** PDF de Aldrich 5ª edição pp.31–34; a tabela de instruções é uma transcrição técnica resumida do procedimento, não cópia extensa da obra.  
**Arquivos de teste:** `prototype/web-app/src/ch02BookLineCommands.test.ts` e `prototype/integration-spike/tests/bookCommandBridge.test.mjs`.

| Teste | Critério de aceite | Resultado esperado |
|---|---|---|
| SL-01 | Conferir lista independente com as instruções da fonte | 7 comandos para uma peça e 9 para duas peças |
| SL-02 | Distinguir `STRAIGHT` de `CURVE` | 8 retas, 8 curvas em ambas as construções |
| SL-03 | Identificar fontes/capítulo/páginas e evitar rótulos de corte | PDF 32/33, diagrama 34; `industrialRole=UNCLASSIFIED_NOT_CUT` |
| SL-04 | Registrar quatro legendas `no seam allowance` | Cintura/barra x dois blocos, sem mapear aresta |
| SL-05 | Preservar margem de 10 mm **já incluída** | `NO_AUTOMATIC_OFFSET`, mesmo nas variantes BASIC/EASY |
| SL-06 | Preservar a instrução de espelhamento da frente uma peça | `DOCUMENTED_OPERATION_NOT_EXECUTED` |
| SL-07 | Retas diretamente prescritas pelo livro | Coordenadas em mm e comprimento válido; sem atribuição industrial |
| SL-08 | Curvas no livro | Pontos de passagem e `hasSpline=false`, sem Bézier por inferência |
| SL-09 | Rejeitar registros adulterados | Papel CUT_LINE, página falsa, comando duplicado, exceção com alcance inventado |
| SL-10 | Validar adaptação ao FreeSewing real | `Point`+`Path`, comprimento em mm confrontado com o cálculo independente |
| SL-11 | Exportar diagnóstico segregado | JSON e SVG só com **retas de texto**, sem perímetro fechado nem escala física |
| SL-12 | Medidas/variante se propagam a todas as linhas conhecidas | Mesmo comando, posições e comprimentos recalculados |

### Evidência

- [CI Web #38487642126](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38487642126): **157/157 Vitest PASS** e TypeScript/Vite build.
- [CI de integração #38487840635](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38487840635): **34/34 Node tests PASS**, `npm ci`, artefatos de pesquisa.
- O registro de 16 comandos é `docs/domain/CH02-SOURCE-LINES-001.json`. As regras de oito curvas pendentes permanecem em `docs/domain/CH02-CURVE-REQUIREMENTS-001.json`.
- Os novos arquivos externos são `ch02-book-command-geometry.json` e `ch02-book-command-lines.svg`. Não são peças para corte nem esquema de impressão.

### Divergências que continuam abertas

**GEOM-01:** os comandos de curva citam pontos e deslocamentos, mas não determinam uma spline única. Não aplicar Bézier por valores padrão.

**FIG-01:** `no seam allowance` foi observado na cintura e na barra dos dois desenhos, mas a área exata de aplicação ainda não foi atribuída a cada aresta.

**METHOD-01:** o livro descreve espelhamento e montagem do bloco de uma peça, que ainda não foi implementado/validado.

**CUT-01:** faltam contornos fechados, distinção linha de costura/linha de corte e exceções por aresta, costura/trueing, tolerâncias, piques, fio, impressão 1:1 e prova física.

**SOFTWARE-01:** integração FreeSewing Part v4 contém API interna `__boundary` usada em laboratório; auditoria de dependências/licenças (ex.: `hooks`) permanece pendente.

A aprovação é apenas de **interpretação de parte dos comandos de traçado e sua execução experimental**. Gates: APP EXPERIMENTAL_ONLY; A IN_REVIEW; B NO-GO; comercial NO-GO.
