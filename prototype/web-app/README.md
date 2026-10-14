# Web App — laboratório CAD sintético e pesquisa paramétrica CH02

**Status:** protótipo de engenharia, baseline **1.29 DRAFT**, **não** produto. Escopo do `GATE-APP-001`.

O app contém dois laboratórios separados: um editor de geometria sintética (curva Bézier artificial, viewport e JSON) e um workspace CH02 de pesquisa que executa o interpretador paramétrico já existente de Aldrich com fixtures de calça. Nenhum dos dois é um molde industrial. O workspace CH02 não contém bloco de camisa aprovado, `SeamPair`/`AssemblyEase` de produção, corte nem impressão industrial.

## Executar

Requer Node 22 ou compatível com Vite 7.

```bash
cd prototype/web-app
npm ci
npm run test
npm run build
npm run dev
```

A aplicação abre no endereço informado por Vite.

## Avisos de escopo

- `formatVersion: "0.1.0"` não é o schema definitivo de produção.
- Após reabrir o JSON, uma cadeia **linear e íntegra** de eventos `MOVE_CONTROL_POINT` é validada e permite reconstruir snapshots para undo/redo das coordenadas. A cadeia não pode ter revisões puladas ou eventos incompatíveis com as coordenadas atuais. Limitação: o formato 0.1.0 não persiste estados anteriores de validação; eles retornam a `NOT_YET_DEFINED` após undo reconstruído. Modos paramétricos com alterações próprias ainda não são suportados.
- O adaptador TypeScript calcula **comprimento e três marcas sintéticas por arco** diretamente da Bézier canônica em mm; o SVG apenas desenha. Isto **não** implementa costuras, piques funcionais nem qualquer bloco de camisa. O bloco real continua `NOT_YET_DEFINED`.
- Não faz persistência automática, autenticação, backend, telemetria nem exportação para corte.
- Os limites de importação são provisórios e não substituem revisão de segurança.
- As dependências diretas estão fixadas e o `package-lock.json` registra a árvore usada na CI; licenças/avisos das dependências transitivas ainda exigem auditoria antes de qualquer release. Bibliotecas do protótipo não ficam automaticamente aprovadas para produção.
- CI do app verifica unitários, TypeScript/Vite e E2E Chromium; os workflows não substituem validação de domínio, inspeção de artefatos nem prova física.

Documentos: `../../docs/gates/GATE-APP-001.md`, `../../docs/architecture/APP-FOUNDATION-001.md` e `../../docs/qa/QA-APP-001.md`.

## Experimento matemático em TypeScript

`src/geometry.ts` expõe avaliação de Bézier cúbica, comprimento de arco via integração adaptativa Simpson, inversão numérica da distância de arco, tangente e marcas sintéticas; nenhum método é específico de vestuário. A API falha explicitamente em entrada não finita, tangente indefinida ou orçamento de quadratura insuficiente.

`src/geometry.test.ts` verifica segmento 3-4-5, parábola com comprimento fechado, a curva sintética da POC Python (aprox. `258.1271065334 mm`), invariância por translação/escala/reversão e erros. A igualdade cruzada é testada contra **fixture estática**, não contra uma execução simultânea de Python. São critérios experimentais, sem garantia industrial de erro nem validação física.

## Histórico persistido (experimento)

`createEditor(importProject(file))` reconstitui a lista de edições passadas a partir dos eventos validáveis. Se o arquivo tiver histórico parcial, revisões incongruentes, coordenadas finais inconsistentes ou encadeamento inválido, sua leitura será bloqueada em vez de inventar snapshots. O histórico reconstruído é intencionalmente restrito aos comandos `MOVE_CONTROL_POINT` do modo `FREE`; histórico de constraints, regras, `PARAMETRIC_OVERRIDE` e estados pré-evento complexos exigirá schema novo.

## Cena 0.3 e testes Chromium

Menu **Editor multi-entidades**: criar/remover linhas e curvas, undo/redo com histórico persistido, salvar/abrir JSON 0.3.0 e converter 0.2 com confirmação. Arquivos 0.1 permanecem no laboratório legado. Com Node 22: `npm ci`, `npm test` para testes unitários, e `npx playwright install chromium` seguido de `npm run test:e2e` para testes reais de browser. Dependências de teste são apenas POC. Nenhum molde real é exportado.


## Constraints experimentais de uma etapa

`src/constraints.ts` contém projeções matemáticas **dirigidas** e independentes de peças de roupa: coincidir pontos, alinhamento horizontal/vertical e distância em mm, com falhas explícitas e ordenação topológica. No inspector da cena 0.3, selecione uma **linha FREE** e use `Alinhar H` ou `Alinhar V`. O resultado vira comando reversível `MOVE_POINT`.

**A constraint em si não é salva**, somente as coordenadas alteradas. Edições seguintes não recalculam vínculos. Resolver mais de uma constraint sobre o mesmo destino, tolerâncias de produção e persistência reativa exigem uma futura versão de projeto. Não é ferramenta de geração de moldes reais.


## Documento experimental de constraints 0.4 (motor, ainda sem UI)

`src/constrainedSceneV4.ts` registra regras `COINCIDENT/HORIZONTAL/VERTICAL/DISTANCE` como comandos persistidos, separando `driverEntities` de `resolvedEntities`. Após importação JSON `0.4.0`, o motor refaz os eventos e permite undo/redo. As projeções se atualizam após movimentar a origem de uma regra. O laboratório visível `SceneLab` **continua no esquema 0.3.0** e não expõe os novos comandos; não há migração silenciosa nem E2E de UI 0.4. Uma regra por destino, limite de 256 eventos, sem solver simultâneo ou moldes reais.


## Workspace de pesquisa paramétrica CH02 — baseline 1.29

Pelo botão **Construção Aldrich CH02**, é possível escolher `ONE_PIECE`/`TWO_PIECE`, variante `BASIC`/`EASY`, editar quadril/altura do gancho/entreperna em centímetros, alternar a vista entre frente e costas e inspecionar os comandos registrados, sua página e comprimento das retas. As coordenadas são recalculadas pelo interpretador existente; os testes confirmam a identidade das regras-fonte.

O workspace é `RESEARCH_ONLY`: as curvas continuam sem geometria, retas são somente os comandos textuais que foram auditados, margem por aresta permanece não mapeada, o espelhamento não é executado e o corte/exportação ficam desabilitados. A tela não gera camisa, molde pronto, PDF 1:1 nem saída de fabricação. A inspeção visual em browser não comprova caimento ou montagem física.

**Validação atual do workspace:** `npm test` — 182/182 unitários; `npm run build` — TypeScript/Vite PASS; `npm run test:e2e` — 10/10 Playwright Chromium, incluindo interações CH02 em desktop e viewport móvel de 390 px. O app web usa `vite@7.3.7` e `vitest@5.0.4`; `npm audit` reportou 0 vulnerabilidades no pacote do app na data da baseline. A integração FreeSewing fica em `prototype/integration-spike`, isolada do bundle do browser e com análise de dependências/licenças separada.
