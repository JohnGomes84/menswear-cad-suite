import { useMemo, useRef, useState } from "react";
import SceneLab from "./SceneLab";
import type { ChangeEvent, PointerEvent } from "react";
import {
  createEditor, demoProject, exportProject, importProject,
  moveControl, redo, undo
} from "./domain";
import type { EditorState, PointIndex, Vec2 } from "./domain";
import { evaluateSyntheticCurve } from "./geometry";
import type { CubicControls } from "./geometry";

type ViewBox = { x: number; y: number; width: number; height: number };
type DragState =
  | { kind: "POINT"; pointerId: number; index: PointIndex }
  | { kind: "PAN"; pointerId: number; lastX: number; lastY: number };

const initialView: ViewBox = { x: 0, y: 0, width: 240, height: 160 };
const formatMm = (value: number) => value.toFixed(2) + " mm";

export default function App() {
  const [multiEntity, setMultiEntity] = useState(false);
  const [editor, setEditor] = useState<EditorState>(() => createEditor());
  const [view, setView] = useState<ViewBox>(initialView);
  const [selected, setSelected] = useState<PointIndex | null>(null);
  const [preview, setPreview] = useState<{ index: PointIndex; point: Vec2 } | null>(null);
  const [error, setError] = useState<string>("");
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const curve = editor.project.curve;
  const points = curve.controlPointsMm.map((point, index) =>
    preview?.index === index ? preview.point : point
  );
  const path = `M ${points[0].x} ${points[0].y} C ${points[1].x} ${points[1].y}, ${points[2].x} ${points[2].y}, ${points[3].x} ${points[3].y}`;
  // Geometria canônica em mm, calculada sem depender de viewport, zoom ou SVG.
  const geometry = useMemo(() => {
    const controls: CubicControls = [points[0], points[1], points[2], points[3]];
    return evaluateSyntheticCurve(controls);
  }, [curve.controlPointsMm, preview]);

  function world(e: PointerEvent<SVGSVGElement>): Vec2 {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const matrix = svg.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const position = p.matrixTransform(matrix.inverse());
    return { x: Math.round(position.x * 1000) / 1000, y: Math.round(position.y * 1000) / 1000 };
  }

  function pointDown(e: PointerEvent<SVGCircleElement>, index: PointIndex) {
    if (curve.editMode !== "FREE") return;
    e.preventDefault();
    e.stopPropagation();
    setSelected(index);
    setError("");
    svgRef.current?.setPointerCapture(e.pointerId);
    dragRef.current = { kind: "POINT", pointerId: e.pointerId, index };
  }

  function canvasDown(e: PointerEvent<SVGSVGElement>) {
    const target = e.target as SVGElement;
    if (target === e.currentTarget || target.dataset.pan === "true") {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = { kind: "PAN", pointerId: e.pointerId, lastX: e.clientX, lastY: e.clientY };
    }
  }

  function pointerMove(e: PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (drag.kind === "POINT") {
      setPreview({ index: drag.index, point: world(e) });
    } else {
      const svg = svgRef.current;
      const matrix = svg?.getScreenCTM();
      if (svg && matrix) {
        const a = svg.createSVGPoint();
        const b = svg.createSVGPoint();
        a.x = drag.lastX; a.y = drag.lastY;
        b.x = e.clientX; b.y = e.clientY;
        const aw = a.matrixTransform(matrix.inverse());
        const bw = b.matrixTransform(matrix.inverse());
        setView(v => ({ ...v, x: v.x - (bw.x - aw.x), y: v.y - (bw.y - aw.y) }));
      }
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
    }
  }

  function pointerUp(e: PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (drag.kind === "POINT") {
      const point = world(e);
      try { setEditor(s => moveControl(s, drag.index, point)); }
      catch (err) { setError(String(err)); }
      setPreview(null);
    }
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }

  function zoom(factor: number) {
    setView(v => ({
      x: v.x + v.width * (1 - factor) / 2,
      y: v.y + v.height * (1 - factor) / 2,
      width: v.width * factor,
      height: v.height * factor
    }));
  }

  function download() {
    const blob = new Blob([exportProject(editor.project)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "laboratorio-sintetico.cadlab.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function openFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const project = importProject(await file.text());
      setEditor(createEditor(project));
      setSelected(null);
      setPreview(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Arquivo inválido");
    } finally {
      e.target.value = "";
    }
  }

  const active = selected === null ? null : points[selected];
  if (multiEntity) return <SceneLab onBack={() => setMultiEntity(false)} />;
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div><strong>Menswear CAD</strong><span>Laboratório geométrico</span></div>
        </div>
        <div className="menu-title">PROJETO</div>
        <button className="nav-button active">▧ Visão geométrica</button>
        <button className="nav-button" disabled>◉ Medidas do vestuário <small>bloqueado</small></button>
        <button className="nav-button" disabled>♧ Montagem e piques <small>bloqueado</small></button>
        <button className="nav-button" disabled>▤ Exportar para corte <small>bloqueado</small></button>
        <div className="sidebar-foot"><span className="status-dot" /> Gate APP — experimental<br /><small>Gate B do molde: NO-GO</small></div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div><span className="breadcrumb">Workspace / Projetos / </span><strong>Curva sintética 001</strong></div>
          <div className="top-actions">
            <button onClick={() => setMultiEntity(true)}>Editor multi-entidades</button>
            <button onClick={() => { setEditor(createEditor(demoProject())); setSelected(null); setView(initialView); setError(""); }}>Novo exemplo</button>
            <button onClick={() => fileInput.current?.click()}>Abrir JSON</button>
            <button className="primary" onClick={download}>Salvar JSON</button>
            <input ref={fileInput} hidden type="file" accept=".json,application/json" onChange={openFile} />
          </div>
        </header>

        <div className="content">
          <div className="heading">
            <div><h1>Editor paramétrico — laboratório</h1><p>Geometria vetorial em milímetros, com histórico de edição reversível.</p></div>
            <span className="pill">DADOS SINTÉTICOS</span>
          </div>
          <div className="warning"><strong>Não utilizar para corte.</strong> Esta tela usa uma curva artificial e não implementa qualquer bloco de camisa validado.</div>
          {error && <div className="error" role="alert">{error}</div>}

          <div className="editor-layout">
            <section className="board">
              <div className="toolbar">
                <div className="tool-left"><span className="tool-label">CUBIC_BÉZIER</span><span className="separator" /><button onClick={() => setEditor(undo)} disabled={!editor.past.length}>↶ Desfazer</button><button onClick={() => setEditor(redo)} disabled={!editor.future.length}>↷ Refazer</button></div>
                <div className="tool-right"><button onClick={() => zoom(1.25)}>−</button><span>{Math.round(240 / view.width * 100)}%</span><button onClick={() => zoom(0.8)}>+</button><button onClick={() => setView(initialView)}>Enquadrar</button></div>
              </div>
              <svg ref={svgRef} className="drawing" viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} onPointerDown={canvasDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
                <defs><pattern id="mm-grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="#dce5f1" strokeWidth=".25" /></pattern></defs>
                <rect data-pan="true" x="-2000" y="-2000" width="5000" height="5000" fill="#fbfdff" />
                <rect data-pan="true" x="-2000" y="-2000" width="5000" height="5000" fill="url(#mm-grid)" />
                <g>
                  <path d={`M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} M ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y}`} fill="none" stroke="#87a7ce" strokeWidth=".5" strokeDasharray="2 2" />
                  <path d={path} fill="none" stroke="#225bd3" strokeWidth="1.4" strokeLinecap="round" />
                  {geometry.state === "PASS" && geometry.notches.map((notch) => {
                    const p = notch.pointMm;
                    const n = { x: -notch.tangent.y, y: notch.tangent.x };
                    return <line key={notch.fraction}
                      x1={p.x - 2*n.x} y1={p.y - 2*n.y}
                      x2={p.x + 2*n.x} y2={p.y + 2*n.y}
                      stroke="#121f43" strokeWidth=".8" pointerEvents="none" />;
                  })}
                  {points.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="3.6" fill="transparent" style={{ cursor: "grab" }} onPointerDown={e => pointDown(e, i as PointIndex)} />
                      <circle cx={p.x} cy={p.y} r="1.65" pointerEvents="none" fill={selected === i ? "#1739a4" : i === 0 || i === 3 ? "#225bd3" : "#ffffff"} stroke="#225bd3" strokeWidth=".65" />
                      <text x={p.x + 4} y={p.y - 4} fontSize="3.5" fill="#567097" pointerEvents="none">P{i}</text>
                    </g>
                  ))}
                </g>
              </svg>
              <div className="board-footer"><span>Arraste os quatro pontos ou o fundo para navegar.</span><span>Unidade canônica: mm</span></div>
            </section>

            <aside className="inspector">
              <h2>Propriedades</h2>
              <p className="hint">Entidade ativa</p>
              <div className="inspector-item"><span>ID</span><strong>{curve.id}</strong></div>
              <div className="inspector-item"><span>Tipo</span><strong>Bézier cúbica</strong></div>
              <div className="inspector-item"><span>Modo de edição</span><strong>{curve.editMode}</strong></div>
              <div className="inspector-item"><span>Revisão</span><strong>{curve.revision}</strong></div>
              <hr />
              <h3>Pontos de controle</h3>
              {points.map((point, i) => (
                <button className={`point-row ${selected === i ? "chosen" : ""}`} key={i} onClick={() => setSelected(i as PointIndex)}>
                  <b>P{i}</b><span>X {formatMm(point.x)}</span><span>Y {formatMm(point.y)}</span>
                </button>
              ))}
              <hr />
              <h3>Diagnóstico</h3>
              <div className="diagnostic"><span>Comprimento sintético</span><strong>{geometry.state === "PASS" ? formatMm(geometry.lengthMm) : "FAIL"}</strong></div>
              <div className="diagnostic"><span>Piques sintéticos (arco)</span><strong>{geometry.state === "PASS" ? geometry.notches.length + " (POC)" : "FAIL"}</strong></div>
              {geometry.state === "FAIL" && <div className="error">{geometry.message}</div>}
              <div className="diagnostic"><span>Molde masculino</span><strong>NOT_YET_DEFINED</strong></div>
              <div className="inspector-note">Comprimento e piques são calculados sobre a curva paramétrica sintética, sem referência ao zoom. Não representam cava, manga ou marcações de costura.</div>
              {active && <div className="selection">Selecionado: P{selected} — X {formatMm(active.x)} · Y {formatMm(active.y)}</div>}
            </aside>
          </div>
          <div className="stats"><div><span>Entidades</span><strong>01</strong></div><div><span>Eventos persistidos</span><strong>{editor.project.history.length.toString().padStart(2, "0")}</strong></div><div><span>Estado do Gate APP</span><strong>Experimental</strong></div><div><span>Exportação para corte</span><strong>Bloqueada</strong></div></div>
        </div>
      </main>
    </div>
  );
}
