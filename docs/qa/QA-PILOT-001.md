# QA-PILOT-001 — Plano de Validação

Status: DRAFT 0.1

## Testes obrigatórios
- construção determinística de pontos;
- comprimento de curvas independente da tesselação;
- pique por comprimento de arco;
- orientação reversa de costuras parceiras;
- autointerseção e geometria degenerada;
- offsets côncavos/convexos;
- mudanças de margem por aresta;
- escala SVG/PDF;
- quadrado de calibração;
- impressão A4 a 100%;
- validação física do molde antes de alegação de produção.

## Estados
- PASS
- FAIL
- WARNING
- NOT_RUN
- NOT_YET_DEFINED

`NOT_RUN` e `NOT_YET_DEFINED` nunca contam como aprovação.


## Casos de medida — Issues #1 e #2 (propostos; NOT_RUN)

Fonte/semântica em revisão: `../domain/RESEARCH-ISSUES-1-2-Sleeve-and-Wrist.md`. Estes casos definem resultados esperados para a fixture, mas não aprovam o mapeamento nem o Gate do piloto.

| ID | Entrada | Resultado esperado | Estado |
|---|---|---|---|
| QA-MEAS-001 | `one_piece_sleeve_length = 650 mm`; regra do woven flat shirt | `segment_0_2 = 630 mm` (`650 − 20`) | NOT_RUN; revisão pendente |
| QA-MEAS-002 | `wrist_circumference = 178 mm`; alias `close_wrist` proposto | `segment_2_4 = 139 mm` (`178/2 + 50`) | NOT_RUN; revisão pendente |
| QA-MEAS-003 | `shirt_sleeve_length` fornecido sem `one_piece_sleeve_length` | Não substituir silenciosamente; exigir a medida exigida ou erro explícito | NOT_RUN |
| QA-MEAS-004 | bloco woven flat shirt selecionado | Aplicar `+50 mm`; não importar `+30/+35 mm` do bloco jersey | NOT_RUN |
| QA-MEAS-005 | saída do segmento 2–4 | Não rotular `139 mm` como medida corporal ou cuff acabado; não somar bainha nessa aresta sem regra validada | NOT_RUN |
| QA-MEAS-006 | conversão cm→mm | `65.0 cm → 650 mm`; `17.8 cm → 178 mm`, sem arredondamento adicional | NOT_RUN |

O protocolo operacional proposto para `L-M` (braço ao lado, cotovelo sem flexão forçada, punho neutro) e o alias de punho precisam de aprovação de modelagem antes de qualquer caso ser marcado como `PASS` para o produto. O valor numérico esperado pode ser aprovado separadamente da semântica e da interpretação de espelhamento do desenho.
