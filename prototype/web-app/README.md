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
- Renderização SVG não calcula comprimento canônico, costuras ou piques. O campo de comprimento mostra `NOT_RUN` e o bloco real `NOT_YET_DEFINED`.
- Não faz persistência automática, autenticação, backend, telemetria nem exportação para corte.
- Os limites de importação são provisórios e não substituem revisão de segurança.
- As dependências diretas estão fixadas e o `package-lock.json` registra a árvore usada na CI; licenças/avisos das dependências transitivas ainda exigem auditoria antes de qualquer release. Bibliotecas do protótipo não ficam automaticamente aprovadas para produção.
- O portal GitHub já possui CI para geometria Python; este protótipo terá pipeline próprio.

Documentos: `../../docs/gates/GATE-APP-001.md`, `../../docs/architecture/APP-FOUNDATION-001.md` e `../../docs/qa/QA-APP-001.md`.
