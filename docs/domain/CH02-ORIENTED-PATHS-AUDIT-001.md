# CH02-ORIENTED-PATHS-AUDIT-001 — cadeias orientadas de origem, não perímetros de corte

**Fonte:** Winifred Aldrich, *Metric Pattern Cutting for Menswear*, 5ª ed., PDF pp. 31–34; figura p. 34 examinada visualmente.  
**Evidência preexistente:** `CH02-SOURCE-LINES-001.json` (16 comandos auditados, 8 curvas ainda não aprovadas).  
**Novo registro:** [CH02-ORIENTED-SOURCE-PATHS-001.json](CH02-ORIENTED-SOURCE-PATHS-001.json).  
**Contrato genérico:** [TOPOLOGY-RESEARCH-001.md](../architecture/TOPOLOGY-RESEARCH-001.md).

## Encadeamento nominal comprovável sem inventar trechos

O texto prescreve caminhos de gancho e entreperna nas pp. 32–33. O diagrama p. 34 sustenta o posicionamento das construções básica/folgada, mas não autoriza definir a curva exata nem fechar o contorno de produção. Para cada método/seção, três comandos de fonte fornecem uma cadeia nominal **aberta**:

| Método | Seção | Sequência orientada dos pontos | Traçados de origem | Geometria pendente |
|---|---|---|---|---|
| Uma peça | Frente | `6 → 7 → 8 → 11 → 9` | gancho → entreperna superior → trecho inferior **invertido** | 2 curvas |
| Uma peça | Costas | `13 → 14 → 16 → 18 → 17` | gancho → entreperna superior → trecho inferior **invertido** | 2 curvas |
| Duas peças | Frente | `6 → 7 → 8 → 15 → 13` | gancho → entreperna superior → trecho inferior **invertido** | 2 curvas |
| Duas peças | Costas | `17 → 19 → 21 → 25 → 24` | gancho → entreperna superior → trecho inferior **invertido** | 2 curvas |

**Importante:** `9–11`, `17–18`, `13–15` e `24–25` aparecem na fonte na direção contrária ao encadeamento escolhido. A inversão é **somente de percurso**, não de geometria ou espelhamento. O validador verifica extremos e também mantém os pontos interiores das curvas. Total: **12 referências de comandos** (4×3), com oito curvas ainda não solucionadas. Os outros quatro comandos do registro (incluindo guias) não foram promovidos a qualquer contorno por conveniência.

### Perímetros: estado por peça

Todos os quatro registros têm `layer=INDUSTRIAL_PERIMETER`, `status=NOT_YET_DEFINED`, `approvedEdgeIds=[]`. Nenhum é fechado nem possui função final `SEAM_LINE`, `CUT_LINE`, `FOLD_LINE`, `HEM_LINE` aprovada. Composição da calça de **uma peça** permanece operação documentada de espelhar a frente e alinhar laterais; ela **não foi executada**. Referência interna 0–2 do diagrama composto não é considerada borda de corte.

### Margens já incluídas

Regra p. 31: **10 mm já incluídos** exceto onde indicado. As quatro observações de `no seam allowance` referentes a cintura e barra (uma e duas peças) continuam **sem `edgeIds`**, `offsetAllowed=false`; suas chamadas não justificam offsets nem remoções globais.

### Interpretação dos testes

`PASS_RESEARCH_TOPOLOGY_ONLY` significa apenas consistência entre fonte declarada, ordem de traços e bloqueios. **Não** significa pass em curvas, costuras, margens, contornos, impressão ou prova física. Falhas negativas de continuidade, atribuição de fonte, liberação, margens e papéis industriais têm prioridade sobre visual plausível. A semântica de vestuário do contrato existente permanece isolada.

**Gate:** APP experimental, A IN_REVIEW, B PILOT-001 NO-GO, comercial NO-GO. O piloto formal continua `Flat Shirt Core`; a pesquisa CH02 é estudo vertical da infraestrutura multi-famílias.
