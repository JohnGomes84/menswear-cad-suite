# Fase 1.5 — POC de Geometria Sintética

**Status:** experimento técnico, isolado do produto e do molde `PILOT-001`.
**Objetivo:** explorar mecanismos genéricos do kernel sem usar fórmulas ou coordenadas de vestuário.

## Escopo implementado nesta rodada

- curva Bézier cúbica 2D em milímetros;
- comprimento por integração adaptativa Simpson e `point_at_arc_length(s)` por busca binária;
- piques posicionados por frações/distâncias acumuladas de arco;
- reversão paramétrica da orientação;
- discretização adaptativa por flatness da corda;
- interseção de segmentos e classificação básica de casos;
- diagnóstico de curva degenerada de comprimento nulo;
- offsets poligonais constantes via `buffer` de Shapely como **auxiliar topológico experimental**;
- exportação diagnóstica SVG e PDF com régua nominal de 25 mm.

## Limites

Os pontos e contornos são sintéticos. Este projeto não transcreve as coordenadas do livro, não implementa regra de camisa, não calcula ajuste nem estabelece tolerância de produção. O offset constante de Shapely não é operação de margem validada; largura variável ainda não está implementada. Os arquivos SVG/PDF são diagnósticos, não outputs para corte. Não houve impressão física nem medição da régua.

## Reprodução

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m unittest -v
.venv/bin/python run_poc.py
```

O runner escreve `artifacts/poc_results.json`, `artifacts/geometry_diagnostic.svg` e `artifacts/geometry_diagnostic.pdf`. As versões diretas das dependências estão fixadas em `requirements.txt`.

## Interpretação

- `integration_sweep` e `flattening_sweep` mostram comportamento observado em uma fixture, sem aprovar qualquer tolerância comercial.
- `production_tolerances` continua `NOT_SET`.
- `POC_REPORT.md` registra evidências, limitações e próximos testes.
- POC sintética concluída **não** equivale à validação do `PILOT-001`, do caimento, da margem de vestuário nem à autorização de código de produção.
