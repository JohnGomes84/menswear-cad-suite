# CH02-DIAGRAM-001 — Leitura visual do diagrama de calça flat

**Fonte:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª edição, PDF disponibilizado no projeto, páginas 31–34, especialmente o **diagrama da página 34**.  
**Estado:** `DIAGRAM_PARTIAL` — leitura visual das referências da **frente** concluída; geometria integral, costas e montagem não aprovadas.  
**Escopo:** `ALD-CH02-01`, construção `ONE_PIECE` / `TWO_PIECE`, variantes básica e folgada.

## Elementos de orientação confirmados

A figura do livro foi observada diretamente, não apenas pelo texto extraído. Os desenhos original da obra **não foram copiados para o GitHub**. Para os dois blocos, o sistema de referência de engenharia é:

- ponto `0` sobre o eixo vertical do lado direito, na região superior;
- `1` abaixo de `0`; `2` abaixo de `1`; `3` na linha intermediária do joelho;
- `4` à **esquerda** de `1`; `5` diretamente acima de `4`, na linha superior;
- `6` à direita de `5`; `7` acima de `4`; `8` à esquerda de `4`;
- eixo de engenharia escolhido: `+X` para direita, `+Y` para baixo, origem `0=(0,0)`; tudo em **mm**.

**Interpretação geométrica:** linhas `0→1→3→2` e auxiliares horizontais em `1`, `3` e `2`; projeções ortogonais para `4/5/7/8`. As coordenadas são calculadas a partir de cotas textuais, **nunca obtidas por pixels do PDF**.

### Frente — bloco de uma peça

- `9` situa-se à esquerda de `2` na linha da barra.
- `10` é a projeção de `9` sobre a linha do joelho.
- `11` fica à esquerda de `10`, conforme cota textual.
- A figura representa **contornos de frente e costas** com traços de distinção, seguidos de etapa de construção/espelhamento; os traços **não** autorizam copiar controle de curva como dado numérico.

### Frente — bloco de duas peças

- `9` à esquerda de `1` na linha da altura do gancho; `10` e `11` são suas projeções nos níveis de joelho e barra.
- `12` e `13` distribuem-se simetricamente à esquerda/direita de `11`.
- `14` é obtido pela interseção da guia `1→12` com a linha do joelho, situada na metade do comprimento interno da perna.
- `15` compensa simetricamente a posição `14` em relação ao eixo `10`, conforme instrução `10→15=10→14`.
- Esses pontos são **guias da frente**, não polígonos que possam ser enviados ao plotter para corte.

## Limites e exceções de margem observados

A figura marca explicitamente **regiões de «no seam allowance»**, incluindo a região superior e a linha inferior, e distingue graficamente os traçados frente/costas. A descrição textual estabelece margem incluída como padrão com exceções. **Não é correto adicionar globalmente mais 10 mm a todas as arestas.** A matriz final de contorno/costura/corte exige ler individualmente as exceções e separar as seções da figura.

A linha lateral `0→2` é uma **referência de construção** no bloco inicial e serve ao procedimento de junção/espelhamento da versão de uma peça; não declarar `SeamEdge` pela presença visual dessa guia.

## Implementação técnica e fixture

`prototype/web-app/src/flatTrouserResearch.ts` calcula dois **esqueletos de frente**, sem curvas ou contornos: `ONE_PIECE` (pontos `0–11` disponíveis no subconjunto) e `TWO_PIECE` (pontos `0–15` do subconjunto de construção da frente). Entradas `seat`, `bodyRise` e `insideLeg` em mm com variantes `BASIC`/`EASY`.

Para tamanho MEDIUM da amostra textual (`seat=1020`, `rise=282`, `insideLeg=800` mm):

| Ponto ou relação | Uma peça / duas peças, BASIC | EASY |
|---|---|---|
| `1.y` | 302 mm | 322 mm |
| `2.y` | 1102 mm | 1122 mm |
| `4.x` | -295 mm | -335 mm |
| `8.x` | -363,75 mm | -423,75 mm |
| `9.x` uma peça | -216,667 mm aprox. | -248,333 mm aprox. |
| `9.x` duas peças | -157,5 mm | -177,5 mm |

**Observação:** a ordenação dos pontos não representa linha de corte, e valores negativos são apenas sinal de coordenadas de engenharia.

## Impedimentos que permanecem

1. Construir a matriz completa de **costas** dos dois blocos, com guias adicionais e revisão das direções ambíguas.
2. Especificar as **curvas** do gancho e entreperna, seus pontos intermediários, tangências e continuidade. O diagrama não fixa uma spline/Bézier única.
3. Estabelecer contorno fechado e proveniência de cada aresta `SeamEdge`, `FoldLine` e `CutEdge`, incluindo margens incluídas e exceções.
4. Verificar equivalência e montagem de costuras entre as peças, comprimentos e folga de fabricação.
5. Validar medidas reais, impressão 1:1, prova física e parecer de modelista.

**Gate:** `TEXT_REVIEWED + DIAGRAM_PARTIAL`; **NÃO** `DIAGRAM_REVIEWED` integral, **NÃO** `DraftRuleSet APPROVED`, **NÃO** produto de corte.

A continuidade está rastreada na [Issue #44](https://github.com/JohnGomes84/menswear-cad-suite/issues/44).
