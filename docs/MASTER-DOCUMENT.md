# Documento Mestre — Suíte CAD Paramétrica de Modelagem Masculina

**Versão da baseline:** 1.8 — propostas DRAFT de formalização do Gate B, diagnóstico CI/CD, SARIF e cache
**Data:** 13/10/2026  
**Status:** PR #15 está na `main`; a POC genérica segue em 14/14 testes. As decisões das Issues #1–#5 e o Gate B permanecem pendentes de aprovações de modelagem e QA específico. As propostas de cache, diagnósticos e SARIF registradas nesta versão não estão implementadas nem aprovadas para produção.
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

No PDF fornecido, o texto do bloco “The flat shirt block (woven fabrics)” aparece nas pp. 35–36; o diagrama está na p. 38. A regra de manga é descrita como “machined on the flat”. O texto informa margem de 1 cm incluída em trechos do bloco, com exceções marcadas; a bainha não recebe margem conforme a indicação do bloco.

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
| 1.5. Fechamento dirigido do domínio + POC geométrica sintética | Mecanismos genéricos do kernel, experimentos, medições e saídas diagnósticas | POC inicial incorporada à `main` pelo PR #8; 14 testes passaram também após o merge; revisão de engenharia/QA pendente |
| 2. POC geométrica específica do `PILOT-001` | Aplicação do kernel ao flat shirt após resolver regras de domínio e montagem | Bloqueada pelas pendências específicas da seção 14.1 |
| 3. Exportação piloto | Escala, PDF paginado/plotter, SVG e calibração física | Posterior à POC |
| 4. Implementação do piloto | Fluxo web de perfil a molde validado | Bloqueada até evidência técnica e prova |
| 5. Expansão | Calça, outros blocos, gradação, DXF e módulos especiais | Fora do piloto; gate próprio |
| 6. Distribuição | Privacidade, direitos, licenças, documentação e release | Posterior à validação |

### 14.1 Itens que bloqueiam a validação geométrica específica do `PILOT-001`

1. Revisar a proposta de usar `L-M` (ombro até abaixo do punho) para `one_piece_sleeve_length`: a fixture de 65 cm do flat shirt (PDF p. 35) produz `0–2 = 63 cm` pela regra da p. 36. Aprovar a postura operacional proposta e manter `A-L-N`/`shirt_sleeve_length` separado.
2. Revisar a proposta de mapear `close_wrist` como alias de `wrist_circumference` (medida `V`, logo acima do osso do punho). A regra woven flat shirt `2–4 = 1/2 × 17.8 + 5` produz `13.9 cm`; confirmar também a interpretação do segmento/centro antes de validar abertura acabada.
3. Revisar o mapa preliminar de margens por aresta, consolidado pelo PR #11 e baseado na regra geral da PDF p. 35 e no diagrama da PDF p. 38. A auditoria documental QA-MARG-001/002/003 passou; margens por aresta no motor seguem `NOT_RUN`, centros/dobras e junções `NOT_YET_DEFINED`.
4. Fechar a matriz de pontos/direções, curvas de cava/decote e correspondência frente/costas da Issue #4. A inspeção da p. 38 a 300 dpi sustenta coordenadas condicionais para 14–18 e um teste de consistência documental passou; isso não substitui aprovação de modelagem, curvas paramétricas, escolha de comprimento de camisa nem golden case.
5. Revisar a proposta DRAFT de contrato para `SeamPair`, `SeamSegmentPair` e `AssemblyEase` em `RESEARCH-ISSUE-5-SeamPair-AssemblyEase.md`. O rascunho distingue segmentos medidos em arco, ease por membro/trecho, tolerância física, erro numérico e provenance; nenhum piquê, valor, distribuição ou tolerância da manga está aprovado.
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

Revisar com modelagem as propostas das Issues #1/#2 e as classificações da Issue #3; o QA documental não substitui execução de margens no motor. Para #4, obter revisão do referencial e da leitura condicional, escolher comprimento de camisa e decidir curvas/centros/peças; a passagem da p. 121 sobre separar frente/costas é específica de manga raglan e não resolve o bloco plano. Para #5, revisar o contrato candidato e obter da modelagem a correspondência real dos trechos, piques, ease, distribuição e tolerâncias; não presumir igualdade total cava/cabeça nem converter o `+3 cm` de construção em ease. Nenhum resultado valida ainda o molde; código de produção permanece bloqueado.

---

## 17. Histórico de consolidação

Este documento substitui como fonte de verdade as minutas e relatórios separados produzidos anteriormente. A versão 1.7, integrada pelo PR #14, registra o cross-check da Issue #4 (a separação frente/costas em PDF p. 121 pertence à adaptação raglan) e uma proposta DRAFT de contrato `SeamPair`/`AssemblyEase`, com casos QA ainda `NOT_RUN`; não aprova molde nem fecha issues/gates. A versão 1.6 registra o PR #13 integrado, o refinamento documental da matriz da Issue #4 com leitura a 300 dpi da p. 38, a consistência condicional dos pontos 14–18 e a auditoria inicial da Issue #5. A versão 1.5 registra o merge do mapa preliminar da Issue #3 e os resultados limitados da auditoria QA documental. A versão 1.4 registrou o mapa preliminar da Issue #3; a versão 1.3 registrou a pesquisa das medidas das Issues #1/#2, mesclada pelo PR #10 e ainda pendente de revisão de modelagem. A versão 1.2 registrou a incorporação da POC inicial à `main`. Versões anteriores podem ser guardadas como histórico, mas decisões repetidas ou escopos antigos não prevalecem sobre esta baseline. Qualquer mudança futura deve atualizar este documento e registrar a revisão correspondente.


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

O primeiro protótipo foi incorporado à `main` por squash no [PR #8 (mesclado)](https://github.com/JohnGomes84/menswear-cad-suite/pull/8). Ele cobre uma Bézier cúbica sintética, comprimento e posição por arco, piques, reversão, discretização, interseções, detecção de degeneração, offsets constantes auxiliares e exportação diagnóstica.

A rodada inicial e a execução após o merge passaram em **14 testes** cada, usando ambiente virtual limpo. A suíte foi reexecutada em `main` durante a revisão dos PRs #10 e #11 e passou em **14/14 testes** em cada rodada. A execução após o PR #11 não altera o escopo: offsets testados continuam sintéticos/globais, não margem por aresta do molde. A fixture de curva teve comprimento computacional de referência de aproximadamente **258,1271 mm**. Dois runs consecutivos produziram hashes SHA-256 idênticos para os artefatos JSON, SVG e PDF no ambiente/fixture atual. O resultado e os sweeps estão em [`poc/geometry-synthetic/`](../poc/geometry-synthetic/), com análise detalhada em [`POC_REPORT.md`](../poc/geometry-synthetic/POC_REPORT.md). Esse comprimento é referência numérica da fixture, não solução analítica independente; as medições não definem tolerância de produção.

**Estado dos gates:** o protótipo da POC sintética está incorporado à `main`, mas sua conclusão e aceitação por geometria/QA ainda estão **pendentes** (issue #7). A validação do `PILOT-001` permanece **NO-GO** até resolver as pendências aplicáveis da seção 14.1. Código de produção e implementação web continuam bloqueados. PDF/SVG são apenas saídas diagnósticas; não houve impressão física nem aprovação industrial.


## 20. Pesquisa dirigida — Issues #1 e #2

A pesquisa localizou no livro a correspondência do protocolo `L-M` com a entrada `Sleeve length one-piece sleeve = 65 cm` do bloco woven flat shirt (PDF pp. 35 e 261). A regra de construção da manga é `0–2 = sleeve length − 2 cm`, portanto a fixture gera `63 cm` (`630 mm`). O protocolo `A-L-N` para manga de camisa usa braço elevado e dobrado e continua independente.

Para punho, foi proposta a medida corporal canônica `wrist_circumference` (medida `V`, logo acima do osso do punho) e um alias de regra `close_wrist`. Com o exemplo `17.8 cm`, a regra específica da camisa plana `2–4 = 1/2 × close_wrist + 5 cm` produz `13.9 cm` (`139 mm`). O livro não declara literalmente a equivalência dos rótulos; por isso o alias e a postura operacional de `L-M` aguardam aprovação de modelagem. `13.9 cm` é o segmento 2–4 do desenho, não o valor da medida corporal nem automaticamente uma circunferência de cuff acabado. Não importar a regra diferente `+3/+3.5 cm` do bloco de jersey.

Registro detalhado, fixture e fontes estão em [`RESEARCH-ISSUES-1-2-Sleeve-and-Wrist.md`](domain/RESEARCH-ISSUES-1-2-Sleeve-and-Wrist.md). A SPEC, o formato proposto e a QA recebem os mesmos resultados esperados, identificados como pendentes/`NOT_RUN`. As Issues #1/#2 permanecem abertas; esta pesquisa não altera o estado NO-GO do Gate específico do `PILOT-001`.

## 21. Issue #3 — mapa preliminar e resultados QA de margens

A p. 35 do PDF estabelece 1 cm de margem de costura incluído no bloco, salvo indicação contrária. O diagrama do `Flat shirt block` está na p. 38 (não na p. 36, como constava na Issue #3). O mapa de 11 trechos do corpo e da manga registra como preliminares o default incluído no ombro, cava, lateral, cabeça e costura inferior da manga; as chamadas sem margem no decote e trecho 0–1; as barras sem margem de bainha; e os centros/dobras sem offset assumido. A dimensão 2–4 da manga é uma medida de construção, não margem.

O mapa deixa explícito que “1 cm incluído” **não** autoriza aplicar outro offset sobre a mesma linha. Ainda não decide qual traço é linha líquida ou contorno de corte, se a chamada do decote cobre ambas as curvas, nem se as linhas centrais implicam dobra, corte em par ou outra construção. O tratamento dos encontros e cantos também permanece `NOT_YET_DEFINED`. Não aplicar margens em produção antes da revisão de modelagem.

Na auditoria documental de 2026-10-13, QA-MARG-001 (cobertura dos 11 trechos), QA-MARG-002 (regra contra dupla aplicação) e QA-MARG-003 (mapeamento das exceções zero) passaram **somente como conferência da documentação**. A suíte genérica da POC passou em 14/14 testes, mas não usa o mapa do vestuário. O código ainda não implementa margens por aresta nem separação executável `seam_geometry`/`cut_geometry`; QA-MARG-002/003/006 de motor permanecem `NOT_RUN`; QA-MARG-004/005 permanecem `NOT_YET_DEFINED`. A Issue #3 continua aberta e a saída para corte bloqueada.

O mapa consolidado está em [`RESEARCH-ISSUE-3-Seam-Allowance-Map.md`](domain/RESEARCH-ISSUE-3-Seam-Allowance-Map.md), integrado pelo [PR #11](https://github.com/JohnGomes84/menswear-cad-suite/pull/11). A matriz de estados e o registro de execução estão em [`QA-PILOT-001.md`](qa/QA-PILOT-001.md).

## 22. Pesquisa inicial — Issue #4, matriz geométrica dos pontos 0–18

A transcrição das instruções das pp. 35–36 e do diagrama da p. 38 está em [`RESEARCH-ISSUE-4-Point-Matrix.md`](domain/RESEARCH-ISSUE-4-Point-Matrix.md). Para a fixture publicada, `1–2=284 mm`, `1–3=442 mm`, `2–5=315 mm`, `1–9=74 mm`, `11–12=150 mm`, `1–15=27,5 mm` e `1–18=60 mm`; o comprimento da camisa é variável.

A inspeção da p. 38 a 300 dpi sustenta a leitura condicional `P14=(150,0)`, `P15=(0,57.5)`, `P16=(150,57.5)`, `P17=(165,57.5)` e `P18=(0,90)` mm sob `+x` à direita/`+y` para baixo. Um teste Python interno passou nos cálculos e nas relações de projeção (`PASS_DIAGRAM_CONSISTENCY`). QA-POINT-001 é aritmético; QA-POINT-002/003 são `PASS_DOC`; o motor permanece `NOT_RUN`. Controles de curva, comprimento de camisa, construção frente/costas e revisão de modelagem continuam pendentes; a Issue #4 permanece aberta.


## 23. Auditoria de especificação — Issue #5 (`SeamPair`/`AssemblyEase`)

A Issue #5 está aberta e tem critérios de aceite claros: membros e orientação das arestas parceiras; correspondência por segmentos/piques; comprimentos paramétricos; regra de ease por trecho; tolerâncias; provenance; testes para reversão, alteração de curva e ease não definida; e aprovação de modelagem com evidência de montagem adequada. A regra publicada da manga diz `0–3 = diagonal corporal 5–17 + 3 cm` e descreve marcações/ajustes da cabeça da manga, mas não especifica uma igualdade total entre cava e cabeça nem uma distribuição aprovada de ease. O `+3 cm` é uma dimensão de construção declarada no livro; não deve ser rotulada automaticamente como `AssemblyEase`.

A auditoria dos documentos atuais encontrou `SeamPair` apenas listado como entidade de domínio em GEOM-001 e descrito conceitualmente no Documento Mestre. PROJECT-FORMAT-001 ainda é um esquema genérico em DRAFT e não estrutura pares, orientação, correspondência por segmentos, tolerância, provenance ou `AssemblyEase`. QA-PILOT-001 lista testes amplos de orientação reversa e piques, mas não contém ainda uma matriz dedicada de aceitação da Issue #5. Portanto, o escopo da issue é pertinente, mas o contrato ainda não está especificado nem pronto para implementação; não converter comprimentos totais em PASS/FAIL automático antes de uma regra aprovada.


## 24. Handoff de continuidade

O registro operacional completo de estado, decisões, testes, issues, PRs, lacunas e sequência recomendada está em [`HANDOFF-2026-10-13.md`](HANDOFF-2026-10-13.md). Leia-o junto desta fonte de verdade antes de retomar a pesquisa ou alterar código.


## 25. Issue #5 — contrato candidato de costuras parceiras

O estudo [`RESEARCH-ISSUE-5-SeamPair-AssemblyEase.md`](domain/RESEARCH-ISSUE-5-SeamPair-AssemblyEase.md) transforma os critérios da Issue #5 em uma proposta técnica DRAFT. Ela separa `SeamPair` (duas arestas de costura orientadas) de `SeamSegmentPair` (trechos correspondidos por marcos/piques) e de `AssemblyEase` (diferença intencional por trecho). Comprimentos são calculados na curva paramétrica da linha de costura, em distância de arco; margem/linha de corte ficam fora dessa medida.

O contrato candidato requer orientação explícita, limites correspondentes, provenance e invalidação após mudança de curva ou pique. Ease ausente e tolerância física não definidas permanecem `NOT_YET_DEFINED`, nunca zero. Erro numérico do integrador, excesso-alvo de ease e tolerância de montagem são conceitos distintos. A comparação local por segmento não pode ser substituída pela igualdade dos comprimentos totais.

A regra do livro `0–3 = diagonal corporal 5–17 + 3 cm` define um segmento reto de construção da cabeça da manga; não fornece o comprimento de arco da cabeça montada, piques, distribuição de ease ou tolerância. QA-SEAM-001…006 e QA-EASE-001…004 foram especificados, mas permanecem `NOT_RUN` porque o motor atual não implementa o contrato. A Issue #5 segue aberta até modelagem/produção aprovar os dados e haver evidência de montagem.


A proposta documental da versão 1.7 foi integrada na `main` pelo [PR #14](https://github.com/JohnGomes84/menswear-cad-suite/pull/14); a Issue #5 permanece aberta para revisão e decisões de modelagem.


## 26. Formalização proposta do Gate B, diagnósticos CI/CD e cache (baseline 1.8 DRAFT)

**Estado normativo:** esta seção consolida propostas discutidas em 13/10/2026. Ela não aprova decisões de modelagem, não fecha Issues #1–#5, não altera critérios já aceitos sem revisão e não autoriza implementação de produção. O Gate B permanece NO-GO. A aprovação deve ser registrada por decisão/revisão rastreável e evidência QA; `NOT_RUN` e `NOT_YET_DEFINED` nunca contam como PASS.

### 26.1 Matriz consolidada de fechamento das Issues #1–#5

| Issue | Decisão que deve ser formalmente aprovada | Evidência e QA para aceite |
|---|---|---|
| #1 — comprimento da manga | Aprovar se `L-M` corresponde a `one_piece_sleeve_length`; protocolo operacional completo (marcos, postura, trajeto, unidade); manter `shirt_sleeve_length` (`A-L-N`) separado; aceitar fixture `650−20=630 mm`, com 20 mm como construção, não ease. | Rationale e referência Aldrich, PDF pp. 35–36 e 261; atualizar SPEC/perfil/formato/QA; executar QA-MEAS-001, 003 e 006. Alternativas não aprovadas ficam fora de uso. |
| #2 — `close_wrist` | Aprovar/rejeitar alias a partir de `wrist_circumference`; protocolo e unidade; interpretação do segmento 2–4, centro e espelhamento; manter medida corporal, dimensão do molde e cuff acabado distintos. Fixture candidata `178/2+50=139 mm`; `+50 mm` é constante construtiva, não ease presumida. | Rationale e referência Aldrich, PDF pp. 35–36, 39 e 261; atualizar SPEC/formato/QA; executar QA-MEAS-002, 004, 005 e 006. Campo não aprovado permanece `NOT_YET_DEFINED`. |
| #3 — margens por aresta | Aprovar classificação de cada um dos 11 trechos; linha líquida versus corte; abrangência de exceções; centros/dobras; cantos/terminais; separar `seam_geometry` de `cut_geometry`; impedir margem duplicada. | Referência Aldrich, PDF pp. 35–36 e 38; ledger de auditoria completo; executar QA-MARG-001–006 no motor. `PASS_DOC` não substitui teste geométrico. |
| #4 — matriz/curvas | Aprovar ou corrigir referencial e pontos condicionais; escolher comprimento da camisa; definir fitting line, curvas/tangências paramétricas e construção de centro/frente/costas. | Rationale e referências Aldrich, PDF pp. 35–36 e 38; congelar golden case após revisão; executar QA-POINT-004/005 e regressão do bloco real. Não transpor instrução raglan da p. 121 ao bloco plano. |
| #5 — `SeamPair`/`AssemblyEase` | Aprovar arestas membros, orientação, piques/marcos, segmentação, ease ou `NONE_APPROVED` por trecho, membro, quantidade, distribuição, tolerância física, estados e invalidação. `+3 cm` da diagonal 5–17 não define ease. | Rationale e referência Aldrich, PDF p. 36; schema/contrato versionado; testes QA-SEAM-001–006 e QA-EASE-001–004; evidência de montagem em papel/toile apropriada. |

Para cada decisão aprovada, conservar `decisionId`, Issue/critério, decisão e regra/valor, unidades, fonte (livro/edição/página/figura), rationale, revisor e papel, data, evidências (PR/commit/teste/toile) e vínculo à decisão substituída. Estados `PROPOSED`, `APPROVED`, `REJECTED` e `NOT_YET_DEFINED` representam decisões; `NOT_RUN`, `PASS`, `FAIL` e `WARNING` representam execução/QA e não devem ser colapsados.

A declaração de Gate B exige critérios #1–#5 fechados quando aplicáveis, golden case, QA integrado e evidência física definida no plano; não equivale ao fechamento documental. As Issues #6/#7 e os gates de geometria/QA continuam com seu próprio processo de aceitação.

### 26.2 Auditoria final da Issue #3 — 11 trechos e política de junções

O ledger deve registrar, em cada linha: peça/aresta/endpoints; origem Aldrich; classificação/estado; linha de costura e linha de corte; largura e origem da margem; exceção; terminais/cantos e arestas adjacentes; decisão, revisores/data e rationale; QA e evidência. Os 11 trechos são: (1) decote do corpo; (2) centro do corpo 0–4; (3) ombro 10–17; (4) cava 17–12–5; (5) lateral 5–7–8; (6) barra 4–8; (7) cabeça da manga 3–5–6–7–8–0; (8) costura inferior 3–4; (9) manga 0–1; (10) centro 1–2; (11) bordo inferior 2–4.

Pendências específicas: confirmar a aplicação da chamada `no seam allowance` no decote; identificar linha líquida versus contorno de corte; decidir se centros representam dobra, abertura, eixo ou costura; tratar terminações sem acrescentar margem de bainha às barras indicadas; especificar encontros ombro/decote, ombro/cava, cava/lateral, lateral/barra e cabeça/underarm.

**Proibição de compensação silenciosa:** não fazer snap, prolongamento, aparo, mitra, arredondamento, junção por offset global ou escolha de interseção sem política aprovada. A linha de costura deve permanecer preservada; uma junção sem regra deve emitir diagnóstico estruturado (`JOIN_POLICY_MISSING` ou código mais específico aprovado), manter o estado bloqueado e impedir exportação de geometria de corte. A classificação de valores e as políticas de canto ainda requerem decisão; opções geométricas descritas em pesquisa não são padrão implícito.

Plano de QA: QA-MARG-001 confere cobertura/classe/proveniência; QA-MARG-002 proíbe offset duplicado sobre margem já incluída; QA-MARG-003 testa exceções sem margem/bainha; QA-MARG-004 cobre centro/dobra e duplicação; QA-MARG-005 exige política aprovada ou erro explícito em junções; QA-MARG-006 valida caminhos independentes `seam_geometry`/`cut_geometry` e largura/origem por aresta. Casos positivos e negativos devem ser executados no motor; revisão documental sozinha não passa esses testes.

### 26.3 Diagnósticos canônicos e projeção SARIF

Manter JSON canônico do produto, separado da exportação SARIF. Campos mínimos propostos: `schemaVersion`, metadados do run (tool/version, commit, Gate, operação e status), `diagnostics[]`; cada diagnóstico contém ID determinístico, `code`, `severity`, `status`, chave/texto de mensagem, localização/JSON Pointer quando real, referências de entidades, bloqueios/preservações, e proveniência/regra. O código é estável e independente de idioma; texto não deve ser usado como chave por automação.

Para `JOIN_POLICY_MISSING`, a operação de corte fica `BLOCKED`; registrar as arestas/peça, localização existente, política ausente e artefatos bloqueados. Preservar `seam_geometry`; não fabricar `cut_geometry`. Erro de domínio não deve ser confundido com exceção interna do servidor.

A projeção para interoperabilidade usa SARIF 2.1.0: `$schema`, `version`, `runs[]`, `tool.driver` e regra declarada em `tool.driver.rules[]`; resultado contém `ruleId`, `ruleIndex` quando emitido, `level`, `message.text`, `locations` com URI/region reais quando disponíveis, `partialFingerprints` quando há localização estável e `properties` para metadados CAD. `invocations[].executionSuccessful` descreve execução da ferramenta, não aprovação do Gate. O CI publica JSON/SARIF e resumo; resultado bloqueante da operação solicitada bloqueia o artefato correspondente. Para GitHub Code Scanning, não inventar caminho/linha: findings sem localização de arquivo permanecem no JSON canônico/relatório próprio, pois o consumidor requer localização física para exibir resultado. Validar contra schema e regras de ingestão do consumidor.

Referências normativas: [OASIS SARIF 2.1.0](https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html) e [regras SARIF do GitHub Code Scanning](https://docs.github.com/en/code-security/reference/code-scanning/sarif-files/sarif-support).

### 26.4 Comprimento de arco e chaves de cache do `SeamPair`

O comprimento canônico de um intervalo é `L(a,b)=∫_a^b ||C'(t)||dt` na curva paramétrica da linha de costura. O comprimento não deve vir da tesselação de visualização. A POC usa Simpson adaptativo em Bézier cúbica, mas retorna apenas um número e seu `eps_mm` padrão é experimental, não uma tolerância física nem contrato aprovado.

A proposta de interface retorna `length_mm`, estimativa de erro, convergência, `algorithm_id/version`, parâmetros efetivos, fingerprint/revisão de curva, intervalo, orientação e unidade/referencial. Rejeitar explicitamente curva/intervalo inválido e não convergência; não marcar aproximação como válida. Dividir curvas compostas nas junções; para piques por distância de arco, resolver o parâmetro correspondente e mapear reversão sem ambiguidade. Testar reta exata, independência da tesselação, reversão, aditividade, inversão arc-length↔parâmetro, convergência ao apertar precisão, degeneração e invalidação. Comparação com subdivisão Bézier por corda/polígono de controle pode atuar como oráculo independente.

Separar cache geométrico do cache de avaliação:

```text
ArcLengthCacheKey = hash(
  cacheKeyFormatMajor,
  canonicalCurveFingerprint + curveRevision,
  curveType/controlPoints/knots/weights/domain,
  interval + orientation,
  unit + coordinateFrame,
  algorithmId + algorithmVersion,
  effectiveNumericalParameters
)

SeamEvaluationKey = hash(
  evaluationKeyFormatMajor,
  memberEdges + revisions + segmentMapping + markerRevisions,
  arcLengthResultKeys,
  easeDecision + distributionPolicy + versions,
  assemblyTolerance + policyVersion,
  validationRuleVersion
)
```

Mudança de geometria, intervalo, orientação, pique, algoritmo ou parâmetro numérico relevante invalida o comprimento afetado e sua avaliação dependente. Mudança de ease/distribuição/tolerância invalida a avaliação, não necessariamente o comprimento. Mudança minor/patch pode reutilizar resultado somente com compatibilidade documentada e parâmetros efetivos equivalentes; mudança semanticamente incompatível incrementa namespace/versão do algoritmo ou formato. Se equivalência não for demonstrável, fazer miss e recalcular. Alias/migração de metadados só preserva valor quando sua interpretação não muda. A versão do produto não deve, sozinha, invalidar todos os caches.

### 26.5 Testes propostos para diagnóstico, SARIF e cache

**Unitários de diagnóstico/junção:** ausência de política emite código estável e bloqueio; nenhuma correção geométrica silenciosa; `seam_geometry` permanece; saída de corte bloqueada; IDs/localização/proveniência coerentes; ordem/deduplicação determinísticas; mensagens localizadas não mudam regra; política aprovada resolve o achado; política inválida produz erro; múltiplas junções relatadas sem perda.

**Unitários de serialização SARIF:** schema 2.1.0; `ruleId` declarado e `ruleIndex` consistente; nível/mensagem/location válidos; URI determinístico; fingerprint estável; propriedades de domínio preservadas; `executionSuccessful` independente de Gate; ausência de localização física não é mascarada com dado inventado. Validar arquivo contra schema e validador/ingestão do consumidor.

**Unitários de cache:** chave idêntica para entradas idênticas; mudanças separadamente em geometria, domínio/controles, revisão, intervalo, orientação, unidade/referencial, algoritmo e parâmetros causam miss; parâmetros irrelevantes não causam invalidação; atualização minor compatível pode reutilizar; atualização incompatível não reutiliza sem migração/equivalência; changes semânticos de ease/tolerância invalidam apenas avaliação; degeneração/não convergência não são armazenadas como resultado válido.

**Integração CI/CD:** cache hit e miss; alteração de curva/pique invalida trechos dependentes; ease/tolerância mudadas reutilizam comprimento e recalculam avaliação; `JOIN_POLICY_MISSING` ao pedir corte bloqueia o artefato e publica JSON/SARIF; SARIF malformado ou regra não declarada falha a etapa de relatório (não resulta em “zero findings”); diagnóstico resolvido após decisão aprovada desaparece no novo run sem apagar histórico; códigos e fingerprints permanecem estáveis entre idioma e commits semânticos equivalentes.

### 26.6 Pendências para promover esta proposta

Ainda dependem de revisão: regra/modelagem e tolerâncias para cada medida, ponto, margem e costura; políticas de junção; algoritmo e parâmetros numéricos de produção; estimador/limite de erro; schema canônico de diagnósticos; versão de chave/formato e compatibilidade; convenções SARIF e gates CI. Os testes acima estão **propostos, não implementados/executados**, salvo a POC sintética preexistente. Nenhum elemento desta seção fecha Issues #1–#5, aprova Gate B ou libera exportação industrial.
