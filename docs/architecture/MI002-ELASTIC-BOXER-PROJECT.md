# MI-002 — Short de elástico simples / samba-canção (diagnóstico, sem corte)

**Escopo decidido pelo titular, 14/10/2026:** MI-002 substitui MI-001 como prioridade, sem mesclar ou abandonar PR #62. Peças FRONT e BACK, cós elástico no topo como referência, barra reta; sem botão, braguilha, bolso, forro, cordão ou cós acrescentado. Geometria executável, comparável, persistível e imprimível nominalmente em escala real. **Curvas, encaixe, margens, produção e caimento NÃO aprovados.**

**Mudança de fonte por ordem expressa:** este incremento **NÃO utiliza Aldrich** nem atribui qualquer fórmula a essa obra. A base autoritativa dos requisitos é o **briefing do titular**. Fórmulas não especificadas nesse briefing são `TECHNICAL_DECISION / PENDING_OWNER_DECISION`, nunca apresentadas como regra consagrada. O [Editor FreeSewing](https://freesewing.eu/docs/editor/) é consultado só como **referência de UX**: fluxo design→medidas→rascunho, preview, inspeção e exportação. O código industrial/método do FreeSewing não foi inserido.

## Reaproveitamento: nenhum novo laboratório

- `draftingInterpreter.ts`: executa instruções genéricas `ORIGIN`, `OFFSET` e `PROJECT_AXES` em mm, com origem rastreada ao briefing do titular (página lógica 1, **não capítulo de livro**).
- `geometry.ts:cubicLength`: mede o gancho Bézier de forma independente do SVG.
- `flatShirtExport.ts`: exporta os **mesmos utilitários PDF existentes** (PDF builder, página A4, texto, conversão mm→pontos). Sem alteração de algoritmos MI-001.
- `App.tsx` abre `ShortWorkspace.tsx` dentro da aplicação atual. O MI-001 continua acessível como histórico.
- `shortProject.ts` e `shortExport.ts` são implementações do **novo método** e do adaptador de exportação, não um projeto CAD paralelo.

## Medidas e exemplo nominal

| Entrada editável (cm) | Chave interna | Valor de exemplo | mm |
|---|---|---:|---:|
| Cintura | waist | 90 | 900 |
| Quadril | hip | 102 | 1020 |
| Comprimento total | total_length | 42 | 420 |
| Gancho frontal | front_rise | 30 | 300 |
| Gancho traseiro | back_rise | 31 | 310 |
| Entreperna | inseam | 12 | 120 |
| Largura da barra **por painel** | hem_width | 31 | 310 |
| Largura do elástico | elastic_width | 3,5 | 35 |

**Interpretação provisória:** `front_rise` / `back_rise` são **coordenadas verticais desde a cintura**, NÃO comprimentos do arco do gancho; `hem_width` é a largura de cada **painel** plano, NÃO a circunferência de uma perna montada. Estas interpretações dependem do titular. As equações rejeitam entradas incompatíveis em vez de forçar distorções.

## Geometria e proveniência — frente/costas

| Ponto estável por peça | Função | Origem |
|---|---|---|
| W0 | Origem central cintura (0,0) | TECHNICAL_DECISION |
| W1 | Largura cintura = cintura/4 | TECHNICAL_DECISION, zero ease |
| H0 | Referência do quadril em y=metade do menor gancho | TECHNICAL_DECISION |
| H1 | Quadril lado, x=quadril/4 e y=H0 | TECHNICAL_DECISION |
| R0 | Ponta gancho: y=gancho inserido, extensão x=−max(0,quadril−cintura)/(8 frente; 4 costas) | TECHNICAL_DECISION |
| B0 | Barra interna: y=comprimento, x resolvido para que segmento R0–B0 tenha distância = entreperna | GEOMETRY_DERIVATION, solução técnica |
| B1 | Barra lateral: B0 + largura barra | OWNER_INPUT / DERIVED_GEOMETRY |
| G0 | Guia do elástico: x=0, y=largura elástico | OWNER_INPUT / DERIVED_GEOMETRY |
| G1 | Interpolação entre os pontos laterais no nível do elástico | TECHNICAL_DECISION |

A derivação da entreperna é `dx = sqrt(entreperna² − (comprimentoTotal − ganchoVertical)²)`. Um valor negativo sob a raiz provoca `MI002_INSEAM_INCOMPATIBLE`, não correção implícita de entrada. A curva do gancho tem controles candidatos `(-extensão,0,64×gancho)` e `(0,0,32×gancho)` no sentido R0→W0; **não há regra de caimento nem fonte externa aprovando essa curva**.

| Aresta em FRONT/BACK | Segmento | Classificação | Origem |
|---|---|---|---|
| E01 | W0→W1: topo cintura | UNCLASSIFIED | PENDING_OWNER_DECISION |
| E02 | W1→H1: lateral superior | UNCLASSIFIED | PENDING_OWNER_DECISION |
| E03 | H1→B1: lateral inferior | UNCLASSIFIED | PENDING_OWNER_DECISION |
| E04 | B1→B0: barra reta | UNCLASSIFIED | PENDING_OWNER_DECISION |
| E05 | B0→R0: entreperna | UNCLASSIFIED | PENDING_OWNER_DECISION |
| E06 | R0→W0: gancho Bézier candidato | UNCLASSIFIED | PENDING_OWNER_DECISION |
| E07 | G0→G1: guia elástico | CONSTRUCTION_LINE | TECHNICAL_DECISION |
| E08 | H0→H1: guia quadril | CONSTRUCTION_LINE | TECHNICAL_DECISION |
| E09 | W0→H0: guia central | CONSTRUCTION_LINE | TECHNICAL_DECISION |

As 18 arestas possuem `id`, `origin`, `solution`, `role`, `review`, `classificationOrigin`, `dependsOn` e `allowanceMm=null`. Cada ponto também possui rastreabilidade. A proposta de margem por aresta fica **fora da geometria** em `edgeAllowances[id]={proposedMm:null,approval:PENDING_OWNER_DECISION}`, sem offset ou linha de corte. Uma entrada de proposta não a aplica nem valida; não há folga/costura/corte/ajuste automático.

## Diagnóstico, artefatos e travas

- `shortDiagnostic()` produz comprimento do topo de cintura, lateral (E02+E03), entreperna (E05), gancho (E06), barra (E04) e todas as 18 arestas em mm, sem afirmar linhas de costura.
- `exportShortSvg()` usa `width/height` mm e todos os pontos identificados; sem marcações industriais.
- `paginateShortA4()` e `exportShortA4()` reutilizam o protocolo A4: 210×297mm, quadro 180×214mm, sobreposição de registro 10mm, página/total, projeto, método, SHA, UTC, cruzes em coordenadas mm, régua 100mm, quadrado 25×25mm. **NÃO é margem de costura**. A escala física permanece **NOT_RUN**, não obstante a aprovação restrita de uma impressão histórica diferente do MI-001.
- `saveShortProject()`, `loadShortProject()`, `changeShortMeasure()` exigem método `MI002-ELASTIC-BOXER@research-0.1.0` e peças regeneráveis sem dependência da interface. Alterar medidas incrementa revisão sem reusar provas físicas.
- As saídas digitais são identificadas como `DRAFT / NO CUT / PROVISIONAL GEOMETRY`, sem aprovação industrial. **`cutReady=false`, `scalePhysical=NOT_RUN`, `assembly=NOT_RUN`, `fit=NOT_RUN`.**
- Testes unitários, TypeScript/build, E2E e PDFs devem ser conferidos no **SHA final**. PR #63 fica **Draft, sem merge**; PR #62 também.

**Pendência principal para eventual revisão posterior, ainda não autorizada:** escolher e documentar um método de construção de short de tecido plano e interpretar de modo industrial os ganchos e a largura da barra. Até essa decisão, os pontos e curvas são geometria diagnóstica técnica, não molde de produção.
