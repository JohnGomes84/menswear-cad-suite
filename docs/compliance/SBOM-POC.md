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
