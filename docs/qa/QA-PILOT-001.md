# QA-PILOT-001 — Plano de Validação

Status: DRAFT 0.2

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


## Casos preliminares de margens — Issue #3

Mapa de referência: `../domain/RESEARCH-ISSUE-3-Seam-Allowance-Map.md`. Os casos esperam revisão da classificação antes da implementação.

| ID | Verificação | Resultado esperado | Estado |
|---|---|---|---|
| QA-MARG-001 | Cobertura do contorno do corpo e da manga | Cada aresta recebe origem e uma classe explícita: default 10 mm incluído, sem margem, sem bainha, centro/dobra ou `NOT_YET_DEFINED` | PASS_DOC (11 trechos auditados); motor NOT_RUN |
| QA-MARG-002 | Conversão da margem incluída no bloco | A regra geral de 1 cm não gera um segundo offset sobre uma linha que já a incorpore | PASS_DOC (regra explícita); motor NOT_RUN |
| QA-MARG-003 | Bordos explicitamente sem margem/bainha | Decote/trecho 0–1 e barras/2–4 permanecem sem offset apenas nas partes confirmadas na revisão | PASS_DOC (mapa); motor NOT_RUN; escopo do decote pendente |
| QA-MARG-004 | Centro frente/costas e centro da manga | Não gerar costura/corte duplicado; operação dobra/par exige especificação explícita | NOT_YET_DEFINED; construção pendente |
| QA-MARG-005 | Encontros de ombro/decote, cava/lateral, lateral/barra e cabeça/underarm | Junções não se auto-reparam silenciosamente; regra de canto ou erro explícito | NOT_YET_DEFINED; junções pendentes |
| QA-MARG-006 | Separação de caminhos | `seam_geometry` mantém-se independente de `cut_geometry`; margens por aresta têm largura/origem próprias | NOT_RUN; motor ainda não implementa estes caminhos |

Nenhum desses casos conta como aprovação até modelagem confirmar a leitura dos traços do diagrama, os centros/dobras e a convenção de linha de costura versus corte.

### Registro de execução — 2026-10-13

A auditoria documental dos casos QA-MARG-001 a QA-MARG-003 passou nos limites indicados na tabela. Ela confere cobertura e consistência do mapa; **não** testa geometria de peça nem offset por aresta.

A suíte genérica da POC foi executada na `main` após o merge do PR #11: **14/14 testes passaram**. Inclui offsets sintéticos convexos/côncavos, erosão inválida, entradas não finitas e interseções. Esses testes não recebem o mapa do flat shirt e não contam como execução do motor para QA-MARG-002/003/006.

A inspeção do código da POC não encontrou implementação de `SeamAllowance` por aresta nem caminhos separados `seam_geometry`/`cut_geometry`. QA-MARG-004/005 permanece `NOT_YET_DEFINED`; QA-MARG-006 permanece `NOT_RUN`. A validação de produção e o gate do piloto seguem bloqueados.


## Casos da matriz geométrica — Issue #4

Fonte de detalhe: `../domain/RESEARCH-ISSUE-4-Point-Matrix.md`. A fixture aritmética é rastreada às pp. 35–36 do PDF; o diagrama está na p. 38. Os valores são esperados, não golden case aprovado.

| ID | Verificação | Resultado esperado | Estado |
|---|---|---|---|
| QA-POINT-001 | Conversão das dimensões dadas na fixture | `0–1=30 mm`; `1–2=284 mm`; `1–3=442 mm`; `2–5=315 mm`; `1–9=74 mm`; `9–10=30 mm`; `1–11=142 mm`; `11–12=150 mm`; `1–15=27.5 mm`; `16–17=15 mm`; `1–18=60 mm` | PASS_ARITHMETIC (2026-10-13); geometria NOT_RUN |
| QA-POINT-002 | Projeções ortogonais nos pontos 6–8 e 13–14 | Cada ponto deriva da linha superior, profundidade da cava, cintura ou barra declarada, sem eixo-alvo implícito | PASS_DOC (diagrama p. 38, 300 dpi + consistência Python); motor NOT_RUN; comprimento de estilo continua variável |
| QA-POINT-003 | Pontos 15–17 | P15 abaixo de 1; P16 na projeção horizontal até a vertical de 12/14; P17 15 mm à direita de 16 | PASS_DOC (diagrama p. 38, 300 dpi + consistência Python); aprovação de modelagem e motor NOT_RUN |
| QA-POINT-004 | Decotes e cava | Curvas passam pelos marcos textuais e fitting line; handles/tangências só após regra aprovada | NOT_RUN; controles não definidos |
| QA-POINT-005 | Comprimento de camisa e frente/costas | Golden case exige comprimento de estilo e regra aprovada para centro, dobra ou peças separadas | NOT_RUN; dados/construção pendentes |

Nenhum ponto de coordenada condicional da pesquisa pode ser promovido para produção até aprovação do referencial, das projeções, da separação frente/costas e das curvas.

QA-POINT-001 foi conferido por cálculo reproduzível com os valores publicados. A inspeção a 300 dpi da p. 38 resolveu documentalmente as projeções condicionais de 14–17; uma verificação Python de consistência passou (`PASS_DIAGRAM_CONSISTENCY`). Isso verifica a transcrição e seus alinhamentos, não o motor CAD nem a aprovação do padrão. QA-POINT-002/003 são `PASS_DOC`, com execução geométrica `NOT_RUN`; QA-POINT-004/005 continuam `NOT_RUN`/`NOT_YET_DEFINED`.


## Casos propostos — `SeamPair`/`AssemblyEase`, Issue #5 (DRAFT; todos NOT_RUN)

Fonte: `../domain/RESEARCH-ISSUE-5-SeamPair-AssemblyEase.md`. A POC atual não implementa essas entidades. Os casos especificam intenção e não são resultados de execução.

| ID | Verificação | Resultado requerido | Estado |
|---|---|---|---|
| QA-SEAM-001 | Integridade do par | Exatamente duas `SeamEdge`s válidas, peças existentes e orientação resolvida | NOT_RUN |
| QA-SEAM-002 | Orientação reversa | A inversão preserva o caminho físico e remapeia limites/piques do trecho | NOT_RUN |
| QA-SEAM-003 | Comprimento paramétrico | Comprimentos independem da tesselação; cache depende das revisões de curva, intervalo e orientação | NOT_RUN |
| QA-SEAM-004 | Segmentação por piques | Trechos em ordem e sem sobreposição; ausência/duplicação de marcador gera erro explícito | NOT_RUN |
| QA-SEAM-005 | Mutação geométrica | Alterar curva ou pique invalida e recalcula comprimento e avaliação dependentes | NOT_RUN |
| QA-SEAM-006 | Provenance | Fonte, versão da regra, revisão e aprovação rastreáveis no resultado | NOT_RUN |
| QA-EASE-001 | Ease ausente | Estado `NOT_YET_DEFINED`, sem conversão implícita em zero ou PASS | NOT_RUN |
| QA-EASE-002 | Diferença local, total igual | Exemplo sintético A=[100,100] mm e B=[95,105] mm não passa apenas porque ambos totalizam 200 mm | NOT_RUN |
| QA-EASE-003 | Ease por segmento | Membro-alvo, excesso e distribuição explicitamente aprovados; comparação somente com política definida | NOT_RUN |
| QA-EASE-004 | Tolerâncias distintas | Erro numérico de arco, excesso de ease e tolerância física de montagem não são confundidos | NOT_RUN |

O caso QA-EASE-002 é sintético e demonstra apenas que total igual não prova compatibilidade local. Não representa medidas ou piques da manga Aldrich. Os testes de montagem permanecem bloqueados até aprovar o contrato e os dados do piloto.
