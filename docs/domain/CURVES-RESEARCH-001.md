# CURVES-RESEARCH-001 — Técnicas documentadas para ganchos e curvas em modelagem CAD

**Data:** 13/10/2026 · **Situação:** pesquisa e requisitos de modelagem, NÃO geometria aprovada.
**Fonte principal:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª edição (PDF disponibilizado pelo usuário), pp. 14, 31–34.
**Objetivo:** preservar o método da obra e fundamentar a futura construção de curvas sem digitalizar figuras ou inserir Béziers arbitrárias.

## 1. O que a fonte primária efetivamente determina

O prefácio de ferramentas (PDF p. 14) recomenda réguas curvas, curva francesa e curva flexível como meios para desenhar curvas adequadas. Esses instrumentos são instrumentos de construção **sujeitos às medidas e aos pontos do método**, não substitutos das fórmulas.

No capítulo 2 (PDF pp. 32–34), as instruções fornecem referências concretas para traçados de gancho, lateral e entreperna. No código, as cotas são convertidas a mm. **Não estão sendo reproduzidas imagens ou páginas do livro.**

| Método / seção | Condições *especificadas* pelo texto | O que ainda não está definido matematicamente |
|---|---|---|
| Uma peça, frente, curva de gancho | Liga segmentos pela sequência 6→7→8, com passagem/contato em referência situada a **30 mm** de 4; opção folgada **32,5 mm**. | Direção exata e geometria da referência intermediária, tangentes e parametrização entre pontos |
| Uma peça, costas, curva de gancho | Liga 13→14→16, com referência de contato a **55 mm** de 4; folgada **60 mm**. | Direção da referência, tangentes e continuidade |
| Duas peças, frente, curva de gancho | Mesma família de referência 6→7→8, **30 / 32,5 mm** a partir de 4. | Mesmo conjunto de incógnitas |
| Duas peças, costas, curva de gancho | Liga 17→19→21, referência de contato a **55 / 60 mm** de 4. | Direção exata da distância e tangentes |
| Uma peça, entreperna dianteira | 9→11 é reta; 8→11 tem **entrada interior de 10 mm**. | Ponto ao longo do trecho onde a entrada é medida, tipo de curva, tangentes |
| Uma peça, entreperna traseira | 17→18 é reta; 16→18 tem **entrada interior de 20 mm**. | Local da entrada e transição |
| Duas peças, entreperna dianteira | 13→15 é reta; 8→15 tem **entrada interior de 10 mm**. | Local da entrada e transição |
| Duas peças, entreperna traseira | 24→25 é reta; 21→25 tem **entrada interior de 20 mm**. | Local da entrada e transição |

**Importante:** o livro *fixa dimensões e relações de traçado*, mas esses valores não definem automaticamente os quatro pontos de controle de uma cúbica de Bézier. A instrução deve ser codificada inicialmente como **requisitos de curva** (pontos obrigatórios, passagem, deslocamento assinado, segmentos retos, orientação, referências) e depois resolvida por um algoritmo documentado e conferido. A escolha de um algoritmo numérico é uma **decisão de engenharia CAD**, nunca algo a atribuir indevidamente à autora.

## 2. Técnicas complementares comprovadas em fontes técnicas

| Técnica | Evidência externa | Implicação para o CAD |
|---|---|---|
| **Régua francesa com linha-guia auxiliar / referência a 45°** | Curso Dresspatternmaking: em curva de gancho, marca guia diagonal de 45° e avalia a suavidade, considerando a distância como orientação de construção, não único critério | Representar ponto-guia e testar passagem/direção/suavidade sem equivaler “passa nos pontos” a “encaixa no corpo” |
| **Curva francesa com referências de gancho e quadril** | Cornell University, draping de calças: construção de curva de gancho traseiro com régua francesa sobre pontos de referência | Tratar referência de gancho como modelagem de forma, não como arco de raio fixo universal |
| **Alças de controle com ângulos e comprimentos por fórmulas** | Comunidade de desenvolvimento Seamly: curvas paramétricas recalculam com novas medidas quando ângulos/handles são dependentes de pontos e segmentos; transição sem quinas depende de tangentes orientadas | Controlar tangentes `G1` entre curvas adjacentes e parametrizar alças por cota/segmento, nunca pixels ou ajuste livre fixo |
| **Concordância e “andar as costuras” (walking/trueing)** | Seamwork e The Shapes of Fabric: conferir extensão de arestas parceiras e ausência de quebra na junção, caminhar entrepernas/laterais antes de cortar | Criar diagnóstico de comprimento em **linha de costura** e continuidade nos encontros, não apenas plot de curvas isoladas |
| **Ajuste de encaixe em toile** | Threads: o ajuste do gancho depende da forma do corpo; checar transições junto à entreperna e ajustar a curva no molde após prova | Não confundir `NUMERICALLY_SATISFIED` com `FIT_VALIDATED`; exigir prova de vestibilidade |
| **Gradação preservando relações de costura** | M. Müller & Sohn: controlar forma do gancho e comprimentos em gradação e transferir ajustes para a entreperna | Testar regras em diferentes medidas/tamanhos e aferir distorção de curvas |

Fontes consultadas:
- Livro da obra: Aldrich, 5ª ed., pp. 14, 32–34 (PDF do usuário).
- Cornell University: https://fit.cit.cornell.edu/textiles/draping/drapes/pants/steps/print.html
- Dresspatternmaking: https://dresspatternmaking.com/videos/video-learn-how-to-draft-the-basic-pants-block-part-2-drafting-a
- Seamly, método de curvas suaves: https://forum.seamly.io/t/creating-smooth-curves-the-kolson-method/1818
- Seamly, curvas e alças formulares: https://forum.seamly.io/t/formula-options/15382
- Seamwork, trueing: https://www.seamwork.com/sewing-patterns/pattern-hack-how-to-rotate-a-dart
- The Shapes of Fabric, *walking* de calças: https://www.theshapesoffabric.com/2020/08/16/learn-how-to-draft-the-basic-pants-pattern/
- Threads, ajuste de gancho: https://www.threadsmagazine.com/project-guides/fit-and-sew-pants/step-by-step-process-for-better-fitting-pants
- Müller & Sohn, gradação e costuras: https://www.muellerundsohn.com/en/allgemein/grading-trouser-patterns/

**Hierarquia da evidência:** essas fontes complementares orientam possíveis técnicas de representação, continuidade e QA; **não substituem as medidas e o procedimento de Aldrich** nem autorizam incorporar como regra universal as tolerâncias ou ajustes próprios de outro sistema.

## 3. Contrato proposto para futura curva paramétrica

**Fase A — `CURVE_REQUIREMENTS`:** método, página e trecho (`frontCrotch`, `backCrotch`, `inseam` etc.), pontos extremos, pontos de passagem, distância/entrada interior, direção, variante, tecido e `sourceTrace`. Se a direção ou o lugar do deslocamento não forem inequívocos, estado `AMBIGUOUS_REFERENCE` e bloqueio de produção.

**Fase B — `CURVE_CANDIDATE`:** converter requisitos em spline paramétrica por **regra computacional explícita**, não pelo “olhômetro”. Candidatos: Bézier cúbica por trechos, interpolação suave com condições de tangente e minimização de variação de curvatura. O algoritmo e suas condições de contorno são hipóteses de engenharia sujeitas a revisão.

**Fase C — `NUMERICALLY_CHECKED`:** validar pontos obrigatórios, distância assinada onde definida, lado correto da linha, continuidade `G1`, ausência de autointerseção/loops, curvatura sem descontinuidades injustificadas e comprimento real da curva em mm. Testar mudança de medidas e variantes sem deformações imprevistas.

**Fase D — `SEAM_TRUEING_REVIEW`:** identificar quais trechos são realmente costuras parceiras; caminhar as **linhas de costura**, medir diferença com tolerância *especificada pelo método ou projeto* e verificar encontros sem bicos. **Nem toda costura de calça é obrigatoriamente de comprimento idêntico**: prever embebimento/alongamento de tecido quando explicitamente permitido pela técnica utilizada.

**Fase E — `PHYSICALLY_VALIDATED`:** imprimir 1:1, conferir dimensões físicas, montar toile em tecido representativo (tecido plano ou malha conforme método), avaliar postura/assento e obter parecer da modelista. Sem isso não há molde liberado para corte.

## 4. Decisões que não devemos antecipar

- Não impor a constante **0,551915** (aproximação Bézier de arco circular apresentada em tutorial comunitário) como “forma correta universal” de gancho: **gancho não é universalmente circular**.
- Não adotar “45 graus” de outro método como regra para todas as curvas Aldrich.
- Não substituir as cotas de entrada **10 / 20 mm** por parâmetros fixos de Bézier.
- Não criar margens automaticamente: Aldrich inclui 10 mm por padrão nesses blocos, **com exceções indicadas no desenho**.
- Não declarar `APPROVED` só porque o desenho é visualmente suave. As curvas continuam `NOT_YET_DEFINED` até resolver ambiguidades com a fonte e validação competente.

## 5. Próximo desenvolvimento permitido

1. Completar e conferir pontos e linhas-guia retas das costas contra pp. 32–34, com testes fonte-dirigidos e resultado `RESEARCH_ONLY`.
2. Criar a matriz declarativa de oito curvas do quadro 1, **sem gerar geometrias definitivas**.
3. Para cada curva, inspecionar sentido/posição das referências do diagrama, definir condições de tangente onde houver suporte e documentar escolhas de interpolação.
4. Implementar um protótipo matemático de curva em sandbox que apenas **propõe candidatas**, com residuais e comparação contra a técnica; deixar bloqueado o corte/produção.
5. Submeter a modelista as transições de gancho/entreperna, costuras correspondentes e toile antes da promoção dos estados.

**Gates:** CAUSAL_METHOD_REVIEW (fonte) → CURVE_REQUIREMENTS_VERIFIED → NUMERICALLY_CHECKED → SEAM_TRUEING_REVIEW → PHYSICALLY_VALIDATED. Atualmente só há relações textuais e guias parciais. Gate B do PILOT-001 continua NO-GO.
