# PROJECT-FORMAT-001 — Formato de Projeto

Status: DRAFT 0.1

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
