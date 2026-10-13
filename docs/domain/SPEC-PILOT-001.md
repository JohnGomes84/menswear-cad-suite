# SPEC-PILOT-001 — Flat Shirt Core

Status: DRAFT 0.1

## Entradas confirmadas do bloco
- chest
- scye_depth
- back_neck_to_waist
- neck_size
- half_back
- garment_length
- one_piece_sleeve_length
- close_wrist

## Medidas relacionadas, mas não equivalentes por padrão
- `shirt_sleeve_length` não deve alimentar silenciosamente `one_piece_sleeve_length`.
- `wrist_circumference` não deve ser automaticamente tratado como `close_wrist` até validação.

## Regras de modelagem
A matriz ponto-a-ponto será registrada aqui com:
`ID -> fórmula -> entradas -> dependências -> geometria -> margem -> semântica -> SeamPair -> validação`.

## Margens
A margem é propriedade por aresta, não um valor único por peça.

## Estado
Pendente de auditoria ponto-a-ponto contra texto e diagrama da referência técnica.


## Medidas e fórmulas — pesquisa das Issues #1 e #2 (proposta v0.2)

Fonte de detalhe: `RESEARCH-ISSUES-1-2-Sleeve-and-Wrist.md`; Aldrich, 5ª ed., PDF pp. 35–36 e 261–262. Estado: proposta rastreada, **pendente de revisão de modelagem**.

### Comprimento de manga

- `one_piece_sleeve_length`: medir do osso do ombro até logo abaixo do osso do punho (`L-M`, cap. 13). A fixture do bloco de camisa plana de tecido plano é `65.0 cm` (PDF p. 35).
- O capítulo diz que o corpo deve estar relaxado, mas não especifica posição do braço para `L-M`. Proposta operacional pendente: braço ao lado do corpo, cotovelo sem flexão forçada, punho neutro e fita acompanhando a superfície externa entre os marcos.
- `shirt_sleeve_length` é distinto: braço elevado e dobrado, medir da nuca através do ombro e cotovelo até abaixo do punho (`A-L-N`). Não converter nem substituir silenciosamente um pelo outro.
- Para o bloco woven flat shirt, a dimensão de construção é `segment_0_2 = one_piece_sleeve_length - 2 cm`. Fixture: `65.0 - 2.0 = 63.0 cm = 630 mm`. Os 2 cm são constante publicada do bloco, não campo `GarmentEase`.

### Punho

- Medida corporal canônica proposta: `wrist_circumference`, tomada logo acima do osso do punho (`V`, cap. 13). Para a regra do bloco, `close_wrist` é proposto como alias numérico explícito dessa medida, e não como circunferência acabada de cuff.
- O livro não escreve a equivalência em uma frase; o alias continua pendente de revisão. Manter separadas `wrist_circumference`, `shirt_cuff_size` e a dimensão geométrica do molde.
- Regra somente do woven flat shirt: `segment_2_4 = 1/2 * close_wrist + 5 cm`. Fixture: `17.8/2 + 5 = 13.9 cm = 139 mm`.
- `+5 cm` deve ser armazenado como constante de construção do bloco, não rotulado como `GarmentEase` sem confirmação. Não reusar o `+3 cm` (`+3.5 cm` para alternativa mais folgada) do bloco jersey/tee shirt (PDF p. 39).
- A geometria do desenho marca uma linha central e o bordo 2–4 sem bainha. A regra determina o segmento desenhado; a conversão em largura total refletida/abertura acabada requer revisão do diagrama.

Os valores e o mapeamento acima são fixtures propostas, não medidas aprovadas nem validação do `PILOT-001`. Não fechar o gate até revisão por modelagem.


## Auditoria preliminar de margens — Issue #3 (v0.1)

Fonte de detalhe: `RESEARCH-ISSUE-3-Seam-Allowance-Map.md`. O texto da p. 35 do PDF informa 1 cm incluído no bloco, salvo exceções. O diagrama do flat shirt é PDF p. 38; a página 36 é continuação das instruções textuais. **Toda classificação abaixo aguarda revisão de modelagem**, em especial a distinção entre linha líquida e linha de corte.

| Peça/aresta | Regra preliminar | Evidência/status |
|---|---|---|
| Corpo — decote frente/costas | 0 mm onde coberto pela chamada “no seam allowance” | Explícita no diagrama; confirmar abrangência sobre as duas curvas |
| Corpo — centro frente/costas | centro/dobra, sem offset provisório | Rótulo “centre front and back” e chamada de ausência de margem no trecho inferior; dobra versus corte em par pendente |
| Corpo — ombro 10–17 | 10 mm incluídos no bloco | Default da p. 35, sem exceção indicada |
| Corpo — cava 17–12–5 | 10 mm incluídos no bloco | Default da p. 35, sem exceção indicada |
| Corpo — lateral 5–7–8 | 10 mm incluídos no bloco | Default da p. 35, sem exceção indicada |
| Corpo — barra 4–8 | 0 mm de margem de bainha | Chamada “no hem allowance” |
| Manga — cabeça 3–0 | 10 mm incluídos no bloco | Default da p. 35, sem exceção indicada |
| Manga — costura inferior 3–4 | 10 mm incluídos no bloco | Default da p. 35, sem exceção indicada |
| Manga — trecho 0–1 | 0 mm | Chamada “no seam allowance” |
| Manga — centro 1–2 | linha central, sem offset provisório | Tratamento de dobra/borda ainda não definido |
| Manga — bordo inferior 2–4 | 0 mm de margem de bainha | Chamada “no hem allowance” |

`DEFAULT_10_MM_INCLUDED` descreve o que a fonte diz sobre o bloco; **não** é uma instrução para aplicar outro offset de 10 mm sobre a geometria recebida. `seam_geometry` e `cut_geometry` continuam distintas. O papel de cada traço, o encontro das margens nos cantos e o tratamento de centros ainda não são especificação aprovada.
