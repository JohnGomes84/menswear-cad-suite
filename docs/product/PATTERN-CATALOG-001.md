# PATTERN-CATALOG-001 — Registro estruturado de cobertura

**Situação:** descoberta inicial baseada no sumário, NÃO auditoria de todos os capítulos.

[JSON do catálogo](PATTERN-CATALOG-001.json) contém **54 registros temáticos candidatos**, em **14 capítulos** e **23 famílias funcionais** (agrupamentos de arquitetura). Eles **não** equivalem a 54 moldes distintos: há entradas de métodos, processos, capítulos de CAD e categorias que podem conter várias regras ou nenhuma fórmula executável.

Origem: sumário do arquivo PDF fornecido, pp. 2–6/309, Winifred Aldrich, *Metric Pattern Cutting for Menswear*, quinta edição.

Cada entrada mantém estados independentes `sourceVerification`, `geometrySpecification`, `implementation`, `modelValidation` e `physicalValidation`. Após inspeção textual, **53 registros seguem TOC_ONLY** e **ALD-CH02-01 está TEXT_REVIEWED** (PDF pp. 31–34); todos continuam **NOT_YET_DEFINED / NOT_STARTED / NOT_RUN / NOT_RUN** nas fases de geometria, implementação e validação. A única investigação específica em andamento é o `PILOT-001`, rastreada fora deste catálogo, não declarada validada.

## Evolução

1. Auditar texto e diagrama de cada método, anotar intervalo PDF real da regra, parâmetros, condições de tecido, entidades geométricas e validações; não copiar figuras.
2. Separar entradas agregadas em métodos específicos com IDs versionados, sem perder proveniência.
3. Definir contrato `DraftRuleSet` próprio e fixtures de geometria para cada bloco.
4. Atualizar estados apenas mediante links para código, testes, revisão de modelagem e prova física.

## Verificação

`python docs/product/validate_catalog.py` verifica IDs, capítulos, estados e ausência de validações impossíveis. A CI também executa testes para evitar falsas alegações de cobertura. Isso é **QA do catálogo**, não QA dos moldes.

Este material é independente do domínio da camisa e ajuda a evitar uma arquitetura limitada a esse piloto.


## Primeiro registro textual: calça plana do capítulo 2

[RESEARCH-CH02-FLAT-TROUSERS-001](../domain/RESEARCH-CH02-FLAT-TROUSERS-001.md) separa blocos **uma peça / duas peças**, variantes básica/folgada, medidas da amostra e relações aritméticas verificáveis. O arquivo [FLAT-TROUSER-SCALAR-FIXTURE-001.json](../domain/FLAT-TROUSER-SCALAR-FIXTURE-001.json) permite regressão de distâncias em mm. Diagramas, coordenadas, curvas, margens por aresta e prova física permanecem pendentes; **não é molde implementado**.
