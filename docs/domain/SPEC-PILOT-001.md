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
