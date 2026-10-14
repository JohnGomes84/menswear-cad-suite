# Project Status — Menswear CAD Suite

**Data:** 14/10/2026
**Fonte de verdade:** `docs/MASTER-DOCUMENT.md`  
**Baseline corrente:** 1.29 DRAFT — workspace paramétrico de pesquisa CH02 integrado à `main` (PR #57)

## Prioridade de entrega — 14/10/2026

- **Duas trilhas, sem confusão:** enquanto se aguarda revisão de modelagem das Issues #1–#5 via [Issue #26](https://github.com/JohnGomes84/menswear-cad-suite/issues/26), podem ser concluídas entregas técnicas já especificadas (por exemplo, APP-004/#49) que não introduzam regras de vestuário. Revisão independente do Gate A segue via [Issue #7](https://github.com/JohnGomes84/menswear-cad-suite/issues/7); só parecer qualificado autoriza golden case e POC do bloco de camisa.
- **Métrica de progresso:** número de decisões formalmente aprovadas/corrigidas com evidências, e bloqueios efetivamente fechados. Testes de pesquisa, documentação, PRs e versões não constituem aprovação de modelagem.
- **Status atual:** Issues #1–#5 e #26 seguem abertas, sem parecer conclusivo. Gate A **IN_REVIEW**, Gate B **NO-GO**. Nenhum molde real validado.
- **Integração concluída:** [PR #57](https://github.com/JohnGomes84/menswear-cad-suite/pull/57) foi mesclado em 14/10/2026 (commit `8f1e1d80`); a baseline 1.29 está na `main`. O workspace CH02 é de pesquisa, não gera molde de camisa ou saída de corte.
- **Limite de expansão:** não iniciar novas famílias de vestuário nem lógica de produção sem fechar domínio/QA. Entregas técnicas limitadas a Issues existentes são permitidas quando seu escopo não inventa método, curva, facilidade, margem ou tolerância de roupa.
- **Segurança:** `npm audit` do web app reporta **0 achados conhecidos** com `vite@7.3.7` e `vitest@5.0.4`. O spike FreeSewing reporta **10 (9 altos, 1 moderado)** e continua isolado/`NO_RELEASE`. O PR #58 integrou auditoria reproduzível com artefatos JSON; workflow verde não significa vulnerabilidade zero.

## Snapshot atual

- Baseline integrada: **182/182 unitários**, **10/10 Playwright Chromium**, TypeScript/Vite build PASS na CI do PR #57. A branch do [PR #60](https://github.com/JohnGomes84/menswear-cad-suite/pull/60) acrescenta validação local limpa de **184/184 unitários**, **21/21 E2E Chromium** e build PASS; aguarda CI remoto antes de integrar.
- **Gate A:** `IN_REVIEW`, requer revisão geométrica independente e escala física documentada. **Gate B:** `NO-GO`, depende de parecer de modelista para Issues #1–#5 via Issue #26. Issues #1–#5, #7 e #26 permanecem abertas.
- Não há molde de camisa validado, impressão calibrada, toile aprovada ou serviço de produção publicado. A interface CH02 expõe somente pesquisa da construção flat de calça, com corte/exportação bloqueados.
- [PR #58](https://github.com/JohnGomes84/menswear-cad-suite/pull/58) foi mesclado em 14/10/2026 (commit `1d65c8c`); integrou manutenção de reprodutibilidade/auditoria, sem mudar regras de modelagem nem os estados de Gate A/B.

## Histórico de gates — snapshot anterior à baseline 1.29

O projeto possui base suficiente para continuar a engenharia controlada. A POC geométrica sintética foi incorporada à `main` e registra 27/27 testes aprovados em CI para mecanismos genéricos. Isso não valida o molde real.

### Gate A — POC geométrica sintética
**Estado:** evidência técnica existente; revisão formal de geometria/QA ainda pendente.

Escopo validado apenas experimentalmente:
- Bézier cúbica sintética;
- comprimento de arco;
- `point_at_arc_length`;
- reversão de orientação;
- piques derivados de arco;
- discretização;
- interseções/degenerações;
- offsets sintéticos com Shapely;
- artefatos SVG/PDF diagnósticos.

### Gate B — aplicação ao PILOT-001
**Estado:** **NO-GO**.

Bloqueios rastreados:
1. Issue #1 — protocolo `one_piece_sleeve_length`;
2. Issue #2 — semântica de `close_wrist`;
3. Issue #3 — mapa de margens e junções;
4. Issue #4 — matriz geométrica/curvas/frente-costas;
5. Issue #5 — `SeamPair` e `AssemblyEase`;
6. revisão integrada das especificações e aplicação das evidências da POC ao domínio.

## Direção de trabalho

A prioridade não é ampliar pesquisa genérica. A prioridade é:
1. fechar decisões de modelagem das Issues #1–#5;
2. concluir a revisão formal do Gate A;
3. congelar contratos mínimos de `SeamEdge`, `SeamPair`, curvas, margens e formato;
4. só então abrir a POC geométrica específica do `PILOT-001`.

Frontend de produção, autenticação, banco, editor final, gradação, DXF, nesting e 3D permanecem fora da execução atual; o shell experimental citado no snapshot atual não equivale a esses componentes de produto.

## Governança

- Mudanças de regra ou geometria devem atualizar o Documento Mestre ou ADR correspondente.
- Documentos especializados não podem contradizer o Documento Mestre.
- Pesquisa deve distinguir claramente: evidência da fonte, inferência, proposta e decisão aprovada.
- Resultados documentais (`PASS_DOC`) não equivalem a execução do motor.
- POC sintética não equivale a validação do `PILOT-001`.
- Nenhuma tolerância física/comercial deve ser inventada antes de evidência de POC/impressão/toile.

## Avanço verificado nesta rodada — 13/10/2026

- PR #17: sincronização documental e de compliance; **MERGED**.
- PR #18: 9 testes adicionais e workflow de GitHub Actions; **MERGED**. 23/23 testes PASS_CI.
- PR #19: falha explícita em não convergência/overflow e limite de tesselação; **MERGED**. 27/27 testes PASS_CI.
- Evidência: [workflow #38454065254](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38454065254), sucesso com 27 testes; também passaram checks nominais dos artefatos e hashes iguais no mesmo runner.
- Gate A: **IN_REVIEW**, aguardando revisão formal e análise dos limites de precisão/calibração física.
- Gate B: **NO-GO**, sem golden case ou validação de cava/manga.


## Gate experimental web — proposta de início de implementação isolada

A base para um shell web com curvas sintéticas foi formalizada em `docs/gates/GATE-APP-001.md`, `docs/architecture/APP-FOUNDATION-001.md` e `docs/decisions/ADR-0003-experimental-app-foundation.md`. Esse escopo é **independente** do bloco Aldrich e não altera Gate B = NO-GO.

- TypeScript strict + React + Vite + viewport SVG como escolhas iniciais de engenharia, revisáveis.
- Contratos e requisitos de projeto sintético/undo/redo/validação em `docs/qa/QA-APP-001.md`.
- Nenhum app funcional ou schema de produção criado por esta decisão; critérios QA-APP seguem `NOT_RUN`.
- Integração com `PILOT-001`, dados pessoais, backend e exportação para corte permanecem bloqueadas.

## Pesquisa numérica complementar

Foi incluído na branch de pesquisa um benchmark Gauss-Legendre independente do integrador Simpson e um fixture matemático analítico de parábola. A primeira execução em CI da branch passou **30/30 testes**; merge e testes pós-merge ainda precisam ser confirmados.

## Fundação experimental do web app — implementação inicial

Foi criado na branch `prototype/web-shell-synthetic` um shell TypeScript/React/Vite/SVG em `prototype/web-app`. O editor usa **exclusivamente** uma curva Bézier sintética, suporta seleção/arraste de quatro pontos, zoom/pan, undo/redo em memória, JSON versionado (`0.1.0`) e avisos de proibição de corte.

A suíte inicial registra **8 testes de contrato PASS_CI** e build Vite/TypeScript bem-sucedido na [execução #38457022142](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38457022142). A árvore npm foi fixada em `package-lock.json`; a execução final com `npm ci` deverá ser confirmada antes do merge. O histórico de desfazer **não** é reconstituído após reabrir o JSON (embora os eventos sejam persistidos); comprimento de arco TS e `SeamPair` não estão implementados. Isso não libera Gate B ou release.

## Adaptador geométrico browser-side — revisão experimental

Na branch de engenharia `feat/ts-generic-geometry-adapter` foi implementada uma função Bézier em TypeScript independente da renderização SVG, com comprimento de arco e piques sintéticos por distância acumulada. A cobertura inclui 11 testes de fixture analítica, comparação estática com o benchmark Python, invariâncias e falhas explícitas. A UI mostra resultado em mm como *POC* e mantém `PILOT-001` como `NOT_YET_DEFINED`.

O adaptador ainda exige CI final, tratamento de curvas adversariais, política formal de erro e teste de interação no navegador. Não inclui `SeamEdge` real ou qualquer `SeamPair` do bloco da camisa, calça ou alfaiataria.

## Histórico do editor: restauração de sessões sintéticas

Na branch `fix/web-persisted-undo-history`, `createEditor` passa a validar a cadeia linear de eventos do projeto sintético e reconstruir snapshots de undo ao importar JSON. A suíte web passou em [CI #38459723728](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38459723728) com **23/23 testes** e compilação aprovada. O formato 0.1.0 **não** guarda estados anteriores de QA nem eventos paramétricos complexos; eles continuam fora do contrato aprovado.

## Iteração seguinte — catálogo verificável + editor multi-entidades (13/10/2026)

- [PR #34](https://github.com/JohnGomes84/menswear-cad-suite/pull/34) **MERGED**: `PATTERN-CATALOG-001.json`, 54 assuntos candidatos dos 14 capítulos do livro, validador/testes; conteúdo ainda `TOC_ONLY`.
- [PR #35](https://github.com/JohnGomes84/menswear-cad-suite/pull/35) **MERGED**: `SceneProject 0.2.0` com 2 grupos de esboço e 3 entidades geométricas, seleção/edição, movimentos reversíveis e arquivo sintético versionado. A cena não representa moldes reais.
- [CI #38461298308](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38461298308): **35 testes web PASS + build Vite/TypeScript**.
- [CI do catálogo](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38461068500): validou capítulos/IDs/status.
- Estado dos gates: APP experimental, A IN_REVIEW, B NO-GO.
- Pendências mais próximas: edição `ADD_ENTITY`/`REMOVE_ENTITY` com undo/redo, testes E2E reais de interação, auditoria método a método do livro e bloqueios de modelagem #1–#5.


## Execução browser e transações de entidades — 13/10/2026

PR #39 integrado com `ADD_ENTITY`, `REMOVE_ENTITY` e `MOVE_POINT`, JSON 0.3 e undo/redo entre sessões. [CI unitária #38463463286](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38463463286) passou **50/50 testes e build**. [CI Chromium #38463489072](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38463489072) passou **4/4 E2E** em branch de QA. Gate A IN_REVIEW e Gate B NO-GO.

## QA de navegador — fechamento do ciclo experimental

PR #41 integrado; [CI Chromium #38464138662](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38464138662) passou em **5/5 E2E**, incluindo contraste mínimo de 4,5:1 no aviso de não utilização para corte. Não representa auditoria de acessibilidade completa, prova física ou liberação do PILOT-001.


## Núcleo de constraints e operação multi-frente — rodada experimental

- Contrato de trabalho: `docs/governance/DELIVERY-OPERATING-MODEL.md` + templates de engenharia, modelagem e PR.
- `prototype/web-app/src/constraints.ts`: coincidência, horizontalidade, verticalidade e distância, uma constraint dirigida por alvo e DAG; projeção imutável, sem solver industrial.
- UI experimental: alinhar horizontal/vertical uma linha selecionada, com undo/redo pela movimentação de ponto; a regra não é persistida.
- [CI #38465429034](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38465429034): **65/65 testes PASS e build**.
- [CI E2E #38465429112](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38465429112): **6/6 cenários Chromium PASS**.
- Issues: #43 (constraints persistentes e simultâneas), #44 (primeiro método de calça do capítulo 2).
- O catálogo continua TOC_ONLY, a execução física do PDF não foi realizada, Gate B permanece NO-GO.


## Início efetivo de análise de outra família do livro — CH02

O registro `ALD-CH02-01` recebeu estado **TEXT_REVIEWED** com fonte em pp. 31–34 do PDF, documento `docs/domain/RESEARCH-CH02-FLAT-TROUSERS-001.md` e fixture aritmética para variantes básica/folgada. **53 registros** continuam `TOC_ONLY`; nenhum bloco real foi implementado ou validado. Diagramas e provas de modelagem ainda pendentes na Issue #44. Gate B PILOT-001 permanece NO-GO.


## Primeiro esqueleto coordenado de calça CH02

O diagrama da página 34 do livro foi inspecionado visualmente, permitindo orientar frente de calças flat de uma e duas peças. `src/flatTrouserResearch.ts` calcula apenas pontos/linhas auxiliares em mm, sem contorno ou curva aprovada. Documento `docs/domain/CH02-DIAGRAM-001.md`, catálogo marcado `PARTIAL_FRONT_GRID`. [CI #38467502627](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38467502627): **73/73 testes + build PASS**. Fonte e geometria parcial, prova de modelista/física pendente. Gate B NO-GO.


## Contrato 0.4 de constraints dirigidas persistentes

O motor `constrainedSceneV4.ts` separa drivers e coordenadas resolvidas, grava regras dirigidas com eventos e reconstrói undo/redo entre sessões; a mudança de origem reavalia o destino. O [PR #60](https://github.com/JohnGomes84/menswear-cad-suite/pull/60) da Issue #49 acrescenta `SceneLabV4` isolado: o laboratório 0.3 permanece, migração/rebase exigem confirmação, regras podem ser criadas/editadas/removidas e conflitos são expostos sem commit parcial. Validação local: **184/184 unitários**, **21/21 E2E Chromium** e build PASS; CI remoto ainda pendente. Solver simultâneo, adição/remoção de entidades no documento 0.4 e regras de vestuário continuam fora do escopo.


## Interpretador fundamentado no passo a passo do livro — 13/10/2026

- `draftingInterpreter.ts`: operadores geométricos genéricos executados na ordem da fonte, medidas corporais em mm, fórmulas e `instructionTrace` com capítulo/página.
- `aldCh02FlatTrouserProgram.ts`: passos parciais das frentes dos dois blocos de calça flat, BASIC/EASY, fonte PDF pp. 32–34; `flatTrouserResearch.ts` deixou de duplicar regras.
- Corrigida divergência de leitura: ponto **12 à direita de 11**, ponto **13 à esquerda**, ponto 14 na guia 1→12 e ponto 15 simétrico pelo ponto 10; documentação CH02-DIAGRAM revisada.
- [CI web #38473802868](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38473802868): **109/109 testes PASS + build**, incluindo fixtures fonte-dirigidas.
- Ainda **RESEARCH_ONLY**: faltam costas, curvas, topologia, margens, revisão de modelista e prova física. Gate B NO-GO.


## Costas de calça e técnicas de curvas — CH02

- `aldCh02FlatTrouserBackProgram.ts`: pontos 12–18 (uma peça) e 16–25 (duas peças), seguindo as instruções da fonte PDF pp.32–33; `flatTrouserBackResearch.ts` expõe guias e trace em mm, não contorno de corte.
- O interpretador genérico passou a rastrear pontos usados **também nas fórmulas escalares**; exemplo: ponto 25 depende de 15, 14 e 23.
- [CI web #38476422267](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38476422267): **123/123 testes e build PASS**.
- `CURVES-RESEARCH-001.md` documenta técnicas de gancho, francês, tangência, walking seams e toile; `CH02-CURVE-REQUIREMENTS-001.json` relaciona oito restrições métricas da obra; **splines não definidas/geradas**.
- Catálogo permanece TEXT_REVIEWED/DIAGRAM_PARTIAL para ALD-CH02-01; método real não implementado, Gate B NO-GO.


## Integração funcional auditada com software existente — experimental

- Matriz integral por subsistema: `docs/architecture/REUSE-DECISION-001.md` (medidas, execução, geometria, peças, anotações, costuras, grade, render, impressão, DXF, encaixe, 3D, PLM).
- POC `prototype/integration-spike`: execução **real** do programa de pontos de Aldrich CH02 com `@freesewing/core@4.0.0` `Point/Path`, grupos frente/costas, SVG e JSON **diagnósticos**, sem contorno de corte. Nenhuma dependência instalada no shell web do produto.
- [CI #38480789883](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38480789883): **9/9 testes de integração PASS**, SVG/JSON gerados e disponibilizados como artefatos do GitHub Actions.
- Incompatibilidade identificada: plugin FreeSewing 4.0.0 requer `@freesewing/config` em tempo de execução sem declará-lo; declarado explicitamente na POC, não tratado como solução pronta para produção.
- **Bloqueios:** dependências transitivas travadas em lockfile mas sem auditoria de licenças/segurança, anotações reais não integradas, costuras/margens/curvas ainda não aprovadas, escala 1:1 não executada, Gate B PILOT-001 NO-GO.

- **Reprodutibilidade adicional:** arquivo `prototype/integration-spike/package-lock.json` foi gerado a partir de CI bem-sucedida (16 entradas de pacote) e o workflow foi alterado para **npm ci**. Revisão final do novo workflow ainda sujeita a CI do PR.

- **Supply chain:** 2 testes adicionais verificam `package-lock.json`/integridade e marcam lacuna de licença em `hooks@0.3.2`; não autorizar distribuição comercial automaticamente por ter pacotes FreeSewing MIT.


## Contrato de peça de pesquisa + anotações sintéticas (FreeSewing)

- Dois objetos **FreeSewing Part** reais serializados como guias de dependência, `CONSTRUCTION_GROUP_NOT_GARMENT_PIECE`, sem sewing/cutting/pique/fio da obra.
- Macro real de `grainline` e `Snippet(notch)` executados em **Design sintético isolado** para avaliar APIs do plugin; não aplicados ao CH02.
- Correção: primeiras referências de fórmula são **conectores de dependência**, não necessariamente linhas de construção do desenho original (`DEPENDENCY_CONNECTOR_NOT_BOOK_LINE`).
- [CI #38483660435](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38483660435): **21/21 testes PASS**, quatro artefatos segregados; `npm ci` reprodutível.
- Riscos: `Part.__boundary` é API interna, `grainline` interage com cutlist, licença transitiva `hooks@0.3.2` ainda pendente de auditoria. Gate B NO-GO.


## Contrato canônico de vestuário e regra das margens — 13/10/2026

- `garmentSemantics.ts`: esquema validado para pontos, peças, arestas (construção/costura/corte/dobra/barra), declarações por costura, fio e pique; saída sempre `cutReady=false`. Só dados **SYNTHETIC_ONLY** podem exercitar papéis de produção, sem liberação.
- `createCh02SemanticResearch`: para a calça do livro, somente conectores de dependência `RESEARCH_ONLY`, sem anotações ou margens aplicadas; evidência capítulo/página/passo.
- `aldCh02AllowancePolicy.ts`: fonte PDF p.31 — **10 mm de costura já incluídos no bloco**, exceções `no seam allowance`; edge mapping ainda `NOT_YET_DEFINED`, nenhum segundo offset automático.
- [Web #38484936503](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38484936503): **145/145 unitários + build PASS**; [integração #38485166474](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38485166474): **26/26 PASS**, FreeSewing e semântica independentes reconciliados.
- Quinto artefato `ch02-semantic-contract.json` publicado pelo pipeline; modelo de peça **não aprovado** e nenhum método além do CH02 promovido. Gate B e comercial **NO-GO**.


## Próxima camada do livro — comandos reais de desenho (13/10/2026)

- **Fonte PDF pp.32–33:** `CH02-SOURCE-LINES-001.json` registra 16 comandos `join/draw` (uma peça: 7; duas: 9). Deles, 8 são retas e 8 curvas; não é inventário integral dos traços auxiliares.
- **Diagrama PDF p.34:** rótulos `no seam allowance` em cintura e barra dos dois blocos — 4 observações regionais, escopo por aresta ainda `NOT_YET_DEFINED`. Regra geral PDF p.31: 10 mm **já incluídos** com exceções, sem offset automático.
- **Código:** `ch02BookLineCommands.ts` liga comandos textuais aos pontos calculados pela obra; `bookCommandBridge.mjs` usa FreeSewing `Path` REAL apenas nas retas. Curvas `SOURCE_CURVE_REQUIREMENTS_PENDING`, sem Bézier arbitrária e sem classificação industrial.
- [Web #38487642126](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38487642126) **157/157 testes + build**; [integração #38487840635](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38487840635) **34/34 testes** e sete artefatos de pesquisa.
- **Gate:** TEXT_COMMANDS_REVIEWED; DIAGRAM_PARTIAL; `noCut=true`; Gate B / comercial NO-GO.
