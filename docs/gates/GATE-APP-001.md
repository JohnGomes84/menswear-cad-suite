# GATE-APP-001 — Critérios para iniciar o aplicativo sem validar o molde

**Data:** 13/10/2026  
**Decisão:** GO **somente para a fundação experimental da aplicação web** conforme `APP-FOUNDATION-001`; NO-GO para a implementação funcional de modelagem do `PILOT-001` e qualquer alegação de molde apto para corte.  
**Autoridade:** decisão técnica limitada; não substitui aceite de modelista, usuário como dono do produto, QA físico ou direitos de distribuição.

## 1. Três gates independentes

| Gate | Pergunta | Estado | Resultado permitido |
|---|---|---|---|
| Gate A — Geometria sintética | Os mecanismos genéricos têm evidência? | IN_REVIEW: 27/27 testes CI; revisão independente/escala física pendentes | Continuar testes/POC e experimentar API com fixtures sintéticas |
| Gate APP-001 — Fundação web | Podemos desenvolver UX, estrutura e serialização sem usar moldes reais? | **GO limitado** com isolamento e requisitos deste documento | Desenvolvimento de protótipo web de engenharia, não lançamento |
| Gate B — Molde `PILOT-001` | Fórmulas, curvas, margens e montagem foram aprovadas? | **NO-GO**, Issues #1–#5 | Não gerar/aprovar camisa real |
| Release industrial | Há qualidade, impressão e provas físicas suficientes? | **NO-GO** | Nenhum molde declarado apto para corte/comercialização |

**Importante:** Gate APP não altera o status de Gate A ou Gate B. Caso requisitos de isolamento não sejam cumpridos, o trabalho de interface deve retornar a NO-GO.

## 2. Checklist de condições para começar o protótipo experimental

| Critério | Exigência | Estado |
|---|---|---|
| APP-01 | Plataforma web, editor avançado e público definidos | SATISFIED |
| APP-02 | Kernel de geometria separado de SVG e regras de vestuário | CONTRACT_DEFINED |
| APP-03 | Unidades internas mm e interface cm | CONTRACT_DEFINED |
| APP-04 | Semântica de edição parametrizada/override/livre descrita | CONTRACT_DEFINED |
| APP-05 | Prototipagem apenas com fixtures sintéticas e aviso visível | REQUIRED_BEFORE_MERGE |
| APP-06 | JSON de protótipo identificado e versionado (não schema de produção) | REQUIRED_BEFORE_MERGE |
| APP-07 | CI de geometria e de interface com testes de determinismo, undo, import/export | REQUIRED_BEFORE_MERGE |
| APP-08 | Dependências/licenças front-end registradas com versão | REQUIRED_BEFORE_MERGE |
| APP-09 | Não adicionar dados pessoais reais, credenciais, autenticação ou livro | REQUIRED_BEFORE_MERGE |
| APP-10 | Teste do adaptador TS contra fixtures/Python antes de reutilizar algoritmo | REQUIRED_BEFORE_INTEGRATION |

`CONTRACT_DEFINED` não equivale a teste executado. Os requisitos marcados `REQUIRED_BEFORE_MERGE` devem ser verificados no PR do protótipo.

## 3. Lacunas do bloco real, não bloqueadoras do shell web

| Issue | Natureza | Decisão de contenção |
|---|---|---|
| #1 — medida one-piece | Protocolo físico ainda requer revisão | Shell usa campo sintético distinto de `shirt_sleeve_length`; não implementa medição pessoal real |
| #2 — `close_wrist` | Alias para `wrist_circumference` não aprovado | Não aplicar alias automático; preservar semântica distinta e pendência |
| #3 — margens | Linha líquida/corte e junções não aprovadas | Não exportar corte nem derivar offset de camisa |
| #4 — pontos/curvas | Coordenadas condicionais, curvas não aprovadas | Nunca usar a matriz como fixture canônica do aplicativo |
| #5 — `SeamPair` | Orientação/piques/ease não aprovados | Estrutura genérica pode ser prototipada apenas com pares sintéticos |
| #21 — integrador | Comparador independente/casos difíceis incompletos | Não prometer tolerância comercial nem portar como motor final |
| #22 — PDF físico | Escala não medida em papel | Não liberar impressão de molde |

## 4. Barras de saída do protótipo

- abrir projeto JSON sintético válido sem perder unidades, IDs ou revisão;
- rejeitar `schemaVersion` desconhecido e dados malformados sem executar código;
- exibir curva e ponto idênticos após zoom/pan;
- editar e desfazer/refazer duas transações com histórico coerente;
- diferenciar visualmente modo paramétrico, override e livre;
- fornecer diagnósticos explícitos de geometria inválida;
- nenhuma ação de exportação para corte nem alegação de caimento.

**Se algum dos critérios falhar, o shell não é promovido além de protótipo de laboratório.**

## 5. Próximos gates

**Gate B:** revisão de modelagem e geometria das Issues #1–#5, fixtures aprovadas e regressão do molde.  
**Gate de release:** teste de montagem/toile, impressão calibrada, requisitos legais, privacidade e robustez do produto.

O início experimental do web app **não revoga** a decisão de manter bloqueado o código de produção.
