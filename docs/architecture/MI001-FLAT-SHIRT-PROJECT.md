# MI-001 — Flat Shirt Core em projeto versionado (DRAFT / NO-CUT)

**Papel:** primeira integração vertical de pesquisa na aplicação web existente. **Não é novo laboratório**. Integra o interpretador `draftingInterpreter.ts`, o kernel Bézier de `geometry.ts` (modelo de curvas compatível), o shell React existente e saída SVG/PDF derivada de pontos/arestas, sem duplicar fórmulas na interface.

**Origem:** Aldrich, *Metric Pattern Cutting for Menswear*, 5.ª ed., PDF pp. 35–36 (texto) e p. 38 (figuras), usando somente descrições técnicas originais. `ALD-FLAT-SHIRT-CORE@research-0.1.0` é versão de regras de pesquisa e **não** versão aprovada de método do livro. Os valores exemplares de torso/cava/pescoço etc. são citados da fonte, enquanto o comprimento da camisa é uma escolha explícita de estilo (700 mm nesta fixture).

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
4. `SLEEVE_HEAD_INTERPOLATION@1.0.0`: reconstrução provisória por quintos, ajustes e curvas Bézier; sentido, tangências e encaixe ainda dependem de revisão.
5. `SLEEVE_DIAGONAL_PROJECTION@1.0.0`: decomposição da diagonal 0–3 em componente horizontal usando a altura 0–1; não é um novo traço textual da fonte.
6. `CLOSURE_EXPERIMENT@1.0.0`: fechamento diagnóstico das três figuras; não há papel industrial atribuído a essa linha.

A projeção da diagonal `0–3` da manga para a horizontal da linha `1` usa Pitágoras e não deve ser vendida como operador textual de Aldrich. Piques, montagem/`SeamPair`, margens por borda, dobras definitivas, trueing, tolerâncias de montagem, orientação de corte e acabamento não foram aprovados.

## Identidade, reabertura e segurança

Projeto serializado `menswear-garment-project/0.1.0`; unidade `mm`; oito medidas com unidade de entrada, origem e valor; três peças com IDs de pontos/arestas estáveis e dependências explícitas; array de decisões com versão; evidências vinculadas a medidas/decisões; estado obrigatório `cutReady=false`, `scalePhysical=NOT_RUN`, `assembly=NOT_RUN`, `fit=NOT_RUN`.

A importação reexecuta a receita congelada e rejeita geometria adulterada, versão desconhecida, decisão alterada, unidades incompatíveis ou bloqueio alterado. **Não migra silenciosamente** versões do método. Uma mudança inválida não substitui o último projeto válido. Uma alteração de medida regenera peças com IDs estáveis e marca como `STALE` apenas revisões cuja dependência mudou. Não existe registro de aprovação profissional fornecido por este módulo.

## Exportações e QA

- SVG do projeto e PDF vetorial usam coordenadas em mm, escala **nominal 1:1**, na página personalizada de **1200 × 850 mm**, destinada a plotter. **Não há paginação A4 de moldes neste incremento.** O exportador não desloca/engrossa margens de corte nem certifica impressora.
- PDF A4 de calibração: 210 × 297 mm, quadrado 25 × 25 mm, régua de 100 mm e campos para impressora, configurações, resultados físicos, data, responsável e evidência. Imprimir em **tamanho real/100%**, sem ajuste automático.
- CI unitária, build e testes de interface comprovam apenas fluxo digital. `scalePhysical`, `assembly` e `fit` só podem mudar após avaliação futura, fora do escopo do schema DRAFT.
- Gate A independente continua `IN_REVIEW`. Gate B do Flat Shirt Core continua **NO-GO** por Issues #1–#5/#26. Integração FreeSewing e CH02 não são dependências deste incremento.

**Antes do próximo incremento:** revisão formal da interpretação das curvas e do conceito de fechamento/aresta; adicionar conferência das relações de montagem e output A4/plotter robusto somente com regras/evidências específicas. Nunca promover cutReady por CI.
