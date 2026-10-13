# Web App — laboratório geométrico sintético

**Status:** protótipo de engenharia, **não** produto. Escopo do `GATE-APP-001`.

Este shell web implementa um viewport SVG, seleção/arraste de quatro pontos de controle de uma curva Bézier inventada, zoom/pan, JSON sintético de laboratório e edição com undo/redo em memória. Não contém regras do livro, medidas antropométricas reais, bloco de camisa, `SeamPair`, engine CAD aprovada, corte ou impressão industrial.

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
- O arquivo JSON guarda eventos históricos, mas o histórico de **undo após reabrir** ainda não é reconstruído. Na mesma sessão, undo/redo usa snapshots em memória; esta limitação fica aberta em APP-002.
- O adaptador TypeScript calcula **comprimento e três marcas sintéticas por arco** diretamente da Bézier canônica em mm; o SVG apenas desenha. Isto **não** implementa costuras, piques funcionais nem qualquer bloco de camisa. O bloco real continua `NOT_YET_DEFINED`.
- Não faz persistência automática, autenticação, backend, telemetria nem exportação para corte.
- Os limites de importação são provisórios e não substituem revisão de segurança.
- As dependências diretas estão fixadas e o `package-lock.json` registra a árvore usada na CI; licenças/avisos das dependências transitivas ainda exigem auditoria antes de qualquer release. Bibliotecas do protótipo não ficam automaticamente aprovadas para produção.
- O portal GitHub já possui CI para geometria Python; este protótipo terá pipeline próprio.

Documentos: `../../docs/gates/GATE-APP-001.md`, `../../docs/architecture/APP-FOUNDATION-001.md` e `../../docs/qa/QA-APP-001.md`.

## Experimento matemático em TypeScript

`src/geometry.ts` expõe avaliação de Bézier cúbica, comprimento de arco via integração adaptativa Simpson, inversão numérica da distância de arco, tangente e marcas sintéticas; nenhum método é específico de vestuário. A API falha explicitamente em entrada não finita, tangente indefinida ou orçamento de quadratura insuficiente.

`src/geometry.test.ts` verifica segmento 3-4-5, parábola com comprimento fechado, a curva sintética da POC Python (aprox. `258.1271065334 mm`), invariância por translação/escala/reversão e erros. A igualdade cruzada é testada contra **fixture estática**, não contra uma execução simultânea de Python. São critérios experimentais, sem garantia industrial de erro nem validação física.
