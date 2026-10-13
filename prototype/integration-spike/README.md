# FreeSewing — prova de integração vertical (somente pesquisa)

**Estado:** POC isolada, **NÃO APTA PARA CORTE**.  
**Método de origem:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª ed., capítulo 2 (texto PDF pp. 32–33; diagrama p.34).  
**Tecnologia existente efetivamente executada:** `@freesewing/core@4.0.0`, com `Point` e `Path`.  
**Não é:** implementação do Titan, editor de moda, peça completa, PDF de plotter ou prova física.

## Encadeamento que a CI verifica

1. **Medidas:** `seatMm`, `bodyRiseMm`, `insideLegMm` em mm, variantes `BASIC`/`EASY` e métodos `ONE_PIECE`/`TWO_PIECE`.
2. **Receita da obra:** o código existente de `prototype/web-app/src/aldCh02FlatTrouser[Back]Program.ts` é compilado com esbuild, **sem transcrever um segundo conjunto de fórmulas**.
3. **Execução de instruções:** `draftingInterpreter.ts` determina posições e sequência com `sourceTrace` (página/etapa/dependências).
4. **Geometria de terceiro:** `Point` e `Path.move/line/length/asPathstring` do FreeSewing criam e medem as **linhas-guia retas**.
5. **Estrutura:** os identificadores frente/costas agrupam somente referências de construção; não são ainda `PatternPiece`, `SeamEdge` ou `CutEdge`.
6. **Anotações diagnósticas:** SVG com pontos numerados, traços de guias separados por seção, cabeçalho **NÃO CORTAR**. A renderização das anotações é própria nesta POC; o plugin FreeSewing de anotações ainda **não** foi integrado.
7. **Verificações:** entradas válidas, cadeia de proveniência, referências, cotas textuais, sentidos do diagrama, comprimento dos segmentos via biblioteca externa; **trueing e caimento ainda NOT_RUN**.
8. **Saída:** `out/ch02-guides.svg` e `out/ch02-diagnostics.json`. O SVG usa dimensões de visualização em pixels, não é impressão em escala 1:1. O contrato proíbe explicitamente `CUT_CONTOUR`, `SEAM_ALLOWANCE`, `SEAM_PAIR`, `NOTCH_PLACEMENT`, `SIZE_GRADING`, `NESTING`, `PRINT_1_TO_1` e `PRODUCTION_RELEASE`.

## Executar com Node 22

Da raiz do repositório:

```bash
npm ci --prefix prototype/web-app
npm ci --prefix prototype/integration-spike --ignore-scripts
mkdir -p prototype/integration-spike/generated
prototype/web-app/node_modules/.bin/esbuild \
  prototype/web-app/src/flatTrouserBackResearch.ts \
  --bundle --platform=node --format=esm \
  --outfile=prototype/integration-spike/generated/aldch02.mjs
npm test --prefix prototype/integration-spike
npm run demo --prefix prototype/integration-spike
```

A CI repete os comandos em Node 22 e publica os dois arquivos resultantes como artefato temporário.

## Por que a POC é isolada

- Nenhuma dependência nova foi adicionada ao aplicativo web existente.
- O formato nativo de projetos 0.1/0.2/0.3/0.4 não foi reescrito; apenas um **adaptador descartável de interoperabilidade** lê a saída do interpretador.
- O pacote FreeSewing 4.0.0 exigiu adicionar explicitamente `@freesewing/config@4.0.0`: o plugin de anotações o importa em runtime sem declará-lo como dependência, no estado inspecionado. **É um risco de empacotamento real**, não uma garantia de suporte industrial.
- Versões diretas e transitivas agora são fixadas em **`package-lock.json`**, materializado no GitHub Actions a partir da instalação efetiva do core 4.0.0. A CI usa `npm ci` para reprodutibilidade. **Ainda são obrigatórias** auditoria de licença, segurança, compatibilidade de API e atualização de upstream antes de promover ao aplicativo principal.
- FreeSewing é MIT; manter atribuições e avisos em qualquer redistribuição. Bibliotecas GPL e softwares proprietários permanecem somente como referências técnicas até decisão jurídica de integração.

## Próximo critério para expansão

A integração de **anotações, perfis, regras de peça, exportação PDF e encaixe** será tratada individualmente. Cada camada precisa demonstrar uma API utilizável, fixtures, limites do método e testes antes de ser integrada. A biblioteca de métodos Aldrich permanece independente de FreeSewing.

Ver `docs/architecture/REUSE-DECISION-001.md` e `docs/qa/QA-REUSE-001.md`.
