# MI-001 — Flat Shirt Core em projeto versionado (DRAFT / NO-CUT)

**Papel:** primeira integração vertical de pesquisa na aplicação web existente. **Não é novo laboratório**. Integra o interpretador `draftingInterpreter.ts`, o kernel Bézier de `geometry.ts` (modelo de curvas compatível), o shell React existente e saída SVG/PDF derivada de pontos/arestas, sem duplicar fórmulas na interface.

**Origem:** Aldrich, *Metric Pattern Cutting for Menswear*, 5.ª ed., PDF pp. 35–36 (texto) e p. 38 (figuras), usando somente descrições técnicas originais. `ALD-FLAT-SHIRT-CORE@research-0.1.2` é versão de regras de pesquisa e **não** versão aprovada de método do livro. Os valores exemplares de torso/cava/pescoço etc. são citados da fonte, enquanto o comprimento da camisa é uma escolha explícita de estilo (700 mm nesta fixture).

## Execução

```bash
cd prototype/web-app
npm ci
npm test
npm run build
npm run dev
```

Na interface inicial, selecione **Flat Shirt Core — projeto experimental**, altere uma medida no painel (o `blur` regenera sem mutação parcial), baixe JSON, abra o mesmo arquivo, baixe o SVG nominal 1:1 e o PDF nominal 1:1. Imprima a ficha de calibração A4 separada e registre **medições reais**, não apenas o cabeçalho do PDF.

## Proveniência, três conceitos distintos

- `origin` identifica `SOURCE_LINE`, `DERIVED_LINE` ou `TECHNICAL_DECISION`, independente do papel industrial.
- `solution` cita a regra literal de posição, derivação geométrica ou ID/versão de decisão revisável.
- `role` contém `CONSTRUCTION`, `SEAM`, `CUT`, `FOLD`, `MARK` ou `UNCLASSIFIED`. Neste incremento, nenhuma aresta do livro é promovida a `SEAM`/`CUT`.
- `review` tem estado `DRAFT` sem evidência ou revisor inventado. Evidências globais acompanham **fingerprint das dependências** e não são reutilizadas após mudança relevante.

### Decisões geométricas provisórias

1. `BODY_SPLIT@1.0.0`: o diagrama único de corpo p. 38 é representado por duas projeções, frente e costas, com decotes diferentes. Separação não confere shape industrial.
2. `NECK_INTERPOLATION@1.0.0`: controles de cúbicas para decotes não impressos no livro.
3. `ARMHOLE_INTERPOLATION@1.0.0`: cúbicas passando por pontos 17,12,5, com tangências/handles técnicos.
4. `SLEEVE_HEAD_INTERPOLATION@1.0.2`: CORREÇÃO do erro observado no PR #62. Os pontos **5, 6, 7 e 8 são as quatro divisões da diagonal reta 0–3** no texto p.36 e diagrama p.38, não pontos sobre a curva. Mantêm-se sobre essa linha de construção. Uma curva diagnóstica separada utiliza âncora 7,5 mm abaixo da reta no ponto 5 (rebaixo, conforme diagrama), cruza a reta no ponto 6 (interpretação visual), eleva-se 15 mm sobre a reta em t=0,7 entre pontos 7 e 8 e termina no ponto 0. As derivadas Hermite/C1 e Béziers são **decisão técnica versionada**, não regra literal. Versões anteriores 1.0.0 e 1.0.1 não são reinterpretadas silenciosamente.
5. `SLEEVE_DIAGONAL_PROJECTION@1.0.0`: decomposição da diagonal 0–3 em componente horizontal usando a altura 0–1; não é um novo traço textual da fonte.
6. `CLOSURE_EXPERIMENT@1.0.0`: fechamento diagnóstico das três figuras; não há papel industrial atribuído a essa linha.

A projeção da diagonal `0–3` da manga para a horizontal da linha `1` usa Pitágoras e não deve ser vendida como operador textual de Aldrich. Piques, montagem/`SeamPair`, margens por borda, dobras definitivas, trueing, tolerâncias de montagem, orientação de corte e acabamento não foram aprovados.

## Identidade, reabertura e segurança

Projeto serializado `menswear-garment-project/0.1.0`; modo imutável `SOURCE_DRAFT_DIAGNOSTIC_ONLY`; aviso `DRAFT_NO_CUT_PROVISIONAL_GEOMETRY`; unidade `mm`; oito medidas com unidade de entrada, origem e valor; três peças com IDs de pontos/arestas estáveis e dependências explícitas; array de decisões com versão; evidências vinculadas a medidas/decisões; estado obrigatório `cutReady=false`, `scalePhysical=NOT_RUN`, `assembly=NOT_RUN`, `fit=NOT_RUN`.

A importação reexecuta a receita congelada e rejeita geometria adulterada, versão desconhecida, decisão alterada, unidades incompatíveis ou bloqueio alterado. **Não migra silenciosamente** versões do método. Uma mudança inválida não substitui o último projeto válido. Uma alteração de medida regenera peças com IDs estáveis e marca como `STALE` apenas revisões cuja dependência mudou. Não existe registro de aprovação profissional fornecido por este módulo.

## Exportações e QA

- SVG do projeto e PDF vetorial usam coordenadas em mm, escala **nominal 1:1**, na página personalizada de **1200 × 850 mm**, destinada a plotter. **Não há paginação A4 de moldes neste incremento.** O exportador não desloca/engrossa margens de corte nem certifica impressora.
- PDF A4 de calibração: 210 × 297 mm, quadrado 25 × 25 mm, régua de 100 mm e campos para impressora, configurações, resultados físicos, data, responsável e evidência. Imprimir em **tamanho real/100%**, sem ajuste automático.
- CI unitária, build e testes de interface comprovam apenas fluxo digital. `scalePhysical`, `assembly` e `fit` só podem mudar após avaliação futura, fora do escopo do schema DRAFT.
- Gate A independente continua `IN_REVIEW`. Gate B do Flat Shirt Core continua **NO-GO** por Issues #1–#5/#26. Integração FreeSewing e CH02 não são dependências deste incremento.

**Antes do próximo incremento:** revisão formal da interpretação das curvas e do conceito de fechamento/aresta; adicionar conferência das relações de montagem e output A4/plotter robusto somente com regras/evidências específicas. Nunca promover cutReady por CI.

## Conflito de gate identificado — decisão de escopo exigida antes do merge

O texto vigente de `docs/gates/GATE-APP-001.md` concede GO à **fundação sintética da aplicação**: APP-05 exige apenas fixtures sintéticas e a contenção da Issue #4 instrui não usar a matriz de camisa como fixture canônica do app. O MI-001 acrescenta visualização de cálculos de **fonte real do Flat Shirt Core**, mesmo com curvas/fechamentos provisórios e `cutReady=false`. Portanto **não se enquadra automaticamente** na autorização APP-001 atual e não pode ser mesclado como se Gate B estivesse aprovado.

**Proposta mínima para aprovação expressa do titular do produto/revisão dos gates:** permitir, dentro do mesmo web app, exclusivamente um **workspace isolado `SOURCE_DRAFT_DIAGNOSTIC_ONLY`** com coordenadas condicionais calculadas pelo interpretador existente, todas as soluções técnicas não literais explicitamente versionadas, sem atribuição de `SEAM`/`CUT`, sem margens aplicadas, sem produção e com toda exportação marcada `NO-CUT`; exigir testes negativos, rastreabilidade e preservação de estados `NOT_RUN`. Não promover qualquer aprovação de geometria, montagem, impressão física ou caimento. Essa exceção habilita uma experiência digital demonstrável, **não** libera o método no Gate B.

**Estado corrigido:** autorização **EXPRESSAMENTE CONCEDIDA** pelo titular do produto em 14/10/2026 somente para `SOURCE_DRAFT_DIAGNOSTIC_ONLY`; formalizada no próprio [GATE-APP-001](../gates/GATE-APP-001.md) e na referência central [MASTER-DOCUMENT](../MASTER-DOCUMENT.md). Ela não autoriza merge automático e não depende de declarar curvas aprovadas. PR MI-001 permanece Draft até revisão do diff e checks do SHA final.

## Revisão do diff na preparação para integrar

- **Fórmulas textuais:** verificados os pontos 0–18 do corpo com fixture de medidas médias da p.35/36; comprimento de camisa 700 mm permanece escolha de estilo, não valor atribuído à obra. Manga 0–1, 0–2, 0–3 diagonal e 2–4 vinculadas ao livro; projeção horizontal e Béziers ficam separados como decisão técnica.
- **Retificação versionada da manga:** deslocamento de 7,5 mm em ponto 5 é proposta de geometria derivada; elevar a seção orientada 8→7 é uma decisão de controles, não equivalência entre comprimento de costura e diagonal. Incrementou método de `research-0.1.0` para `research-0.1.2`, sem migração implícita de JSON anterior.
- **Unidades e exportação:** medidas corporais persistem mm, entrada cm; SVG `width/height` mm e PDF `MediaBox` em pt pela relação `72/25.4`. Exportador recusa peça fora da página 1200×850, bbox sobreposta ou região de calibração ocupada (`EXPORT_PAGE_OVERFLOW`, `EXPORT_PIECE_OVERLAP`, `EXPORT_CALIBRATION_OVERLAP`). Não autoajusta escala ou recorta silenciosamente.
- **Persistência / revisão:** validação reexecuta método fixado e compara entidades; formato e decisões diferentes falham; revisão, proveniência, decisões provisórias e avisos NO-CUT acompanham JSON. Alterações de medidas são atômicas e evidências declaradas dependentes são marcadas `STALE`. A reprodução não certifica aprovação de caimento.
- **Próxima verificação independente:** profissional de modelagem deve revisar sinal, tangências e papel industrial das curvas, linha central, costura da cava/manga, piques e margens (#1–#5/#26). Não há assinatura ou aceite profissional simulado.

**Status do Gate:** APP autorização restrita confirmada; A `IN_REVIEW`, B `NO-GO`, impressão física/montagem/caimento `NOT_RUN`. **Não** imprimir para corte.

## Correção localizada de geometria da manga — revisão no mesmo PR #62

**Causa reproduzida no código 0.1.1:** no antigo bloco `const adj=[0,-7.5,-6,-7.5,-7.5,0]`, deslocavam-se os próprios pontos 5–8 de referência para forçar a forma da curva; o trecho orientado 8→7 ainda movia somente os seus dois controles `c1.y-=20; c2.y-=20`, destruindo a tangente compartilhada e produzindo uma saliência. No diagrama p.38, 5–8 são marcadores na diagonal 0–3, e a curva é independente desses marcadores. Isso não é um problema da biblioteca Bézier nem justifica substituição pelo método FreeSewing Brian/Simon.

**Reutilização e alteração mínima:** preserva o `draftingInterpreter.ts` para a diagonal, o `geometry.ts` existente para `reverseCubic` e `cubicLength`, o formato de projeto e a exportação. Pontos fonte 5–8 são agora interpolações exatas em 20%, 40%, 60% e 80% do segmento 3→0. Novas âncoras **derivadas/provisórias** `HEAD_HOLLOW_5` (+7,5 mm em y de tela) e `HEAD_RAISE_78` (−15 mm em y de tela no meio 7/8) estabelecem condições mensuráveis. Uma curva Hermite em quatro seções, convertida em cúbicas Bézier e revertida por `reverseCubic`, usa tangentes compartilhadas em seus nós. O cruzamento em 6 e as inclinações são escolhas técnicas explícitas a rever, não instruções atribuídas à fonte.

**Contrato/revisão:** método `research-0.1.2`, decisão `SLEEVE_HEAD_INTERPOLATION@1.0.2`; rejeitar JSON antigo sem migração. Frente/costas e fórmulas de medidas continuam inalteradas; `cutReady=false`, escala física, montagem e caimento `NOT_RUN`; nenhuma aresta de manga aprovada como costura/corte. Comparações de comprimento da curva versus 17→12→5 da frente/costas servem exclusivamente ao diagnóstico geométrico: não pressupõem margens iguais, montagem ou folga.

**Comparação independente de geometria — mesmas medidas de tórax 100 cm:** a integração numérica das curvas por SciPy `quad`, independente de `cubicLength` da aplicação, mede a cabeça representada (meia manga) em **301,435991567 mm antes** e **295,318778093 mm depois**. O comprimento da diagonal base permanece **291,327859211 mm**; frente e costas (17→12 e 12→5) somam **284,531833366 mm cada**, sem alteração. Assim, a diferença numérica da cabeça candidata para uma cava experimental é **+10,786945 mm** no caso atual; **isso não é facilidade aprovada**. Duplicar a meia cabeça por espelhamento para comparar com as duas cavas é hipótese geométrica (`2×295,318778093 - 2×284,531833366 = 21,573889454 mm`), não `SeamPair` confirmado. Os trechos, papéis e resultados estão identificados no artefato CI `sleeve-cap-numeric-diagnostic.json`.

**Limite remanescente:** o livro não define derivadas Bézier, nem condições industriais de junção da cava com a cabeça, posicionamento dos piques e facilidade. A proposta cumpre os deslocamentos quantificados e respeita a construção de pontos, mas não está aprovada por modelista; a comparação visual com a figura é qualitativa, não calibração dimensional da imagem digitalizada.


## Diagnóstico rastreável cava–manga — MI-001 (mesmo método, sem alteração de curvas)

**Escopo:** módulo de leitura `src/flatShirtSeamDiagnostic.ts`. Consome exclusivamente o projeto já validado `ALD-FLAT-SHIRT-CORE@research-0.1.2` e `geometry.ts:cubicLength/reverseCubic`. Não altera o `DraftProgram`, a curva, os controles, a versão do método, as margens nem `release`. Não cria `SeamPair`.

**Segmentos com orientação precisa (costurados? NÃO; `role=UNCLASSIFIED`):**

| Cadeia | Ordem medida | Origem da instrução | Solução geométrica |
|---|---|---|---|
| Cava frente | `FRONT:E04` 5→12; `FRONT:E03` 12→17 | Aldrich PDF p.36: curva passando por 17, 12 e 5 | `ARMHOLE_INTERPOLATION@1.0.0` candidata |
| Cava costas | `BACK:E04` 5→12; `BACK:E03` 12→17 | Mesmo diagrama comum (PDF pp.35–36/38) | Mesma interpolação provisória da frente |
| Meia cabeça manga | `SLEEVE:E04` 3→HEAD_HOLLOW_5; `E03` →6; `E02` →HEAD_RAISE_78; `E01` →0 | Aldrich PDF p.36: diagonal 0–3 em quintos, rebaixo 7,5 mm em 5, elevação 15 mm entre 7–8 | `SLEEVE_HEAD_INTERPOLATION@1.0.2` candidata |

**Excluídos:** `SLEEVE:E05` (diagonal de construção 3–0), `SLEEVE:E06–E08` (junção, fechamento e linha central), qualquer margem, hem e `FRONT/BACK:E02` (linha 10–17 do ombro). A seleção é fixa e verifica IDs, extremos, solução, papel e continuidade. **Mudança no contrato de qualquer aresta produz erro explícito, não migração automática.**

**Referência 100 cm de tórax, mm; resultados conferíveis por quadratura independente:**

| Elemento | Comprimento |
|---|---:|
| Frente E04 (5→12) | 168,819410 |
| Frente E03 (12→17) | 115,712424 |
| Frente total | 284,531833 |
| Costas total | 284,531833 (geometria coincidente) |
| Manga E04 (3→HOLLOW5) | 56,539425 |
| Manga E03 (HOLLOW5→6) | 61,173752 |
| Manga E02 (6→RAISE78) | 93,481419 |
| Manga E01 (RAISE78→0) | 84,124181 |
| Meia cabeça total | 295,318778 |
| Meia cabeça menos cada cava | **+10,786945** |
| Duas meias cabeças espelhadas (hipótese) menos ambas cavas | **+21,573889** |

**Referência 112 cm de tórax (após regeneração):** cada cava diagnóstica **299,390863 mm**, meia cabeça **302,598574 mm**, diferença **+3,207712 mm**. A diferença muda com a medida; não é parâmetro de folga definido pelo livro. Essas curvas, mas não as quantidades da diagonal e dos deslocamentos, são decisões técnicas.

**Meia manga versus manga completa:** o projeto implementa a meia manga mostrada pela linha central 0→2 (`SLEEVE:E08`). Refletir esse traçado e dobrar seu comprimento é uma **hipótese geométrica candidata**, ainda sem alocação da metade dianteira ou traseira, nem piques, folga, ou semântica de linha de costura. O SVG cadastra coincidência do ponto de origem `SLEEVE:3` com `FRONT/BACK:5` por **translação e rotação rígidas**, nunca escalonamento; `SLEEVE:0` e `FRONT/BACK:17` permanecem separados visualmente porque as cordas têm comprimentos diferentes. A ordem/sentido é explicitada. Cada possível coincidência é marcada como registro **não aprovado**, jamais como pique.

**Rastreabilidade das relações:**
- `SOURCE_DERIVED`: identidade dos pontos 17,12,5 e instruções de diagonal/quintos/deslocamentos p.36/38, sem assumir controles curvos.
- `GEOMETRY_CALCULATION`: integração do comprimento de arco em mm e diferença algébrica, preservando precisão numérica.
- `TECHNICAL_DECISION_PENDING`: Béziers das duas cavas, Bézier da manga, identidade das curvas frente/costas, espelhamento da meia manga, correspondência entre extremidades, montagem e eventual tolerância/folga.

**Veredito único: `INDEFINIDA`.** A geometria é computável, porém nenhum `SeamPair` define qual trecho da manga corresponde a qual cava. Os dois arcos do corpo são idênticos pelo mesmo algoritmo provisório, e a meia cabeça não discrimina lados frontal/dorsal. O acréscimo de 30 mm à diagonal 0–3 contra a corda corporal 5–17 provém da construção; os excedentes de comprimento calculados não têm folga especificada/validada. Portanto não há evidência para concluir coerência de montagem nem erro de proporção industrial. **Menor próxima ação:** revisão de modelista para classificar a correspondência frontal/posterior da meia cabeça (e os trechos de cava) conforme o diagrama, antes de qualquer ajuste de curva. Essa revisão deve poder concluir `INSUFFICIENT_EVIDENCE`, sem inventar ponto, folga ou pique.

**Evidências geradas no mesmo workflow digital:** `cava-manga-chest100.diagnostic.json`, `cava-manga-chest112.diagnostic.json` e correspondentes `*.overlay.svg` com unidades físicas mm, registro não deformado e legenda de bloqueios. O inspector do workspace possui resumo de comprimentos e botão para baixar a sobreposição do projeto corrente. Testes de referência numérica independentes e E2E garantem regeneração, roundtrip e invariantes `cutReady=false`, `scalePhysical/assembly/fit=NOT_RUN`. Nenhuma prova de impressão física foi executada.


### Controle do excedente geométrico — correção terminológica e referência externa ASG

**Fato matemático reproduzido para a fixture de tórax 100 cm:** com a hipótese explícita de espelhar a meia manga, a cabeça mede `2 × 295,318778093 = 590,637556186 mm`; as cavas somam `284,531833366 + 284,531833366 = 569,063666733 mm`; o **excedente geométrico total é +21,573889454 mm** (metade frente +10,786944727 mm, metade costas +10,786944727 mm). Para tórax 112 cm, o mesmo cálculo produz **+6,415423080 mm**. Este valor é medido, não é artefato do algoritmo. Não existe, porém, autorização para tratá-lo como *folga de costura adequada*: o papel das arestas ainda é `UNCLASSIFIED` e o espelhamento da meia manga ainda é `TECHNICAL_DECISION_PENDING`.

**Campos explícitos no contrato de diagnóstico, não no método da fonte:** `geometricExcess.headTotalHypothesisMm`, `armscyeFrontMm`, `armscyeBackMm`, `armscyeTotalMm`, `excessTotalMm`, `excessFrontHalfMm`, `excessBackHalfMm`. O alvo aprovado de folga e sua tolerância são `null`; posições de piques e as três zonas de distribuição também `null`; `stitchLineStatus=NOT_IDENTIFIED`; intenção e distribuição `UNDEFINED`. Assim, nenhum algoritmo inventa uma meta de 0, 10 ou 20 mm, um pique ou a localização de um embebimento.

**Referências ASG externas (contexto profissional, NÃO instrução de Aldrich):**
- American Sewing Guild, Linda Griepentrog, *Sleeve Setting*, 14/08/2026: https://www.asg.org/sleeve-setting/. Diferencia **cabeça arredondada montada** de **manga plana de camisa**. Na arredondada, a folga é distribuída acima dos piques e os trechos inferiores casam sem embebimento. Na manga plana de camisa, descreve montagem antes das costuras laterais e **sem operação específica de embebimento da cabeça**. Isso torna **injustificado** transplantar uma meta de folga de manga arredondada para este Flat Shirt Core.
- American Sewing Guild, Judy Barlup, *Sewing Tips from Japanese Tailoring*, 26/04/2024: https://www.asg.org/sewing-tips-from-japanese-tailoring/. Orienta conferir pares **nas linhas de costura**, não nas linhas de corte, e registrar marcas de correspondência quando aplicável. Isso não classifica automaticamente o `role` dos nossos arcos.

**Rastreabilidade causal:** o acréscimo de **30 mm** à diagonal 0–3 é regra da fonte e altera a construção, mas **não demonstramos** que ele explica integralmente os 21,574 mm de excedente: a diferença depende também das duas curvas candidatas e muda com o tórax. Não é adequado descontar ou reatribuir esse excesso automaticamente.

**Veredito preservado: `INDEFINIDA` quanto à montagem, embora o excedente geométrico seja `MEASURED`.** A menor revisão seguinte é confirmar, com a fonte e modelista, quais arcos representam as linhas de costura e qual a correspondência das metades dianteira/traseira da manga plana; **só depois** decidir se a montagem requer meta, zonas de distribuição e piques. Até lá, a ASG não autoriza desenho industrial, corte ou alteração da curva.

## Autoridade de decisão — regra vinculante do MI-001 (14/10/2026)

> **Autoridade de decisão**
>
> A IA executa, calcula, propõe e documenta. O titular do produto decide escopo, prioridade, critérios de aceitação, classificação industrial, folga, piques, margens, aprovação de curvas, integração e merge.
>
> Nenhuma decisão de modelagem, montagem, produção ou liberação pode ser assumida automaticamente pela IA. Toda recomendação deve ser apresentada como opção rastreável, com origem, consequências e estado de aprovação.
>
> Estados possíveis para decisões pendentes: `PENDING_OWNER_DECISION`, `PENDING_TECHNICAL_REVIEW`, `APPROVED_BY_OWNER`, `REJECTED_BY_OWNER`.
>
> A IA não pode alterar um estado de `PENDING_OWNER_DECISION` para aprovado sem instrução explícita do titular.

**Aplicação neste incremento:** a autorização recebida é para **executar e demonstrar** a classificação provisória, não para aprovar a classificação industrial. Todas as propostas de papel de aresta permanecem `PENDING_OWNER_DECISION`, inclusive as referências identificadas como linhas auxiliares da fonte. `SOURCE_EXPLICIT` identifica a procedência da evidência, **não** aprovação. Nenhuma classe `SEAM_LINE`, `FOLD_LINE` ou `MARK` será criada sem embasamento específico e revisão pertinente; Gate B continua NO-GO. O titular permanece a única autoridade para integrar o PR #62.

## Inventário de todas as 22 arestas — classificação de construção (14/10/2026)

**Autorização específica do titular:** neste incremento, os únicos valores legais de `classification` são `CONSTRUCTION_LINE` e `UNCLASSIFIED`; os valores de origem são `SOURCE_EXPLICIT`, `SOURCE_INFERRED`, `TECHNICAL_DECISION`, `PENDING_OWNER_DECISION`. O estado de decisão de **todas** as classificações é `PENDING_OWNER_DECISION`, inclusive as explicitamente documentadas pelo livro. A leitura de uma fonte não constitui aprovação industrial. Não existem `SEAM_LINE`/`CUT_LINE`, nem margem, tolerância, pique, folga ou distribuição aprovada.

**Corpus da comparação:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5.ª ed., Flat Shirt Core, PDF pp. 35–36 e diagrama p. 38. A fonte orienta a construção por pontos, curvas e margens já incluídas com exceções; **isso não demonstra qual traço digital é uma linha de costura**. Referências abaixo são sumários curtos, sem reproduzir páginas ou diagramas.

| Aresta | Trecho (como gravado) | Papel anterior | Classificação candidata | classificationOrigin | Evidência do livro e consequência |
|---|---|---|---|---|---|
| FRONT:E01 | 18→10 | UNCLASSIFIED | UNCLASSIFIED | PENDING_OWNER_DECISION | pp.35–36, figura p.38: decote dianteiro próximo à linha de ajuste; função costura/corte não indicada |
| FRONT:E02 | 10→17 | UNCLASSIFIED | UNCLASSIFIED | PENDING_OWNER_DECISION | p.36: ligar 10–17; traço não identificado como linha de costura |
| FRONT:E03 | 17→12 | UNCLASSIFIED | UNCLASSIFIED | PENDING_OWNER_DECISION | p.36: curva de cava por 17–12–5; controles Bézier provisórios, sem linha de costura identificada |
| FRONT:E04 | 12→5 | UNCLASSIFIED | UNCLASSIFIED | PENDING_OWNER_DECISION | p.36: segundo trecho da mesma curva; papel industrial indefinido |
| FRONT:E05 | 5→8 | UNCLASSIFIED | UNCLASSIFIED | PENDING_OWNER_DECISION | p.35, figura p.38: projeção lateral para a bainha; potencial lado da peça não demonstra linha de costura |
| FRONT:E06 | 8→4 | UNCLASSIFIED | UNCLASSIFIED | PENDING_OWNER_DECISION | figura p.38: área de bainha sem margem extra; não demonstra linha de dobra ou costura |
| FRONT:E07 | 4→18 | UNCLASSIFIED | CONSTRUCTION_LINE | SOURCE_INFERRED | pp.35–36, figura p.38: coincidência com o eixo central auxiliar do bloco; **não** constitui dobra aprovada |
| BACK:E01 | 1→10 | UNCLASSIFIED | UNCLASSIFIED | PENDING_OWNER_DECISION | pp.35–36, figura p.38: decote posterior; falta identificação industrial |
| BACK:E02 | 10→17 | UNCLASSIFIED | UNCLASSIFIED | PENDING_OWNER_DECISION | p.36: unir 10–17; não prova costura |
| BACK:E03 | 17→12 | UNCLASSIFIED | UNCLASSIFIED | PENDING_OWNER_DECISION | p.36: cava 17–12–5; geometria candidata equivalente à frente |
| BACK:E04 | 12→5 | UNCLASSIFIED | UNCLASSIFIED | PENDING_OWNER_DECISION | p.36: restante da cava; função não especificada |
| BACK:E05 | 5→8 | UNCLASSIFIED | UNCLASSIFIED | PENDING_OWNER_DECISION | p.35, figura p.38: projeção até barra; não atribuir costura |
| BACK:E06 | 8→4 | UNCLASSIFIED | UNCLASSIFIED | PENDING_OWNER_DECISION | figura p.38: bainha sem margem adicional; não atribuir dobra |
| BACK:E07 | 4→1 | UNCLASSIFIED | CONSTRUCTION_LINE | SOURCE_INFERRED | p.35, figura p.38: eixo central da construção das costas; sem comando comprovado de dobra |
| SLEEVE:E01 | 0→HEAD_RAISE_78 | UNCLASSIFIED | UNCLASSIFIED | PENDING_OWNER_DECISION | p.36 e figura p.38: elevação da cabeça entre referências 7–8; solução curva provisória |
| SLEEVE:E02 | HEAD_RAISE_78→6 | UNCLASSIFIED | UNCLASSIFIED | PENDING_OWNER_DECISION | p.36: curva da cabeça sobre subdivisões da diagonal; sem papel de costura |
| SLEEVE:E03 | 6→HEAD_HOLLOW_5 | UNCLASSIFIED | UNCLASSIFIED | PENDING_OWNER_DECISION | p.36: rebaixo da cabeça próximo à referência 5; curva não aprovada |
| SLEEVE:E04 | HEAD_HOLLOW_5→3 | UNCLASSIFIED | UNCLASSIFIED | PENDING_OWNER_DECISION | p.36, figura p.38: continuação da curva da cabeça; função industrial não identificada |
| SLEEVE:E05 | 3→0 | CONSTRUCTION | CONSTRUCTION_LINE | SOURCE_INFERRED | p.36: diagonal 0–3 usada para dividir em cinco partes; linha auxiliar, não contorno da cabeça |
| SLEEVE:E06 | 3→4 | UNCLASSIFIED | UNCLASSIFIED | PENDING_OWNER_DECISION | p.36: ligar pontos 3–4; papel de costura não especificado |
| SLEEVE:E07 | 4→2 | UNCLASSIFIED | UNCLASSIFIED | PENDING_OWNER_DECISION | figura p.38: bainha da manga sem margem adicional; não equivale a linha de dobra |
| SLEEVE:E08 | 2→0 | CONSTRUCTION | CONSTRUCTION_LINE | SOURCE_EXPLICIT | p.36, figura p.38: linha central da manga; é referência de construção, **não** prova linha de dobra |

**Arestas que permanecem `UNCLASSIFIED` (18):** `FRONT:E01–E06`, `BACK:E01–E06`, `SLEEVE:E01–E04`, `SLEEVE:E06–E07`. Nenhuma aresta foi promovida a linha industrial de costura ou corte. As duas arestas centrais do corpo são **inferências sujeitas ao titular**, não equivalem a aprovação de dobra.

**Serialização e evidências:** `flatShirtSeamDiagnostic.ts` disponibiliza `edgeClassifications[]` no diagnóstico JSON exportado pela aplicação e pela CI, com papel anterior, classificação, origem, resumo da fonte, justificativa e `decisionState=PENDING_OWNER_DECISION`. O SVG diagnóstico contém por caminho `data-line-class`, `data-class-origin` e `data-role-source`. O SVG de sobreposição inclui o mesmo inventário em `metadata#mi001-line-classification-json`; o painel lista a classificação e a origem ao selecionar cada peça. O **projeto canônico e o método continuam `research-0.1.2`**, sem migração/revisão silenciosa de geometria.

**Impacto na cava–manga:** ZERO em curvas, coordenadas, controles e comprimentos. As oito arestas das cavas e da meia cabeça (`FRONT/BACK:E03–E04`, `SLEEVE:E01–E04`) permanecem `UNCLASSIFIED`. Na fixture de 100 cm, o excedente geométrico da hipótese de espelhamento segue **+21,573889 mm** (não folga aprovada). `stitchLineStatus=NOT_IDENTIFIED`; o veredito formal na API é **`INDEFINITE`** (isto é, adequação **indefinida**). `cutReady=false`, `scalePhysical=NOT_RUN`, `assembly=NOT_RUN`, `fit=NOT_RUN`.

**Próxima ação mínima:** submeter ao titular, com suporte de modelista e p.35–38, uma decisão explícita sobre **qual** contorno, se algum, é a linha de costura, sem classificar pela aparência nem derivar autorização das margens indicadas no livro. Esta documentação não aprova o método.

## MI-001 — exportação A4 paginada e protocolo físico (escopo autorizado; sem modificação do método)

**Decisão do titular em 14/10/2026:** permitir exclusivamente impressão diagnóstica A4 100%, registros de escala e protocolo preenchível. Não liberar método, padrão industrial, costuras, margens, folga, piques, tolerância, montagem ou caimento. `cutReady=false`, `scalePhysical=NOT_RUN`, `assembly=NOT_RUN`, `fit=NOT_RUN`. Gate B NO-GO. PR #62 deve permanecer Draft, sem merge automático. A autoridade das decisões industriais continua exclusivamente do titular.

**Reuso técnico:** `flatShirtExport.ts` foi estendido, utilizando suas funções já existentes `PdfBuilder`, `xy`, `line`, `rect`, `txt`, `PdfBuilder.finish()`, geometria `ShirtProject` e as mesmas arestas/controles de `research-0.1.2`. Não há novo laboratório, motor nem formato canônico de projeto. `flatShirtProject.ts` não recebe alterações, nem os estados do método.

**Imposição de escala:** folha A4 retrato com `MediaBox` 210 × 297 mm; quadro útil de geometria **180 × 214 mm** iniciado em **(15,36) mm**. A origem de cada quadro corresponde exatamente a uma região retangular das coordenadas originais em milímetros. O conteúdo é transladado e recortado por comando PDF `W n` **apenas no limite da página**, sem reamostragem, deformação, ajuste de escala ou corte permanente da geometria; o trecho que continua está presente na folha adjacente. Pontos de controle Bézier são copiados sem alteração, apenas convertidos para coordenadas físicas da página. `72/25.4` pontos PDF por mm.

**Tiling:** cada uma das três peças tem seu conjunto independente de folhas. Margem geométrica de **5 mm** ao redor da caixa delimitadora de pontos de controle (não é margem de costura), deslocamento entre origens de tiles **170 mm horizontal** e **204 mm vertical**, e **10 mm de sobreposição** replicada exclusivamente para registro de folhas. A lista determinística de páginas traz `piece,row,col,index`, origem `originXmm/originYmm`, limites `worldRightMm/worldBottomMm` e vizinhos esquerda/direita/cima/baixo. `assertTiledPageLayout()` impede tiles duplicados, deslocados, ausentes, lacunas e sobreposição acima dos **10 mm de registro**; nunca compartilha uma folha física entre duas peças. Grande número de páginas é rejeitado explicitamente.

**Identificação impressa em todas as páginas:** número/total, ID da peça, coluna/linha, ID do projeto, ID e versão de método, **SHA integral de 40 caracteres do commit de origem**, geração UTC, escala nominal 100%, e o aviso literal `DRAFT / NO CUT / PROVISIONAL GEOMETRY`. Os rótulos de conexão informam **número da página vizinha e coordenada real em mm**. Para correspondência lateral, a cruz do tile direito em `world X=originX+175` encontra a cruz esquerda do vizinho em `world X=neighborX+5`; analogamente, cruz inferior `Y=originY+209` encontra superior `Y=neighborY+5`. Cada folha possui régua física **100 mm** e quadrado **25 × 25 mm** na região inferior reservada, fora do quadro de geometria. A ficha A4 separada continua disponível.

**Commit verdadeiro:** o bundler Vite lê o SHA do Git local; a CI passa `MI001_COMMIT_SHA` derivado da revisão de cabeça do PR, não do merge sintético. Metadata obrigatória é `{commitSha,generatedAtISO}`; ausência ou formato inválido causa `A4_COMMIT_SHA_REQUIRED`/`A4_GENERATED_AT_REQUIRED`. Duas execuções com o **mesmo SHA/data/projeto** geram bytes idênticos. A data preenchida é a data da geração do PDF, **não uma medição física**.

**Protocolo físico PDF preenchível:** documento A4 com campos AcroForm de texto `printer`, `driverConfiguration`, `paper`, `selectedScale`, `printDate`, `responsible`, `measuredRuler100Mm`, `measuredSquareWidth25Mm`, `measuredSquareHeight25Mm`, `observations` e `evidenceReference`. Os valores são deixados **vazios** para medição REAL pelo titular e não são usados para promover nenhuma prova. A própria ficha mantém escala/montagem/caimento `NOT_RUN` mesmo depois de preenchida, até avaliação formal posterior.

**Instruções:** imprimir A4 retrato em Tamanho real/100%, desabilitando `Fit to Page`/redimensionamento automático, impressão sem bordas com escala alterada e rotação automática. Unir quadros pelas cruzes de **mesma coordenada mundial**, preservando 10 mm de repetição; não identificar essas cruzes com piques industriais. Medir régua de 100 mm, lados do quadrado de 25 mm e documentar equipamento, driver, papel, data, pessoa e evidência no protocolo. **Não inferir aprovação** de impressão pelo simples formato do PDF ou resultado de CI.

**Artefatos gerados pela CI:** `flat-shirt-core-a4-100percent.pdf`, `mi001-protocolo-fisico-preenchivel.pdf`, `mi001-a4-page-map.json` (tabela de páginas e marcas), `mi001-a4-instrucoes-impressao.txt`; permanecem o PDF nominal de plotter e a folha A4 original. Testes unitários, navegador e verificação de estrutura PDF no SHA final integram a evidência digital; nenhuma prova física é realizada automaticamente.

**Próxima decisão — NÃO executar sem instrução:** optar pela correspondência cava–manga, margens, `PatternPiece`, validação da impressão a partir das medições, ou outra prioridade do titular, cada uma com pré-requisitos e riscos específicos.

## Registro de observação física do titular — calibração dimensional parcial (14/10/2026)

**Origem da informação:** o titular confirmou nesta conversa, em 14/10/2026, que a impressão foi realizada e declarou **"O CUBO DE ESCALA ESTÁ EXATO E PRECISO"**; ao ser solicitado a informar dimensão nominal e medida real, respondeu **"25MM X 25MM"**. Esta declaração é registrada como **medição física fornecida pelo titular**: a referência quadrada/cubo de escala tem dimensão nominal **25 × 25 mm** e dimensão observada informada **25 × 25 mm**. Medições comunicadas sem fotografia, instrumento ou certificado de calibração. O titular confirmou adicionalmente nesta conversa, em 14/10/2026, **"A REGUA TAMBÉM ESTÁ EXATA"**: para a régua nominal de **100 mm**, o comprimento físico relatado é **100 mm**, com desvio absoluto **0 mm** e relativo **0%**. Não presumir valor real de qualquer dimensão do molde. A associação dessa medição ao arquivo físico impresso permanece relatada, sem identificação independente do arquivo.

**Vinculação digital (referência, não prova de que foi exatamente esse o arquivo impresso):**
- Projeto de exemplo `flat-shirt-core-experimental-001`, revisão `1`; método `ALD-FLAT-SHIRT-CORE@research-0.1.2`.
- PDF paginado e protocolo gerados no commit `4be146a39f2c9e4d5e40f847d52db62d98b41b7e`, geração digital UTC `2026-10-14T16:35:59.413Z`; artefatos `flat-shirt-core-a4-100percent.pdf`, `mi001-protocolo-fisico-preenchivel.pdf`, `mi001-a4-page-map.json`. **Arquivo e revisão efetivamente utilizados na impressão ainda não comprovados**, assim como data real, impressora, driver, papel e responsável.
- Escala selecionada **100% / tamanho real** conforme relato do titular, sem comprovante de configuração.

| Grandeza de referência | Valor nominal obtido do artefato digital | Valor real informado | Desvio absoluto | Desvio relativo |
|---|---:|---|---|---|
| Régua de calibração | 100 mm | **100 mm (titular: exata)** | **0 mm** | **0%** |
| Quadrado/cubo de escala — largura | 25 mm | **25 mm (titular)** | **0 mm** | **0%** |
| Quadrado/cubo de escala — altura | 25 mm | **25 mm (titular)** | **0 mm** | **0%** |
| Frente — largura entre extremos do conjunto de pontos do exemplo | 345 mm | NÃO INFORMADO | INDETERMINADO | INDETERMINADO |
| Frente — altura entre extremos do conjunto de pontos do exemplo | 730 mm | NÃO INFORMADO | INDETERMINADO | INDETERMINADO |
| Costas — largura entre extremos do conjunto de pontos do exemplo | 345 mm | NÃO INFORMADO | INDETERMINADO | INDETERMINADO |
| Costas — altura entre extremos do conjunto de pontos do exemplo | 730 mm | NÃO INFORMADO | INDETERMINADO | INDETERMINADO |
| Manga — distância reta dos pontos 0→2 do exemplo | 630 mm | NÃO INFORMADO | INDETERMINADO | INDETERMINADO |
| Manga — diagonal reta dos pontos 3→0 do exemplo | 298,686155 mm | NÃO INFORMADO | INDETERMINADO | INDETERMINADO |

**Definições métricas:** `desvioAbsolutoMm = observadoMm − nominalMm` (sinal preservado; módulo para magnitude); `desvioPercentual = 100 × (observadoMm − nominalMm) / nominalMm`. **Cálculo executado** sobre as três referências de calibração informadas pelo titular: régua (100−100)=0 mm, desvio relativo 0%; quadrado largura (25−25)=0 mm, 0%; quadrado altura (25−25)=0 mm, 0%. Para as dimensões físicas do molde ainda não foi fornecido valor observado, portanto seus desvios permanecem indeterminados. Os limites nominais das peças são a caixa dos pontos do projeto de exemplo, não medidas de linha de costura nem de corte.

**Estado da evidência:** `PRINTING_REPORTED_BY_OWNER`, `SCALE_REFERENCE_25X25_MEASURED_BY_OWNER` e `SCALE_RULER_100_EXACT_REPORTED_BY_OWNER`; desvios relatados/calculados `0_mm/0_percent` nas **três** referências (régua, largura e altura do quadrado). A calibração das referências físicas foi registrada conforme o relato do titular, mas a conferência dimensional do **molde montado** ainda não tem valores observados nem critérios globais de aceitação. Critérios de aceitação globais `PENDING_OWNER_DECISION`. **Estado canônico do projeto `scalePhysical=NOT_RUN` permanece inalterado** até dados mensuráveis e decisão explícita do titular; `cutReady=false`, `assembly=NOT_RUN`, `fit=NOT_RUN`; linha de costura `NOT_IDENTIFIED` e encaixe cava–manga `INDEFINITE`. A declaração positiva sobre o cubo não é evidência de que o molde montado foi conferido dimensionalmente e não autoriza alterações no método.

**Próxima entrada aguardada — sem nova frente de trabalho:** a régua de 100 mm e a referência 25 × 25 mm já possuem medidas reais reportadas e desvios calculados. Permanecem pendentes as dimensões reais do molde montado, identidade do arquivo impresso, equipamento/data e critério quantitativo de aceitação a ser definido pelo titular. Não presumir `PASSED_WITH_EVIDENCE`, `FAILED_WITH_EVIDENCE` ou promoção automática.
