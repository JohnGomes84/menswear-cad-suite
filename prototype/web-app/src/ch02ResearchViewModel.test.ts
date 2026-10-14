import {describe,expect,it} from "vitest";
import {buildCh02ResearchModel} from "./ch02ResearchViewModel";
const standard={seatMm:1020,bodyRiseMm:282,insideLegMm:800,variant:"BASIC" as const};

describe("Aldrich CH02 research workspace model — real interpreter, no invented garment",()=>{
 it.each(["ONE_PIECE","TWO_PIECE"] as const)("reuses CH02 %s source, topology and real point positions",method=>{
  const model=buildCh02ResearchModel(method,standard);
  expect(model.purpose).toBe("RESEARCH_ONLY");
  expect(model.cutReady).toBe(false);
  expect(model.exportAllowed).toBe(false);
  expect(model.mirrorPerformed).toBe(false);
  expect(model.paths).toHaveLength(2);
  expect(model.unresolvedCurveCount).toBe(4);
  expect(model.strokes.every(s=>s.source.methodId==="ALD-CH02-01")).toBe(true);
  expect(model.strokes.filter(s=>s.geometry==="CURVE").every(s=>s.hasSpline===false)).toBe(true);
  expect(model.strokes.filter(s=>s.geometry==="STRAIGHT").every(s=>s.lengthMm>0)).toBe(true);
  expect(model.points.every(p=>Number.isFinite(p.pointMm.x)&&Number.isFinite(p.pointMm.y))).toBe(true);
  expect(model.allowanceRegions).toEqual(["UPPER_WAIST","LOWER_HEM"]);
 });
 it("preserves separate published method sizes and geometry counts",()=>{
  const one=buildCh02ResearchModel("ONE_PIECE",standard);
  const two=buildCh02ResearchModel("TWO_PIECE",standard);
  expect(one.strokes).toHaveLength(7);
  expect(two.strokes).toHaveLength(9);
  expect(one.sourceStraightCount).toBe(3);
  expect(two.sourceStraightCount).toBe(5);
  expect(one.sourcePage).toBe(32);
  expect(two.sourcePage).toBe(33);
 });
 it("regenerates point positions when input measurements change without changing the source methods",()=>{
  const a=buildCh02ResearchModel("ONE_PIECE",standard);
  const b=buildCh02ResearchModel("ONE_PIECE",{...standard,seatMm:1160});
  expect(a.points.map(x=>x.id)).toEqual(b.points.map(x=>x.id));
  expect(a.points.some((p,i)=>p.pointMm.x!==b.points[i].pointMm.x||
                               p.pointMm.y!==b.points[i].pointMm.y)).toBe(true);
  expect(b.paths.map(p=>p.orderedPointIds)).toEqual(a.paths.map(p=>p.orderedPointIds));
  expect(b.unresolvedCurveCount).toBe(4);
 });
 it("supports basic and easy variants through the original drafting program",()=>{
  const a=buildCh02ResearchModel("TWO_PIECE",standard);
  const b=buildCh02ResearchModel("TWO_PIECE",{...standard,variant:"EASY"});
  expect(a.points.some((p,i)=>p.pointMm.x!==b.points[i].pointMm.x||
                               p.pointMm.y!==b.points[i].pointMm.y)).toBe(true);
 });
 it.each([0,-5,Number.NaN,Number.POSITIVE_INFINITY,10000])("rejects invalid seat %s",seatMm=>{
  expect(()=>buildCh02ResearchModel("ONE_PIECE",{...standard,seatMm})).toThrow();
 });
 it("rejects invalid variant and method rather than returning plausible diagrams",()=>{
  expect(()=>buildCh02ResearchModel("ONE_PIECE",{...standard,variant:"FAKE" as never})).toThrow();
  expect(()=>buildCh02ResearchModel("INVALID" as never,standard)).toThrow();
 });
 it("never maps unresolved curves as renderable straight strokes",()=>{
  const model=buildCh02ResearchModel("ONE_PIECE",standard);
  expect(model.strokes.filter(s=>s.geometry==="STRAIGHT").map(s=>s.id))
   .toEqual(["ALD-CH02-1P-FRONT_LOWER_INSEAM","ALD-CH02-1P-BACK_WAIST","ALD-CH02-1P-BACK_LOWER_INSEAM"]);
  expect(model.paths.flatMap(p=>p.orderedPointIds).length).toBeGreaterThan(8);
 });
});