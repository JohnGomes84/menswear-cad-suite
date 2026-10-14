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
