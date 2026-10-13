## Resultado
Descreva a capacidade **implementada**, não a promessa de produto.

## Evidência
- [ ] Build e testes automáticos executados na branch do PR (link CI)
- [ ] Fixtures positivas, negativas e não convergência quando aplicável
- [ ] Schema/contrato atualizado se houve mudança de dados
- [ ] Histórico/undo/redo e segurança de importação avaliados quando aplicável
- [ ] Dependências/artefatos externos auditados ou declarados experimentais
- [ ] Documento Mestre, issue e status coerentes com evidências

## Riscos e limitações
- Gate APP: laboratório experimental / não produção
- Gate A: aprovação numérica formal ainda pendente, se aplicável
- Gate B: não confundir QA geométrica com validação de molde real
- Não incluir digitalizações, imagens protegidas nem dados pessoais

## Questões externas
Declare `BLOCKED_EXTERNAL_DECISION` quando depender de modelista, medição física, titular da licença ou aceite do produto.

## Checklist de rollout
- [ ] Verificado que nenhuma regra de camisa foi colocada no kernel genérico
- [ ] Sem exportação para corte sem gate apropriado
- [ ] PR revisado por evidência — não presumir revisores humanos
