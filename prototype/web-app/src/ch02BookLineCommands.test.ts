import { describe,expect,it } from "vitest";
import registry from "../../../docs/domain/CH02-SOURCE-LINES-001.json";
import {
 ch02SourceLineRegister,resolveCh02BookLineCommands,validateCh02SourceLineRegister
} from "./ch02BookLineCommands";
const basic={seatMm:1020,bodyRiseMm:282,insideLegMm:800,variant:"BASIC" as const};
const easy={...basic,variant:"EASY" as const};
const copy=<T>(x:T):T=>JSON.parse(JSON.stringify(x)) as T;

const independentlyTranscribed=[
 ["ONE_PIECE","FRONT","CURVE","6-7-8"],
 ["ONE_PIECE","FRONT","STRAIGHT","9-11"],
 ["ONE_PIECE","FRONT","CURVE","8-11"],
 ["ONE_PIECE","BACK","STRAIGHT","13-0"],
 ["ONE_PIECE","BACK","CURVE","13-14-16"],
 ["ONE_PIECE","BACK","STRAIGHT","17-18"],
 ["ONE_PIECE","BACK","CURVE","16-18"],
 ["TWO_PIECE","FRONT","CURVE","6-7-8"],
 ["TWO_PIECE","FRONT","STRAIGHT","1-12"],
 ["TWO_PIECE","FRONT","STRAIGHT","13-15"],
 ["TWO_PIECE","FRONT","CURVE","8-15"],
 ["TWO_PIECE","BACK","STRAIGHT","17-18"],
 ["TWO_PIECE","BACK","CURVE","17-19-21"],
 ["TWO_PIECE","BACK","STRAIGHT","18-22"],
 ["TWO_PIECE","BACK","STRAIGHT","24-25"],
 ["TWO_PIECE","BACK","CURVE","21-25"]
];
describe("CH02 source-ordered line commands from PDF p32–34",()=>{
 it("matches independently transcribed book commands and their point sequences",()=>{
  expect(ch02SourceLineRegister.lineCommands.map(row=>[
   row.method,row.section,row.geometry,row.pointIds.join("-")
  ])).toEqual(independentlyTranscribed);
  expect(ch02SourceLineRegister.lineCommands).toHaveLength(16);
  expect(ch02SourceLineRegister.lineCommands.filter(x=>x.geometry==="CURVE")).toHaveLength(8);
  expect(ch02SourceLineRegister.lineCommands.filter(x=>x.geometry==="STRAIGHT")).toHaveLength(8);
 });
 it("sources one-piece commands only from printed page 32 and two-piece from 33",()=>{
  for(const row of ch02SourceLineRegister.lineCommands){
   expect(row.source.methodId).toBe("ALD-CH02-01");
   expect(row.source.pdfPage).toBe(row.method==="ONE_PIECE"?32:33);
   expect(row.source.diagramPdfPage).toBe(34);
   expect(row.industrialRole).toBe("UNCLASSIFIED_NOT_CUT");
  }
 });
 it("preserves both visible 'no seam allowance' labels as region flags, never offsets",()=>{
  expect(ch02SourceLineRegister.figureLabels.map(x=>x.method+":"+x.region)).toEqual([
   "ONE_PIECE:UPPER_WAIST","ONE_PIECE:LOWER_HEM",
   "TWO_PIECE:UPPER_WAIST","TWO_PIECE:LOWER_HEM"
  ]);
  for(const label of ch02SourceLineRegister.figureLabels){
   expect(label.scope).toBe("REGION_CONFIRMED_EDGE_SCOPE_NOT_MAPPED");
   expect(label.textMeaning).toBe("NO_SEAM_ALLOWANCE");
  }
  expect(ch02SourceLineRegister.statements.bookAllowance.widthMm).toBe(10);
  expect(ch02SourceLineRegister.statements.bookAllowance.application).toBe("NO_AUTOMATIC_OFFSET");
 });
 it("keeps one-piece mirror assembly as a documented operation NOT executed",()=>{
  const statement=ch02SourceLineRegister.statements.assembly;
  expect(statement.method).toBe("ONE_PIECE");
  expect(statement.operation).toBe("TRACE_BACK_AND_FRONT_MIRROR_FRONT_ALIGN_SIDE_SEAMS");
  expect(statement.status).toBe("DOCUMENTED_OPERATION_NOT_EXECUTED");
  const result=resolveCh02BookLineCommands("ONE_PIECE",basic);
  expect(result.mirrorPerformed).toBe(false);
 });
 it("resolves three one-piece explicit straight lines in canonical mm",()=>{
  const result=resolveCh02BookLineCommands("ONE_PIECE",basic);
  const straight=result.strokes.filter(x=>x.geometry==="STRAIGHT");
  expect(straight.map(x=>x.pointIds.join("-"))).toEqual(["9-11","13-0","17-18"]);
  for(const row of straight){
   expect(row.lengthMm).toBeGreaterThan(0);
   expect(row.status).toBe("TEXT_EXPLICIT_STRAIGHT_NO_INDUSTRIAL_ROLE");
   expect(row.technicalRole).toBe("DOCUMENTED_LINE_UNCLASSIFIED");
   expect(row.lengthMm).toBeCloseTo(Math.hypot(
    row.startMm.x-row.endMm.x,row.startMm.y-row.endMm.y
   ),9);
  }
  expect(result.strokes).toHaveLength(7);
  expect(result.offsetAllowed).toBe(false);
  expect(result.noCut).toBe(true);
 });
 it("resolves five two-piece explicit straights, not dependency connectors",()=>{
  const result=resolveCh02BookLineCommands("TWO_PIECE",basic);
  expect(result.strokes.filter(x=>x.geometry==="STRAIGHT").map(x=>x.pointIds.join("-")))
   .toEqual(["1-12","13-15","17-18","18-22","24-25"]);
  expect(result.strokes).toHaveLength(9);
  const guide=result.strokes.find(x=>x.geometry==="STRAIGHT"&&x.pointIds.join("-")==="1-12");
  expect(guide).toBeDefined();
  if(!guide||guide.geometry!=="STRAIGHT")throw new Error("1–12 missing");
  expect(guide.startMm).toEqual({x:0,y:302});
  expect(guide.endMm.x).toBeCloseTo(-49.1666666667,8);
  expect(guide.endMm.y).toBeCloseTo(1102,8);
 });
 it("never fabricates a spline for any of eight source curves",()=>{
  for(const method of ["ONE_PIECE","TWO_PIECE"] as const)
   for(const variant of [basic,easy]){
    const result=resolveCh02BookLineCommands(method,variant);
    const curves=result.strokes.filter(x=>x.geometry==="CURVE");
    expect(curves).toHaveLength(4);
    for(const row of curves){
     expect(row.status).toBe("SOURCE_CURVE_REQUIREMENTS_PENDING");
     expect(row.hasSpline).toBe(false);
     expect(row.technicalRole).toBe("DOCUMENTED_CURVE_UNRESOLVED");
     expect(row.anchorsMm).toHaveLength(row.pointIds.length);
     expect("pathD" in row).toBe(false);
     expect("bezier" in row).toBe(false);
    }
   }
 });
 it("varied measurements and ease change correct positions, not the book's instructions",()=>{
  const baseline=resolveCh02BookLineCommands("TWO_PIECE",basic);
  const larger=resolveCh02BookLineCommands("TWO_PIECE",{
   seatMm:1080,bodyRiseMm:300,insideLegMm:840,variant:"EASY"
  });
  expect(larger.strokes.map(x=>x.pointIds)).toEqual(baseline.strokes.map(x=>x.pointIds));
  const a=baseline.strokes.find(x=>x.id==="ALD-CH02-2P-FRONT_LEG_GUIDE");
  const b=larger.strokes.find(x=>x.id==="ALD-CH02-2P-FRONT_LEG_GUIDE");
  if(!a||!b||a.geometry!=="STRAIGHT"||b.geometry!=="STRAIGHT")throw new Error("fixture missing");
  expect(a.endMm.y).toBe(1102);
  expect(b.endMm.y).toBe(1160+20); // EASY rise 340, 840 inside leg
 });
 it("rejects forged seam/cut roles, undocumented source pages or duplicated lines",()=>{
  const tampered=copy(registry);
  tampered.lineCommands[0].industrialRole="CUT_LINE";
  expect(()=>validateCh02SourceLineRegister(tampered)).toThrow();
  const fakePage=copy(registry);
  fakePage.lineCommands[0].source.pdfPage=31;
  expect(()=>validateCh02SourceLineRegister(fakePage)).toThrow();
  const dupe=copy(registry);
  dupe.lineCommands[1].id=dupe.lineCommands[0].id;
  expect(()=>validateCh02SourceLineRegister(dupe)).toThrow();
 });
 it("rejects implying printed regions identify specific seam segments",()=>{
  const labels=copy(registry);
  labels.figureLabels[0].scope="WAIST_EDGE_CONFIRMED";
  expect(()=>validateCh02SourceLineRegister(labels)).toThrow();
  const cutoff=copy(registry);
  cutoff.statements.bookAllowance.application="APPLY_10_MM_EVERYWHERE";
  expect(()=>validateCh02SourceLineRegister(cutoff)).toThrow();
  const promoted=copy(registry);
  promoted.purpose="PRODUCTION";
  expect(()=>validateCh02SourceLineRegister(promoted)).toThrow();
 });
 it("rejects book commands referencing nonexistent points",()=>{
  const tampered=copy(registry);
  tampered.lineCommands[0].pointIds[1]="999";
  expect(()=>resolveCh02BookLineCommands("ONE_PIECE",basic,tampered)).toThrow();
 });
 it("registries remain valid under canonicalized re-import",()=>{
  expect(validateCh02SourceLineRegister(ch02SourceLineRegister)).toEqual(ch02SourceLineRegister);
  const edited=copy(ch02SourceLineRegister);
  edited.figureLabels.pop();
  expect(()=>validateCh02SourceLineRegister(edited)).toThrow();
 });
});
