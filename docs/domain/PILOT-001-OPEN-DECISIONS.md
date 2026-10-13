# Registro de decisões pendentes — PILOT-001

**Data:** 13/10/2026  
**Estado:** DRAFT de domínio; nenhuma aprovação profissional presumida.

Este registro separa **decisão técnica implementável em ambiente sintético**, **interpretação da fonte** e **decisão de modelagem que ainda precisa de validação**. Ele não altera o estado das Issues #1–#5.

## Registros

| ID | Tema | Decisão segura agora | Permanece pendente para molde real | Critério de fechamento |
|---|---|---|---|---|
| DOM-01 | Comprimento de manga | Manter `one_piece_sleeve_length` e `shirt_sleeve_length` como campos independentes; fixture 650 mm e `0–2=630 mm` documentada | Postura, trajeto da fita e confirmação operacional da medida `L-M` | Revisão de modelagem + teste de mapeamento, Issue #1 |
| DOM-02 | Punho | **Não** derivar `close_wrist` automaticamente de `wrist_circumference` no aplicativo enquanto alias estiver proposto | Aceite/refutação do alias, posicionamento da fita, espelhamento do segmento 2–4 | Revisão de modelagem + QA do alias, Issue #2 |
| DOM-03 | Margens | Entidade de margem por aresta e estado de origem já podem ser modelados genericamente | Linha de corte vs costura, exceções do decote, centros/dobras, junções e acabamento | Mapa de arestas revisado + testes de não duplicação, Issue #3 |
| DOM-04 | Pontos e curvas | Matriz 0–18 e cálculo aritmético podem ser mantidos como documento **condicional** | Adoção de referencial, comprimento de estilo, curvas/tangências, fitting line, frente/costas | Golden case aprovado por modelagem/geometria, Issue #4 |
| DOM-05 | Manga/cava | Contrato genérico `SeamPair` por arestas e segmentos pode ser exercitado com geometria **sintética** | Identificação dos pares reais, orientação, piques, `AssemblyEase` e tolerâncias | Revisão de montagem + QA por segmento, Issue #5 |
| DOM-06 | Precisão geométrica | Converter erro numérico não convergente em falha explícita já implementada em POC | Referência independente, curva extrema, limite global de erro | Issue #21 e Gate A |
| DOM-07 | PDF físico | PDF nominal diagnóstico pode ser criado para investigação | Medição da escala no papel em mais de uma configuração | Issue #22 e Gate A/exportação |

## Decisão explícita de engenharia — `close_wrist`

Os documentos de pesquisa propõem `close_wrist ← wrist_circumference` como alias, mas a equivalência não foi afirmada literalmente no livro nem revisada profissionalmente. Na fundação do aplicativo, a associação estará **desabilitada**. Um usuário de laboratório poderá fornecer um campo chamado `close_wrist` diretamente apenas em fixture de pesquisa, mantendo origem e estado. Não se gravará um alias como se fosse verdade antropométrica aprovada.

Isso é uma regra de **contenção de incerteza**, não a resolução da interpretação da fonte.

## Decisão explícita de engenharia — curvas condicionais

A inspeção do diagrama sustenta coordenadas condicionais (como `P14=(150,0)`, `P17=(165,57.5)` mm no referencial proposto). Essas coordenadas não entram no app como *golden pattern* nem são chamadas de peças de camisa. A interface inicial usa curvas sintéticas inventadas e não permite exportar produção.

## Quais perguntas precisam de pessoas/revisões externas

- Modelista: postura operacional, `close_wrist`, centros/dobra, curvas do bloco e montagem de manga.
- Engenharia geométrica: referência numérica independente, parametrização/tangências, erros/offsets.
- QA físico/produção: tolerâncias de montagem, impressão a 100%, prova de papel e toile.
- Dono do produto: eventual mudança de escopo e liberação pública/comercial.

O assistente técnico poderá preparar relatórios, casos de teste, protótipos e candidatos de especificação. Ele **não** simulará aprovações de especialistas que ainda não ocorreram.
