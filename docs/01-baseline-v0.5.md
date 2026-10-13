# Baseline v0.5 — 13/10/2026

## Estado
Especificação de produto consolidada; drafts de domínio em revisão; código de produção bloqueado.

## PILOT-001 — Flat Shirt Core
Escopo inicial:
- frente;
- costas;
- cava;
- manga básica de uma folha;
- piques correspondentes.

Fora do primeiro gate:
- gola;
- punho;
- carcela;
- bolso;
- gradação;
- ajustes corporais avançados;
- DXF;
- nesting;
- simulação 3D.

## Arquitetura consolidada
- Kernel CAD próprio.
- Entidades semânticas de vestuário separadas.
- Shapely/GEOS apenas como POC auxiliar de topologia.
- ezdxf apenas como possível adaptador posterior.
- Projeto paramétrico versionado como fonte editável.
- SVG/PDF como saídas iniciais.
- Estados de edição: `PARAMETRIC`, `PARAMETRIC_OVERRIDE`, `FREE`.

## Conceitos obrigatoriamente separados
- `GarmentEase`
- `AssemblyEase`
- margem/tolerância de costura

## Bloqueios atuais
1. mapa completo de margens por aresta;
2. matriz ponto-a-ponto do piloto;
3. definição de `SeamPair` e orientação cava/manga;
4. convenção definitiva de curvas e comprimento de arco;
5. seleção/validação da biblioteca PDF.
