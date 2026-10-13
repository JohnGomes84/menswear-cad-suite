import { describe, expect, it } from "vitest";
import { cmToMm, createEditor, demoProject, exportProject, importProject, moveControl, redo, undo, validateProject } from "./domain";

describe("synthetic project contract", () => {
  it("uses mm as canonical unit and marks synthetic purpose", () => {
    const p = demoProject();
    expect(p.unit).toBe("mm");
    expect(p.purpose).toBe("SYNTHETIC_ONLY");
    expect(cmToMm(5)).toBe(50);
  });

  it("roundtrips unchanged with stable ID and mode", () => {
    const p = demoProject();
    expect(importProject(exportProject(p))).toEqual(p);
  });

  it("rejects unknown format, purpose and non-finite numbers", () => {
    const p = demoProject();
    expect(() => validateProject({ ...p, formatVersion: "1.0" })).toThrow("Versão");
    expect(() => validateProject({ ...p, purpose: "REAL_PATTERN" })).toThrow("sintéticos");
    const bad = demoProject();
    bad.curve.controlPointsMm[0].x = Infinity;
    expect(() => validateProject(bad)).toThrow("curva");
  });

  it("requires explicit FREE mode for direct manipulation", () => {
    const state = createEditor();
    state.project.curve.editMode = "PARAMETRIC";
    expect(() => moveControl(state, 0, { x: 40, y: 20 })).toThrow("override");
  });

  it("moves one control point and retains revision and history", () => {
    const s = moveControl(createEditor(), 1, { x: 45, y: 25 });
    expect(s.project.curve.controlPointsMm[1]).toEqual({ x: 45, y: 25 });
    expect(s.project.curve.revision).toBe(1);
    expect(s.project.history).toHaveLength(1);
    expect(importProject(exportProject(s.project)).history).toHaveLength(1);
  });

  it("undoes, redoes, and invalidates redo after diverging edit", () => {
    const first = createEditor();
    const second = moveControl(first, 1, { x: 60, y: 15 });
    const backward = undo(second);
    expect(backward.project.curve.controlPointsMm[1]).toEqual(first.project.curve.controlPointsMm[1]);
    expect(redo(backward).project.curve.controlPointsMm[1]).toEqual({ x: 60, y: 15 });
    const divergent = moveControl(backward, 2, { x: 180, y: 30 });
    expect(divergent.future).toHaveLength(0);
  });

  it("rejects invalid event history rather than trusting imported records", () => {
    const p = demoProject();
    const raw = { ...p, history: [{ kind: "EVAL", before: {x:0,y:0}, after: {x:2,y:3} }] };
    expect(() => validateProject(raw)).toThrow("Evento do histórico inválido");
  });

  it("disallows oversized project files", () => {
    expect(() => importProject(" ".repeat(1024 * 1024 + 1))).toThrow("1 MB");
  });
});
