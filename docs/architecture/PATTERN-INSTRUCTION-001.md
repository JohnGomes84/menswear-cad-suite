# PATTERN-INSTRUCTION-001 — Interpretador sequencial de métodos de modelagem

**Estado:** implementação experimental, domínio **RESEARCH_ONLY** (13/10/2026).  
**Fonte primária para a primeira fixture:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª edição, capítulo 2, texto nas páginas PDF **31–33** e diagrama na página **34**.  
**Objetivo:** executar regras construtivas **do método**, não reproduzir o desenho por coordenadas manuais nem criar um gerador específico de camisas ou calças.

## Princípio

Cada método é um **programa de instruções declarativas e sequenciais**, alimentado por um mapa de medidas em milímetros. Cada passo:

1. Possui `stepId` e o `pointId` único gerado.
2. Referencia apenas medidas e pontos anteriores já construídos.
3. Declara operação geométrica e fórmula escalar, sem `eval` ou código executável vindo de projeto.
4. Declara `sourceId`, capítulo, página PDF e interpretação textual/visual das direções.
5. Produz coordenada canônica em mm e **trace** reproduzível de origem, operação e referências.

Pontos 0, 1, 2 etc. pertencem ao **programa do método**, nunca a um kernel exclusivo de roupas. Um método para paletó, camisa, calça ou outro sistema futuro utiliza os mesmos operadores, e novos operadores só entram mediante necessidade comprovada da fonte.

## Expressões matemáticas implementadas

| Nome de AST | Sentido |
|---|---|
| `MEASURE_MM(name)` | Entrada corporal ou de produto explicitamente nomeada |
| `LITERAL_MM(value)` | Acréscimo ou distância constante da instrução, em mm |
| `DISTANCE_MM(from,to)` | Distância euclidiana entre dois pontos existentes |
| `ADD(a,b)`, `SUBTRACT(a,b)` | Soma e subtração de escalares |
| `MULTIPLY(value,factor)` | Fração ou fator da medida/cota construída |

As expressões não expõem fórmulas copiadas do livro via UI. A implementação matemática é original e os métodos documentam proveniência.

## Operadores de construção implementados

| Operação | Significado geométrico |
|---|---|
| `ORIGIN` | Ponto inicial referenciado |
| `OFFSET` | Deslocar LEFT/RIGHT/UP/DOWN a distância calculada |
| `PROJECT_AXES` | Cruzar vertical que passa por um ponto e horizontal de outro |
| `INTERSECT_LINE_AT_Y` | Interseção **dentro de um segmento** com nível horizontal, falhando em horizontalidade degenerada |
| `MIRROR_ABOUT_VERTICAL` | Simetria horizontal do ponto em torno da vertical que passa por outra referência |

**As direções** são hipóteses de interpretação que devem ser verificadas no diagrama original. Elas não são inferidas de pixels nem escolhidas automaticamente para satisfazer os testes.

## Primeira execução vinculada ao livro — calça plana CH02

`aldCh02FlatTrouserProgram.ts` contém dois programas de **frente de calça**:

- `ONE_PIECE`: passos de referência `0–11`, do texto PDF 32, com direções verificadas na figura PDF 34.
- `TWO_PIECE`: passos de referência `0–15`, do texto PDF 33, com direções verificadas na figura PDF 34.

Cada programa tem as variantes `BASIC` e `EASY`, como opções explícitas de acréscimos/frações; as entradas são `seatMm`, `bodyRiseMm` e `insideLegMm`. O `flatTrouserResearch.ts` é um **adaptador** que somente executa o programa genérico e apresenta os pontos e guias já documentados: não mantém cálculo duplicado.

### Correção obrigatória do diagrama — frente de duas peças

A implementação anterior colocava `12` à esquerda de `11` e `13` à direita; o livro coloca **`12` à direita e `13` à esquerda**. Consequentemente, `14` — interseção da guia `1→12` no joelho — e `15` — reflexão em `10` — também mudam. Os testes que aprovavam os valores antigos apenas confirmavam o código equivocado e foram substituídos por fixtures independentes da fonte.

Para medidas do texto (seat=1020, body rise=282, inside leg=800 mm), variante BASIC, adotando `+x` para a direita/`+y` para baixo:

| Ponto | X calculado (mm) | Y (mm) | Dependência textual/diagrama |
|---|---:|---:|---|
| 9 | -157,5 | 302 | 1→9: meia largura + 10 mm, para esquerda |
| 10 | -157,5 | 702 | projeção de 9 no nível do joelho |
| 11 | -157,5 | 1102 | projeção de 9 na barra |
| 12 | -49,1667 | 1102 | 11→12 para a **direita** |
| 13 | -265,8333 | 1102 | 11→13 para a **esquerda** |
| 14 | -24,5833 | 702 | interseção 1→12 com nível 3 |
| 15 | -290,4167 | 702 | simetria de 14 em torno da vertical de 10 |

Valores são *derivações aritméticas*, não valores de coordenadas impressos literalmente no livro. Testes numéricos e asserts de esquerda/direita protegem essa leitura contra regressão.

## Tratamento de incerteza e falhas

Execução bloqueada por identidade de passo/ponto repetida, medida inexistente ou não finita, referência futura, distância negativa, origem sem fonte, direção desconhecida, interseção ambígua ou fora do segmento, operação desconhecida e overflow. `RESEARCH_ONLY` impede que esse contrato seja descrito como peça de corte.

### Fora do escopo e gates

- **Não construído:** curvas dependentes de instruções de contato/tangência, contorno completo, frente/costas combinadas, margens por aresta, costura, mola de pence, piques, gradação e exportação de molde.
- **Não validado:** equivalência técnica completa do livro, aprovação de modelista, prova física/toile, escala real de PDF.
- As fontes podem conter passos descritivos que exigem escolha geométrica adicional; essas escolhas precisam de operador proposto com justificativa, fixture e validação, não aproximação silenciosa.
- **Gate APP:** experimento numérico; **Gate A:** IN_REVIEW; **Gate B PILOT-001:** NO-GO; comercial: NO-GO.

**Próxima sequência de trabalho fundamentada:** revisar as instruções **BACK SECTION** do mesmo capítulo e decompor seus pontos e operações (incluindo curvas, sem inventar tangências) antes de estender outras peças. Continuar a auditoria metódica das famílias do livro na Issue #30, com problemas da calça na Issue #44.
