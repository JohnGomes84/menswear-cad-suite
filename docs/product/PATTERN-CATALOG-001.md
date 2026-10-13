# PATTERN-CATALOG-001 — Registro estruturado de cobertura

**Situação:** descoberta inicial baseada no sumário, NÃO auditoria de todos os capítulos.

[JSON do catálogo](PATTERN-CATALOG-001.json) contém **54 registros temáticos candidatos**, em **14 capítulos** e **23 famílias funcionais** (agrupamentos de arquitetura). Eles **não** equivalem a 54 moldes distintos: há entradas de métodos, processos, capítulos de CAD e categorias que podem conter várias regras ou nenhuma fórmula executável.

Origem: sumário do arquivo PDF fornecido, pp. 2–6/309, Winifred Aldrich, *Metric Pattern Cutting for Menswear*, quinta edição.

Cada entrada mantém estados independentes `sourceVerification`, `geometrySpecification`, `implementation`, `modelValidation` e `physicalValidation`. Na presente revisão todos têm **TOC_ONLY / NOT_YET_DEFINED / NOT_STARTED / NOT_RUN / NOT_RUN**. A única investigação específica em andamento é o `PILOT-001`, rastreada fora deste catálogo, não declarada validada.

## Evolução

1. Auditar texto e diagrama de cada método, anotar intervalo PDF real da regra, parâmetros, condições de tecido, entidades geométricas e validações; não copiar figuras.
2. Separar entradas agregadas em métodos específicos com IDs versionados, sem perder proveniência.
3. Definir contrato `DraftRuleSet` próprio e fixtures de geometria para cada bloco.
4. Atualizar estados apenas mediante links para código, testes, revisão de modelagem e prova física.

## Verificação

`python docs/product/validate_catalog.py` verifica IDs, capítulos, estados e ausência de validações impossíveis. A CI também executa testes para evitar falsas alegações de cobertura. Isso é **QA do catálogo**, não QA dos moldes.

Este material é independente do domínio da camisa e ajuda a evitar uma arquitetura limitada a esse piloto.
