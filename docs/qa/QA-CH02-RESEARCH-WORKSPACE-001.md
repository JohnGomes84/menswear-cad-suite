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

## Evidência executada — 14/10/2026 (branch do PR #57)

- Unitários: **182/182 PASS**; TypeScript/Vite build: **PASS**.
- Playwright Chromium: **10/10 PASS**, incluindo quatro casos do workspace CH02: entrada e avisos de segurança, regeneração ao mudar método/variante/medidas, alternância frente/costas e inspeção de reta, além de layout móvel de 390 px sem overflow horizontal.
- Revisão visual manual das capturas E2E em desktop 1440×1000 e móvel 390×844: controles legíveis, viewport e inspetor empilhados no móvel, sem overflow horizontal observado. O canvas comprido exige rolagem vertical e continua sendo apenas um diagnóstico.
- O workspace web usa o interpretador próprio; não executa APIs FreeSewing no browser. As capturas e traces ficam como artefatos temporários da CI, não como evidência física permanente.

## Limites de teste

Os testes e a inspeção visual confirmam navegação, renderização, interações e os avisos de bloqueio. **Não** confirmam fidelidade de caimento, completude do perímetro, escala de impressão, geometria de costura/corte ou qualidade de confecção. Continua necessária revisão de modelista e prova física/toile antes de qualquer promoção industrial.

## Oráculos de segurança

Falha obrigatória se uma curva pendente for apresentada como contorno completo; se um Stroke UNCLASSIFIED virar SEAM_LINE ou CUT_LINE; se o botão de corte ficar ativo; se offsets extras forem produzidos sem auditoria; se espelhamento for informado como executado; se as entradas mm forem interpretadas como cm e vice-versa.

**Gate:** interface de pesquisa implementada, auditável por teste; corte NO-GO, comercial NO-GO.
