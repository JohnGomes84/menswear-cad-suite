# Pesquisa inicial — matriz geométrica do `flat shirt block` (Issue #4)

**Estado:** transcrição técnica preliminar; não é golden case aprovado e não fecha a Issue #4.

**Fonte primária:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª edição, PDF fornecido pelo usuário. As medidas e instruções do bloco estão nas pp. 35–36; o diagrama do `Flat shirt block` está na p. 38. A Issue #4 citava p. 36 como página do diagrama; para paginação do PDF, usar p. 38.

## Fixture de referência e hipótese de eixos

A tabela do bloco fornece: tórax `100 cm`, profundidade de cava `24,4 cm`, nuca à cintura `44,2 cm`, pescoço `40 cm`, meia-costas `20 cm`; o comprimento da camisa “varia com o estilo”. A manga e o punho são tratados nas Issues #1/#2.

Como convenção de trabalho, propõe-se `P0=(0,0)`, `+x` para a direita no diagrama (largura do corpo) e `+y` para baixo no desenho (comprimentos verticais). A fonte manda “square”/esquadrar linhas e o diagrama mostra essas projeções, mas a convenção de sinal/coordenação ainda precisa ser aprovada. Coordenadas condicionais abaixo são apenas verificações aritméticas da fixture sob essa hipótese; não devem ser codificadas como padrão final.

| Ponto/aresta | Relação textual | Resultado aritmético da fixture | Leitura provisória e estado |
|---|---|---|---|
| 0 | Origem; esquadre nos dois sentidos | `(0, 0)` | Origem proposta; direção positiva dos eixos requer aprovação |
| 1 | `0–1 = 3 cm` | `30 mm`; hipótese `P1=(0,30)` | Direção para baixo é mostrada no diagrama |
| 2 | `1–2 = scye depth + 4 cm` | `24,4 + 4 = 28,4 cm = 284 mm`; hipótese `P2=(0,314)` | “Square across”; linha de profundidade da cava |
| 3 | `1–3 = back neck to waist` | `442 mm`; hipótese `P3=(0,472)` | Projeção para a cintura mostrada; conferir sistema de eixos |
| 4 | `1–4 = shirt length` | `30 mm + L_camisa`; `L_camisa` não consta na fixture | Varia com o estilo; impede golden case completo sem escolha de comprimento |
| 5 | `2–5 = 1/4 chest + 6,5 cm` | `25 + 6,5 = 31,5 cm = 315 mm`; hipótese `P5=(315,314)` | Posição pela linha da profundidade da cava; direção à direita mostrada |
| 6 | Esquadrar para cima desde 5 | Se a linha de referência superior passa por 0: `P6=(315,0)` | Projeção indicada, confirmar linha-alvo |
| 7 | Esquadrar para baixo até a linha da cintura | Sob o eixo proposto: `P7=(315,472)` | Linha da cintura é a horizontal por 3 |
| 8 | Esquadrar para baixo até a linha da barra | `x=315 mm`; `y=30 mm + L_camisa` | Comprimento final depende do estilo |
| 9 | `1–9 = 1/5 neck size − 0,6 cm` | `40/5 − 0,6 = 7,4 cm = 74 mm`; hipótese `P9=(74,30)` | Direção horizontal à direita indicada pelo desenho |
| 10 | Esquadrar 3 cm para cima desde 9 | `30 mm`; hipótese `P10=(74,0)` | Projeção mostrada; o traçado exato do decote ainda não está definido |
| 11 | `1–11 = 1/2 da medida 1–2` | `284/2 = 142 mm`; hipótese `P11=(0,172)` | Marca intermediária na linha 1–2, segundo o diagrama |
| 12 | `11–12 = 1/2 half back + 5 cm` | `20/2 + 5 = 15 cm = 150 mm`; hipótese `P12=(150,172)` | “Square out”; confirmar orientação/sinal |
| 13 | Esquadrar de 12 para baixo até a linha de profundidade da cava | Se alinhado com 2: hipótese `P13=(150,314)` | Projeção determinada pela linha indicada; coordenada ainda depende da hipótese de eixos |
| 14 | Esquadrar de 12 para cima | Linha-alvo deve ser confirmada; diagrama parece indicar projeção à linha superior | A fórmula textual não nomeia explicitamente a linha-alvo |
| 15 | `1–15 = 1/8 scye depth − 0,3 cm` | `24,4/8 − 0,3 = 2,75 cm = 27,5 mm` | O diagrama sugere deslocamento para baixo desde 1; sentido não está escrito na frase |
| 16 | Esquadrar para fora desde 15 | Sem distância/alvo numérico na frase | A direção “out” e a linha que limita a projeção precisam ser fixadas com a leitura conjunta do diagrama |
| 17 | `16–17 = 1,5 cm`; unir 10–17 | `15 mm` | A direção do segmento 16–17 não é escrita; não converter em vetor sem revisão |
| 18 | `1–18 = 1/5 neck size − 2 cm` | `40/5 − 2 = 6 cm = 60 mm` | O diagrama sugere deslocamento para baixo na linha central; o texto não explicita a direção |

## Curvas e separação frente/costas

A referência especifica que o decote de costas termina numa linha de fitting 1 cm abaixo de 10; o decote da frente também chega à linha 1 cm abaixo de 10. A cava passa pelos pontos 17, 12 e 5. Isso estabelece condições de passagem e alguns pontos de referência, mas **não** define controle/tangência suficiente para Bézier, spline ou outra curva paramétrica. Não escolher handles visuais para fechar o contorno.

O diagrama identifica “front and back” e mostra curvas de decote diferentes, porém a relação entre bloco compartilhado, moldes separados, centro em dobra ou centro cortado com abertura precisa de decisão de modelagem. Os pontos 13, 14, 16 e 17, a linha-alvo da projeção para 14 e o sentido de 16–17 não devem receber coordenadas hipotéticas.

## Próximas decisões para fechar a Issue #4

1. Aprovar origem, direção dos eixos e sinal de cada projeção, e decidir um valor de comprimento de camisa para a fixture.
2. Confirmar a linha-alvo do ponto 14 e a construção/direção dos pontos 15–17; fixar se 1–18 segue a linha central.
3. Definir curva de decote frente/costas e cava com restrições geométricas rastreáveis, sem copiar controles por aparência.
4. Definir como o bloco compartilhado se separa em frente e costas e se cada centro é dobra, borda de abertura ou outro tratamento.
5. Só então congelar coordenadas golden e QA. Todos os valores acima permanecem `PROPOSED`/`NOT_RUN` até essa revisão.
