# BOOK-COVERAGE-001 — Cobertura integral da obra de referência

**Estado:** INVENTORY_VERIFIED_FROM_TOC — 13/10/2026.  
**Fonte:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª edição (2011), sumário do PDF fornecido, páginas **2–6 de 309**.  
**Escopo:** inventário editorial e planejamento arquitetural; **não** é auditoria das fórmulas de cada capítulo nem indicação de cobertura implementada.

## Contrato do produto

O produto é uma **suíte web CAD paramétrica de modelagem masculina**, não um gerador de camisas. A referência define o mapa de métodos/construções a estudar, com implementação própria, testes, traceabilidade e validação física. Não copiar desenhos, scans, tabelas extensas ou texto do livro para o repositório.

Os capítulos 1–14 são preservados como unidades de rastreabilidade. A prioridade de implementação é definida por dependências de engenharia, **não** pela ordem de impressão. Cada bloco e adaptação deverá ser cadastrado como `DraftRuleSet` distinto, conectado a recursos comuns do kernel e às operações de transformação.

## Mapa de capítulos

| ID | Capítulo da obra / assunto confirmado pelo sumário | Módulos do produto candidatos | Dependências relevantes | Estado atual |
|---|---|---|---|---|
| CH-01 | Princípios, tabelas de tamanhos, medidas, blocos e margens | Profiles, MeasurementProtocols, SizeTables, BlockMetadata, SeamAllowance | Unidades, regras e versões | TOC_ONLY |
| CH-02 | Blocos **flat**: calça, camisa, sobrepeças, malha/jersey, quimono | FlatTrouser, FlatShirt, FlatOvergarment, JerseyTee, FlatKimono | Curvas, contornos, ease, margens | PILOT-001 em estudo; demais TOC_ONLY |
| CH-03 | Lazer, vestuário para intempéries e esporte, calças casuais, jeans | Leisurewear, Weatherwear, Sportswear, CasualTrousers, JeansBlocks | Transformações, tecido, componentes | TOC_ONLY |
| CH-04 | Workwear | WorkwearPatterns, WorkwearAdaptations | Base flat, bolsos/recortes, aberturas | TOC_ONLY |
| CH-05 | Nightwear e base de pijama | PyjamaBlock, NightwearAdaptations | Bases flat, peças complementares | TOC_ONLY |
| CH-06 | Construção de mangas nos sistemas flat/form | OnePieceSleeve, TwoPieceSleeve, SleeveVariants | Arc length, Seams, Notches, Balance | TOC_ONLY |
| CH-07 | Aberturas, golas, pé de gola, golas integradas, lapelas/reversos, gola plana | Openings, CollarLibrary, StandCollar, Revers, Facings | Neckline, offset/contorno, SeamPairs | TOC_ONLY |
| CH-08 | Paletós clássicos e folgados, manga de duas folhas, forros e colete | ClassicSuit, EasyFitSuit, TwoPieceSleeve, Lining, Waistcoat | Form blocks, forro, eases, darts | TOC_ONLY |
| CH-09 | Calças clássicas e casuais, cós | ClassicTrousers, Waistbands | Trousers, darts, openings | TOC_ONLY |
| CH-10 | Camisas clássicas, de alfaiataria e casuais | ClassicShirt, TailoredShirt, CasualShirt | Form bodies, sleeves, collars, openings | TOC_ONLY; **diferente do PILOT-001** |
| CH-11 | Sobrepeças clássicas/casuais e adaptações | ClassicOvergarments, OvergarmentTransformations | Form/flat, lapels, sleeves, linings | TOC_ONLY |
| CH-12 | Gradação de moldes flat e form | SizeGrading, GradeRuleSets, GradeValidation | Regras, transformações, tamanhos | TOC_ONLY |
| CH-13 | Medidas individuais, adaptações e problemas de ajuste de calça/casaco/jaqueta/camisa | MadeToMeasure, FitAdaptation, BodyMeasurementProtocols | Medidas, constraints, fit QA | Protocolos de manga/punho em pesquisa; restante TOC_ONLY |
| CH-14 | CAD, desenho digital, PDM/PLM, gradação, made-to-measure, encaixe, plotagem/corte, 3D | EditorUX, Export, Interop, PDM/PLM roadmap, Nesting roadmap, 3D roadmap | Core CAD + integrações externas | TOC_ONLY (capítulo descritivo, não um único bloco) |

**Atenção:** `TOC_ONLY` confirma apenas a presença do tema no sumário. Não afirma quantidade de variações, fórmula disponível, peça validada ou viabilidade de automatização. Estes pontos exigem auditoria de capítulo e diagrama.

## Inventário de famílias e processos reutilizáveis

| Grupo | Famílias do catálogo | Operações de CAD compartilhadas |
|---|---|---|
| **Corpo superior plano** | flat shirt, sobrepeças, jersey/tee shirt, quimono | Ponto, curva, espelhamento, extensão, recorte, montagem, dobra |
| **Corpo inferior** | calça flat, casual, jeans, clássica, pijama | Cintura/quadril, gancho, pences, lateral/entreperna, cós, braguilha |
| **Vestuário formal e estrutural** | paletós, coletes, casacos/sobrepeças | Form blocks, pences, equilíbrio, forros, lapelas/reversos |
| **Componentes** | mangas, golas, aberturas, cós, forros | `SeamEdge`, `SeamPair`, `AssemblyEase`, limites por peça, notch |
| **Transformações** | adaptations, recortes, espelhamento, pence giratória, mudança de forma | Operações paramétricas de construção com dependências/histórico |
| **Tamanhos e ajustes** | grades flat/form, medidas individuais, fit | Perfis, protocolos, regras de grade, constraints, QA |
| **Engenharia CAD** | editor, PDF/SVG, DXF futuro, plotagem, nesting/PDM/3D futuro | Modelo editável, exportador, interoperabilidade, validação |

A matriz distingue **biblioteca de construções** da **biblioteca de operações**. Uma nova peça não deve requerer copiar todo o código do kernel; novos blocos são plugins de regras com esquema e testes, quando a regra for validada.

## Registro obrigatório por método/bloco

Um método identificado durante auditoria de capítulo deverá receber:

```text
patternId
sourceChapter / sourcePageRange
family (upper / lower / outerwear / component / transformation)
cuttingMethod (FLAT / FORM / PROCESS / SUPPORT)
sourceStatus (TOC_ONLY / TEXT_REVIEWED / DIAGRAM_REVIEWED)
modelingStatus (DRAFT / IN_REVIEW / VALIDATED / BLOCKED)
measurementProtocolIds
fabricAssumptions
geometryRuleVersion
requiredEntities / transformations
seamPairs / ease / allowances
goldenFixtureIds
testEvidenceIds
physicalToileEvidenceId
copyrightLicenseDecision
```

A cobertura será reportada em três percentuais **separados**, calculáveis quando houver catálogo de métodos auditado: `inventariados`, `especificados`, `validados`. Não apresentar o número de capítulos como percentual de blocos efetivamente implementados.

## Sequência de expansão proposta — sem criar escopo de produção prematuro

- **Fundação horizontal:** entidades CAD, constraints, regras DSL/AST, import/export de projeto, curvas, margens/SeamPair.
- **Validação de famílias distintas:** depois do PILOT-001, um bloco **inferior** (calça) e um bloco **form** (ex.: camisa clássica ou paletó) para provar que o motor não foi desenhado apenas para camisas planas. Cada novo piloto requer decisão/gate próprios.
- **Componentes e transformações:** manga, abertura, gola, pence, recorte, cós, forro.
- **Tamanhos e ajustes individuais:** Grading e MadeToMeasure após maturidade de regras e testes.
- **Industrial/interoperabilidade:** DXF, marker/nesting, produção e 3D/PLM quando houver requisitos demonstrados.

Esta sequência é proposta de arquitetura de produto, não cronograma aprovado ou alegação de métodos já implementados.

## Política de rastreabilidade e propriedade intelectual

O catálogo descreve *assuntos e funções* em linguagem própria. Fórmulas que forem formalizadas devem ser auditadas caso a caso, com referências de página internas, implementação e esquemas originais. O repositório público não contém o PDF nem figuras da obra. A fonte não deve ser apresentada como biblioteca oficial licenciada ou endossada pela autora/editora.

## Próximo passo

Auditar os capítulos por família, criando `PATTERN-CATALOG-001` com **uma linha por método/bloco concreto** e estado de fonte `TEXT_REVIEWED`/`DIAGRAM_REVIEWED`; prioritariamente CH-01, CH-02, CH-06, CH-07, CH-09, CH-10 e CH-13. Continuar desenvolvimento horizontal do editor em paralelo.

**Gate APP** permanece experimental. **Gate B** permanece NO-GO até completar os requisitos específicos do PILOT-001.


## Registro operacional (adicionado em 13/10/2026)

O inventário editorial foi desdobrado em [PATTERN-CATALOG-001.json](PATTERN-CATALOG-001.json), com **54 assuntos candidatos**, rastreados por 14 capítulos e 23 agrupamentos de arquitetura. O número de registros **não** é número de moldes prontos, de regras totais da obra ou de padrões distintos. Apenas `ALD-CH02-01` passou a **TEXT_REVIEWED** por leitura das páginas 31–34 do PDF; os outros **53 permanecem TOC_ONLY**. Todos estão **NOT_STARTED** quanto à implementação e sem validação geométrica/física. [Critérios de validação](PATTERN-CATALOG-001.md) e CI usam controle automático de unicidade e estados.
