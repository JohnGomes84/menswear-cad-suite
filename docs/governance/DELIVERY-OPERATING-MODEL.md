# DELIVERY-OPERATING-MODEL — Operação técnica do Sistema Paramétrico

**Início:** 13/10/2026 · **Estado:** EXECUTION_FRAMEWORK — método de trabalho, não equipe humana contratada.

## Missão e fronteiras

Construir uma **suíte CAD paramétrica web de modelagem masculina**, cobrindo progressivamente os métodos e famílias de `Metric Pattern Cutting for Menswear` (Aldrich, 5ª ed.). O `PILOT-001` é somente um caso, não limite arquitetural. O núcleo geométrico é generalista; a implementação de regras de vestuário exige especificações, evidência de fonte e revisão.

Este documento define **responsabilidades de trabalho que o assistente pode exercer**; **não** cria colaboradores humanos, equipes externas, aprovação profissional ou trabalho assíncrono garantido.

## Frentes de entrega e definição de pronto

| Frente / papel | Entrega sob responsabilidade | Critério verificável |
|---|---|---|
| Produto / arquitetura | Escopo multipeças, ADR, dependências e matriz de decisão | Nenhuma regra de um piloto incorporada ao kernel |
| Pesquisa de modelagem | Catálogo auditado capítulo/método, protocolos e `DraftRuleSet` propostos | `TOC_ONLY` não vira `APPROVED` sem leitura de texto/diagrama e parecer |
| CAD / geometria | Curvas, coordenadas, unidades, solver, constraints, topologia | Testes analíticos/metamórficos, falha explícita e referências numéricas independentes |
| Engenharia web / dados | Editor, comandos, formato versionado, histórico, interface | Build TS strict, roundtrip, undo/redo, sem migrations implícitas |
| QA / integração | CI, browser E2E, regressões e rastreamento de falhas | Evidência por commit/PR, testes que falham para cenários adversariais |
| Compliance / release | Licenças, propriedade intelectual, privacidade e impressão | Decisões documentadas; não divulgar imagens do livro nem liberar produção sem gates |

## Fluxo único de entrega

1. **Issue:** problema, escopo e aceite mensurável, dependências e fronteira entre laboratório e produto.
2. **Branch curta:** uma capacidade de domínio ou QA por alteração.
3. **Implementação + testes:** primeiro código reutilizável, depois integração UI; evitar inventar regras de modelagem.
4. **CI:** testes e build para o SHA do PR; manter falhas explícitas e corrigir antes de merge.
5. **Revisão objetiva:** verificar QA, contrato, unidades, segurança, regressões e licenças; não tratar CI como aprovação de domínio físico.
6. **Merge:** apenas quando permissões permitirem, CI aprovada e inexistirem blockers novos; atualizar issue/status/master de forma proporcional.
7. **Gate:** continuar em experimento ou avançar de fase somente com evidência e decisão competente.

## Gates que não devem ser confundidos

- **Gate APP:** autorizado laboratório web com geometria sintética; sem produção.
- **Gate A:** motor numérico experimental sob revisão, incluindo erros extremos e impressão física de diagnóstico.
- **Gate B:** bloco real `PILOT-001` bloqueado pelas Issues #1–#5 e revisão profissional (#26).
- **Gate industrial/comercial:** bloqueado por calibração, QA físico e definição legal/privacidade (#27).

Nenhum número de testes unitários ou automação de navegador supera a necessidade de avaliar fisicamente um molde real.

## Dependências priorizadas

**Pipeline CAD:** primitivas → constraints/solver → armazenamento/replay → UI paramétrica → contornos/seam semantics → export validado.

**Pipeline do livro:** sumário (54 tópicos candidatos) → leitura por método → reconstrução original → revisão geométrica → peça de teste → prova física → registro VALIDATED.

**Primeiro teste real de generalidade (futuro):** bloco inferior e bloco `form` após Flat Shirt, com gates independentes. Não assumir que 54 tópicos são 54 moldes.

## Gestão de impedimentos

Se precisar de parecer de modelista, uso real de impressora, licença proprietária ou decisão comercial, registrar `BLOCKED_EXTERNAL_DECISION` e apresentar a pergunta precisa ao titular. Não fabricar pareceres, medições físicas ou resultados. Se uma ferramenta não permitir ação externa, produzir código/documentação e deixar o passo claramente pendente.

**Observação de segurança:** o repositório está atualmente **público**; a decisão de visibilidade/licenciamento pertence ao titular. Evitar depositar dados pessoais, conteúdos extensos da obra e credenciais no Git.
