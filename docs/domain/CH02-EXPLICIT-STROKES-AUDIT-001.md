# CH02-EXPLICIT-STROKES-AUDIT-001 — Comandos de traçado versus linhas de cálculo

**Data:** 13/10/2026 · **Estado:** TEXT_COMMANDS_REVIEWED / DIAGRAM_PARTIAL / NO-CUT.  
**Fonte primária:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª edição, PDF do usuário, páginas 31–34.  
**Registro auditável:** [CH02-SOURCE-LINES-001.json](CH02-SOURCE-LINES-001.json).  
**Executor:** `prototype/web-app/src/ch02BookLineCommands.ts`; prova real de geometria em `prototype/integration-spike/src/bookCommandBridge.mjs`.

## 1. Diferença que resolve um problema de interpretação

Há **três coisas distintas** no CAD:

1. **Conexão de dependência matemática:** o passo 15 calcula usando ponto 8 (ou fórmula que inclui outro segmento); a visualização que liga esse ponto à primeira referência **não é necessariamente uma linha desenhada por Aldrich**.
2. **Comando explícito de traçado:** o livro manda unir dois pontos por reta, desenhar uma curva passando por referências ou curvar a entreperna para dentro. **Somente estes comandos** constituem os 16 registros desta fase.
3. **Linha industrial:** aresta de costura, de corte, dobra, bainha ou outra função real. **Não decorre automaticamente** do texto anterior nem da classe `FreeSewing.Path`.

O registro cobre apenas os **comandos explícitos “join/draw”** das seções frente/costas dos dois blocos de calça plana, não todos os traços auxiliares de esquadro nem a topologia integral. Um comando com três pontos é um único trajeto de curva com referências, **não uma curva Bézier já determinada**.

## 2. Auditoria independente: texto do livro versus comandos

| Método | Seção | Página texto | Referências dos comandos | Tipo |
|---|---|---:|---|---|
| Uma peça | Frente | 32 | 6–7–8 | Curva de gancho — pendente |
| Uma peça | Frente | 32 | 9–11 | Reta explicitamente prescrita |
| Uma peça | Frente | 32 | 8–11 | Curva de entreperna — pendente |
| Uma peça | Costas | 32 | 13–0 | Reta explicitamente prescrita |
| Uma peça | Costas | 32 | 13–14–16 | Curva de gancho — pendente |
| Uma peça | Costas | 32 | 17–18 | Reta explicitamente prescrita |
| Uma peça | Costas | 32 | 16–18 | Curva de entreperna — pendente |
| Duas peças | Frente | 33 | 6–7–8 | Curva de gancho — pendente |
| Duas peças | Frente | 33 | 1–12 | Reta de construção, referência de joelho 14 |
| Duas peças | Frente | 33 | 13–15 | Reta explicitamente prescrita |
| Duas peças | Frente | 33 | 8–15 | Curva de entreperna — pendente |
| Duas peças | Costas | 33 | 17–18 | Reta explicitamente prescrita |
| Duas peças | Costas | 33 | 17–19–21 | Curva de gancho — pendente |
| Duas peças | Costas | 33 | 18–22 | Reta de construção, referência de joelho 23 |
| Duas peças | Costas | 33 | 24–25 | Reta explicitamente prescrita |
| Duas peças | Costas | 33 | 21–25 | Curva de entreperna — pendente |

São **8 retas e 8 curvas instruídas**. Em cada método, quatro curvas. Os valores de referência **30 / 32,5 mm** e **55 / 60 mm**, bem como entradas interiores **10 / 20 mm**, continuam armazenados em `CH02-CURVE-REQUIREMENTS-001.json`; não foram transformados em parâmetros arbitrários de alça.

## 3. Inspeção do diagrama PDF p.34 (imagem real)

A figura distingue por convenção gráfica a **frente pontilhada** e as **costas com linha contínua**. Isso auxilia a identificar figuras, **mas não constitui uma licença para inferir as linhas de costura e corte**. Na figura de uma peça, a instrução escrita manda contornar as duas seções, espelhar a frente e unir pelas laterais. Essa operação foi registrada como `DOCUMENTED_OPERATION_NOT_EXECUTED`; espelhamento e montagem não são gerados automaticamente.

O diagrama rotula **`no seam allowance`** na região superior (cintura) e na inferior (barra) **em ambas as construções**, produzindo quatro observações auditadas:
- `ONE_PIECE:UPPER_WAIST`
- `ONE_PIECE:LOWER_HEM`
- `TWO_PIECE:UPPER_WAIST`
- `TWO_PIECE:LOWER_HEM`

**Limite da evidência:** o alcance preciso de cada chamada sobre a(s) aresta(s), a diferenciação do contorno de frente/costas e a definição de linha final de corte exigem validação geométrica. As observações são **regionais** e têm estado `REGION_CONFIRMED_EDGE_SCOPE_NOT_MAPPED`. Não associar silenciosamente a uma `SemanticEdge`.

A p.31 esclarece que **10 mm já estão incluídos nos blocos em geral**, com exceções identificadas. Portanto, **não acrescentar 10 mm automaticamente** em qualquer reta/curva ou duplicar margem nas regiões superiores/inferiores. `aldCh02AllowancePolicy.ts` permanece `BLOCKED_UNTIL_SOURCE_EDGE_TOPOLOGY_REVIEW`.

## 4. Execução e capacidades reais

O registro de comandos é consumido por `resolveCh02BookLineCommands(method, measurements)`:

- Reutiliza o interpretador original (medidas, pontos de Aldrich em milímetros), sem duplicar fórmulas.
- **Retas expressamente comandadas:** são executadas como coordenadas de dois pontos, com comprimento calculado. Papel `DOCUMENTED_LINE_UNCLASSIFIED` — **não costura nem corte**.
- **Curvas expressamente comandadas:** publicadas como âncoras e `SOURCE_CURVE_REQUIREMENTS_PENDING`, `hasSpline=false`; nenhuma curva gerada.
- **Exceções de margem:** publicadas como observações **regionais**, com `offsetAllowed=false`.
- **Espelhamento:** `mirrorPerformed=false`, mesmo no bloco uma peça.

A prova `bookCommandBridge.mjs` cria `new FreeSewing.Point` e `new FreeSewing.Path().move().line()` **somente para as retas de fonte**, coteja os comprimentos com os calculados pelo interpretador e exporta:
- `ch02-book-command-geometry.json` — retas, curvas pendentes, evidências, região de exceção e gates;
- `ch02-book-command-lines.svg` — **diagnóstico de visualização não calibrado**, contendo apenas retas explicitamente prescritas, nunca contornos fechados.

Este SVG é intencionalmente parcial: não substitui o diagrama original e não representa um molde de vestuário.

## 5. O que ainda impede avançar para corte

- Escolha documentada de referência espacial e controle das curvas de gancho/entreperna, sem introduzir tangentes arbitrárias.
- Mapeamento completo de **linhas auxiliares, linhas de montagem, costura e corte** e identificação exata dos limites das regiões `no seam allowance`.
- Validação de topologia dos dois blocos, transformação/espelhamento para o de uma peça, seam-trueing, piques, fio e possíveis dobras.
- Conferência com modelista e toile, depois plotagem física com escala validada.

**Status final:** evidência de comandos de reta de fonte **TEXT_REVIEWED**; mapeamento de diagrama **PARCIAL**, oito curvas e todos os contornos de corte **NÃO APROVADOS**; Gate B PILOT-001 e comercial **NO-GO**.
