# RESEARCH-CH02-FLAT-TROUSERS-001 — Auditoria textual inicial

**Fonte verificada:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª ed. (2011), capítulo 2, **páginas 31–34 do PDF fornecido**.  
**Escopo:** `ALD-CH02-01` — blocos de calça em construção *flat* para tecidos planos e malhas.  
**Evidência:** texto das páginas lido. **Desenhos técnicos NÃO verificados visualmente nesta rodada.**  
**Estado:** `TEXT_REVIEWED` / `DIAGRAM_PENDING` / `GEOMETRY_NOT_APPROVED` / `PHYSICAL_NOT_RUN`.

## 1. Dois métodos distintos confirmados pela fonte

| Candidato | Uso e topologia indicados pelo texto | Estado |
|---|---|---|
| `FLAT-TROUSER-ONE-PIECE` | Bloco de uma peça; frente e costas construídas separadamente, depois justapostas/espelhadas para eliminar uma costura lateral | Texto lido; contornos/espelhamento pendentes de diagrama |
| `FLAT-TROUSER-TWO-PIECE` | Bloco de duas peças com modelagem de perna mais definida, apropriado a peças esportivas | Texto lido; contornos/espelhamento pendentes de diagrama |

O capítulo aborda tecidos planos e jersey, calças simples e produtos casuais/funcionais. Há **duas graduações de folga construtiva** em parte das medidas: configuração básica e alternativa mais folgada. Não tratar qualquer uma como ajuste anatômico aprovado sem prova física.

## 2. Entradas e pressupostos da amostra

| Entrada | Exemplo textual (tamanho MEDIUM) | Contrato candidato |
|---|---:|---|
| `seat` — circunferência do quadril/assento | 102 cm | 1020 mm |
| `body_rise` — altura do gancho do corpo | 28,2 cm | 282 mm |
| `inside_leg` — comprimento interno da perna | 80 cm | 800 mm |

A base foi concebida para ter a borda superior aproximadamente **2–4 cm acima da linha convencional da cintura da calça**, com possibilidade de ajuste por adaptação. Há **1 cm de margem de costura incluído**, salvo exceções especificadas. Não adicionar automaticamente 10 mm às linhas sem identificar qual contorno já os contém.

O protocolo antropométrico e as origens reais dessas três medidas deverão ser associados às convenções do capítulo 1 e de medições individuais no capítulo 13 antes de uso real.

## 3. Subconjunto matemático conferido no texto

A tabela resume somente **distâncias escalares**, para permitir teste aritmético sem presumir coordenadas x/y ou direção de construção. Convenção A = bloco básico; B = variação folgada. São etiquetas de engenharia, não nomenclatura editorial.

| Relação de construção | Expressão interpretada (mm) | Fixture A | Fixture B |
|---|---|---:|---:|
| 0→1 | body_rise + 20 / +40 | 302 | 322 |
| 1→2 | inside_leg | 800 | 800 |
| 1→3 | (1→2)/2 | 400 | 400 |
| 1→4 | seat/4 + 40 / +80 | 295 | 335 |
| 4→8 | (1→4)/4 − 5 / +5 | 68,75 | 88,75 |
| 2→9 (uma peça) | 2×(1→4)/3 + 20 / +25 | 216,666… | 248,333… |
| 1→9 (duas peças) | (1→4)/2 + 10 | 157,5 | 177,5 |

Outras relações do método dependem de desenho (linhas auxiliares, interseções, pontos e curvas), incluindo junções de frente/costas, gancho, entreperna e orientações. **Não inferi coordenadas ou sentido dos eixos a partir de uma leitura textual isolada.**

## 4. Dependências e riscos para o futuro DraftRuleSet

- Identificar origin `0`, sentido das linhas auxiliares, bases horizontal/vertical e projeções por *square*.
- Reconstruir separadamente a frente e as costas em ambos os blocos; não colapsar desenho de uma peça com o de duas peças.
- Identificar qual contorno representa **linha de costura e linha de corte**, aresta lateral eventual, dobra e espelhamento.
- Definir tangências e pontos de controle para curvas do gancho, lateral e entreperna sem tomar aproximação visual como geometria aprovada.
- Estabelecer *ease* de quadril/assento e função de tecido/uso por variante.
- Validar simetria, entrepernas e comprimentos funcionais de costura e registrar `SeamPair`/pences quando aplicável.
- Verificar o método visualmente no PDF e depois submeter a modelista e prova de papel/toile; **nenhuma dessas etapas foi executada**.

## 5. Relevância arquitetural

A calça exige **blocos inferior, linhas de gancho, costura interna/externa, relações de perímetro e opções com/sem costura lateral**. Ela serve como contraprova do requisito de produto multi-famílias, impedindo que o kernel ou o formato nativo dependam de conceitos exclusivos de camisas/cavas.

A auditoria textual não autoriza modelagem real, fórmulas completas, arquivo STEP/DXF para produção, prova de vestibilidade ou promoção do Gate B do `PILOT-001`.

**Próxima ação vinculada:** [Issue #44](https://github.com/JohnGomes84/menswear-cad-suite/issues/44) — revisão de páginas/diagramas, protocolos, matriz de pontos e golden fixture do bloco de calça.
