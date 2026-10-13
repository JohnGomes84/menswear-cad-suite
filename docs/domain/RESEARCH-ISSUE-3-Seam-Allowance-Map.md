# Pesquisa dirigida — margens por aresta do `flat shirt block` (Issue #3)

**Estado:** mapa preliminar para revisão de modelagem; não libera offsets nem exportação para corte.

**Fonte primária:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª edição, PDF fornecido pelo usuário. A regra geral está na p. 35; as instruções de construção continuam na p. 36; o diagrama do `Flat shirt block` está na **p. 38**. A referência de diagrama “p. 36” que aparece na Issue #3 parece incorreta para paginação do PDF: p. 36 contém instruções, enquanto o desenho está na p. 38.

A p. 35 declara que os blocos incluem **1 cm de margem de costura**, exceto onde indicado `no seam allowance`. O diagrama p. 38 identifica algumas exceções (`no seam allowance`, `centre line`, `no hem allowance`). Ele não fornece uma lista textual por aresta nem uma legenda inequívoca para decidir qual traço representa a linha líquida de costura e qual representa o contorno de corte. Por isso, os valores abaixo separam o que é explícito da aplicação da regra geral.

| Peça | Aresta/trecho no diagrama | Classificação preliminar | Evidência e pendência |
|---|---|---|---|
| Corpo | Decote frente/costas | 0 mm onde coberto pela chamada `no seam allowance` | Chamada explícita na região do decote; confirmar se a indicação se aplica às duas curvas. |
| Corpo | Centro frente/costas, linha 0–4 | 0 mm como linha central, sem tratar como costura | O diagrama identifica `centre front and back` e marca ausência de margem no trecho inferior. Confirmar se a peça será dobrada, cortada em par ou se receberá abertura/placket fora do piloto. |
| Corpo | Ombro, trecho 10–17 | 10 mm incluídos no bloco, pela regra geral | Sem exceção indicada junto ao ombro. Confirmar interpretação dos traços paralelos. |
| Corpo | Cava, curva 17–12–5 | 10 mm incluídos no bloco, pela regra geral | Sem exceção indicada na cava. A curva/offset e a linha de referência precisam ser distinguidas antes de normalizar a geometria. |
| Corpo | Lateral, 5–7–8 | 10 mm incluídos no bloco, pela regra geral | Sem exceção indicada na lateral. Confirmar encontro com barra e a leitura dos traços. |
| Corpo | Barra, 4–8 | 0 mm de margem de bainha | Indicação explícita `no hem allowance`. Não acrescentar margem de barra ao bloco-base. |
| Manga | Cabeça, curva 3–5–6–7–8–0 | 10 mm incluídos no bloco, pela regra geral | Sem exceção indicada na curva. Confirmar qual traço é linha de costura/corte e como encontra a cava. |
| Manga | Costura inferior, 3–4 | 10 mm incluídos no bloco, pela regra geral | Sem exceção indicada na costura. Confirmar encontro com o bordo inferior. |
| Manga | Trecho 0–1 | 0 mm | Chamada explícita `no seam allowance`. Confirmar o papel construtivo desse trecho na montagem. |
| Manga | Trecho 1–2 | 0 mm de offset assumido para a linha central | O diagrama rotula `centre line`; ainda precisa confirmar se é eixo interno, linha de dobra ou borda de corte. |
| Manga | Bordo inferior, 2–4 | 0 mm de margem de bainha | Indicação explícita `no hem all.`. A dimensão 2–4 vem da fórmula de construção do bloco, não é margem. |

## Regras de implementação que a pesquisa sustenta

A regra de 1 cm é uma margem **já indicada como incluída no bloco**, não autorização para aplicar outro offset de 10 mm à mesma borda sem antes identificar a linha de referência. A especificação deve manter `seam_geometry` independente de `cut_geometry`; cada aresta precisa guardar seu tipo, largura e origem, com exceções explícitas para margem zero, centro/dobra e bainha zero.

A fonte não define o tratamento geométrico dos encontros e cantos. Permanecem `NOT_YET_DEFINED`: terminação da margem em ombro/decote, encontro cava/ombro/lateral, junção lateral/barra, junção cabeça/costura inferior da manga e relação entre margem de costura e bordo sem bainha. Não escolher mitra, esquadro, arredondamento ou extensão automática sem especificação e revisão.

## Próximos critérios de aceite

A revisão de modelagem deve confirmar a abrangência das chamadas `no seam allowance`, a função de `centre front and back`/`centre line`, a leitura dos traços paralelos e a eventual aplicação do bloco em dobra ou com abertura. Depois, cada aresta do escopo deve ter classificação rastreada como `DEFAULT_10_MM_INCLUDED`, `NO_SEAM_ALLOWANCE`, `NO_HEM_ALLOWANCE`, `CENTER_OR_FOLD`, ou `NOT_YET_DEFINED`.

Os casos QA ainda não foram executados. A próxima matriz deve provar que não se aplica margem duas vezes; que as linhas sem margem/bainha permanecem sem offset; que a dobra/centro não gera costura ou corte duplicado; e que os encontros de arestas inválidos bloqueiam a saída em vez de produzir um contorno silenciosamente incorreto.
