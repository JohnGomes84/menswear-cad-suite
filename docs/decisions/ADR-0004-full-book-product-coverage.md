# ADR-0004 — Cobertura integral e arquitetura não vinculada ao piloto

**Status:** ACCEPTED_PRODUCT_SCOPE  
**Data:** 13/10/2026

## Problema

A seleção do `PILOT-001 — Flat Shirt Core` como prova de conceitos podia ser confundida com um produto destinado exclusivamente à confecção de camisas. O pedido original é uma **suíte CAD de modelagem masculina** fundamentada nos métodos da obra inteira.

## Decisão

1. A cobertura pretendida inclui os temas de **todos os 14 capítulos** confirmados no sumário do PDF, organizada por famílias (flat, form, calças, camisas, vestuário externo, componentes, gradação, adaptações e CAD).
2. O `PILOT-001` comprova **somente um bloco de referência**, não define o limite funcional do produto.
3. O kernel, o formato de projeto e as operações serão **independentes de família de vestuário**; padrões concretos entram por `DraftRuleSet` versionado, com metadados de família e `sourceChapter`.
4. Após o piloto, casos de verificação de **famílias diferentes** deverão demonstrar generalidade (por exemplo calça e um bloco `form`), antes de declarar o motor multiplataforma de modelagem masculina.
5. A auditoria do conteúdo técnico de cada capítulo terá evidências próprias, separando inventário de índice, especificação, implementação e validação física.

## Consequências

- Manter `docs/product/BOOK-COVERAGE-001.md` como inventário editorial auditável.
- O produto não será comercializado como contendo “todo o livro” enquanto não existir catálogo auditado de regras efetivamente implementadas/validadas.
- Não copiar o PDF, ilustrações, páginas ou conteúdo extenso para Git ou interface.
- Não exigir que capítulos de gradação/nesting/PLM estejam implementados antes de validar o primeiro piloto; são abrangência de roadmap, não promessa da primeira versão.
