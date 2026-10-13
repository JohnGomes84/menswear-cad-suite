# MODELING-REVIEW-PACKET-001 — Revisão técnica do Flat Shirt Core

**Status:** AWAITING_SPECIALIST_REVIEW; respostas abaixo não foram presumidas.  
**Referência:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª ed., PDF fornecido pelo usuário; texto do flat shirt pp. 35–36, diagrama p. 38, medidas cap. 13 pp. 260–262.  
**Uso:** orientar uma revisão objetiva por profissional de modelagem e engenharia geométrica. Não incluir imagens, scans nem páginas protegidas do livro no Git.

## 1. Identificação do parecer

- Função do revisor:
- Qualificação/experiência relevante:
- Data:
- Versão do material examinado:
- Resultado por item: `APPROVED`, `REJECTED`, `INSUFFICIENT_EVIDENCE` ou `NEEDS_PHYSICAL_TEST`.
- Observações, justificativa e documento de evidência:
- A decisão só se torna oficial quando refletida nas Issues e no Documento Mestre.

## 2. Questões objetivas do domínio

### MR-01 — Protocolo de manga (Issue #1)

A entrada `Sleeve length one-piece sleeve = 65 cm` do bloco será mapeada para `one_piece_sleeve_length`, distinta da medida de camisa `A-L-N`. Confirmar/corrigir a postura, o trajeto da fita e os marcos para o protocolo `L-M`.

- Proposta documentada: ombro ósseo até logo abaixo do punho, braço ao lado, sem flexão forçada (postura é convenção operacional proposta, não frase do livro).
- Resultado aritmético esperado: `0–2 = 650 − 20 = 630 mm`.
- Veredito, correção, justificativa e evidência: **PENDENTE**.

### MR-02 — `close_wrist` (Issue #2)

Confirmar ou rejeitar equivalência de `close_wrist` com `wrist_circumference` medida logo acima do osso do punho. Confirmar se a dimensão `2–4 = 178/2 + 50 = 139 mm` é apenas segmento parcial e qual orientação/espelhamento o bloco exige.

- Até parecer: sem alias automático; `close_wrist` continua um parâmetro distinto quando presente.
- Veredito e evidência: **PENDENTE**.

### MR-03 — Margens por aresta (Issue #3)

O bloco informa 1 cm **já incluído** onde não houver exceção. Revisar o mapa de 11 trechos em `RESEARCH-ISSUE-3-Seam-Allowance-Map.md`, especificamente:

- quais linhas do diagrama são `seam_geometry` versus `cut_geometry`;
- decote frente/costas e chamada `no seam allowance`;
- centro frente/costas e eixo da manga: borda, dobra ou referência interior;
- ombro, cava, lateral, cabeça, costura inferior; margens já incluídas;
- barra e borda inferior da manga com `no hem allowance`;
- tratamento de canto em cada encontro: ombro/decote, cava/lateral, lateral/barra, cabeça/underarm.

**Não aplicar offset de 10 mm novamente à mesma linha sem interpretar sua origem.**

- Veredito e mapa assinado: **PENDENTE**.

### MR-04 — Matriz geométrica e curvas (Issue #4)

Revisar referencial de trabalho, coordenadas **condicionais** dos pontos 0–18 e projeções do diagrama p. 38, documentadas em `RESEARCH-ISSUE-4-Point-Matrix.md`.

- Definir comprimento nominal de camisa para fixture de laboratório.
- Decidir frente e costas: separação, identidade dos centros, dobra/abertura, espelhamento.
- Definir decote frente/costas: marcos, *fitting line*, tangência e método replicável de construção.
- Definir cava: passagem por 17, 12 e 5 e comportamento curvilíneo reprodutível.
- Informar se condições podem ser definidas por constraints e qual é a evidência.

Um desenho visualmente semelhante não é aceite geométrico.

- Veredito, contorno paramétrico e modelo original do revisor: **PENDENTE**.

### MR-05 — Montagem cava/manga (Issue #5)

A construção `0–3 = diagonal 5–17 do corpo + 3 cm` define um **segmento construtivo**, não um alvo de ease.

- Identificar as arestas exatas da cava da frente, das costas e da cabeça da manga que se correspondem.
- Indicar orientação das arestas durante a montagem plana.
- Identificar marcas/piques de montagem efetivos; diferenciar de pontos apenas construtivos.
- Delimitar trechos correspondentes, comprimento por arco, tecido e parâmetros de `AssemblyEase`.
- Definir o valor de ease em cada trecho somente se houver regra justificada; `NONE_APPROVED` exige decisão explícita.
- Determinar método/distribuição e tolerância física de montagem após prova de papel/toile.

- Veredito, evidência e aprovação da montagem: **PENDENTE**.

## 3. Material a entregar após a revisão

| ID | Entregável | Estado atual |
|---|---|---|
| R1 | Ficha de medidas/aliases/protocolo aprovada | NOT_RUN |
| R2 | Mapa de 11 arestas com origem da margem e junções aprovadas | NOT_RUN |
| R3 | Matriz de pontos e regras de curva com golden fixture aprovado | NOT_RUN |
| R4 | Contrato de costuras parceiras e piques reais | NOT_RUN |
| R5 | Especificação de ease/tolerância com tecido e método de montagem | NOT_RUN |
| R6 | Prova física de papel/toile documentada quando aplicável | NOT_RUN |

## 4. Registro de decisões

Para cada item criar registro com `decisionId`, `issueRef`, `documentVersion`, `decisionStatus`, `rationale`, `evidence`, `reviewerRole`, `date`, `testImpacts` e `followUps`. Não preencher campos de revisor com identidades fictícias.

As decisões aprovadas devem gerar alteração nas SPEC/GEOM/QA/PROJECT-FORMAT, regressão correspondente e revisão do Gate B. Até lá, não se fecha nenhuma Issue #1–#5.
