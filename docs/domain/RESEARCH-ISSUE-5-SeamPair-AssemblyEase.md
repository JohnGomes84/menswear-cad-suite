# Issue #5 — proposta de contrato para `SeamPair` e `AssemblyEase`

**Estado:** proposta de domínio DRAFT; não aprovada para implementação nem para fechar a Issue #5.
**Piloto:** `PILOT-001 — Flat Shirt Core`.
**Fonte primária:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª edição, PDF fornecido pelo usuário, pp. 35–36. O diagrama geral do bloco está na p. 38.

## O que a fonte determina — e o que não determina

Para a camisa plana em tecido plano, o texto do corpo descreve a cava passando por 17, 12 e 5. Para a manga, diz “machined on the flat”, define `0–3` como a medida da diagonal `5–17` do corpo mais 3 cm, divide `0–3` em cinco partes e manda desenhar a cabeça da manga, aprofundando 0,75 cm em 5 e elevando 1,5 cm entre 7–8.

Isso especifica uma construção geométrica. `0–3` é um segmento reto usado para construir a cabeça; não é o comprimento da curva acabada da cabeça da manga. A diagonal do corpo `5–17` também é uma distância entre marcos, não o comprimento de arco da cava `17–12–5`. Portanto, o `+3 cm` não pode ser copiado automaticamente como ease de montagem, nem usado como prova de que o comprimento total da cabeça deve exceder a cava em exatamente 3 cm.

A fonte não declara a localização de piques de montagem, a subdivisão da cava/cabeça em trechos correspondentes, a quantidade de ease a distribuir, uma tolerância de costura, nem um critério de aprovação de comprimentos. O rótulo “machined on the flat” descreve o método de construção, mas não completa esses contratos.

A busca no restante do livro encontrou instruções mais detalhadas de separação de frente/costas e posicionamento de piques na seção de manga raglan (PDF pp. 120–121). Essa é uma adaptação de outro tipo de manga; não deve ser transplantada para o bloco base `flat shirt`. Na própria adaptação raglan, o livro admite que as seções podem não alcançar exatamente os pontos da manga. Isso reforça que o algoritmo de correspondência não deve inventar uma aprovação, mas não define o comportamento do bloco atual.

## Vocabulário proposto

- **`SeamEdge`**: caminho paramétrico de costura numa peça, com orientação canônica estável. O comprimento útil vem da linha de costura, não do contorno de corte nem de um polígono tessellated.
- **`SeamPair`**: relação entre exatamente duas `SeamEdge`s que devem ser montadas uma à outra. Cada membro referencia peça, aresta e orientação (`FORWARD` ou `REVERSED`). Um par identifica a relação; não afirma, por si só, que os comprimentos casam.
- **`SeamSegmentPair`**: subtrechos correspondentes dentro do par, limitados por piques, terminais ou marcos explicitamente aprovados. A coordenada de cada limite é distância de arco em mm na orientação do membro, e não índice de vértice de uma tesselação.
- **`AssemblyEase`**: diferença de comprimento deliberada, localizada num membro e num segmento correspondido, a ser absorvida no processo de montagem. Não é folga corporal (`GarmentEase`), margem de costura, nem uma constante de construção que apenas altera um ponto do molde.
- **`AssemblyTolerance`**: limite de resíduo permitido após aplicar a regra de montagem aprovada. É diferente do erro numérico permitido no cálculo de comprimento e da quantidade de ease.

Essas definições são propostas para revisão; não alteram ainda os contratos normativos de GEOM-001 ou do formato de projeto.

## Contrato conceitual proposto

Um `SeamPair` deve conter um identificador estável, duas referências de membro e uma sequência ordenada de `SeamSegmentPair`s. Cada membro guarda `pieceRef`, `seamEdgeRef` e `orientation`. Cada subpar registra os intervalos inicial/final em distância de arco nos dois membros e as referências dos piques ou marcos que delimitam o trecho. Os dois intervalos precisam estar na mesma ordem lógica após aplicar a orientação declarada.

Os comprimentos `lengthA_mm` e `lengthB_mm` são valores derivados da curva paramétrica canônica. Eles não são entradas manuais nem resultados baseados em tesselação. Um cache pode ser persistido apenas com hash/revisão da curva, do intervalo e da orientação; qualquer alteração deve invalidá-lo ou recalculá-lo.

A facilidade é por `SeamSegmentPair`, não apenas pelo total do par. O estado inicial deve ser `NOT_YET_DEFINED`. Só uma decisão aprovada pode substituir esse estado por `DEFINED` ou `NONE_APPROVED`; ausência de valor jamais significa ease zero. Quando houver facilidade, a regra deve declarar qual membro é o mais longo/será acomodado, um `targetExcessMm` não negativo e o método de distribuição ao longo daquele segmento. Não se fixa quantidade nem distribuição nesta proposta.

A comparação deve permanecer `NOT_YET_DEFINED` se faltar qualquer um destes elementos: correspondência dos limites, regra de ease, método de distribuição aplicável ou tolerância física de montagem. Não se deve produzir `PASS`/`FAIL` com base apenas na igualdade dos comprimentos totais. `PASS` só pode ser calculado depois de aprovados os dados e a política; `FAIL` e `WARNING` também exigem limites aprovados.

A provenance registra a regra/bloco e sua versão, fonte/página, revisão de geometria, estado de aprovação e autor/revisor/data quando aprovados. A relação deve apontar para a linha de costura. `cut_geometry` e margens ficam fora do cálculo do pareamento, mas continuam rastreáveis na peça.

## Rascunho de estrutura de dados

A estrutura abaixo é ilustrativa, não um schema congelado. Os `null`s são intencionais e devem manter estado indefinido; não equivalem a zero.

```json
{
  "seamPairs": [
    {
      "id": "body-armhole-to-sleeve-cap",
      "status": "NOT_YET_DEFINED",
      "members": [
        {
          "memberId": "A",
          "pieceRef": "body-piece-pending",
          "seamEdgeRef": "armhole-edge-pending",
          "orientation": "FORWARD"
        },
        {
          "memberId": "B",
          "pieceRef": "sleeve-piece-pending",
          "seamEdgeRef": "sleeve-cap-edge-pending",
          "orientation": "REVERSED"
        }
      ],
      "segmentPairs": [
        {
          "id": "segment-pending-modeling-review",
          "memberAInterval": {
            "startArcMm": null,
            "endArcMm": null,
            "startMarkerRef": null,
            "endMarkerRef": null
          },
          "memberBInterval": {
            "startArcMm": null,
            "endArcMm": null,
            "startMarkerRef": null,
            "endMarkerRef": null
          },
          "assemblyEase": {
            "status": "NOT_YET_DEFINED",
            "easedMemberRef": null,
            "targetExcessMm": null,
            "distributionPolicy": "NOT_YET_DEFINED"
          },
          "assemblyToleranceMm": null,
          "provenanceRef": null
        }
      ],
      "sourceRuleRef": "Aldrich-5e-flat-shirt-woven-p36-pending-review"
    }
  ]
}
```

`FORWARD`/`REVERSED`, a separação `SeamPair`/`SeamSegmentPair` e o uso de intervalos em arco são candidatos de contrato técnico, sujeitos a revisão de domínio. Os IDs dos exemplos não declaram a orientação real, os piques ou o pareamento aprovado da manga.

## Cálculo e estados propostos

Para cada intervalo paramétrico orientado `C(t)`, o comprimento é a integral de `||C'(t)||` no intervalo. O motor deve calcular também/guardar internamente o limite de erro numérico do integrador. O processo de costura compara o resíduo do segmento depois da ease aprovada; não mistura esse erro numérico com a tolerância física de montagem.

O cálculo deve falhar explicitamente se a curva for degenerada, o intervalo estiver fora da aresta, os limites se sobrepuserem, a orientação não puder ser resolvida ou um marcador referenciado estiver ausente. Alterações na curva ou nos piques invalidam comprimentos, intervalos e qualquer resultado de validação que dependa deles.

Matriz de estado mínima proposta:

- `NOT_YET_DEFINED`: sem pareamento, ease ou tolerância aprovados suficientes; não é PASS nem FAIL.
- `NOT_RUN`: contrato existente, porém avaliação automatizada não executada.
- `PASS`: somente com pareamento, ease, distribuição e tolerância aprovados, e resíduo dentro da tolerância.
- `WARNING`: condição aprovada, mas dentro de uma faixa de alerta explicitamente definida.
- `FAIL`: violação de uma regra e tolerância aprovadas.

A lista de estados precisa ser harmonizada com o vocabulário geral de QA antes da implementação. `NONE_APPROVED` é uma decisão explícita de ease zero; não deve ser deduzida de campo ausente.

## Casos de QA a adicionar

Os casos abaixo estão especificados, mas **não foram executados**: a POC atual não implementa `SeamPair` nem `AssemblyEase`.

| ID proposto | Verificação | Resultado requerido | Estado |
|---|---|---|---|
| QA-SEAM-001 | Integridade do par | Exatamente duas arestas válidas, com referências de peças e orientação resolvidas | NOT_RUN |
| QA-SEAM-002 | Orientação reversa | Reverter a direção de um membro preserva o caminho físico e remapeia corretamente limites/piques | NOT_RUN |
| QA-SEAM-003 | Comprimento paramétrico | Resultado independe da tesselação; cache identifica revisões da curva/intervalo/orientação | NOT_RUN |
| QA-SEAM-004 | Segmentação por piques | Trechos ordenados e sem sobreposição; limites correspondem entre membros; ausência/duplicação gera erro explícito | NOT_RUN |
| QA-SEAM-005 | Alteração de curva | Mudança geométrica invalida/recalcula comprimento e estado dependente | NOT_RUN |
| QA-EASE-001 | Ease ausente | Ease não definida permanece `NOT_YET_DEFINED`; nunca vira zero ou PASS automaticamente | NOT_RUN |
| QA-EASE-002 | Diferenças locais com mesmo total | Exemplo sintético A=[100,100] mm e B=[95,105] mm não passa só porque ambos totalizam 200 mm; cada segmento exige regra própria | NOT_RUN |
| QA-EASE-003 | Ease aprovada e localizada | Membro-alvo, excesso e distribuição explícitos; comparação somente depois de política/tolerância aprovadas | NOT_RUN |
| QA-EASE-004 | Tolerâncias distintas | Erro numérico do arco, ease-alvo e tolerância de montagem são campos/conceitos separados | NOT_RUN |
| QA-SEAM-006 | Provenance | Regra, revisão, fonte, decisão e aprovação são recuperáveis a partir da validação | NOT_RUN |

O exemplo de dois segmentos é apenas sintético para demonstrar que comprimentos totais iguais não garantem correspondência local. Não representa a manga do livro nem define pontos/piques do piloto.

## Decisões ainda necessárias para fechar a Issue #5

1. Modelagem deve indicar quais `SeamEdge`s do corpo e da manga formam o par, seus endpoints e a direção de montagem.
2. Modelagem deve dizer se 12, 7–8 ou outros marcos são apenas pontos de construção ou também piques/balances de montagem. O livro do flat shirt não os nomeia como piques.
3. Deve ser definida a divisão correspondente da cava e da cabeça em segmentos; usar apenas o comprimento total não satisfaz a verificação local.
4. Deve ser aprovada a existência ou não de `AssemblyEase` para cada segmento, seu valor, membro-alvo e método de distribuição. O `+3 cm` da diagonal `0–3` não decide nenhum desses campos.
5. Deve ser aprovada uma política de tolerância física de montagem, separada da tolerância numérica do kernel.
6. Deve ser aprovado o significado exato dos estados e como alterações de curva/piques invalidam resultados.
7. O contrato final precisa de revisão de modelagem/produção e evidência de montagem em papel ou toile antes de satisfazer o aceite da issue.

**Conclusão:** o trabalho desta rodada transforma os critérios da Issue #5 em um contrato candidato e em casos de QA específicos. Ainda não há dados aprovados da manga/cava, schema congelado, algoritmo de facilidade, testes executados ou aceite de modelagem. A Issue #5 deve permanecer aberta e a validação de montagem do piloto permanece bloqueada.
