/**
 * Contratos APENAS do projeto sintético de laboratório (schema 0.1.0).
 * Não representa os moldes do livro nem é formato de produção.
 */
export type Vec2 = { x: number; y: number };
export type PointIndex = 0 | 1 | 2 | 3;
export type EditMode = "PARAMETRIC" | "PARAMETRIC_OVERRIDE" | "FREE";
export type FindingState = "PASS" | "FAIL" | "WARNING" | "NOT_RUN" | "NOT_YET_DEFINED";

export type Curve = {
  id: string;
  kind: "CUBIC_BEZIER";
  revision: number;
  editMode: EditMode;
  controlPointsMm: [Vec2, Vec2, Vec2, Vec2];
};

export type EditEvent = {
  kind: "MOVE_CONTROL_POINT";
  curveId: string;
  controlPointIndex: PointIndex;
  before: Vec2;
  after: Vec2;
  revision: number;
};

export type SyntheticProject = {
  formatVersion: "0.1.0";
  purpose: "SYNTHETIC_ONLY";
  projectId: string;
  unit: "mm";
  curve: Curve;
  history: EditEvent[];
  validation: FindingState;
};

export type EditorState = {
  project: SyntheticProject;
  past: SyntheticProject[];
  future: SyntheticProject[];
};

const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isPoint = (v: unknown): v is Vec2 =>
  isRecord(v) && finite(v.x) && finite(v.y);
const isIndex = (v: unknown): v is PointIndex =>
  v === 0 || v === 1 || v === 2 || v === 3;
const validMode = (v: unknown): v is EditMode =>
  v === "FREE" || v === "PARAMETRIC" || v === "PARAMETRIC_OVERRIDE";
const validFinding = (v: unknown): v is FindingState =>
  ["PASS", "FAIL", "WARNING", "NOT_RUN", "NOT_YET_DEFINED"].includes(String(v));

export function cmToMm(valueCm: number): number {
  if (!finite(valueCm)) throw new Error("Medida inválida");
  return valueCm * 10;
}

export function demoProject(): SyntheticProject {
  return {
    formatVersion: "0.1.0",
    purpose: "SYNTHETIC_ONLY",
    projectId: "synthetic-curve-lab",
    unit: "mm",
    curve: {
      id: "curve-001",
      kind: "CUBIC_BEZIER",
      revision: 0,
      editMode: "FREE",
      controlPointsMm: [
        { x: 25, y: 130 },
        { x: 35, y: 25 },
        { x: 170, y: 15 },
        { x: 205, y: 115 }
      ]
    },
    history: [],
    validation: "NOT_YET_DEFINED"
  };
}

export function validateProject(value: unknown): SyntheticProject {
  if (!isRecord(value)) throw new Error("Projeto inválido: objeto esperado");
  if (value.formatVersion !== "0.1.0") throw new Error("Versão de projeto não suportada");
  if (value.purpose !== "SYNTHETIC_ONLY") throw new Error("Somente projetos sintéticos são permitidos");
  if (value.unit !== "mm") throw new Error("Unidade canônica deve ser mm");
  if (typeof value.projectId !== "string" || !value.projectId || value.projectId.length > 120) {
    throw new Error("Identificador de projeto inválido");
  }
  if (!isRecord(value.curve)) throw new Error("Curva não encontrada");
  const curve = value.curve;
  if (curve.kind !== "CUBIC_BEZIER" || typeof curve.id !== "string" ||
      !curve.id || curve.id.length > 120 || !validMode(curve.editMode) ||
      !Number.isSafeInteger(curve.revision) || (curve.revision as number) < 0 ||
      !Array.isArray(curve.controlPointsMm) || curve.controlPointsMm.length !== 4 ||
      !curve.controlPointsMm.every(isPoint)) {
    throw new Error("Dados da curva inválidos");
  }
  if (!validFinding(value.validation)) throw new Error("Estado de validação desconhecido");
  if (!Array.isArray(value.history) || value.history.length > 10000) {
    throw new Error("Histórico inválido");
  }
  let previousRevision = 0;
  for (const event of value.history) {
    if (!isRecord(event) || event.kind !== "MOVE_CONTROL_POINT" ||
        event.curveId !== curve.id || !isIndex(event.controlPointIndex) ||
        !isPoint(event.before) || !isPoint(event.after) ||
        !Number.isSafeInteger(event.revision) || (event.revision as number) <= previousRevision) {
      throw new Error("Evento do histórico inválido");
    }
    previousRevision = event.revision as number;
  }
  if (previousRevision > (curve.revision as number)) throw new Error("Histórico mais novo que a geometria");

  // Reconstrução explícita: não executar funções ou protótipos da entrada.
  return {
    formatVersion: "0.1.0",
    purpose: "SYNTHETIC_ONLY",
    unit: "mm",
    projectId: value.projectId,
    curve: {
      id: curve.id as string,
      kind: "CUBIC_BEZIER",
      revision: curve.revision as number,
      editMode: curve.editMode as EditMode,
      controlPointsMm: (curve.controlPointsMm as Vec2[]).map(p => ({ x: p.x, y: p.y })) as Curve["controlPointsMm"]
    },
    history: value.history.map(v => {
      const e = v as unknown as EditEvent;
      return {
        kind: "MOVE_CONTROL_POINT" as const,
        curveId: e.curveId,
        controlPointIndex: e.controlPointIndex,
        before: { x: e.before.x, y: e.before.y },
        after: { x: e.after.x, y: e.after.y },
        revision: e.revision
      };
    }),
    validation: value.validation as FindingState
  };
}

export function createEditor(project: SyntheticProject = demoProject()): EditorState {
  return { project: validateProject(project), past: [], future: [] };
}

export function moveControl(state: EditorState, index: PointIndex, position: Vec2): EditorState {
  if (!isPoint(position)) throw new Error("Coordenadas não finitas");
  if (state.project.curve.editMode !== "FREE") {
    throw new Error("Modo paramétrico: alteração exige override ou desvinculação explícita");
  }
  const before = state.project.curve.controlPointsMm[index];
  if (before.x === position.x && before.y === position.y) return state;
  const controlPointsMm = state.project.curve.controlPointsMm.map(
    (p, i) => i === index ? { x: position.x, y: position.y } : { ...p }
  ) as Curve["controlPointsMm"];
  const revision = state.project.curve.revision + 1;
  const event: EditEvent = {
    kind: "MOVE_CONTROL_POINT",
    curveId: state.project.curve.id,
    controlPointIndex: index,
    before: { ...before },
    after: { ...position },
    revision
  };
  const next: SyntheticProject = {
    ...state.project,
    curve: { ...state.project.curve, controlPointsMm, revision },
    history: [...state.project.history, event],
    validation: "NOT_YET_DEFINED"
  };
  return { project: next, past: [...state.past, state.project], future: [] };
}

export function undo(state: EditorState): EditorState {
  if (!state.past.length) return state;
  const previous = state.past[state.past.length - 1];
  return { project: previous, past: state.past.slice(0, -1), future: [...state.future, state.project] };
}

export function redo(state: EditorState): EditorState {
  if (!state.future.length) return state;
  const next = state.future[state.future.length - 1];
  return { project: next, past: [...state.past, state.project], future: state.future.slice(0, -1) };
}

export function exportProject(project: SyntheticProject): string {
  return JSON.stringify(validateProject(project), null, 2) + "\n";
}

export function importProject(json: string): SyntheticProject {
  if (json.length > 1024 * 1024) throw new Error("Arquivo de laboratório excede 1 MB");
  return validateProject(JSON.parse(json) as unknown);
}
