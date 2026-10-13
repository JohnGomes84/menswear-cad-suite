# Pesquisa dirigida — medidas de manga e punho (`PILOT-001`)

**Estado:** proposta fundamentada em fonte, aguardando revisão de modelagem. Não fecha as issues nem aprova o bloco para produção.

**Fonte primária do projeto:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª edição, PDF fornecido pelo usuário. Os números de página abaixo são páginas do PDF.

## Issue #1 — comprimento da manga e fixture de 65 cm

### O que a referência distingue

No capítulo 13, PDF p. 261, `L-M` é o comprimento de manga para manga de uma peça: medir do osso do ombro até logo abaixo do osso do punho. A instrução geral do capítulo diz que o corpo deve estar relaxado e que as medidas normalmente são tomadas com camisa e calças. A referência **não especifica a posição do braço nem se a fita deve seguir uma linha de superfície para esse protocolo específico**.

A mesma página descreve outra medida, `A-L-N`, para manga de camisa: braço elevado e dobrado; medir do osso da nuca, passando pelo ombro e pelo cotovelo, até logo abaixo do osso do punho. A referência também descreve `D-N` para manga de duas peças. São protocolos distintos. Não há fórmula no livro para converter um comprimento no outro.

O exemplo do bloco de camisa plana de tecido plano (PDF p. 35) chama a entrada de `Sleeve length one-piece sleeve` e dá **65 cm**. Portanto, o nome do campo e o protocolo `L-M` coincidem. Para este piloto, a proposta é que a fixture `65 cm` represente `one_piece_sleeve_length`, e não `shirt_sleeve_length`.

### Protocolo proposto para a fixture

- Campo de perfil: `one_piece_sleeve_length`, unidade de entrada cm; valor da fixture `65.0 cm` (`650 mm` no kernel).
- Marcos anatômicos: ponto ósseo do ombro até logo abaixo do osso do punho, conforme `L-M`.
- Fonte diz que o corpo fica relaxado e normalmente veste camisa e calças. Como ela não determina a postura do braço para `L-M`, propõe-se para repetibilidade do produto: braço ao lado do corpo, cotovelo sem flexão forçada, punho neutro e fita acompanhando a superfície externa entre os marcos. **Essa postura/trajeto é uma regra operacional proposta, não uma citação do livro, e requer aprovação de modelagem.**
- `shirt_sleeve_length` permanece campo separado e opcional, com protocolo `A-L-N`. Não pode alimentar silenciosamente a regra de manga de uma peça.

Para o bloco de camisa plana, a regra da construção (PDF p. 36) é `0-2 = sleeve length − 2 cm`. Assim:

```text
one_piece_sleeve_length = 65.0 cm
segmento_de_bloco_0_2 = 65.0 − 2.0 = 63.0 cm = 630 mm
```

O desconto de 2 cm é um termo fixo da construção publicada; não deve ser renomeado como `GarmentEase` sem evidência/revisão. A fixture é um caso de referência do bloco, não uma medida corporal universal.

## Issue #2 — `close_wrist`

### Interpretação proposta

Na tabela do bloco de camisa plana (PDF p. 35), `Close wrist measurement` aparece com **17.8 cm**. No capítulo 13, PDF p. 261, a medida corporal de punho listada é `V: Wrist circumference`, tomada logo acima do osso do punho. A leitura mais consistente é tratar a medida corporal canônica como `wrist_circumference` e mapear `close_wrist` do bloco como **alias direto**, não como outra medida corporal nem como a circunferência acabada de punho/cuff.

O livro não escreve uma frase explícita de equivalência entre os dois rótulos. Portanto, o alias é uma proposta rastreável para revisão de modelagem. Até a aprovação, a semântica do campo deve permanecer marcada `PROPOSED_PENDING_MODELING_REVIEW`, nunca `VALIDATED`.

A fórmula específica da camisa plana de tecido plano (PDF p. 36) é:

```text
segmento_2_4 = 1/2 × close_wrist + 5 cm
```

Aplicando o exemplo publicado:

```text
wrist_circumference = 17.8 cm = 178 mm
close_wrist         = 17.8 cm (alias proposto)
segmento_2_4        = 17.8 / 2 + 5 = 8.9 + 5 = 13.9 cm = 139 mm
```

**139 mm é a distância do segmento de construção `2–4`, não o valor corporal `close_wrist` nem, sem validação da leitura de espelhamento/centro, a circunferência acabada da abertura.** O desenho identifica a linha central e indica ausência de bainha nesse bordo. O exportador não deve somar uma bainha ali sem regra específica.

O acréscimo de 5 cm não é nomeado no texto como folga de vestibilidade; no modelo deve ser guardado como constante de construção do bloco, separada de `GarmentEase`, `AssemblyEase` e margens. Não confundir `wrist_circumference` com `shirt_cuff_size`, que a referência lista separadamente nas medidas padrão (PDF p. 262).

A página seguinte que inicia os blocos de jersey/tee shirt repete os números de exemplo, mas usa outra regra para a manga: `1/2 close wrist + 3 cm` (ou `+3.5 cm` para a alternativa mais folgada; PDF p. 39). Essa regra **não** deve substituir o `+5 cm` da camisa plana de tecido plano.

## Fixture verificável e representação sugerida

Valores de entrada em mm, sem perda de precisão na conversão cm→mm:

```json
{
  "measurements": {
    "one_piece_sleeve_length_mm": 650,
    "wrist_circumference_mm": 178
  },
  "proposedAliases": {
    "close_wrist_mm": {
      "aliasOf": "wrist_circumference_mm",
      "status": "PROPOSED_PENDING_MODELING_REVIEW"
    }
  },
  "expectedDraftDimensions": {
    "flat_shirt_segment_0_2_mm": 630,
    "flat_shirt_segment_2_4_mm": 139
  }
}
```

Casos QA propostos: (1) conferir `650 − 20 = 630 mm`; (2) conferir `178/2 + 50 = 139 mm`; (3) comprovar que `shirt_sleeve_length` não substitui `one_piece_sleeve_length`; (4) comprovar que `close_wrist` não é serializado como tamanho de cuff acabado; (5) comprovar que o cálculo do bloco de tecido plano usa `+50 mm`, sem importar o `+30/+35 mm` do bloco de jersey.

## Pendências para concluir as issues

Modelagem deve aprovar ou alterar a postura/trajeto da medida `L-M`; confirmar o alias `close_wrist ← wrist_circumference`; revisar a interpretação do segmento `2–4` e do centro/espelhamento; e aceitar os dois resultados esperados na fixture. Até essa revisão, #1 e #2 continuam abertas, os resultados são propostas de especificação e o Gate do `PILOT-001` permanece bloqueado.

A página oficial da ISO descreve a ISO 8559-1:2017 como referência de definições antropométricas e orientação de medição para vestuário, confirmada como vigente em 2026 [1]. Esse escopo é um apoio metodológico; as definições específicas acima vêm do livro anexado, não do resumo público da ISO.

## Referências

Fonte primária do projeto: Aldrich, Winifred. *Metric Pattern Cutting for Menswear*, 5ª ed., PDF fornecido pelo usuário, bloco de camisa plana, PDF pp. 35–36; capítulo 13, PDF pp. 260–262; comparação de bloco jersey, PDF p. 39.

[1]: https://www.iso.org/standard/61686.html "ISO 8559-1:2017 — Size designation of clothes — Part 1: Anthropometric definitions for body measurement"
[2]: https://www.iso.org/news/Ref2172.htm "ISO — Tinker Tailor: clothing size standards get a makeover"
