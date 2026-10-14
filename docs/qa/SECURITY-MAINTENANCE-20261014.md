# SEC-MAINT-001 — auditoria npm dos laboratórios isolados (14/10/2026)

**Escopo:** manutenção/supply chain; **não** altera geometria nem autoriza molde para corte. **Baseline da main:** 1.26 DRAFT. Gate A IN_REVIEW; Gate B PILOT-001 NO-GO.

## Evidência reproducível

O workflow [Dependency Audit (experimental labs)](../../.github/workflows/dependency-audit.yml) executa `npm ci` com lockfile, gera `npm audit --json` por projeto e guarda JSON integral como artefato de CI. Um workflow concluído com sucesso **não significa auditoria limpa**; o campo `metadata.vulnerabilities.total` deve ser verificado.

- [Audit original #38544864579](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38544864579): **web-app = 4** (2 critical, 1 high, 1 moderate); **integration-spike = 10** (0 critical, 9 high, 1 moderate).
- [Prova temporária #38545295394](https://github.com/JohnGomes84/menswear-cad-suite/actions/runs/38545295394): tentativa isolada, Vite **7.3.7** e Vitest **5.0.4** com lockfile gerado por `npm` na CI. Resultado da árvore candidata **web-app = 0**; **157/157 testes existentes** e build TypeScript/Vite passaram.
- Versões e lockfile da árvore candidata de web app incorporados ao **PR de manutenção**. Ainda requer reexecução do workflow com essas versões **commitadas**, antes de marcar a remediação como confirmada no PR.

## Decisão de risco

| Escopo | Tratamento | Estado de release |
|---|---|---|
| Web app (Vite 7.1.0, Vitest 3.2.4) | Migração de ferramenta de desenvolvimento para Vite 7.3.7 e Vitest 5.0.4, com `package-lock.json` pinado e teste pós-mudança | Testado em runner temporário; validar CI do commit |
| FreeSewing core 4.0.0 + plugin annotations 4.0.0 | **Não** executar `npm audit fix --force`; pacote direto `@freesewing/core` e `plugin-annotations` sem correção automática na auditoria. `lodash.set` também sem correção automática. Inspecionar upstream, licenças e API antes de atualizar | ISOLATED / NO_RELEASE (10 vulnerabilidades reportadas) |

A falta de correção automática **não prova ausência de versão segura**; significa que a árvore fixada não possui remediação automática segura conforme `npm audit`. O spike não deve ser distribuído, incorporado ao aplicativo de produção ou exposto a dados não confiáveis antes da revisão. Também permanece não resolvida a verificação independente de licença de transitivos já descrita no estudo de reaproveitamento.

**Bloqueios de domínio inalterados:** Issues #1–#5 e #26 aguardam revisão de modelagem; Issue #7 aguarda revisão geométrica/QA e evidência de escala física. Esta auditoria de dependências não conta como avanço ou GO dos gates de molde.
