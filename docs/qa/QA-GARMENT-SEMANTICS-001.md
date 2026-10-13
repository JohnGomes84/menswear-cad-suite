# QA-GARMENT-SEMANTICS-001 — Semântica, margens e interoperabilidade

**Data:** 13/10/2026 · **Escopo:** contrato executável de entidades de vestuário **não destinado a corte**.  
**Método da obra:** Aldrich, 5ª ed., CH02, PDF pp.31–34.  
**Evidência automatizada:** `prototype/web-app/src/garmentSemantics.test.ts`, `aldCh02AllowancePolicy.test.ts` e `prototype/integration-spike/tests/semanticBridge.test.mjs`.

## Matrizes de teste

| ID | Cenário | Resultado exigido |
|---|---|---|
| GS-01 | Dois contêineres semânticos da calça de uma peça e de duas peças | `RESEARCH_ONLY`; pontos/trace do interpretador; nenhuma aresta de costura/corte |
| GS-02 | BASIC/EASY e medidas corporais alteradas | Recalcular fontes sem renomear `sourceStepId` ou inventar método |
| GS-03 | Contrato sintético com `SEAM_LINE`, `CUT_LINE`, `HEM_LINE`, `FOLD_LINE` | É possível representar os papéis **somente** sob `SYNTHETIC_ONLY` |
| GS-04 | Pique e fio sintéticos | Pique deve referir `SEAM_LINE/CUT_LINE`, `0<fraction<1`; fio exige dois pontos conhecidos |
| GS-05 | Margem sintética `ALREADY_INCLUDED_IN_BLOCK` / `OFFSET_NEEDED_NOT_EXECUTED` | Armazenar regra por costura, nunca executar um offset implícito |
| GS-06 | Margem CH02 do livro | p.31: 10 mm **incluídos**, exceção explícita, **nenhuma aresta mapeada/offset autorizado** |
| GS-07 | Tentativa de dupla margem na mesma costura | Rejeitar |
| GS-08 | Costura/corte/fio/dobra/pique acrescentados ao CH02 parcial | Rejeitar, inclusive com tentativa de esconder evidências |
| GS-09 | `cutReady=true`, `physicalFit=PASS`, campos não conhecidos | Rejeitar |
| GS-10 | NaN, Infinity, comprimento zero, IDs repetidos, pontos/evidências inexistentes | Rejeitar |
| GS-11 | Importação de objeto arbitrário | Retornar dados clonados/canônicos e validar novamente com mesmo resultado |
| GS-12 | Modelo semântico CH02 → `Part` do FreeSewing | Concordância de IDs, posições, comprimentos e fonte; `CUT_READY=false` |
| GS-13 | Fixture sintética de `grainline`/pique do FreeSewing | Não adicionar nenhuma marca ao modelo CH02 |
| GS-14 | Saída CLI/CI | Quinto relatório `ch02-semantic-contract.json` com `PASS_RESEARCH_TRACE_ONLY` e `cutReady=false` |

## Regras de interpretação

- A string `DEPENDENCY_CONNECTOR` **não** significa “linha de costura” nem “linha desenhada no livro”. Ela aponta ao primeiro ponto da expressão construtiva; exige mapa específico para traços literais do diagrama.
- A regra de **1 cm já incluído** em CH02 é uma regra **em nível de bloco**, não margem implicitamente autorizada para todas as arestas. Não permite um segundo offset automático.
- Um objeto `Part` externo contendo linhas não altera o status do desenho. Este contrato não contém qualquer transição para `PRODUCTION_APPROVED`.
- As declarações de margem são metadados, **não** uma implementação de geometria offset/topologia de cantos.

## Lacunas e bloqueadores

**SOURCE-01:** contornos reais de frente/costas precisam de auditoria dos traços do livro, curvas e acabamento de cantos. **SEAM-01:** topologia e pares de costuras, comprimentos, notches, margem por trecho, grafo de montagem e fio estão em `NOT_YET_DEFINED`. **PRINT-01:** sem prova em escala física. **FIT-01:** sem toile/revisão da modelista. **LEGAL-01:** auditoria de licenças e dependências de terceiros permanece pendente, incluindo `hooks@0.3.2`.

**Release:** APP EXPERIMENTAL_ONLY; A IN_REVIEW; B NO-GO; COMERCIAL NO-GO.
