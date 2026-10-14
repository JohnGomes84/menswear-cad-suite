# SEC-MAINT-001 — auditoria npm dos laboratórios isolados (14/10/2026)

**Escopo:** manutenção/supply chain; **não** altera geometria nem autoriza molde para corte. **Baseline da main:** 1.29 DRAFT (PR #57 integrado em `8f1e1d80`). Gate A IN_REVIEW; Gate B PILOT-001 NO-GO.

## Evidência reproducível

O workflow [Dependency Audit (experimental labs)](../../.github/workflows/dependency-audit.yml) executa `npm ci` com lockfile, gera `npm audit --json` por projeto e guarda JSON integral como artefato de CI. Um workflow concluído com sucesso **não significa auditoria limpa**; o campo `metadata.vulnerabilities.total` deve ser verificado.

- [Audit original #38544864579](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38544864579), antes dos patches web: **web-app = 4** (2 critical, 1 high, 1 moderate); **integration-spike = 10** (0 critical, 9 high, 1 moderate).
- [Prova temporária #38545295394](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38545295394): Vite **7.3.7** e Vitest **5.0.4** com lockfile gerado por `npm`; a árvore candidata reportou **web-app = 0**, **157/157 unitários** e build PASS naquele commit anterior à baseline 1.29.
- Após o merge do PR #57, o pacote web na `main` foi revalidado localmente em instalação travada: **182/182 unitários, 10/10 E2E Chromium, build PASS e `npm audit` web-app = 0**. A CI do PR #57 também concluiu quatro checks verdes. O workflow de auditoria introduzido pelo PR #58 ainda precisa executar no seu SHA atualizado.
- O spike manteve a árvore FreeSewing fixada, sem `npm audit fix --force`; a execução remota existente reporta **10 achados**. O novo workflow deve registrar esses achados como artefato e aviso, nunca como aprovação limpa.

## Decisão de risco

| Escopo | Tratamento | Estado de release |
|---|---|---|
| Web app (Vite 7.3.7, Vitest 5.0.4) | Patches integrados no PR #57; lockfile pinado; 182 unitários, 10 E2E, build e audit web zero validados localmente | Testado; workflow de auditoria do PR #58 pendente no SHA atualizado |
| FreeSewing core 4.0.0 + plugin annotations 4.0.0 | **Não** executar `npm audit fix --force`; pacote direto `@freesewing/core` e `plugin-annotations` sem correção automática na auditoria. `lodash.set` também sem correção automática. Inspecionar upstream, licenças e API antes de atualizar | ISOLATED / NO_RELEASE (10 vulnerabilidades reportadas) |

A falta de correção automática **não prova ausência de versão segura**; significa que a árvore fixada não possui remediação automática segura conforme `npm audit`. O spike não deve ser distribuído, incorporado ao aplicativo de produção ou exposto a dados não confiáveis antes da revisão. Também permanece não resolvida a verificação independente de licença de transitivos já descrita no estudo de reaproveitamento.

**Bloqueios de domínio inalterados:** Issues #1–#5 e #26 aguardam revisão de modelagem; Issue #7 aguarda revisão geométrica/QA e evidência de escala física. Esta auditoria de dependências não conta como avanço ou GO dos gates de molde.
