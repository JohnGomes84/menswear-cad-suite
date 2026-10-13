# APP-FOUNDATION-001 — Contrato de arquitetura para iniciar a aplicação web

**Estado:** APPROVED_FOR_EXPERIMENTAL_APP_FOUNDATION — 13/10/2026  
**Autoridade:** decisão de engenharia reversível, não aprovação de regra de modelagem, impressão para corte ou produto comercial.  
**Fonte de verdade:** `docs/MASTER-DOCUMENT.md` e ADR-0003.

## 1. Decisão de plataforma e fronteiras

A fundação experimental da aplicação poderá ser construída independentemente do fechamento dos detalhes de modelagem do `PILOT-001`, desde que utilize **somente projetos e geometrias sintéticas**, claramente identificados como demonstração técnica.

| Decisão | Escolha inicial | Justificativa e limite |
|---|---|---|
| Plataforma | Browser/web | Já aprovado pelo produto |
| Linguagem da aplicação | TypeScript em modo strict | Entidades/contratos/unidades explicitamente tipados |
| UI | React | Estado e composição de ferramentas de editor; decisão técnica reversível |
| Build local | Vite | Iteração e testes do protótipo; não fixa hospedagem |
| Desenho CAD inicial | SVG vetorial controlado | Curvas, pontos, piques e zoom; sem torná-lo fonte de verdade |
| Geometria canônica no app | Módulo independente da renderização | Zoom/pan nunca alteram comprimento ou pontos |
| Persistência protótipo | Importar/exportar arquivo JSON local | Não exige autenticação ou servidor; backend/IndexedDB serão decididos depois |
| Testes | Unitários de domínio/contratos, interação e regressão de fixtures | Sem usar resultados de teste como validação de vestuário |
| Unidades | mm nas entidades; cm na interface | Conversão explícita e testada, sem arredondamento prematuro |
| Estágio | Protótipo técnico isolado | Sem dados pessoais obrigatórios, backend, produção ou comercialização |

As dependências específicas do front-end serão registradas em SBOM quando instaladas, com versões/licenças verificadas. Não confundir biblioteca de renderização e kernel geométrico.

## 2. Fronteiras e contrato de integração

O protótipo utilizará interfaces internas com IDs estáveis, entidades imutáveis quando conveniente e versionamento explícito:

- `CADProject`: `formatVersion`, `projectId`, `unit: 'mm'`, `sourceMode`, `geometry`, `rules`, `history`, `validation`.
- `GeometryRecord`: `id`, `kind`, `controlPointsMm` / referências, `revision`, `origin`, `editMode`.
- `GeometryAdapter`: avaliar curva, comprimento em mm, ponto por distância de arco, orientações, tesselação diagnóstica e erros explícitos.
- `EditCommand`: `id`, `type`, `beforeRevision`, `payload`, `undoPayload`, `dependencies`.
- `ValidationFinding`: `code`, `level`, `entityRefs`, `source`, `state`, `message`, `evidence`.
- `ExportManifest`: `projectHash`, `units`, `geometryVersion`, `exporterVersion`, `status`, `diagnosticOnly`.

Os campos acima são um **contrato mínimo preliminar de interoperabilidade** e não são o schema aprovado de todos os moldes. O schema de projeto de produção permanece em `PROJECT-FORMAT-001`, DRAFT. Um `schemaVersion` de protótipo (ex.: `0.x`) deve ser diferente de qualquer versão de formato de produção.

### 2.1 Ponte Python → TypeScript

A POC numérica existente está em Python, mas a aplicação web inicial será TypeScript. Ela **não poderá simplesmente importar o arquivo Python** nem assumir que copiar uma fórmula gera resultados numericamente equivalentes.

Para qualquer `GeometryAdapter` TS, será obrigatório:

1. criar fixtures sintéticas e resultados de referência versionados, com origem e erro observado;
2. rodar o mesmo conjunto de entradas no experimento Python e no módulo TS;
3. comparar coordenadas, comprimentos, orientação, piques e estados de falha;
4. reportar não convergência sem inventar precisão;
5. manter a projeção SVG completamente separada da avaliação geométrica.

O arquivo SVG/PDF é **saída**, nunca fonte da geometria editável.

### 2.2 Modos de edição

- `PARAMETRIC`: o valor depende da regra.
- `PARAMETRIC_OVERRIDE`: conserva referência da regra, delta/restrição e origem.
- `FREE`: desvinculação expressa, com registro da geometria anterior.

A aplicação não pode converter `PARAMETRIC` em `FREE` por arraste silencioso. Toda alteração recalcula/invalida dependências e pode ser revertida transacionalmente.

### 2.3 Segurança e privacidade

- Sem telemetria de medidas pessoais, contas, autenticação, uploads ou integração externa no primeiro protótipo.
- Projetos de demonstração usam somente valores inventados. A aplicação mostra o aviso **“Geometria sintética: não é molde para corte”**.
- Não executar expressões de regra por `eval` ou executar JavaScript vindo de arquivo de projeto; AST/DSL tipada com parser validado.
- JSON importado é validado por schema e versão antes de hidratar estado ou renderizar.
- Não enviar livros protegidos, datasets, scans e figuras para o repositório público.

## 3. Requisitos de UX do primeiro protótipo

1. Quadro SVG com grade, zoom, pan e sistema de coordenadas em mm.
2. Listagem de entidades e painel de propriedades que não misturem unidade interna e de interface.
3. Seleção de ponto/curva; edição `FREE` com undo/redo; `PARAMETRIC` deve bloquear edição destrutiva ou pedir escolha de override/desvinculação.
4. Inspeção de comprimento e pique genérico sintético por arco — com diagnóstico `PASS/FAIL/NOT_RUN/NOT_YET_DEFINED`.
5. Salvar/reabrir projeto JSON sintético, mantendo IDs e histórico; nenhum export de corte.
6. Visão de validação que diferencie `PASS_CI` da POC geométrica e `NOT_YET_DEFINED` do bloco real.
7. Links de rastreabilidade ao Documento Mestre e às issues aplicáveis.

## 4. Não objetivos explícitos da fundação

- Gerar camisa real do livro ou usar coordenadas condicionais da Issue #4 como molde aprovado.
- Inferir `AssemblyEase` ou piques de cava e manga.
- Calcular margem por aresta específica do bloco antes de validar linha de costura/corte.
- Login, banco remoto, pagamentos, perfis antropométricos reais, DXF, nesting, gradação, 3D.
- Alegar precisão de impressão física sem medição.

## 5. Gate de implementação do protótipo

Para começar a **fundação experimental web** é necessário registrar ADR-0003 e este contrato, preservar a fonte da geometria, abrir testes do formato e isolar fixtures sintéticas. Esses itens **não exigem fechar as Issues #1–#5**. A integração do `PILOT-001` e a implementação de produto permanecem bloqueadas pelo Gate B.

A próxima entrega deve ser um protótipo pequeno em branch dedicada, com CI, um fluxo de edição reprodutível, importação/exportação JSON sintético e sem contas. O código só será promovido para produção depois dos gates e da revisão de licença.
