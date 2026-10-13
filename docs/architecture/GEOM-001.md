# GEOM-001 — Kernel Paramétrico

Status: DRAFT 0.2 — proposta da Issue #5 pendente de revisão de modelagem/geometria.

## Entidades canônicas
- Point
- Line
- Arc
- Bezier
- Spline
- Path
- Constraint

## Entidades de domínio
- PatternPoint
- SeamEdge
- SeamPair
- SeamSegmentPair (proposta Issue #5)
- AssemblyEase (proposta Issue #5)
- AssemblyTolerance (proposta Issue #5)
- Dart
- Notch
- Grainline
- FoldLine
- SeamAllowance

## Regras geométricas existentes
- Curvas paramétricas são a fonte canônica.
- Comprimento de costura é calculado sobre a curva original.
- Pique é armazenado por distância acumulada em `SeamEdge`.
- Tesselação serve apenas para renderização/operação auxiliar.
- Offset inválido deve gerar estado de erro/bloqueio.

## Contrato candidato — costuras parceiras (DRAFT)
- Um `SeamPair` relaciona exatamente duas referências de `SeamEdge`; cada membro aponta para peça, aresta e orientação explícita (`FORWARD`/`REVERSED`). O par não afirma igualdade nem compatibilidade de comprimentos.
- A comparação é dividida em `SeamSegmentPair`s correspondidos por marcos/piques aprovados. Limites usam distância de arco em mm na orientação do membro, não índice de tesselação.
- Comprimentos de cada intervalo são derivados da geometria paramétrica. Qualquer alteração de curva, orientação, limite ou pique invalida resultado/cache dependente.
- A curva referenciada é a linha de costura. Margem e `cut_geometry` não entram no comprimento parceiro.
- Estado sem pareamento, regra de facilidade ou tolerância suficiente permanece `NOT_YET_DEFINED`; ausência de ease nunca equivale a ease zero.
- Não validar apenas pelo total do par: estado `PASS`/`FAIL` exige política de montagem e tolerância aprovadas por segmento.

## `AssemblyEase` e tolerâncias — proposta

`AssemblyEase` pertence ao `SeamSegmentPair` e registra, quando aprovado, membro que será acomodado, excesso-alvo em mm e distribuição ao longo do segmento. `AssemblyTolerance` registra o limite físico de resíduo após aplicar a ease. O erro numérico do cálculo de arco é um limite do kernel separado; não usar nenhum desses valores como substituto dos outros.

Os dados do bloco `flat shirt` não fornecem ainda piques de montagem, ease por trecho, distribuição, limite físico ou correspondência curva-a-curva. O `+3 cm` da linha reta `0–3` da manga é regra de construção, não valor de `AssemblyEase`. Todos os campos e interpretações permanecem DRAFT até aprovação.

## Constraints mínimas do piloto
- Coincident
- Horizontal
- Vertical
- FixedDistance
- PointOnCurve
- Symmetry
- Collinear
- Tangent quando necessário e com regra aprovada

## Edição
- PARAMETRIC
- PARAMETRIC_OVERRIDE
- FREE

## QA relacionada

A matriz proposta QA-SEAM-001…006 e QA-EASE-001…004 está em `../qa/QA-PILOT-001.md`, com especificação em `../domain/RESEARCH-ISSUE-5-SeamPair-AssemblyEase.md`. Nenhum caso está implementado ou executado nesta versão.
