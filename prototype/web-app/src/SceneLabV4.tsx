import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, PointerEvent } from "react";
import type { ConstrainedEditorV4, ConstrainedSceneV4 } from "./constrainedSceneV4";
import {
  addDirectedConstraintV4, createConstrainedEditorV4, createConstrainedV4,
  migrateV3ToConstrainedV4, moveDrivingPointV4, parseConstrainedV4,
  redoConstrainedV4, removeDirectedConstraintV4, serializeConstrainedV4,
  undoConstrainedV4, updateDirectedConstraintV4
} from "./constrainedSceneV4";
import type { ControlRef, DirectedConstraint } from "./constraints";
import { solveDirectedConstraints } from "./constraints";
import type { SketchEntity } from "./scene";
import { exampleSceneV3, parseSceneV3 } from "./sceneV3";
import type { Vec2 } from "./domain";

type View = { x: number; y: number; width: number; height: number };
type Drag =
  | { kind: "DRIVER"; pointerId: number; ref: ControlRef }
  | { kind: "PAN"; pointerId: number; lastX: number; lastY: number };
type ConstraintKind = DirectedConstraint["kind"];
type Draft = {
  id: string;
  kind: ConstraintKind;
  sourceEntityId: string;
  sourcePointIndex: number;
  targetEntityId: string;
  targetPointIndex: number;
  distanceMm: string;
};

const initialView: View = { x: 0, y: 0, width: 240, height: 160 };
const formatMm = (value: number) => `${value.toFixed(2)} mm`;
const cloneEntity = (entity: SketchEntity): SketchEntity => ({
  ...entity,
  pointsMm: entity.pointsMm.map(point => ({ x: point.x, y: point.y }))
});
const sameRef = (a: ControlRef, b: ControlRef) =>
  a.entityId === b.entityId && a.pointIndex === b.pointIndex;
const targetKey = (ref: ControlRef) => `${ref.entityId}#${ref.pointIndex}`;
const pointRefLabel = (ref: ControlRef) => `${ref.entityId}:P${ref.pointIndex}`;

function nextRuleId(project: ConstrainedSceneV4): string {
  const used = new Set(project.history.flatMap(event =>
    event.kind === "ADD_CONSTRAINT" ? [event.constraint.id] : []
  ));
  for (let i = 1; i <= 5000; i++) {
    const id = `rule-${i}`;
    if (!used.has(id)) return id;
  }
  throw new Error("Limite de IDs de regra do laboratório atingido");
}

function createDraft(project: ConstrainedSceneV4): Draft {
  const ids = new Set(project.driverEntities.map(entity => entity.id));
  const entityId = ids.has("line-a") ? "line-a" : project.driverEntities[0]?.id ?? "";
  const entity = project.driverEntities.find(item => item.id === entityId);
  return {
    id: nextRuleId(project), kind: "HORIZONTAL",
    sourceEntityId: entityId, sourcePointIndex: 0,
    targetEntityId: entityId, targetPointIndex: Math.min(1, (entity?.pointsMm.length ?? 1) - 1),
    distanceMm: "50"
  };
}

function draftFromRule(rule: DirectedConstraint): Draft {
  return {
    id: rule.id, kind: rule.kind,
    sourceEntityId: rule.source.entityId, sourcePointIndex: rule.source.pointIndex,
    targetEntityId: rule.target.entityId, targetPointIndex: rule.target.pointIndex,
    distanceMm: rule.kind === "DISTANCE" ? String(rule.distanceMm) : "50"
  };
}

function constraintFromDraft(draft: Draft, id = draft.id): DirectedConstraint {
  const common = {
    id,
    source: { entityId: draft.sourceEntityId, pointIndex: draft.sourcePointIndex },
    target: { entityId: draft.targetEntityId, pointIndex: draft.targetPointIndex }
  };
  if (draft.kind === "DISTANCE") {
    const distanceMm = Number(draft.distanceMm);
    if (!Number.isFinite(distanceMm) || distanceMm < 0)
      throw new Error("Informe uma distância finita e não negativa em mm");
    return { ...common, kind: "DISTANCE", distanceMm };
  }
  return { ...common, kind: draft.kind };
}

function pathFor(entity: SketchEntity): string {
  const p = entity.pointsMm;
  return entity.kind === "LINE"
    ? `M ${p[0].x} ${p[0].y} L ${p[1].x} ${p[1].y}`
    : `M ${p[0].x} ${p[0].y} C ${p[1].x} ${p[1].y}, ${p[2].x} ${p[2].y}, ${p[3].x} ${p[3].y}`;
}

export default function SceneLabV4({
  editor, onChange, onBack
}: {
  editor: ConstrainedEditorV4;
  onChange: (next: ConstrainedEditorV4) => void;
  onBack: () => void;
}) {
  const [view, setView] = useState<View>(initialView);
  const [selectedEntityId, setSelectedEntityId] = useState("line-a");
  const [selectedPoint, setSelectedPoint] = useState<ControlRef | null>(null);
  const [preview, setPreview] = useState<{ ref: ControlRef; point: Vec2 } | null>(null);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => createDraft(editor.project));
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const driverEntities = editor.project.driverEntities;
  const selectedEntity = driverEntities.find(entity => entity.id === selectedEntityId) ?? driverEntities[0];
  const activeConstraints = editor.project.constraints;

  const previewDrivers = useMemo(() => {
    const entities = driverEntities.map(cloneEntity);
    if (!preview) return entities;
    const entity = entities.find(item => item.id === preview.ref.entityId);
    if (entity && entity.pointsMm[preview.ref.pointIndex])
      entity.pointsMm[preview.ref.pointIndex] = { ...preview.point };
    return entities;
  }, [driverEntities, preview]);

  const solution = useMemo(
    () => solveDirectedConstraints(previewDrivers, activeConstraints),
    [previewDrivers, activeConstraints]
  );
  const resolvedEntities = solution.status === "SOLVED"
    ? solution.entities : editor.project.resolvedEntities;
  const selectedResolved = resolvedEntities.find(entity => entity.id === selectedEntity?.id);

  const world = (event: PointerEvent<SVGSVGElement>): Vec2 => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return { x: 0, y: 0 };
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const mapped = point.matrixTransform(matrix.inverse());
    return { x: Math.round(mapped.x * 1000) / 1000, y: Math.round(mapped.y * 1000) / 1000 };
  };

  const targetRefs = useMemo(
    () => new Set(activeConstraints.map(constraint => targetKey(constraint.target))),
    [activeConstraints]
  );

  const startDriverMove = (event: PointerEvent<SVGCircleElement>, ref: ControlRef) => {
    if (targetRefs.has(targetKey(ref))) {
      setMessage("Ponto alvo condicionado: mova a origem da relação, não o resultado resolvido.");
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setSelectedEntityId(ref.entityId);
    setSelectedPoint(ref);
    setMessage("");
    svgRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = { kind: "DRIVER", pointerId: event.pointerId, ref };
  };

  const startPan = (event: PointerEvent<SVGSVGElement>) => {
    const target = event.target as SVGElement;
    if (target === event.currentTarget || target.dataset.pan === "true") {
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = { kind: "PAN", pointerId: event.pointerId, lastX: event.clientX, lastY: event.clientY };
    }
  };

  const movePointer = (event: PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.kind === "DRIVER") {
      setPreview({ ref: drag.ref, point: world(event) });
      return;
    }
    const matrix = svgRef.current?.getScreenCTM();
    const svg = svgRef.current;
    if (!matrix || !svg) return;
    const from = svg.createSVGPoint();
    const to = svg.createSVGPoint();
    from.x = drag.lastX; from.y = drag.lastY;
    to.x = event.clientX; to.y = event.clientY;
    const a = from.matrixTransform(matrix.inverse());
    const b = to.matrixTransform(matrix.inverse());
    setView(current => ({ ...current, x: current.x - (b.x - a.x), y: current.y - (b.y - a.y) }));
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
  };

  const endPointer = (event: PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    try {
      if (drag.kind === "DRIVER") {
        onChange(moveDrivingPointV4(editor, drag.ref, world(event)));
        setMessage("");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setPreview(null);
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const zoom = (factor: number) => setView(current => ({
    x: current.x + current.width * (1 - factor) / 2,
    y: current.y + current.height * (1 - factor) / 2,
    width: current.width * factor,
    height: current.height * factor
  }));

  const saveRule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const rule = constraintFromDraft(draft, editingId ?? draft.id);
      const next = editingId
        ? updateDirectedConstraintV4(editor, editingId, rule)
        : addDirectedConstraintV4(editor, rule);
      onChange(next);
      setMessage("");
      setEditingId(null);
      setDraft(createDraft(next.project));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const editRule = (rule: DirectedConstraint) => {
    setEditingId(rule.id);
    setDraft(draftFromRule(rule));
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(createDraft(editor.project));
    setMessage("");
  };

  const removeRule = (id: string) => {
    try {
      const next = removeDirectedConstraintV4(editor, id);
      onChange(next);
      if (editingId === id) {
        setEditingId(null);
        setDraft(createDraft(next.project));
      }
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const download = () => {
    const blob = new Blob([serializeConstrainedV4(editor.project)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cena-sintetica-0.4.cadlab.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const openFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error("Arquivo excede 1 MB");
      const raw = await file.text();
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed !== "object" || parsed === null || !("formatVersion" in parsed))
        throw new Error("Arquivo de laboratório sem versão declarada");
      if (parsed.formatVersion === "0.4.0") {
        const project = parseConstrainedV4(raw);
        const next = createConstrainedEditorV4(project);
        onChange(next);
        setDraft(createDraft(next.project));
      } else if (parsed.formatVersion === "0.3.0") {
        if (!window.confirm("Migrar explicitamente esta cena sintética 0.3.0 para o overlay de constraints 0.4.0? O arquivo original não será alterado."))
          return;
        const scene = parseSceneV3(raw);
        const next = createConstrainedEditorV4(migrateV3ToConstrainedV4(scene));
        onChange(next);
        setDraft(createDraft(next.project));
      } else {
        throw new Error("Formato não suportado: importe JSON 0.4.0 ou confirme explicitamente a migração 0.3.0");
      }
      setEditingId(null);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      event.target.value = "";
    }
  };

  const startNew = () => {
    if (editor.project.history.length && !window.confirm("Descartar a sessão 0.4 atual e carregar um novo exemplo sintético? Salve o JSON se quiser conservar esta sessão."))
      return;
    const next = createConstrainedEditorV4(createConstrainedV4(exampleSceneV3()));
    onChange(next);
    setSelectedEntityId("line-a");
    setSelectedPoint(null);
    setEditingId(null);
    setDraft(createDraft(next.project));
    setView(initialView);
    setMessage("");
  };

  const setEntityForDraft = (which: "source" | "target", entityId: string) => {
    setDraft(current => which === "source"
      ? { ...current, sourceEntityId: entityId, sourcePointIndex: 0 }
      : { ...current, targetEntityId: entityId, targetPointIndex: 0 });
  };

  const renderEntityOptions = () => driverEntities.map(entity =>
    <option value={entity.id} key={entity.id}>{entity.id} — {entity.kind === "LINE" ? "linha" : "Bézier"}</option>
  );

  const renderPointOptions = (entityId: string) => {
    const entity = driverEntities.find(item => item.id === entityId);
    return (entity?.pointsMm ?? []).map((_, index) =>
      <option value={index} key={index}>P{index}</option>
    );
  };

  const constraints = editor.project.constraints;
  const eventCount = editor.project.history.length;
  const solverError = solution.status === "BLOCKED"
    ? `${solution.finding.code}: ${solution.finding.message}` : "";

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">M</div><div><strong>Menswear CAD</strong><span>Laboratório persistente</span></div></div>
      <div className="menu-title">NAVEGAÇÃO</div>
      <button className="nav-button" onClick={onBack}>← Laboratório 0.3</button>
      <button className="nav-button active">◉ Constraints persistidas</button>
      <div className="sidebar-foot"><span className="status-dot"/> Schema 0.4.0 sintético<br/><small>Não apto para corte · Gate B NO-GO</small></div>
    </aside>
    <main className="workspace">
      <header className="topbar">
        <div><span className="breadcrumb">Workspace / Laboratório / </span><strong>Constraints persistidas 0.4</strong></div>
        <div className="top-actions">
          <button onClick={onBack}>Voltar ao 0.3</button>
          <button onClick={startNew}>Novo exemplo 0.4</button>
          <button onClick={() => fileRef.current?.click()}>Abrir JSON</button>
          <button className="primary" onClick={download}>Salvar JSON 0.4</button>
          <input ref={fileRef} hidden type="file" accept=".json,application/json" onChange={openFile} aria-label="Selecionar arquivo JSON de laboratório" />
        </div>
      </header>
      <div className="content">
        <div className="heading">
          <div><h1>Constraints dirigidas — 0.4.0</h1><p>Regras persistidas e reavaliadas em mm; geometria sintética, solver acíclico de uma regra por alvo.</p></div>
          <span className="pill">LABORATÓRIO · NÃO APTO PARA CORTE</span>
        </div>
        <div className="warning" data-testid="v4-safety-notice"><strong>Não utilizar para corte.</strong> Este modo contém apenas entidades sintéticas e não valida blocos de vestuário.</div>
        {message && <div className="error" role="alert" data-testid="v4-error">{message}</div>}
        {!message && solverError && <div className="error" role="alert" data-testid="v4-error">{solverError}</div>}
        <div className="editor-layout v4-layout">
          <section className="board">
            <div className="toolbar">
              <div className="tool-left"><span className="tool-label">DIRECTED CONSTRAINTS · 0.4.0</span><span className="separator" />
                <button onClick={() => { onChange(undoConstrainedV4(editor)); setMessage(""); }}>↶ Desfazer</button>
                <button onClick={() => { onChange(redoConstrainedV4(editor)); setMessage(""); }}>↷ Refazer</button>
              </div>
              <div className="tool-right"><button aria-label="Zoom menos" onClick={() => zoom(1.2)}>−</button><span>{Math.round(240 / view.width * 100)}%</span><button aria-label="Zoom mais" onClick={() => zoom(1 / 1.2)}>+</button><button onClick={() => setView(initialView)}>Enquadrar</button></div>
            </div>
            <svg ref={svgRef} className="drawing" data-testid="v4-viewport" viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} onPointerDown={startPan} onPointerMove={movePointer} onPointerUp={endPointer} onPointerCancel={endPointer}>
              <defs>
                <pattern id="v4-grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="#dbe5f1" strokeWidth=".25" /></pattern>
                <marker id="v4-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#bd7a32" /></marker>
              </defs>
              <rect data-pan="true" x="-2000" y="-2000" width="5000" height="5000" fill="#fbfdff" />
              <rect data-pan="true" x="-2000" y="-2000" width="5000" height="5000" fill="url(#v4-grid)" />
              {previewDrivers.map(driver => {
                const resolved = resolvedEntities.find(entity => entity.id === driver.id) ?? driver;
                const active = selectedEntity?.id === driver.id;
                return <g key={driver.id}>
                  <path data-testid={`driver-path-${driver.id}`} d={pathFor(driver)} fill="none" stroke="#9aabc2" strokeWidth=".9" strokeDasharray="2 1.5" />
                  <path data-testid={`resolved-path-${driver.id}`} d={pathFor(resolved)} fill="none" stroke={active ? "#2358bb" : "#587da9"} strokeWidth={active ? "1.6" : "1.1"} onClick={() => setSelectedEntityId(driver.id)} style={{ cursor: "pointer" }} />
                  {active && driver.pointsMm.map((point, index) => {
                    const ref = { entityId: driver.id, pointIndex: index };
                    const target = targetRefs.has(targetKey(ref));
                    const source = constraints.some(rule => sameRef(rule.source, ref));
                    const resolvedPoint = resolved.pointsMm[index];
                    return <g key={index}>
                      <circle data-testid={`driver-point-${driver.id}-${index}`} cx={point.x} cy={point.y} r="4" fill={target ? "#f2eee7" : "transparent"} stroke={source ? "#4a8d65" : "#2358bb"} strokeWidth=".7" style={{ cursor: target ? "not-allowed" : "grab" }} onPointerDown={event => startDriverMove(event, ref)} />
                      <circle cx={point.x} cy={point.y} r="1.4" fill={target ? "#bd7a32" : source ? "#4a8d65" : "#fff"} stroke={target ? "#a76224" : "#2358bb"} strokeWidth=".6" pointerEvents="none" />
                      {target && <circle data-testid={`resolved-point-${driver.id}-${index}`} cx={resolvedPoint.x} cy={resolvedPoint.y} r="2.2" fill="#e2a94f" stroke="#885619" strokeWidth=".6" pointerEvents="none" />}
                      <text x={point.x + 4} y={point.y - 4} fontSize="3.5" fill="#526e93" pointerEvents="none">P{index}</text>
                    </g>;
                  })}
                </g>;
              })}
              {constraints.map(rule => {
                const sourceEntity = resolvedEntities.find(entity => entity.id === rule.source.entityId);
                const targetEntity = resolvedEntities.find(entity => entity.id === rule.target.entityId);
                const source = sourceEntity?.pointsMm[rule.source.pointIndex];
                const target = targetEntity?.pointsMm[rule.target.pointIndex];
                return source && target ? <g key={rule.id}>
                  <line data-testid={`constraint-link-${rule.id}`} x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="#bd7a32" strokeWidth=".8" strokeDasharray="1.5 1" markerEnd="url(#v4-arrow)" pointerEvents="none" />
                  <text data-testid={`constraint-label-${rule.id}`} x={(source.x + target.x) / 2 + 1} y={(source.y + target.y) / 2 - 1} fontSize="3.5" fontWeight="700" fill="#805010" pointerEvents="none">{rule.id}</text>
                </g> : null;
              })}
            </svg>
            <div className="board-footer"><span>Tracejado = driver/autoral; azul = resolvido; âmbar = alvo condicionado.</span><span>Unidade: mm</span></div>
          </section>
          <aside className="inspector v4-inspector">
            <h2>Entidades e pontos</h2>
            <div className="v4-entity-list">
              {driverEntities.map(entity => <button key={entity.id} className={`point-row ${entity.id === selectedEntity?.id ? "chosen" : ""}`} onClick={() => { setSelectedEntityId(entity.id); setSelectedPoint(null); }}>
                <b>{entity.id}</b><span>{entity.kind === "LINE" ? "Linha" : "Bézier"}</span><span>{entity.mode}</span>
              </button>)}
            </div>
            {selectedEntity && <>
              <h3>Coordenadas: {selectedEntity.id}</h3>
              {selectedEntity.pointsMm.map((point, index) => {
                const ref = { entityId: selectedEntity.id, pointIndex: index };
                const resolved = selectedResolved?.pointsMm[index] ?? point;
                const isSelected = selectedPoint !== null && sameRef(selectedPoint, ref);
                return <button key={index} className={`point-row v4-coordinate-row ${isSelected ? "chosen" : ""}`} onClick={() => setSelectedPoint(ref)}>
                  <b>P{index}</b><span>D {formatMm(point.x)}, {formatMm(point.y)}</span><span>R {formatMm(resolved.x)}, {formatMm(resolved.y)}</span>
                </button>;
              })}
            </>}
            <hr />
            <h2>Constraints ativas</h2>
            {constraints.length === 0 && <p className="hint">Nenhuma regra ativa. A geometria driver coincide com a resolvida.</p>}
            <div className="v4-constraint-list">
              {constraints.map(rule => <div className="v4-constraint-card" data-testid={`constraint-row-${rule.id}`} key={rule.id}>
                <strong>{rule.id}</strong><span>{rule.kind}{rule.kind === "DISTANCE" ? ` · ${rule.distanceMm} mm` : ""}</span>
                <small>{pointRefLabel(rule.source)} → {pointRefLabel(rule.target)}</small>
                <div className="tool-left"><button aria-label={`Editar ${rule.id}`} onClick={() => editRule(rule)}>Editar</button><button aria-label={`Remover ${rule.id}`} onClick={() => removeRule(rule.id)}>Remover</button></div>
              </div>)}
            </div>
            <hr />
            <h2>{editingId ? `Editar ${editingId}` : "Nova regra dirigida"}</h2>
            <form className="v4-form" onSubmit={saveRule}>
              <label>ID estável<input aria-label="ID da regra" value={draft.id} readOnly /></label>
              <label>Tipo<select aria-label="Tipo de constraint" value={draft.kind} onChange={event => setDraft(current => ({ ...current, kind: event.target.value as ConstraintKind }))}>
                <option value="COINCIDENT">COINCIDENT</option><option value="HORIZONTAL">HORIZONTAL</option><option value="VERTICAL">VERTICAL</option><option value="DISTANCE">DISTANCE</option>
              </select></label>
              <label>Entidade de origem<select aria-label="Entidade de origem" value={draft.sourceEntityId} onChange={event => setEntityForDraft("source", event.target.value)}>{renderEntityOptions()}</select></label>
              <label>Ponto de origem<select aria-label="Ponto de origem" value={draft.sourcePointIndex} onChange={event => setDraft(current => ({ ...current, sourcePointIndex: Number(event.target.value) }))}>{renderPointOptions(draft.sourceEntityId)}</select></label>
              <label>Entidade de alvo<select aria-label="Entidade de alvo" value={draft.targetEntityId} onChange={event => setEntityForDraft("target", event.target.value)}>{renderEntityOptions()}</select></label>
              <label>Ponto de alvo<select aria-label="Ponto de alvo" value={draft.targetPointIndex} onChange={event => setDraft(current => ({ ...current, targetPointIndex: Number(event.target.value) }))}>{renderPointOptions(draft.targetEntityId)}</select></label>
              {draft.kind === "DISTANCE" && <label>Distância (mm)<input aria-label="Distância em mm" type="number" min="0" step="any" value={draft.distanceMm} onChange={event => setDraft(current => ({ ...current, distanceMm: event.target.value }))} required /></label>}
              <div className="tool-left"><button className="primary" type="submit">{editingId ? "Atualizar regra" : "Adicionar regra"}</button>{editingId && <button type="button" onClick={cancelEdit}>Cancelar</button>}</div>
            </form>
            <div className="inspector-note">O solver 0.4 aceita uma regra por ponto-alvo. Regras duplicadas, ciclos e direção indefinida são recusados; não há solver simultâneo nem semântica de vestuário.</div>
          </aside>
        </div>
        <div className="stats v4-stats">
          <div><span>Formato</span><strong>0.4.0</strong></div><div><span>Regras ativas</span><strong>{constraints.length}</strong></div><div><span>Eventos reversíveis</span><strong>{eventCount}</strong></div><div><span>Estado</span><strong>{solution.status === "SOLVED" ? "SOLVED · SINTÉTICO" : solution.finding.code}</strong></div>
        </div>
      </div>
    </main>
  </div>;
}
