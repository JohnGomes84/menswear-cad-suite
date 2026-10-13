# Pesquisa da matriz geométrica do `flat shirt block` — Issue #4

**Estado:** transcrição geométrica condicional, refinada pela inspeção do diagrama a 300 dpi. Não é golden case aprovado e não fecha a Issue #4.

**Fonte primária:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª edição, PDF fornecido pelo usuário. O texto do `flat shirt block` está nas pp. 35–36; o diagrama está na p. 38 do PDF. A Issue #4 inicialmente apontava p. 36 como página do diagrama; para a paginação do PDF, a página correta é 38.

## Fixture publicada e referencial de trabalho

A tabela do bloco fornece tórax `100 cm`, profundidade de cava `24,4 cm`, nuca à cintura `44,2 cm`, pescoço `40 cm` e meia-costas `20 cm`. O comprimento da camisa “varia com o estilo”. A manga e o punho são tratados nas Issues #1/#2.

A leitura da p. 38 sustenta um referencial de trabalho com `P0=(0,0)`, `+x` para a direita no desenho e `+y` para baixo. O desenho mostra o eixo vertical do centro frente/costas, projeções horizontais e verticais e pontos alinhados. Esse referencial torna possível transcrever coordenadas condicionais para a fixture; sua adoção como convenção de domínio ainda requer revisão de modelagem/geometria.

As coordenadas desta tabela são uma reconstrução da transcrição textual e do diagrama. Elas **não** devem ser usadas como bloco de produção, nem ser tratadas como aprovação de ajuste ou de construção.

| Ponto/aresta | Relação textual | Resultado aritmético da fixture | Leitura condicional do diagrama |
|---|---|---|---|
| 0 | Origem; esquadre nos dois sentidos | `(0, 0)` | Origem proposta |
| 1 | `0–1 = 3 cm` | `30 mm` | `P1=(0,30)`; abaixo de 0 |
| 2 | `1–2 = scye depth + 4 cm` | `24,4 + 4 = 28,4 cm = 284 mm` | `P2=(0,314)`; linha de profundidade da cava |
| 3 | `1–3 = back neck to waist` | `442 mm` | `P3=(0,472)`; linha da cintura |
| 4 | `1–4 = shirt length` | `30 mm + L_camisa` | `P4=(0,30+L_camisa)`; `L_camisa` depende do estilo |
| 5 | `2–5 = 1/4 chest + 6,5 cm` | `25 + 6,5 = 31,5 cm = 315 mm` | `P5=(315,314)` |
| 6 | Esquadrar para cima desde 5 | — | `P6=(315,0)`; alinhado à linha superior por 0 |
| 7 | Esquadrar para baixo até a linha da cintura | — | `P7=(315,472)` |
| 8 | Esquadrar para baixo até a linha da barra | — | `P8=(315,30+L_camisa)`; depende do comprimento de estilo |
| 9 | `1–9 = 1/5 neck size − 0,6 cm` | `40/5 − 0,6 = 7,4 cm = 74 mm` | `P9=(74,30)` |
| 10 | Esquadrar 3 cm para cima desde 9 | `30 mm` | `P10=(74,0)`; a curva de decote não fica definida apenas por esse ponto |
| 11 | `1–11 = 1/2 da medida 1–2` | `284/2 = 142 mm` | `P11=(0,172)` |
| 12 | `11–12 = 1/2 half back + 5 cm` | `20/2 + 5 = 15 cm = 150 mm` | `P12=(150,172)` |
| 13 | Esquadrar de 12 para baixo até a linha de profundidade da cava | — | `P13=(150,314)`; abaixo de 12 na vertical de 12/14 |
| 14 | Esquadrar de 12 para cima | — | `P14=(150,0)`; o diagrama alinha 14 com 12/13 na vertical e com 0/6 na linha superior. A linha-alvo não é nomeada pelo texto. |
| 15 | `1–15 = 1/8 scye depth − 0,3 cm` | `24,4/8 − 0,3 = 2,75 cm = 27,5 mm` | `P15=(0,57,5)`; abaixo de 1 na linha central |
| 16 | Esquadrar para fora desde 15 | — | `P16=(150,57,5)`; projeção horizontal até a vertical de 12/14 |
| 17 | `16–17 = 1,5 cm`; unir 10–17 | `15 mm` | `P17=(165,57,5)`; a p. 38 mostra 17 à direita de 16, na mesma linha horizontal |
| 18 | `1–18 = 1/5 neck size − 2 cm` | `40/5 − 2 = 6 cm = 60 mm` | `P18=(0,90)`; abaixo de 1 na linha central |

Os alinhamentos de 14–17 e as direções visíveis de 15 e 18 foram confirmados pela inspeção do diagrama renderizado a 300 dpi. A expressão textual “square out” não fornece sozinha todas as coordenadas; é a leitura conjunta com a figura que sustenta essas posições. Esse é um resultado de transcrição documental, sujeito à aprovação de modelagem.

## Curvas e separação frente/costas

A referência especifica que o decote de costas chega a uma linha de fitting 1 cm abaixo de 10; o decote da frente também chega à linha de fitting 1 cm abaixo de 10. A cava passa por 17, 12 e 5. Isso informa alguns marcos e condições de passagem, mas **não** define controles, tangências ou um método paramétrico suficiente para Bézier, spline ou outra curva. Não escolher handles apenas para fazer um contorno visualmente plausível.

O diagrama identifica “front and back” e mostra curvas de decote distintas. Ainda falta decidir como o bloco compartilhado se torna peças separadas, e se cada centro é dobra, borda de abertura ou outro tratamento. O texto e a figura tampouco fixam um comprimento numérico de camisa para a fixture.

## Verificação executada nesta rodada

Foi feita uma verificação Python efêmera das relações aritméticas e das coordenadas condicionais lidas da p. 38. Os `assert`s passaram para `0–1=30`, `1–2=284`, `1–3=442`, `2–5=315`, `1–9=74`, `9–10=30`, `1–11=142`, `11–12=150`, `1–15=27,5`, `16–17=15` e `1–18=60 mm`. O teste também verificou as projeções condicionais de 6–8 e 13–18 e que a linha da barra acompanha o parâmetro `L_camisa` em exemplos de comprimento variáveis.

**Resultado:** `PASS_DIAGRAM_CONSISTENCY` para a transcrição condicional desta rodada. Não é teste do motor CAD, não valida curvas, margens, caimento, montagem ou impressão e não transforma os pontos em coordenadas golden aprovadas.

## O que ainda falta para fechar a Issue #4

1. Modelagem/geometria deve aprovar o referencial, as projeções reconstruídas e a interpretação de 14–18, ou corrigir os pontos que a revisão identificar.
2. Selecionar um comprimento de camisa para a fixture e definir a construção completa dos pontos 4/8.
3. Definir curvas dos decotes frente/costas e da cava, incluindo linha de fitting, tangências e método paramétrico rastreável.
4. Definir a separação entre frente e costas, centros/dobras/aberturas e quais curvas/arestas pertencem a cada peça.
5. Depois da revisão, congelar o golden case, implementar os testes geométricos correspondentes e executar regressão no motor.

**Conclusão de estado:** houve progresso material na leitura ponto a ponto, principalmente nas projeções de 14–18. A Issue #4 permanece aberta. QA-POINT-001 tem resultado aritmético reproduzível; QA-POINT-002/003 têm apenas consistência documental/diagramática nesta rodada; QA-POINT-004/005 e qualquer validação do motor seguem pendentes.


## Cross-check no restante do livro — frente/costas e fitting line

A busca por regras adicionais localizou “Separate front and back body sections” nas instruções de `12 Classic raglan sleeve` (PDF p. 121). O contexto separa as peças para adaptar ombros e cavas ao recorte raglan e posiciona pontos específicos na fitting line; não é uma instrução da seção `flat shirt block`. Não deve ser aplicada por analogia para decidir se o bloco base da camisa plana é traçado em dobra, em par ou como duas peças desde o início.

No trecho do `flat shirt` (PDF pp. 35–36), há dois decotes de referência, a chamada de centro “front and back” e marcos para a cava, mas não está descrito como extrair as peças independentes nem qual linha central é dobra/abertura. A fonte também não define handles/tangências para as curvas. O cross-check, portanto, não remove as pendências 3–4; ele evita usar uma adaptação raglan como regra não autorizada para o bloco base. Issue #4 segue aberta aguardando decisão de modelagem e golden case.
