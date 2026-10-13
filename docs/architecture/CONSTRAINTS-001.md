# CONSTRAINTS-001 — Restrições geométricas dirigidas, laboratório CAD

**Estado:** EXPERIMENTAL / CANDIDATE; **não é solver paramétrico industrial**.  
**Fonte:** geometria matemática genérica, não fórmula da obra de modelagem.  
**Unidade:** mm, independente da representação SVG.

## 1. Escopo implementado

`prototype/web-app/src/constraints.ts` define `DirectedConstraint` para um ponto de controle de origem e um ponto de destino, identificados por `entityId` e `pointIndex`.

| Tipo | Relação | Escolha de solução |
|---|---|---|
| `COINCIDENT` | destino = origem | copia x/y do ponto origem |
| `HORIZONTAL` | y destino = y origem | preserva x do destino |
| `VERTICAL` | x destino = x origem | preserva y do destino |
| `DISTANCE` | distância euclidiana = `distanceMm` | mantém a direção inicial entre origem e destino; recusa direção inexistente para distância positiva |

### Condições do algoritmo

- **DAG dirigida:** cada destino recebe no máximo uma constraint; ordenação topológica resolve fontes antes dos destinos.
- IDs únicos e referências existentes; dependência cíclica, auto-dependência e múltiplas constraints sobre mesmo destino são `BLOCKED`.
- Entradas e resultados finitos, tolerância experimental explícita e residual por constraint.
- O solver **não altera** a geometria original: devolve uma projeção derivada e movimentos sugeridos.
- `SOLVED` significa que as relações matemáticas autorizadas foram satisfeitas nas fixtures; **não** significa molde costurável ou válido.
- Não há cálculo por pixels, SVG ou projeção com discretização.

## 2. Limites importantes

1. **Uma constraint por destino** é uma limitação deliberada. Ex.: horizontal + distância sobre o mesmo alvo exige solver acoplado posterior, e **não** deve ser silenciosamente reduzida a uma regra.
2. A orientação usada por `DISTANCE` deriva do vetor inicial. Comprimento positivo com vetor nulo gera `UNDETERMINED_DIRECTION`, nunca escolhe direção arbitrária.
3. O motor é uma **projeção de uma só execução**. As constraints não são persistidas em `SceneProject 0.3.0` nem recalculadas em edições futuras. Uma etapa posterior definirá contratos próprios e mudança de versão de schema.
4. Não há solver de tangências, paralelismo, ângulos, simetria, offsets, contornos fechados, `SeamPair` ou `AssemblyEase`. Não usar em molde real até validação.
5. `toleranceMm` é critério numérico das fixtures experimentais, **não tolerância de costura/plotagem**.

## 3. Validação e próximos contratos

`constraints.test.ts` cobre projeção horizontal/vertical, coincidência entre grupos, distância, propagação dirigida, ordem determinística, input imutável, redundância/duplicidade, ciclos, vetor nulo, overflow e estados explicitamente bloqueados.

**Próximo passo:** modelo de constraints com soluções simultâneas, identidade e proveniência no projeto versionado (`0.4.0` ou superior), operações de histórico e E2E reais. Requer revisão formal das regras geométricas e definição de como `PARAMETRIC_OVERRIDE` difere de `FREE`.

**Gates:** APP = laboratório experimental; A = IN_REVIEW; B do PILOT-001 = NO-GO.
