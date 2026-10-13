# SBOM — POC sintética

**Escopo:** dependências efetivamente instaladas/requeridas pela POC geométrica sintética.  
**Estado:** DRAFT; não é SBOM de release de produto.

| Componente | Versão | Uso | Estado | Origem de versão |
|---|---:|---|---|---|
| Python | ambiente de execução | POC/testes | POC | ambiente local/CI a registrar por execução |
| Shapely | 2.2.0 | interseções, validade e offsets auxiliares | POC | `poc/geometry-synthetic/requirements.txt` |
| ReportLab | 5.0.1 | PDF diagnóstico | POC | `poc/geometry-synthetic/requirements.txt` |

## Regras

- Antes de release, registrar versão exata, URL/origem, hash quando aplicável, licença SPDX e avisos obrigatórios.
- Nenhum componente POC é automaticamente aprovado para produção.
- Dependências transitivas deverão ser capturadas por ferramenta de SBOM quando houver empacotamento/release.

## App web experimental (Gate APP)

| Componente | Versão | Uso | Estado |
|---|---:|---|---|
| React | 19.1.1 | UI do shell | POC |
| react-dom | 19.1.1 | Montagem React | POC |
| TypeScript | 5.9.2 | Compilação estrita | POC |
| Vite | 7.1.0 | Build e servidor dev | POC |
| Vitest | 3.2.4 | Testes de contrato | POC |
| @types/react | 19.1.8 | Tipos | POC |
| @types/react-dom | 19.1.6 | Tipos | POC |

A árvore direta/transitiva está fixada no `prototype/web-app/package-lock.json` (lockfile v3). **Não** se trata ainda de SBOM SPDX/CycloneDX verificado. É obrigatório auditar licenças dos artefatos instalados, pacotes transitivos e avisos antes de produção/redistribuição.
