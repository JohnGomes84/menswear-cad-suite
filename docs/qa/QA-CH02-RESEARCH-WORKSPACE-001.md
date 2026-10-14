# QA-CH02-RESEARCH-WORKSPACE-001 — aplicação e regeneração paramétrica

**Alvo:** interface CH02 de pesquisa, não saída industrial. **Baseline:** 1.29 DRAFT. **Fonte:** Aldrich 5ª edição, capítulo 2, PDF pp.31–34.

## Casos automatizados no ch02ResearchViewModel.test.ts

1. Método ONE_PIECE reutiliza a origem e fornece retas / curvas ainda pendentes.
2. Método TWO_PIECE reutiliza a origem e fornece retas / curvas ainda pendentes.
3. Cobertura: 7 comandos de uma peça, 9 de duas peças; 3 e 5 retas respectivamente.
4. Alteração da medida de quadril gera pontos novos sem alterar identidades/regras de fonte.
5. Mudança BASIC/EASY produz alteração de coordenadas pelo programa original.
6. Medidas inválidas (zero, negativa, NaN, infinito, fora do limite) são rejeitadas.
7. Método/variante inválidos não geram geometria aparentemente válida.
8. Retas selecionadas correspondem ao registro explícito, não a conectores de dependência.
9. Em todos os métodos: curvas continuam sem spline, exportAllowed=false e cutReady=false.

## Limites de teste

A CI pode verificar TypeScript, testes unitários e build da interface, mas **não equivale** a navegação E2E em browser, aprovação visual, fidelidade do ajuste ou validação de escala física. O novo workspace **não** executa APIs FreeSewing no browser: consume o interpretador próprio, cuja prova com FreeSewing permanece em laboratório isolado.

## Oráculos de segurança

Falha obrigatória se uma curva pendente for apresentada como contorno completo; se um Stroke UNCLASSIFIED virar SEAM_LINE ou CUT_LINE; se o botão de corte ficar ativo; se offsets extras forem produzidos sem auditoria; se espelhamento for informado como executado; se as entradas mm forem interpretadas como cm e vice-versa.

**Gate:** interface de pesquisa implementada, auditável por teste; corte NO-GO, comercial NO-GO.