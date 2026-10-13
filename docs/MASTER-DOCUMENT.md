# Documento Mestre — Suíte CAD Paramétrica de Modelagem Masculina

**Versão da baseline:** 1.1 — Fase 1.5 em andamento
**Data:** 13/10/2026  
**Status:** descoberta de produto fechada; POC geométrica sintética autorizada e em execução em branch isolada; validação do `PILOT-001` e código de produção continuam não autorizados.
**Idioma inicial:** português brasileiro  
**Unidades:** cm na interface; mm no kernel, no formato-fonte e em operações geométricas.  
**Referência técnica principal:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª edição.  
**Finalidade deste documento:** fonte única de referência para as decisões e especificações do projeto. Conteúdos divergentes de documentos anteriores são substituídos por esta baseline.

---

## 1. Resumo executivo

O projeto é uma suíte CAD web para modelagem masculina paramétrica, destinada tanto a usuários de sob medida/ateliê quanto a modelistas/confecções. O produto terá um editor avançado, mantendo um único motor de regras e geometria, com níveis distintos de interface conforme o perfil de uso.

O piloto formal é **`PILOT-001 — Flat Shirt Core`**: corpo frente/costas, cava, manga básica de uma folha e piques correspondentes, baseado no bloco de camisa plana para tecido plano descrito no livro de referência. Gola, punho construído, carcela, bolso, gradação, ajustes corporais avançados, DXF, nesting e simulação 3D ficam fora deste primeiro piloto.

A arquitetura separa kernel CAD próprio, semântica de vestuário, regras de modelagem, validação/topologia auxiliar, QA e exportadores. O arquivo paramétrico versionado é a fonte editável; SVG e PDF são as saídas iniciais. Shapely/GEOS poderá ser avaliado apenas como auxiliar topológico e ezdxf apenas para um futuro adaptador DXF.

**Princípio de qualidade:** um molde não é considerado correto só porque seu desenho parece plausível. Ele precisa ser determinístico, testado geometricamente, coerente com montagem e costura, imprimível em escala e validado fisicamente no nível de uso pretendido.

---

## 2. Decisões aprovadas e limites da baseline

| Tema | Decisão consolidada |
|---|---|
| Produto | Aplicação web para modelagem masculina paramétrica |
| Público | Misto: sob medida/ateliê e modelista/confecção |
| Editor | Avançado; preserva relações paramétricas e registra overrides/desvinculações |
| Piloto | `PILOT-001 — Flat Shirt Core` |
| Fonte editável | Projeto paramétrico próprio, estruturado e versionado |
| Saídas do MVP | SVG e PDF em escala; PDF paginado e PDF plotter sujeitos à validação |
| Formato posterior | DXF via adaptador isolado, após requisitos de interoperabilidade |
| Kernel | CAD geométrico paramétrico próprio; biblioteca externa não será a fonte de verdade das curvas |
| Topologia | Shapely/GEOS em estado `POC`, limitado a operações auxiliares que passem nos testes |
| Piques | Distância acumulada sobre a aresta paramétrica, não coordenada X/Y independente |
| Dados pessoais | Não compartilhar nem enviar sem informação e escolha clara; minimizar e definir retenção antes de produção |
| Implementação | Código de produção bloqueado até especificação, POC e evidências de validação |

### 2.1 Escopo exato do piloto

**Inclui:**

- frente e costas do corpo básico;
- decotes frontal/posterior e cava conforme regra aprovada;
- manga básica de uma folha, método “machined on the flat” da referência;
- semântica de linha de costura, linha de corte, `SeamPair`, ease e piques;
- margens em subconjunto de trechos depois da auditoria por aresta;
- fio, centro/dobra quando aplicável, identificação e relatório geométrico;
- geração paramétrica, SVG e PDF diagnóstico/escala real.

**Não inclui:** gola, punho como peça, carcela, bolso, gradação, ajuste de posturas/figuras especiais, mangas de duas folhas, DXF, nesting industrial ou simulação 3D.

A medida de punho continua como entrada do bloco de manga quando exigida pela regra; isso não implica construir um punho no piloto.

---

## 3. Propósito, objetivos e não objetivos

### 3.1 Objetivos

1. Transformar medidas, parâmetros de estilo e escolhas de construção em moldes paramétricos editáveis e reproduzíveis.
2. Manter medidas corporais, folga de vestibilidade, medida final da peça, geometria líquida de costura, margem e anotação como conceitos distintos.
3. Tornar rastreáveis as regras, as dependências, as versões do motor, as medidas utilizadas e os testes executados.
4. Validar curvas, offsets, costuras parceiras, piques, fechamento, escala e integridade antes de indicar aptidão para corte.
5. Exportar em escala física verificável; imprimir com quadrado de calibração e instrução de escala 100%.
6. Validar o piloto com prova física/toile, respeitando a separação entre protótipo de engenharia e padrão aprovado para produção.

### 3.2 Não objetivos do MVP/piloto

- substituir avaliação de modelista;
- prometer caimento perfeito sem dados suficientes e prova física;
- reproduzir páginas, figuras, scans ou texto extenso do livro no produto;
- gerar estilos não especificados;
- simular integralmente tecido e drapeado em 3D;
- executar nesting industrial, gradação em série ou integração PLM no piloto.

---

## 4. Arquitetura lógica

| Camada | Responsabilidade |
|---|---|
| Interface web/editor | Perfil de medidas, parâmetros, seleção, prévia, edição controlada, avisos e exportação |
| Validador de entrada | Tipos, unidades, faixas, campos obrigatórios, protocolo e coerência |
| Motor de regras | Regras de modelagem puras, versionadas, tipadas e rastreáveis; recalcula dependências |
| Kernel CAD nativo | Entidades, curvas, constraints, transforms, comprimento e coordenadas canônicas |
| Semântica de vestuário | Peças, pontos do molde, costuras, `SeamPair`, pences, piques, fio, dobras e margens |
| Topologia auxiliar | Operações planas, interseções e verificações delegadas, com aproximação e erro controlados |
| QA/validador | Invariantes, costuras parceiras, estados de validade, testes e relatório de evidências |
| Exportadores | SVG e PDF iniciais; DXF futuro por adaptador isolado |
| Auditoria/compliance | Manifesto reproduzível, SBOM, registro externo de ativos e proveniência |

**Princípios:** regras não ficam na camada de renderização; resultados independem do zoom; as unidades e tolerâncias são explícitas; uma mudança de regra incrementa versão e executa regressão; topologia inválida nunca passa silenciosamente para exportação final.

### 4.1 Kernel geométrico canônico

Entidades previstas: `Point`, `Line`, `Arc`, `Bezier`, `Spline` quando justificada, `Path`, `Constraint` e `Transform`. As entidades mantêm identidade estável, unidade interna em mm, regra de origem, dependências, modo de edição e estado de validação.

Bézier cúbica é a candidata inicial para curvas do piloto. A decisão final de suportar Bézier apenas ou também splines deverá ser baseada no bloco, editor e POC; não se deve implementar uma abstração mais ampla sem caso de uso demonstrado.

### 4.2 Semântica de vestuário

Entidades mínimas: `PatternPoint`, `SeamEdge`, `SeamPair`, `Dart`, `Notch`, `Grainline`, `FoldLine`, `SeamAllowance`, `GarmentEase`, `AssemblyEase`, `PatternPiece`, `MeasurementProfile`, `GarmentSpec`, `DraftRuleSet`, `ExportJob` e `ValidationReport`.

`SeamEdge` identifica uma aresta orientada de costura. `SeamPair` associa arestas que serão montadas, guarda orientação, correspondência por trechos/piques, regra de facilidade de montagem, comprimentos, tolerância e status. Ser parceiras não significa necessariamente ter comprimentos totais idênticos.

### 4.3 Ease, margem e tolerância

- **`GarmentEase`:** diferença intencional entre medida corporal e medida final da peça por região.
- **`AssemblyEase`:** diferença controlada/distribuída ao montar costuras parceiras.
- **Margem de costura:** deslocamento da linha líquida para linha de corte.
- **Tolerância de costura/QA:** limite de variação permitido pelo teste.

São grandezas distintas, com unidades, regras, origem e estado próprios. Ease não definida não será convertida em zero sem decisão explícita.

### 4.4 Modos do editor

- `PARAMETRIC`: a regra geradora controla a entidade.
- `PARAMETRIC_OVERRIDE`: preserva regra-base e registra delta/constraint adicional/ajuste.
- `FREE`: desvinculação explícita da regra, com snapshot de origem.

Toda intervenção deve ser visível, versionada, reversível por undo quando aplicável, e deve revalidar entidades dependentes. Undo/redo será transacional, por comandos/eventos como `MovePoint`, `ChangeMeasurement`, `AddConstraint`, `BreakConstraint`, `OverrideRule` e `AddSeamAllowance`, com snapshots para recuperação.

---

## 5. Requisitos consolidados

### 5.1 Funcionais

- Perfil de medidas registra valor original, unidade, tipo semântico, protocolo, origem, data, região/lado e observações.
- Entradas ausentes, incompatíveis ou fora de faixa são apresentadas sem correção silenciosa.
- Perfil da peça guarda tecido, extensibilidade/comportamento, estilo, comprimentos, folga e convenções de construção.
- Motor gera peças por `DraftRuleSet` versionado e informa dependências utilizadas.
- Costura líquida e linha de corte são representadas separadamente.
- Marcas incluem piques, fio, centro, dobra, pence, bainha, identificação e referências de impressão quando aplicável.
- `SeamPair` compara comprimentos e distribuição por trechos, respeitando a regra de montagem aprovada.
- Exportações registram escala, unidade, tamanho do papel, configuração, versão do exportador e hash do projeto.
- Projeto paramétrico pode ser salvo, reaberto, versionado e regenerado sem depender apenas do PDF final.
- Relatório lista entradas, ease, margens, versão das regras, avisos, testes executados e estado de validade.

### 5.2 Não funcionais

- Cálculo canônico em mm; cm aceito na interface.
- Determinismo por versão do motor, regras e entradas.
- Testabilidade sem interface gráfica.
- Mensagens acionáveis em português.
- Dados antropométricos não são enviados a serviços externos sem consentimento/informação.
- Compatibilidade SVG/PDF comprovada nos leitores selecionados e em teste de impressão.
- Acessibilidade básica e unidade explícita em campos e relatórios.

---

## 6. Especificação de domínio preliminar — PILOT-001

### 6.1 Referência e ressalvas

No PDF fornecido, o bloco “The flat shirt block (woven fabrics)” aparece nas pp. 35–36; o diagrama está na p. 36. A regra de manga é descrita como “machined on the flat”. O texto informa margem de 1 cm incluída em trechos do bloco, com exceções marcadas; a bainha não recebe margem conforme a indicação do bloco.

O mapa de linha de costura e linha de corte deve ser auditado **aresta por aresta**. Não subtrair nem acrescentar 1 cm globalmente: isso pode criar ou eliminar margem duas vezes. A regra guarda `seam_geometry` e gera `cut_geometry` separadamente.

A manga usa como uma de suas cotas a medida diagonal 5–17 no corpo mais 3 cm. Isso não pode ser substituído pela hipótese de que o comprimento total da cabeça da manga precisa ser igual ao contorno total da cava. A relação entre método, ease e costura requer validação técnica e prova física.

### 6.2 Entradas do bloco e valores publicados

| Campo | Tipo | Exemplo indicado no livro | Estado |
|---|---|---:|---|
| `chest` | circunferência do tórax | 100 cm | Obrigatória |
| `scye_depth` | profundidade de cava | 24,4 cm | Obrigatória; origem pode ser tabela ou conferência pessoal |
| `back_neck_to_waist` | comprimento nuca/costas até cintura | 44,2 cm | Obrigatória |
| `neck_size` | circunferência de pescoço | 40 cm | Obrigatória |
| `half_back` | meia largura das costas | 20 cm | Obrigatória |
| `garment_length` | comprimento escolhido para estilo | varia | Obrigatória como escolha; ponto final deve ser especificado |
| `one_piece_sleeve_length` | comprimento da manga de uma folha | 65 cm | Fixture; protocolo distinto de manga de camisa até decisão |
| `close_wrist` | medida justa do punho | 17,8 cm | Fixture; equivalência com circunferência de punho ainda pendente |

Valores são exemplos de tamanho médio, não defaults universais nem promessa de ajuste.

### 6.3 Relações transcritas e verificações aritméticas

O texto do bloco inclui as seguintes relações (notação original do livro):

- `0–1 = 3 cm`;
- `1–2 = profundidade de cava + 4 cm`;
- `1–3 = costas-pescoço à cintura`;
- `1–4 = comprimento da camisa`;
- `2–5 = 1/4 tórax + 6,5 cm`;
- `1–9 = 1/5 pescoço − 0,6 cm`; `9–10 = 3 cm`;
- `1–11 = 1/2 da medida 1–2`;
- `11–12 = 1/2 costas + 5 cm`;
- `1–15 = 1/8 profundidade de cava − 0,3 cm`; `16–17 = 1,5 cm`;
- `1–18 = 1/5 pescoço − 2 cm`;
- manga: `0–1 = 1/3 da medida 1–2 do corpo`; `0–2 = comprimento de manga − 2 cm`; `0–3 = diagonal 5–17 do corpo + 3 cm`; `2–4 = 1/2 punho justo + 5 cm`;
- a cabeça da manga divide `0–3` em cinco seções; cava 0,75 cm no ponto 5 e eleva 1,5 cm entre 7–8.

Conversões do exemplo: `scye_depth + 4 = 28,4 cm`; `1/4 chest + 6,5 = 31,5 cm`; `1/5 neck − 0,6 = 7,4 cm`; `1/2 back + 5 = 15 cm`; `1/8 scye_depth − 0,3 = 2,75 cm`; `1/5 neck − 2 = 6 cm`; `65 − 2 = 63 cm`; `17,8/2 + 5 = 13,9 cm`.

São checks aritméticos da transcrição, não ground truth geométrico ou de ajuste. Coordenadas absolutas e curvas dependem da leitura completa do diagrama e revisão especializada.

### 6.4 Matriz resumida de pontos e dependências

| Pontos | Regra/função | Dependências/pendência |
|---|---|---|
| 0–4 | origem; altura do topo (3 cm); linha de cava; cintura; comprimento da peça | Confirmar sistema de eixos/direções; comprimento final é variável |
| 5–8 | largura base `1/4 chest + 6,5`; projeções para topo, cintura e barra | Confirmar alinhamento/identidade das linhas no diagrama |
| 9–10 | largura de decote posterior `1/5 neck − 0,6`; elevação 3 cm; curva termina na linha de encaixe 1 cm abaixo de 10 | Tangências e forma da curva a especificar |
| 11–14 | metade da distância 1–2; `11–12 = 1/2 back + 5`; projeções para cava e acima | Cotas e projeções 13/14 devem ser reconstruídas a partir do diagrama |
| 15–17 | `1/8 scye_depth − 0,3`; projeção 16; 16–17 = 1,5 cm; curva de cava por 17,12,5 | Orientação e controle da curva ainda requerem validação |
| 18 | largura do decote dianteiro `1/5 neck − 2`; curva frontal | Ponto final e construção geométrica devem ser fixados |
| Manga 0–4 | altura, comprimento, diagonal corporal +3 e largura de punho | Conferir orientação e correspondência com a regra original |
| Manga 5–8 | quatro marcas internas dividindo o topo em cinco partes; controle da cabeça | Definir sinais/direções dos deslocamentos e tangências |

A especificação não inventa coordenadas faltantes. Centros, espelhamento, dobra/costura e separação final entre frente e costas serão definidos na regra de domínio após revisão do diagrama.

### 6.5 Protocolos de medidas — capítulo 13

Conferência do capítulo 13, PDF pp. 260–262. A fonte recomenda corpo relaxado, normalmente vestido com camisa e calças, e marcação da cintura natural com cordão/elástico.

| Medida | Protocolo de referência | Observações de projeto |
|---|---|---|
| Tórax | Fita sob os braços, ao redor do tórax, passando sobre as escápulas | Manter fita na posição; circunferência, não largura plana |
| Meia-costas | Centro costas 15 cm abaixo da nuca até posição da costura da manga na cava | Alternativa: medir costas inteiras e dividir por dois; guardar qual foi usada |
| Pescoço | Ao redor da base sem apertar, referência pela borda inferior da fita | Não aplicar aperto/folga sem regra explícita |
| Costas-pescoço à cintura | Osso da nuca até cintura natural marcada | Guardar pontos anatômicos e protocolo |
| Comprimento da camisa | Osso da nuca até comprimento escolhido | É parâmetro de estilo, não um valor fixo do livro |
| Profundidade de cava | Tabela padrão na maioria dos casos; verificar/medir se braço/ombro forem desenvolvidos | Guardar origem `size_chart` ou `personal_check` |
| Manga de uma folha | Osso do ombro até logo abaixo do osso do punho | Campo `one_piece_sleeve_length` |
| Manga de camisa | Braço elevado e dobrado; da nuca por ombro e cotovelo até abaixo do punho | Campo distinto `shirt_sleeve_length`; regra do bloco deve decidir qual usa |
| Punho | Capítulo lista circunferência pouco acima do osso; bloco usa `close wrist` | Equivalência precisa ser aprovada, não presumida |

Cada observação de medida registra valor original, unidade, valor normalizado, tipo (circunferência/comprimento/largura etc.), ponto anatômico, protocolo/versão, postura, origem (pessoal/tabela/derivada), data, lado/região e observações. Nova medição não apaga valor já usado em projeto. Dados pessoais devem ser minimizados; consentimento, retenção, exclusão e proteção precisam estar definidos antes de operação de produção.

### 6.6 Costuras, piques e montagem da manga

`SeamPair` registra nome semântico, arestas parceiras, direção, trechos entre piques, comprimentos paramétricos, diferença, regra de `AssemblyEase`, tolerância e estado. Piques são medidos por distância acumulada (`arcLength`) ao longo da `SeamEdge`, com direção de referência e ponto/tangente derivados da curva.

A validação reporta comprimento total e por trecho, ease distribuída e estado `VALID`, `WARNING`, `INVALID` ou `NOT_YET_DEFINED`. Para a manga “machined on the flat”, até validar a regra de montagem, comprimentos diferentes não são automaticamente falha nem aprovação.

---

## 7. Modelo geométrico, curvas e constraints

`SeamEdge.length()` calcula sobre a curva paramétrica canônica. Para Bézier cúbica, a POC deve testar integração adaptativa/numericamente controlada contra fixtures e registrar limite de erro. A polilinha de tela/exportação é aproximação e nunca referência de verdade para costura.

`point_at_arc_length(s)` recebe distância em mm ao longo da orientação da aresta, verifica `0 ≤ s ≤ L` e retorna ponto/tangente. A reversão de orientação e correspondência entre costuras parceiras são operações explícitas.

Constraints iniciais a considerar: coincidência, horizontal/vertical, perpendicularidade, paralelismo, distância, ângulo, tangência, ponto sobre curva, simetria, igualdade de comprimento/medida e relação de regra. O solver deve declarar solução única, múltipla, inconsistente ou não convergente. Implementar somente o subconjunto que o piloto utilizar.

Regras (`DraftRule`) são versionadas, tipadas e rastreáveis, com entradas, unidades, dependências, limites e testes. Fórmulas devem ser representadas por AST/DSL segura, não por execução de string de código.

### 7.1 Discretização e offsets

Discretização adaptativa tem tolerância física declarada e registra algoritmo, versão e erro observado. Deve ser testada em mais de uma resolução sem alterar comprimento canônico ou posição de pique.

`SeamAllowance` deriva a linha de corte. A POC cobre curva côncava/convexa, canto agudo, junção, mudança de largura de margem, margem de pence, encontro lateral/barra, dobra, auto-interseção, laço, segmento degenerado e offset indeterminado. Estados: `VALID`, `WARNING`, `INVALID`, `UNSUPPORTED`. Falhas `INVALID/UNSUPPORTED` bloqueiam exportação final de corte, embora possam ser exportadas em relatório diagnóstico identificado.

---

## 8. Arquivo paramétrico e histórico

Formato conceitual: JSON UTF-8 versionado (ou pacote com manifesto após decisão), unidade canônica mm, identificadores estáveis. Contém:

- envelope (`format`, `formatVersion`, `projectId`, datas, unidades);
- produto/piloto e versões de kernel/ruleset;
- `MeasurementProfile` com valores originais e protocolos;
- `GarmentSpec`, material/comportamento do tecido e parâmetros de ease;
- entidades geométricas, peças, `SeamEdge`, `SeamPair`, constraints, pences, piques, fio/dobra/margens;
- modos `PARAMETRIC`, `PARAMETRIC_OVERRIDE`, `FREE` e dependências;
- histórico reversível, snapshots e resultados de validação;
- proveniência e metadados dos exports.

As fórmulas são AST/DSL tipada e validada. Dados não executam código nem fazem download remoto ao abrir. O round-trip preservar IDs, unidades, regras, modo de edição, piques por arco e distinção costura/corte. Migrações são explícitas e registram versão anterior, conversor e diferenças; nada é descartado silenciosamente.

Cada export deve registrar hash do projeto, motor/exportador, regra, data, escala, unidade, tamanho do papel e configuração de paginação. Privacidade e retenção de perfis antropométricos continuam requisitos a formalizar antes da produção.

---

## 9. Plano QA consolidado

### 9.1 Fixture aritmético A

Exemplo do bloco nas pp. 35–36: tórax 100 cm; cava 24,4 cm; costas-pescoço à cintura 44,2 cm; pescoço 40 cm; meia-costas 20 cm; manga 65 cm; punho 17,8 cm; comprimento de peça parametrizado. QA confirma as derivações aritméticas da seção 6.3. Esse fixture não aprova geometria nem caimento.

### 9.2 Testes obrigatórios

1. Tipos/unidades: cm/mm equivalentes geram mesmo resultado dentro da tolerância definida; entrada ausente ou inválida não produz peça silenciosamente.
2. Regras: derivados corretos, sem arredondamento prematuro; mesma versão/entrada gera resultado determinístico.
3. Perfil: protocolo e origem distintos são preservados; distinguir manga genérica e manga de camisa; confirmar mapeamento de `close_wrist`.
4. Curvas: comprimento canônico, convergência/erro, `point_at_arc_length`, ponto e tangente; tesselação não altera medidas ou piques.
5. Costuras: `SeamPair`, direção, correspondência por trechos, piques pareados e regra de ease; nenhum pressuposto de igualdade total.
6. Margens: mapeamento por aresta, linha líquida separada de linha de corte; sem margem dupla; offset côncavo/convexo, canto, largura variável, dobra, bainha e pence.
7. Erros: contorno aberto, autointerseção, laço, segmento degenerado, inversão de margem, dependência quebrada, constraint ambígua/não convergente e pique sem par recebem diagnóstico; erros bloqueiam estado apto para corte.
8. Editor/histórico: override conserva fórmula e delta; FREE é explícito; undo/redo de ponto/medida restaura geometria, costuras, piques e status.
9. SVG/PDF: abrir em leitores escolhidos; escala física, paginação, marcas de registro, identificação e quadrado de calibração verificáveis. Impressão é a 100%, sem “ajustar à página”.
10. Privacidade: projeto/export não compartilha perfil pessoal sem informação/consentimento.
11. Montagem: toile documentada com tecido, instrução, piques, margem e revisão profissional.

Relatórios usam `PASS`, `WARN`, `FAIL`, `NOT_RUN` e `NOT_YET_DEFINED`; estados não executados/não definidos nunca contam como aprovação. Tolerâncias finais serão decididas pela POC e teste físico, não inventadas nesta baseline.

### 9.3 Golden cases

- **GC-1:** fixture aritmético do livro — apenas expressões e unidades.
- **GC-2:** geometria do corpo — bloqueada até reconstrução independente dos pontos/diagrama e revisão de modelista.
- **GC-3:** manga — bloqueada até definir diagonal, cabeça, ease e montagem.
- **GC-4:** toile/assemblagem — bloqueada até impressão calibrada e prova física.

---

## 10. Saídas e critérios de aceitação

SVG e PDF são aprovados como formatos de saída planejados. A biblioteca PDF geradora ainda deve ser selecionada por comparação de escala, mosaico A4, plotter, marcas, fontes, metadados, licença e consistência de impressão.

Aceite do piloto exige: geração sem edição manual obrigatória de coordenadas; entrada validada; reprodutibilidade; identidade das peças/arestas; piques e costuras avaliados por percurso; PDF com calibração; SVG/PDF em pelo menos dois leitores; relatório legível; e prova física documentada. Aptidão comercial/industrial exige evidência adicional e não decorre só da aprovação do software.

---

## 11. Recursos gratuitos, dependências e licenças

“Gratuito” não implica permissão de incorporar, modificar ou redistribuir. Estados: `APPROVED`, `POC`, `REFERENCE_ONLY`, `BLOCKED`.

| Recurso | Licença/condição apurada no inventário | Papel/estado neste projeto |
|---|---|---|
| Shapely/GEOS | BSD-3-Clause | `POC`; auxiliar topológico, nunca kernel nem verdade das curvas |
| ezdxf | MIT | `POC`; adaptador DXF futuro, não motor de modelagem |
| SVG | Formato aberto | Saída vetorial inicial; não substitui arquivo paramétrico |
| PDF | Biblioteca ainda não selecionada | Saída inicial; comparar opções e licenças antes de dependência |
| Seamly2D | GPLv3+ | `REFERENCE_ONLY`; estudar fluxo separado, sem copiar/integrar sem análise de licença |
| Valentina | GPLv3 segundo repositório consultado | `REFERENCE_ONLY`; confirmar fonte/versão/ativos antes de reutilização |
| FreeSewing | API atual; repositório antigo consultado arquivado, licenças de código e conteúdo distintas | `REFERENCE_ONLY`; auditar pacote/repositório atual e licença de cada padrão |
| OpenPattern | GPL-3 segundo repositório consultado | `REFERENCE_ONLY`; sem reutilizar código, tabelas ou moldes sem revisão |
| BodyM | CC BY-NC 4.0 | `BLOCKED` para produto comercial; pesquisa não comercial só após termos e privacidade |
| GarmentCodeData | Condições precisam ser confirmadas no DOI/pacote baixado | `POC/RESEARCH` após auditoria; não redistribuir/incluir em produto sem liberação |
| GarmentCode | Licença não confirmada na página consultada | `BLOCKED` até auditoria de código, dependências, ativos e dados |

### 11.1 Compliance

Manter **SBOM** para dependências efetivamente incluídas, com versão, origem, licença SPDX e avisos. Separadamente, **External Asset Register** registra tudo que foi consultado — software, documentação, datasets, moldes — mesmo que não incorporado. Registrar URL, versão/tag/commit, licença/termos, uso previsto, estado, restrições e responsável pela decisão.

O livro é referência de método. Criar código, fórmulas formalizadas, desenhos e documentação próprios; não incluir páginas, imagens ou texto extenso. Não apresentar o produto como padrão oficial da autora/editora nem sugerir endosso. A revisão final de distribuição depende do material concreto e da jurisdição; isto não é parecer jurídico.

### 11.2 Links de referência técnica consultados

- [Shapely — documentação](https://shapely.readthedocs.io/en/latest/)
- [ezdxf — documentação](https://ezdxf.readthedocs.io/en/stable/introduction.html)
- [Seamly2D — repositório](https://github.com/FashionFreedom/Seamly2D)
- [Valentina — repositório consultado](https://github.com/dismine/valentina)
- [BodyM — registro Open Data](https://registry.opendata.aws/bodym/)
- [GarmentCodeData — ETH Zurich](https://igl.ethz.ch/projects/GarmentCodeData/)
- [GarmentCode — repositório](https://github.com/maria-korosteleva/GarmentCode)
- [FreeSewing — API](https://freesewing.dev/reference/api/)
- [FreeSewing core antigo consultado](https://github.com/joostdecock/core)
- [OpenPattern — repositório](https://github.com/fmetivier/OpenPattern)

As licenças e estados acima são baseline de pesquisa, não substituem revalidação da versão efetivamente instalada/baixada.

---

## 12. Papéis de revisão e autoridade

As perspectivas de trabalho são: produto/analista, modelagem masculina, engenharia de geometria/CAD, engenharia de software, QA, produção/costura e compliance/licenças. Não são atribuições a pessoas humanas já contratadas.

Modelagem revisa regra, folga, equilíbrio e montagem; geometria/CAD aprova representações, tolerâncias e operações; QA aprova evidências de teste; engenharia integra software; produto controla escopo; compliance registra licenças/proveniência. Código ou desenho visual, isoladamente, não aprova regra de modelagem.

---

## 13. Riscos e controles

| Risco | Controle |
|---|---|
| Interpretação errada de fórmula/diagrama | Revisão textual e geométrica independente; matriz ponto-a-ponto; aprovação de modelista |
| Confundir protocolos de manga/punho | Campos separados; decisão documentada antes da POC do bloco |
| Somar/subtrair margem duas vezes | `seam_geometry`/`cut_geometry` separadas e tabela por aresta |
| Ease, tolerância e margem misturadas | Entidades/nomes/valores independentes |
| Offset topologicamente inválido | Detectar, diagnosticar e bloquear exportação de corte |
| Costuras iguais no total, mas mal distribuídas | `SeamPair` segmentado por piques e ease definida |
| Tecido/comportamento desconhecido | Guardar composição/estrutura/extensibilidade e limites da regra |
| Impressão redimensionada | Quadrado de controle, instruções e prova A4/plotter |
| Dados antropométricos sensíveis | Minimização, política de consentimento, retenção e exclusão |
| Licença ou ativo sem permissão clara | Registro externo; `POC`, `REFERENCE_ONLY` ou `BLOCKED`; revisão antes de distribuição |
| Escopo inicial excessivo | Um único piloto, sem gola e variações complexas |

---

## 14. Fases, gates e estado atual

| Fase | Entregável/evidência | Situação |
|---|---|---|
| 0. Descoberta de produto | Produto web, público, editor e piloto escolhidos | Fechada |
| 1. Especificação | Domínio, geometria, formato, QA, medidas, margens, costuras, regras | Em revisão; ainda há bloqueantes específicos |
| 2. POC geométrica sintética | Curvas sintéticas, comprimento, piques, discretização, offsets e SVG/PDF diagnóstico | Em andamento em branch/PR isolado; 14 testes iniciais passam; revisão de engenharia/QA pendente |
| 3. Exportação piloto | Escala, PDF paginado/plotter, SVG e calibração física | Posterior à POC |
| 4. Implementação do piloto | Fluxo web de perfil a molde validado | Bloqueada até evidência técnica e prova |
| 5. Expansão | Calça, outros blocos, gradação, DXF e módulos especiais | Fora do piloto; gate próprio |
| 6. Distribuição | Privacidade, direitos, licenças, documentação e release | Posterior à validação |

### 14.1 Itens que bloqueiam a validação geométrica específica do `PILOT-001`

1. Selecionar entre protocolo `one_piece_sleeve_length` e `shirt_sleeve_length` para a medida pessoal usada, mantendo 65 cm como fixture até esclarecer a relação.
2. Resolver se `close_wrist` equivale à medida de circunferência do punho do capítulo 13.
3. Auditar no diagrama as margens incorporadas por aresta, exceções `no seam allowance`, bainha e linhas centrais.
4. Fechar matriz de pontos/direções, curva de cava/decote e correspondência frente/costas.
5. Especificar `SeamPair` e `AssemblyEase` para manga/cava segundo execução “machined on the flat”.
6. Aprovar representação inicial de curvas, método de arco, tolerâncias a testar, formatos e subset de constraints.
7. Revisar `SPEC-PILOT-001`, `GEOM-001`, `QA-PILOT-001` e `PROJECT-FORMAT-001`.

A POC sintética está autorizada como atividade isolada e reproduzível de engenharia. Ela deve usar apenas geometrias artificiais/controladas para provar comprimento paramétrico, `point_at_arc_length`, discretização, offsets, topologia e exportação diagnóstica. Seus resultados validam mecanismos geométricos genéricos, **não** regras de modelagem, encaixe, margens, `SeamPair`, `AssemblyEase` ou caimento do `PILOT-001`.

A validação geométrica específica do `PILOT-001` permanece bloqueada pelos itens desta seção. Somente após fechar essas decisões o piloto poderá usar as evidências da POC sintética para validar sua própria geometria. Impressão, toile e implementação web funcional continuam posteriores ao gate específico do piloto.

---

## 15. Critérios de pronto e governança de alterações

Uma regra/bloco só é concluída quando requisito, unidades, pressupostos e limites estão documentados; testes unitários, de propriedade e montagem aplicáveis passam; exportação/escala foi verificada; modelagem revisou; relatório reflete execução real; motor/regra têm versão rastreável; e prova física foi anexada quando o risco exige.

Mudança em medida necessária, fórmula, ease padrão, tecido, construção, tolerância, exportação ou compatibilidade registra motivo, impacto, revisão e regressão. Mudança que altera molde gera versão nova da regra e informa que a geometria pode mudar.

---

## 16. Próxima ação recomendada

Continuar a POC sintética em branch isolada, incluindo casos difíceis de orientação, interseção, degeneração, offsets e limites de aproximação, e submeter seus resultados à revisão de geometria/QA. Em paralelo, resolver as pendências da seção 14.1 para desbloquear a validação específica do `PILOT-001`. A POC ainda não recebeu aprovação final; nenhum resultado pode ser apresentado como validação do molde. Código de produção permanece bloqueado.

---

## 17. Histórico de consolidação

Este documento substitui como fonte de verdade as minutas e relatórios separados produzidos anteriormente. A versão 1.1 registra o início controlado da POC sintética e o estado das issues. Versões anteriores podem ser guardadas como histórico de trabalho, mas decisões repetidas, pendências superadas ou escopos antigos não prevalecem sobre esta baseline. Qualquer mudança futura deve atualizar este documento e registrar a revisão correspondente.


---

## 18. Rastreamento das pendências no GitHub

As issues formais do projeto estão no repositório [JohnGomes84/menswear-cad-suite](https://github.com/JohnGomes84/menswear-cad-suite). As questões #1–#5 bloqueiam a validação geométrica específica do `PILOT-001`; não bloqueiam a POC sintética genérica da Fase 1.5. A issue #6 acompanha o experimento, e a #7 coordena a revisão e mantém os gates separados.

| Issue | Escopo | Link |
|---:|---|---|
| #1 | Protocolo da medida de manga e fixture de 65 cm | [Issue #1](https://github.com/JohnGomes84/menswear-cad-suite/issues/1) |
| #2 | Semântica de `close_wrist` | [Issue #2](https://github.com/JohnGomes84/menswear-cad-suite/issues/2) |
| #3 | Margens de costura por aresta | [Issue #3](https://github.com/JohnGomes84/menswear-cad-suite/issues/3) |
| #4 | Matriz geométrica dos pontos 0–18 e frente/costas | [Issue #4](https://github.com/JohnGomes84/menswear-cad-suite/issues/4) |
| #5 | `SeamPair` e `AssemblyEase` da manga plana | [Issue #5](https://github.com/JohnGomes84/menswear-cad-suite/issues/5) |
| #6 | POC geométrica sintética e contratos experimentais | [Issue #6](https://github.com/JohnGomes84/menswear-cad-suite/issues/6) |
| #7 | Revisão integrada e GO/NO-GO separados | [Issue #7](https://github.com/JohnGomes84/menswear-cad-suite/issues/7) |

## 19. Evidência inicial da Fase 1.5

O primeiro protótipo foi publicado na branch `poc/phase-1-5-synthetic-geometry` e está em [PR #8 (rascunho)](https://github.com/JohnGomes84/menswear-cad-suite/pull/8). Ele cobre uma Bézier cúbica sintética, comprimento e posição por arco, piques, reversão, discretização, interseções, detecção de degeneração, offsets constantes auxiliares e exportação diagnóstica.

A rodada inicial passou em **14 testes**. A fixture de curva teve comprimento computacional de referência de aproximadamente **258,1271 mm**. O resultado e os sweeps são reproduzíveis em [`poc/geometry-synthetic/`](../poc/geometry-synthetic/), com análise detalhada em [`POC_REPORT.md`](../poc/geometry-synthetic/POC_REPORT.md). Esse comprimento é referência numérica da fixture, não solução analítica independente; as medições não definem tolerância de produção.

**Estado dos gates:** a autorização para executar a POC sintética está vigente; sua conclusão e aceitação por geometria/QA ainda estão **pendentes** (issue #7/PR #8). A validação do `PILOT-001` permanece **NO-GO** até resolver as pendências aplicáveis da seção 14.1. Código de produção e implementação web continuam bloqueados. PDF/SVG são apenas saídas diagnósticas; não houve impressão física nem aprovação industrial.
