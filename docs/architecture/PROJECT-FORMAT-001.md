# PROJECT-FORMAT-001 — Formato de Projeto

Status: DRAFT 0.2

O projeto editável será estruturado e versionado. SVG/PDF não substituem o arquivo de projeto.

Estrutura conceitual:

```json
{
  "schemaVersion": "1.0",
  "measurementProfile": {},
  "garmentSpec": {},
  "ruleSet": {},
  "pieces": [],
  "constraints": [],
  "overrides": [],
  "history": [],
  "validation": {}
}
```

O formato final ainda não está congelado.


## Extensão proposta — medidas de manga/punho (Issue #1/#2)

Estado: exemplo de modelagem de dados para revisão; o formato geral continua DRAFT e o alias `close_wrist` não está aprovado.

```json
{
  "measurementProfile": {
    "unit": "mm",
    "measurements": {
      "one_piece_sleeve_length": {
        "value": 650,
        "protocol": "ALDRICH_5E_CH13_LM",
        "sourceRef": "Aldrich 5e, PDF p. 261",
        "status": "PROPOSED_PENDING_MODELING_REVIEW"
      },
      "wrist_circumference": {
        "value": 178,
        "protocol": "ALDRICH_5E_CH13_V",
        "sourceRef": "Aldrich 5e, PDF p. 261",
        "status": "PROPOSED_PENDING_MODELING_REVIEW"
      },
      "shirt_sleeve_length": {
        "value": null,
        "protocol": "ALDRICH_5E_CH13_ALN",
        "sourceRef": "Aldrich 5e, PDF p. 261",
        "status": "NOT_PROVIDED"
      }
    },
    "aliases": {
      "close_wrist": {
        "measurementRef": "wrist_circumference",
        "status": "PROPOSED_PENDING_MODELING_REVIEW"
      }
    }
  },
  "ruleSet": {
    "flat_shirt_woven": {
      "sleeveSegment0To2": "one_piece_sleeve_length - 20 mm",
      "sleeveSegment2To4": "close_wrist / 2 + 50 mm"
    }
  }
}
```

`close_wrist` não é persistido como uma segunda medição numérica independente enquanto o alias não for aprovado. Fórmulas e constantes têm escopo do bloco `flat_shirt_woven`; margem de costura, adição de construção e ease permanecem conceitos separados. A especificação matemática e os exemplos estão em `../domain/RESEARCH-ISSUES-1-2-Sleeve-and-Wrist.md`.


## Extensão proposta — `SeamPair`/`AssemblyEase` (Issue #5; não congelada)

O exemplo é somente um rascunho de forma. Não determina as arestas, orientação, piques, facilidade ou tolerância reais do piloto. Campos nulos significam `NOT_YET_DEFINED`, nunca zero.

```json
{
  "seamPairs": [
    {
      "id": "body-armhole-to-sleeve-cap",
      "status": "NOT_YET_DEFINED",
      "members": [
        {"memberId": "A", "pieceRef": "body-piece-pending", "seamEdgeRef": "armhole-edge-pending", "orientation": "FORWARD"},
        {"memberId": "B", "pieceRef": "sleeve-piece-pending", "seamEdgeRef": "sleeve-cap-edge-pending", "orientation": "REVERSED"}
      ],
      "segmentPairs": [
        {
          "id": "segment-pending-review",
          "memberAInterval": {"startArcMm": null, "endArcMm": null, "startMarkerRef": null, "endMarkerRef": null},
          "memberBInterval": {"startArcMm": null, "endArcMm": null, "startMarkerRef": null, "endMarkerRef": null},
          "assemblyEase": {"status": "NOT_YET_DEFINED", "easedMemberRef": null, "targetExcessMm": null, "distributionPolicy": "NOT_YET_DEFINED"},
          "assemblyToleranceMm": null,
          "provenanceRef": null
        }
      ],
      "sourceRuleRef": "Aldrich-5e-flat-shirt-woven-p36-pending-review"
    }
  ]
}
```

Comprimentos dos trechos devem ser derivados da curva paramétrica e dos limites orientados em arco; se armazenados como cache, precisam estar vinculados às revisões/hash da curva, intervalo e orientação. Dados de validação não substituem a fonte geométrica. `assemblyToleranceMm` é tolerância física, distinta do erro numérico do integrador e da quantidade-alvo de ease. A proposta está detalhada em `../domain/RESEARCH-ISSUE-5-SeamPair-AssemblyEase.md`; o schema geral segue DRAFT.
