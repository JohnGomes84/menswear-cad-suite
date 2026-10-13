# Dependências e ativos externos

## Estados
- APPROVED
- POC
- REFERENCE_ONLY
- BLOCKED

## Dependências efetivamente usadas na POC sintética

- **Shapely 2.2.0** — `POC`; somente topologia/interseções/offsets auxiliares. Não é o kernel CAD nem fonte canônica de curvas.
- **ReportLab 5.0.1** — `POC`; usado somente para PDF diagnóstico. Adoção no produto depende de benchmark de escala/paginação/fontes/metadados e auditoria de licença da versão escolhida.

As versões acima estão fixadas em `poc/geometry-synthetic/requirements.txt`. Permanecem experimentais.

## Classificação geral

- SVG: APPROVED como formato de saída.
- PDF: APPROVED como formato; biblioteca de produção ainda não selecionada.
- Shapely/GEOS: POC, apenas topologia/validação auxiliar.
- ReportLab: POC para diagnóstico; não aprovado como exportador de produção.
- ezdxf: POC futuro, adaptador DXF posterior.
- Seamly2D: REFERENCE_ONLY.
- Valentina: REFERENCE_ONLY.
- FreeSewing: REFERENCE_ONLY até auditoria atual.
- OpenPattern: REFERENCE_ONLY.
- BodyM: BLOCKED para produto comercial.
- GarmentCodeData: POC/RESEARCH após verificação de termos.
- GarmentCode: BLOCKED até confirmação de licença.

O projeto mantém SBOM e External Asset Register separados.

## Fundação experimental web (Gate APP)

Dependências diretas do protótipo em `prototype/web-app/package.json` (versões fixadas) e transitivas em `package-lock.json`:

- React 19.1.1 e react-dom 19.1.1 — POC, interface experimental;
- TypeScript 5.9.2 — POC, tipagem/build;
- Vite 7.1.0 — POC, desenvolvimento/build;
- Vitest 3.2.4 — POC, testes;
- @types/react 19.1.8 e @types/react-dom 19.1.6 — POC, tipos.

Nenhuma dependência web está promovida a produto. Licenças diretas e transitivas/avisos necessitam inventário SPDX antes de distribuição; árvore do lockfile não substitui SBOM final.
