# REUSE-DECISION-001 — Reaproveitamento integral de tecnologias CAD de vestuário

**Estado:** BENCHMARK_SOURCE_REVIEWED / FIRST_INTEGRATION_SPIKE_PASS · 13/10/2026  
**Escopo do produto:** suíte CAD paramétrica de modelagem masculina, **não somente camisas ou calças**.  
**Referência autoritativa dos MÉTODOS:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª ed.  
**Decisão:** desenvolver a camada de diferenciação (métodos rastreáveis, validação, formato nativo), **reutilizando bibliotecas externas onde os contratos forem compatíveis**. Nenhum código GPL/proprietário é incorporado nesta prova.

## 1. Regras de integração

1. **Métodos não se misturam com kernel:** medidas do corpo + opções → procedimentos específicos auditados do livro → relações geométricas. Nem FreeSewing/Titan nem um desenho pronto são fontes das fórmulas de Aldrich.
2. **Arquivos do usuário são próprios:** manter IDs, unidades, medida de origem, `DraftProgram`, `sourceTrace`, histórico de edição e opções em modelo nativo, independente de bibliotecas.
3. **Uma interface por subsistema:** `GeometryAdapter`, `AnnotationAdapter`, `ExportAdapter` etc., sem converter um `Point` específico de fornecedor no contrato persistido.
4. **Provar ANTES de integrar:** smoke test da API real, casos degenerados, comparação de métricas, licenças e versão de dependências. Uma integração bem-sucedida não autoriza automaticamente todos os módulos do fornecedor.
5. **Sem extrapolar o livro:** construir geometria verificável; se uma curva, margem ou montagem não estiver geometricamente determinada, retornar BLOQUEADO ou CANDIDATE_UNVERIFIED, nunca `CUT_READY`.
6. **Diferenciar gráficos e indústria:** SVG de visualização ≠ PDF em escala real; bin packing retangular ≠ nesting industrial; amostragem de medidas ≠ regras de gradação; visualização 3D ≠ simulação física de tecidos.

## 2. Inventário de capacidades de sistemas existentes

| Família funcional | Código ou referência examinada | O que existe comprovadamente na fonte | Ação/estado |
|---|---|---|---|
| Perfil corporal | FreeSewing `packages/models`, `plugin-measurements`; SeamlyMe e Valentina Tape | Modelos de medidas, medidas derivadas, aplicativos de medidas | **ESTUDAR/ADAPTAR** ao protocolo de Aldrich; não usar tabelas FreeSewing como dados da obra |
| Método de peça, dependências | FreeSewing `packages/core/src/pattern/pattern-drafter.mjs` e `design.mjs` | `PatternDrafter`, fila de peças, configuração, hooks e plugins | **ESTUDAR** pipeline; preservar nosso `DraftProgram` com `sourceTrace` |
| Operações geométricas | FreeSewing `Point`, `Path`, `Bezier` (usa `bezier-js`) | Distância, transformações, caminho e comprimento de curva/linha | **PROVA EXECUTADA** para ponto, linha, comprimento e path SVG |
| Entidades de roupa | FreeSewing `Part` e Valentina `VPiece` | Modelos de partes, caminhos e pontos; acesso a margens de costura | **ESTUDAR/VALIDAR** seam-line vs cut-line, topology, traços e vínculos |
| Anotações | FreeSewing `plugin-annotations` (`notches`, `grainline`, `cutlist`, `cutonfold`, `dimensions`) | Módulos específicos já existentes | **CANDIDATO**, não testado nesta POC; o SVG diagnóstico usa anotação simples própria |
| Montagem/costuras | Referências práticas do Titan, Gerber e técnicas de *walking/trueing* | Metodologias de aferição e balanceamento | **REQUIERE CONTRATO NOVO**: `SeamPair`, ease, tolerância aprovada, diagnosticar sem promover fit |
| Gradação | FreeSewing `pattern-sampler.mjs`, Seamly/Valentina, livro CH12 | FreeSewing varia medidas/opções por sets; CH12 rege gradação | **NÃO CONFUNDIR** sampling com gradação industrial; auditar métodos CH12 |
| Renderização web | FreeSewing `pattern-renderer.mjs`, `packages/react/components/Pattern` | SVG e componentes React sobre `renderProps` | **CANDIDATO**; esta POC executa só `Path.asPathstring` e SVG diagnóstico autoral |
| PDF/plotter | FreeSewing React (`pdfkit`/`svg-to-pdfkit`); `pdf-lib`; Valentina exportador | Exportação/geração PDF e layout | **CANDIDATO**, escopo condicionado a paginação/certas medidas/impressão física 1:1 |
| DXF / interoperabilidade | Valentina `vlayoutexporter.h`; `ezdxf` Python | Métodos de export DXF e suporte DXF de engenharia | **ADAPTADOR FUTURO**, testes de roundtrip com CAD receptor e metadados |
| Encaixe | FreeSewing `plugin-bin-pack`; SVGnest; Valentina `vlayout` | `GrowingPacker` usa caixas retangulares; SVGnest trabalha com contornos | **AVALIAR** irregular + giro/fio/espelhamento/sentido; FreeSewing pack não é nesting industrial completo |
| 3D | Three.js e funcionalidade de CLO | Renderização 3D e produto proprietário de simulação, respectivamente | **PÓS-MVP**, não confundir viewport com simulação real da física de tecido |
| PLM/PDM/versionamento | Operação empresarial e diretrizes CH14 da obra | Requisitos de projeto, versões, componentes e produção | **CONTRATO PRÓPRIO**; não há solução de PLM incorporada |

### Arquivos de código inspecionados

- FreeSewing core: https://github.com/freesewing/freesewing/blob/develop/packages/core/src/index.mjs
- Métodos/fila: https://github.com/freesewing/freesewing/blob/develop/packages/core/src/pattern/pattern-drafter.mjs
- Sampling de tamanhos: https://github.com/freesewing/freesewing/blob/develop/packages/core/src/pattern/pattern-sampler.mjs
- SVG: https://github.com/freesewing/freesewing/blob/develop/packages/core/src/pattern/pattern-renderer.mjs
- Part e Path: https://github.com/freesewing/freesewing/blob/develop/packages/core/src/part.mjs e https://github.com/freesewing/freesewing/blob/develop/packages/core/src/path.mjs
- Plugin de anotações: https://github.com/freesewing/freesewing/tree/develop/plugins/plugin-annotations/src
- Encaixe retangular: https://github.com/freesewing/freesewing/blob/develop/plugins/plugin-bin-pack/src/growing-packer.mjs
- Seamly: https://github.com/seamly/Seamly2D/tree/run-seamlyLayout/src/libs/vpatterndb
- Valentina semântica: https://github.com/dismine/valentina/blob/develop/src/libs/vpatterndb/vpiece.h
- Valentina exportador: https://github.com/dismine/valentina/blob/develop/src/libs/vlayout/vlayoutexporter.h
- ezdxf: https://github.com/mozman/ezdxf
- SVGnest: https://github.com/Jack000/SVGnest

**Nota de precisão:** os caminhos da branch `develop`/nome de branch podem variar por repositório; os fontes foram efetivamente consultados via GitHub na rodada. A presença de código demonstra capacidade da biblioteca, não uma integração aprovada ao nosso produto.

## 3. Primeira prova executada (integração NÃO industrial)

[Protótipo](../../prototype/integration-spike/) isolado, sem editar `package.json` do aplicativo principal. Módulos externos reais instalados: `@freesewing/core@4.0.0` e dependência explícita `@freesewing/config@4.0.0`. A obra continua sendo a fonte do programa parcial da calça CH02 já existente no projeto.

**Pipeline verificado na CI:** medidas em mm → `aldCh02FlatTrouserBackProgram` → `draftingInterpreter` → `sourceTrace` → `FreeSewing Point/Path` → caminhos com metrificação → grupos de referências de frente/costas → SVG apenas visual → JSON de diagnóstico.

Os grupos **NÃO** são peças de roupa, e as linhas **NÃO** são arestas de costura/corte. A POC suporta BOTH `ONE_PIECE/TWO_PIECE`, `BASIC/EASY` e medidas personalizadas. Valida completude de pontos, encadeamento de origem e cotas textuais, orientação do diagrama e comprimento dos segmentos gerado pela biblioteca externa.

[Workflow Actions](https://github.com/JohnGomes84/menswear-cad-suite/actions/workflows/integration-spike.yml) — primeira execução de sucesso [#38480789883](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38480789883): **9/9 testes de integração aprovados**, com SVG e JSON publicados como artefatos temporários do job.

**Obstáculo técnico comprovado:** o pacote FreeSewing 4.0.0 carrega `plugin-annotations/src/logo.mjs`, que importa `@freesewing/config`; o manifesto deste plugin não declara a dependência como runtime. A primeira instalação falhou e a segunda, com `@freesewing/config@4.0.0` explícito, funcionou. A POC possui **package-lock.json** gerado da instalação verificada no Actions e sua CI exige **npm ci**; as licenças transitivas, vulnerabilidades e compatibilidade com builds de produção ainda precisam de auditoria. A dependência externa NÃO está aprovada para release.

## 4. Licenças e autoria

- `@freesewing/core`, seus componentes e `@freesewing/config`: manifestos auditados informam **MIT**. Verificar o conjunto efetivamente empacotado e atender avisos autorais antes de qualquer distribuição.
- `bezier-js`, SVGnest, pdf-lib, ezdxf, Three.js: candidatos MIT com condições próprias de atribuição a auditar por dependência e versão.
- Seamly2D e Valentina: GPL, consultar arquitetura/fluxos como **conhecimento**, sem copiar seus arquivos para produto de licenciamento ainda não decidido.
- Gerber/CLO: proprietários, usados somente como referências de desempenho/UX; não presumir acesso a código.
- A política de licenciamento do **nosso** repositório ainda precisa de decisão do titular (o GitHub atual não identifica licença padronizada). Não inferir automaticamente direito de redistribuição do livro; implementar regras operacionais originais com referências e evitar digitalizar figuras extensas.

## 5. Próximas decisões estritamente por evidência

| Prioridade | Experimento de aceite antes de integração permanente | Bloqueio |
|---|---|---|
| P0 | **Lockfile determinístico gerado e confirmado com npm ci**; auditar licenças transitivas, possíveis CVEs e upstream da dependência FreeSewing | Auditoria e compatibilidade ainda necessárias antes de dependency rollout no web-app |
| P1 | Comparar `Point`, `Path`, operações de offsets e curvas em fixtures analíticas e degeneradas contra nosso kernel em mm | Geometria não aprovada até aferir precisão e falhas |
| P1 | Integrar representação de `Part`/anotações reais e preservar semântica de linha de costura versus linha de corte | Nenhum `SeamEdge` real aprovado |
| P1 | Perfis antropométricos com unidades, protocolo CH1/13 e reexecução dos métodos | Métodos além do CH02 ainda `TOC_ONLY` |
| P2 | Gerar PDF em escala com calibração e matriz de impressoras; roundtrip DXF | QA físico ainda `NOT_RUN` |
| P2 | Grade CH12 e encaixe irregular com direção do fio e restrições de tecido | Não confundir com `PatternSampler`/binpack |
| P3 | Visualização 3D/simulação validada e integrações PLM | Fora do MVP |

**Gates:** APP somente EXPERIMENTAL; numérico A IN_REVIEW; modelagem real B NO-GO; comercial NO-GO. **Sem aprovação por quantidade de testes**.
