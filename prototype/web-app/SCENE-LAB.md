# Multi-entity sketch lab — protótipo 0.2.0

O laboratório web agora oferece duas áreas **separadas**:

- **Laboratório inicial (0.1.0):** demonstra uma Bézier cúbica e preserva seus arquivos JSON antigos.
- **Cena multi-entidades (0.2.0):** duas pastas/grupos de desenho independentes, três entidades geométricas (duas Béziers e uma linha), seleção por ID, arraste de pontos, pan/zoom, undo/redo e JSON sintético versionado.

## Contrato de cena

`SceneProject` contém `pieces` (grupos de esboço, **não** peças de roupa), `entities` (`LINE` ou `CUBIC_BEZIER`), `unit:"mm"`, revisão de projeto e histórico linear de `MOVE_POINT`. Uma entidade tem identidade estável, grupo e modo de edição. Importações validam IDs únicos, referências a grupos existentes, pontos finitos, aridade por tipo e sequência reversível de eventos.

Ao reabrir JSON 0.2.0, o histórico linear de movimentos `FREE` é reconstruído, permitindo desfazer e refazer. `PARAMETRIC` é protegido contra movimento destrutivo e `PARAMETRIC_OVERRIDE` ainda não executa solvers/regras.

Os formatos 0.1.0 e 0.2.0 são **distintos**, sem migração silenciosa. Cada laboratório importa apenas sua versão. Não converter JSON experimental em projeto CAD de produção.

## Testes

`scene.test.ts` verifica duas famílias de primitivas, associações a grupos, persistência, IDs, undo/redo entre entidades, isolamento, rejeição de entrada inválida e casos de adulteração da sequência. A CI do web app executa junto com os testes anteriores.

## Limites

Ainda não há construção de componentes de roupa, centros/dobras, pences, margens, `SeamEdge`, `SeamPair`, constraints, operações CAD do livro, gradação ou PDF para corte. Geometrias são inteiramente inventadas e indicadas como não aptas para corte. O termo `pieces` no schema 0.2 representa apenas **grupos de esboço**, sem semântica de vestuário.

**Gate APP:** experimental. **Gate B — PILOT-001:** NO-GO.

## Operações transacionais — esquema 0.3.0

No editor experimental, `ADD_ENTITY`, `REMOVE_ENTITY` e `MOVE_POINT` são reversíveis com undo/redo mesmo após salvar e reabrir JSON 0.3.0. É possível acrescentar linhas/Béziers a diferentes grupos e remover todas as entidades.

O esquema guarda `initialEntities` e valida a cadeia inteira por reversão/reprodução. Detecta alterações parciais nos eventos, mas **não é assinatura criptográfica**. IDs adicionados não podem ser reutilizados depois de remoção. `0.2.0` só é convertido com confirmação explícita no importador; `0.1.0` permanece no editor inicial.

Isso não adiciona costuras, regras do livro, gradação ou formas aptas a corte; Gate B segue NO-GO.
