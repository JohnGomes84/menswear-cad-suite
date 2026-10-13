# QA-APP-001 — Aceite da fundação experimental web

**Status:** TEST_PLAN; todos os testes do aplicativo abaixo estão `NOT_RUN` até existir o respectivo protótipo.  
**Escopo:** somente projeto e geometria **sintéticos**. Não valida `PILOT-001`, impressão ou uso comercial.

| ID | Grupo | Caso | Aceite observável | Estado |
|---|---|---|---|---|
| APP-QA-001 | Versão | Criar projeto de laboratório | `formatVersion` explícita `0.x`, `unit=mm`, ID estável | NOT_RUN |
| APP-QA-002 | Versão | Abrir versão desconhecida | Recusa com erro explícito, sem truncar/migrar silenciosamente | NOT_RUN |
| APP-QA-003 | Dados | JSON malformado ou comandos desconhecidos | Importação bloqueada; nenhum código executado | NOT_RUN |
| APP-QA-004 | Dados | Salvar/reabrir | Pontos, curvas, IDs, revisões, flags e estado de edição idênticos | PASS_UNIT_LIMITED: histórico geométrico linear |
| APP-QA-005 | Unidade | 5 cm de interface | 50 mm na representação canônica, sem alterar o valor exibido silenciosamente | NOT_RUN |
| APP-QA-006 | Unidade | Propriedade sem unidade/NaN | Rejeição antes de salvar ou gerar curva | NOT_RUN |
| APP-QA-007 | Viewport | Aplicar zoom e pan | Posição no mundo, comprimento e coordenadas canônicas inalterados | NOT_RUN |
| APP-QA-008 | Viewport | Seleção de curva/ponto | ID da entidade selecionada corresponde ao hit-test; sem substituir geometria pelo SVG | NOT_RUN |
| APP-QA-009 | Histórico | Editar ponto livre e desfazer | Geometria, ID, revision e resultados dependentes restaurados | PASS_UNIT_LIMITED: sem estados prévios de QA |
| APP-QA-010 | Histórico | Refazer após desfazer | Mesmo resultado determinístico da operação original | PASS_UNIT |
| APP-QA-011 | Histórico | Desfazer, depois nova operação | Branch `redo` invalidada de maneira explícita | PASS_UNIT |
| APP-QA-012 | Modo | Tentar arrastar entidade PARAMETRIC | Sem alteração destrutiva silenciosa; informar override/desvinculação | NOT_RUN |
| APP-QA-013 | Modo | PARAMETRIC_OVERRIDE | Preservar referência da regra e delta no arquivo | NOT_RUN |
| APP-QA-014 | Modo | FREE | Desvinculação identificável e reversível | NOT_RUN |
| APP-QA-015 | Geometria | Comprimento e pique em curva sintética | Valores compatíveis com fixture independente, erro observado reportado | PASS_UNIT_PENDING_FINAL_CI |
| APP-QA-016 | Geometria | Tangente nula, não convergência e geometria degenerada | Estado de erro explícito; nunca marcar como válida por fallback visual | PARTIAL_UNIT_PENDING_FINAL_CI |
| APP-QA-017 | Integração | Comparar cálculo TypeScript e fixture Python independente | Diferentes versões/métodos registrados; divergência numericamente reportada | PARTIAL_STATIC_FIXTURE_PENDING_FINAL_CI |
| APP-QA-018 | Semântica | Eas e SeamPair ainda desconhecidos | `NOT_YET_DEFINED` não vira `0` ou `PASS` | NOT_RUN |
| APP-QA-019 | Export | Tentar exportar molde para corte | Ação indisponível/bloqueada no protótipo | NOT_RUN |
| APP-QA-020 | Segurança | Projeto de laboratório aberto | Aviso permanente de conteúdo sintético e não apto para corte | NOT_RUN |
| APP-QA-021 | Segurança | Fluxo de laboratório | Sem autenticação, armazenamento remoto, telemetria de medidas ou credenciais | NOT_RUN |
| APP-QA-022 | Reprodutibilidade | Mesma fixture e build | Mesma geometria serializada, exceto metadados intencionalmente variáveis | NOT_RUN |

## Condições para promover o protótipo experimental

Todos os casos necessários para o conjunto de funções efetivamente incluídas deverão estar em `PASS`; casos fora de escopo permanecem listados como `NOT_RUN` e não podem ser chamados de aprovados. Não declarar liberação de código de produção. Gate APP permite iterar o laboratório, mas nenhum resultado promove Gate B sem a revisão de modelagem.

O projeto de demonstração deverá conter curvas **inteiramente sintéticas** e dados antropométricos fictícios. Uma fixture matemática independente (linha analítica, parábola ou Gauss-Legendre) deve sustentar a comparação de `GeometryAdapter` em TypeScript com a POC Python.

## Evidência proposta — adaptador de geometria TypeScript

`prototype/web-app/src/geometry.ts` implementa cálculo semântico desvinculado do SVG e `geometry.test.ts` contém 11 casos de teste com aproximações independentes. O status acima não equivale a integração plena contra runner Python, validação de tolerância de costura ou medição no papel; registrar CI final e revisar tolerância antes de promover estados.

## Execução do histórico persistido (escopo limitado)

`domain.test.ts` passou em GitHub Actions com cenários de reabertura após 3 movimentos, undo/redo reconstruídos, rejeição de revisões inválidas, encadeamento adulterado e invalidação de redo. A prova cobre **somente** `MOVE_CONTROL_POINT` num projeto sintético; snapshots anteriores de `validation` não são preservados no schema 0.1.0 e devem ser marcados `NOT_YET_DEFINED`. Não confundir a lista unitária com validação de UI manual ou editor paramétrico geral.


## Evidência da cena multi-entidades (PR #35)

Os testes `scene.test.ts` exercitam identidade de grupo/entidade, edição de linhas e Bézier, persistência JSON 0.2.0, undo/redo por entidade, invalidação de `redo` em divergência, rejeição de IDs duplicados, pontos não finitos, formatos desconhecidos e histórico adulterado. [CI #38461298308](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38461298308): **35 testes web PASS e build aprovado** (soma dos testes dos laboratórios 0.1.0/0.2.0 e geometria TypeScript). Essa evidência **não** executou automação E2E do navegador, teste físico de escala ou QA do PILOT-001.


## Evidência Chromium E2E — cena sintética 0.3

[Execução #38463489072](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38463489072): **4/4 casos Chromium PASS** (criar/excluir/undo/redo, zoom/pan não alterando geometria, arrastar ponto/salvar/reabrir/desfazer, importar JSON inválido sem substituir projeto). [CI unitária #38463463286](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38463463286): **50/50 testes PASS** e build TypeScript/Vite aprovado. QA de moldes reais, impressão física, solver e constraints continuam NOT_RUN/NOT_YET_DEFINED.


**Adendo Playwright:** [CI #38464138662](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38464138662) aprovou **5/5 testes E2E**; o quinto calcula o contraste do aviso de segurança no Chromium e exige razão ≥4,5:1. A cobertura limita-se ao aviso e não equivale à auditoria WCAG completa.
