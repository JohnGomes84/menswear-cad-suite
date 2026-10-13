# Relatório inicial — POC geométrica sintética (Fase 1.5)

**Execução:** 13/10/2026
**Status:** primeira rodada local, sem revisão formal externa de geometria/QA.
**Escopo:** Bézier cúbica sintética, comprimento e posição por arco, piques, discretização adaptativa, reversão de orientação, interseções de segmentos, offsets poligonais de largura constante e exportação SVG/PDF diagnóstica.

## Resultado de testes

A suíte passou em **14 testes**. Cobriu curva reta de comprimento conhecido; comprimento e ponto por arco; reversão de orientação e preservação da geometria; detecção de curva degenerada de comprimento zero; invariância dos piques em relação à discretização; refinamento de polilinha; segmentos que se cruzam, não se cruzam ou são degenerados; offsets convexos e côncavos; entrada auto-intersectada rejeitada sem reparo silencioso; erosão excessiva sinalizada como resultado inválido; e distância não finita rejeitada.

## Observações quantitativas da fixture

A curva cúbica de controle `(25,30)`, `(35,135)`, `(170,145)`, `(205,45)` mm teve comprimento numérico de referência de aproximadamente **258,1271065334 mm**, obtido com integração adaptativa Simpson e tolerância interna `1e-11 mm`. É uma referência computacional do próprio experimento, não uma verdade analítica independente.

No sweep de integração, `eps=1e-2 mm` diferiu da referência em aproximadamente `0,001517 mm`; `eps=1e-4 mm` em `1,31e-7 mm`; tolerâncias `1e-6 mm` ou mais estritas ficaram abaixo de `6e-11 mm` nesta fixture. Esses valores caracterizam apenas esta curva/implementação e não são tolerâncias de produto.

No sweep de discretização, flatness `5 mm` usou 9 vértices e ficou aproximadamente `1,236 mm` abaixo do comprimento paramétrico; `1 mm` usou 17 vértices e ficou `0,309 mm` abaixo; `0,25 mm` usou 33 vértices e ficou `0,077 mm` abaixo; `0,1 mm` usou 65 vértices e ficou `0,0193 mm` abaixo. `0,05 mm` gerou a mesma amostragem/erro que `0,1 mm` nesta fixture. Isso sinaliza a necessidade de casos mais difíceis e de esclarecer a relação entre o limite de flatness local e erro global de comprimento.

A operação `buffer` de Shapely **2.2.0** produziu saída válida para contornos sintéticos convexo e côncavo de largura constante. Um laço (bow-tie) foi marcado `INVALID_INPUT`, sem reparo silencioso; erosão que eliminou um retângulo foi marcada `INVALID_RESULT`. A interseção de diagonais retornou `(5,5) mm`; segmentos separados retornaram `NONE`. Largura variável ainda está `NOT_IMPLEMENTED`.

## Exportação diagnóstica

- SVG analisado como XML válido e gerado com largura/altura em mm.
- PDF gerado em uma página de **240 × 160 mm**, contendo curva, discretização, piques, contorno de entrada, offset e régua nominal de 25 mm.
- PDF convertido em imagem e inspecionado visualmente: camadas distinguíveis por cor, embora curva e polígono se sobreponham na mesma área. Uma rodada futura deve separar melhor os painéis.
- **Não** foi feita impressão física nem medição da régua; escala de tela ou `pdfinfo` não prova escala real na impressora.

## Limitações e próximos testes

A referência de integração é computacional, não uma solução fechada independente. A métrica de flatness atual usa distância dos controles à corda; não demonstra por si só uma cota rigorosa do desvio global da curva ou do erro de comprimento. O offset usa `buffer` constante de Shapely e serve somente como referência topológica exploratória; larguras variáveis e regra de margem de vestuário não estão implementadas.

Próxima rodada: comparar o integrador com método independente de alta precisão; testar cúbicas com inflexão, curvatura alta e tangentes degeneradas; medir desvio curva–polilinha nos dois sentidos; avaliar interseções tangenciais/coincidentes e offsets que se dividem, colapsam ou criam componentes; e imprimir/medir o controle de 25 mm. Só após revisão, registrar contratos experimentais candidatos. Nada nesta rodada aprova o `PILOT-001`, margens, montagem cava/manga, caimento ou tolerância industrial.
