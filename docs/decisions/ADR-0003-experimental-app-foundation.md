# ADR-0003 — Iniciar fundação experimental web antes da validação do molde

**Data:** 13/10/2026  
**Status:** ACCEPTED_FOR_EXPERIMENTAL_SCOPE  
**Relação:** ADR-0001 (produto), ADR-0002 (POC sintética), `GATE-APP-001`.

## Contexto

O piloto `PILOT-001` ainda depende de aprovação de regras do livro, interpretação das curvas, margens, `SeamPair`/ease e prova de costura. Entretanto, um aplicativo web exige infraestrutura e contratos independentes do bloco específico: viewport, estados de edição, versionamento, histórico e importação/exportação de projeto.

Manter qualquer trabalho web bloqueado até a prova física seria uma dependência artificial. Liberar geração de molde real sem as decisões restantes seria inseguro.

## Decisão

Autorizar **somente um shell web experimental**, com dados e curvas sintéticos, para demonstrar arquitetura e comportamento do editor. Ele será mantido isolado do código de produto e da lógica do bloco real.

Escolhas reversíveis de primeira implementação: **TypeScript strict, React, Vite e SVG**. O projeto continua **web**, com público misto e editor avançado como decisões permanentes de produto.

Não serão implementados neste gate: regras do livro para moldes reais, cadastro de dados pessoais, backend, autenticação, motor de margem real, integração de `SeamPair` do flat shirt, geração para corte, cobrança, release comercial.

## Consequências

- Um contrato de interfaces deve impedir que o editor trate SVG como geometria canônica.
- A POC Python permanece benchmark experimental separado. Portar geometria para TypeScript requer teste cruzado.
- Testes de unidade, histórico/undo e serialização devem ser adicionados ao shell.
- O protótipo deve mostrar a identificação “geometria sintética — não utilizar para corte”.
- `Gate APP` não muda `Gate A: IN_REVIEW`, `Gate B: NO-GO` nem a condição de código de produção bloqueado.
- Sem licença de distribuição definida, todo código experimental permanece sujeito a revisão antes de publicar/reutilizar comercialmente.

## Revisão desta decisão

A decisão deverá ser revisitada antes de conexão a backend, uso de medidas reais, implementação funcional de padrão, escolha final do kernel e disponibilização para terceiros.
