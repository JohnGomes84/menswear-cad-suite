import { describe, expect, it } from "vitest";
import {
  assessSemanticRelease,createCh02SemanticResearch,validateGarmentSemanticProject
} from "./garmentSemantics";
import type { GarmentSemanticProject } from "./garmentSemantics";

const basic={seatMm:1020,bodyRiseMm:282,insideLegMm:800,variant:"BASIC" as const};
const easy={...basic,variant:"EASY" as const};
const cloned=<T>(v:T):T=>JSON.parse(JSON.stringify(v)) as T;

/** Synthetic schema exercise: this square is not a clothing pattern. */
function synthetic():GarmentSemanticProject{
 return {
  formatVersion:"garment-semantic/0.1.0",purpose:"SYNTHETIC_ONLY",
  methodId:"ENGINEERING_FIXTURE",unit:"mm",
  evidence:[{id:"e1",kind:"SYNTHETIC_FIXTURE",description:"Geometria artificial para teste de esquema"}],
  pieces:[{
   id:"test-square",section:"SYNTHETIC_PIECE",status:"SYNTHETIC_EXAMPLE",
   points:[
    {id:"A",positionMm:{x:0,y:0}},{id:"B",positionMm:{x:100,y:0}},
    {id:"C",positionMm:{x:100,y:100}},{id:"D",positionMm:{x:0,y:100}}
   ],
   edges:[
    {id:"seam",fromId:"A",toId:"B",role:"SEAM_LINE",evidenceId:"e1"},
    {id:"cut",fromId:"B",toId:"C",role:"CUT_LINE",evidenceId:"e1"},
    {id:"hem",fromId:"C",toId:"D",role:"HEM_LINE",evidenceId:"e1"},
    {id:"fold",fromId:"D",toId:"A",role:"FOLD_LINE",evidenceId:"e1"}
   ],
   allowances:[{
    id:"included",seamEdgeId:"seam",widthMm:10,
    treatment:"ALREADY_INCLUDED_IN_BLOCK",evidenceId:"e1"
   }],
   annotations:[
    {id:"n",kind:"NOTCH",edgeId:"seam",fraction:0.5,evidenceId:"e1"},
    {id:"grain",kind:"GRAINLINE",fromId:"A",toId:"D",evidenceId:"e1"}
   ]
  }],
  release:{cutReady:false,physicalFit:"NOT_RUN"}
 };
}
function rejects(mutator:(p:GarmentSemanticProject)=>void,kind:"SYNTHETIC_ONLY"|"RESEARCH_ONLY"="SYNTHETIC_ONLY"){
 const base=kind==="SYNTHETIC_ONLY"?synthetic():createCh02SemanticResearch("TWO_PIECE",basic);
 const p=cloned(base);mutator(p);
 expect(()=>validateGarmentSemanticProject(p)).toThrow(/bloqueado/);
}
describe("Garment semantic contract — source first, independent of CAD provider",()=>{
 it("validates synthetic representations of seam, cut, fold, hem, grainline and notch",()=>{
  const p=validateGarmentSemanticProject(synthetic());
  expect(p.pieces[0].edges.map(e=>e.role))
   .toEqual(["SEAM_LINE","CUT_LINE","HEM_LINE","FOLD_LINE"]);
  expect(p.pieces[0].allowances[0].treatment).toBe("ALREADY_INCLUDED_IN_BLOCK");
  expect(p.pieces[0].annotations.map(a=>a.kind)).toEqual(["NOTCH","GRAINLINE"]);
  expect(assessSemanticRelease(p).state).toBe("PASS_SYNTHETIC_SCHEMA_ONLY");
  expect(assessSemanticRelease(p).cutReady).toBe(false);
 });
 it("CH02 one-piece basic uses only dependencies, not presumed seams",()=>{
  const p=createCh02SemanticResearch("ONE_PIECE",basic);
  const q=assessSemanticRelease(p);
  expect(p.purpose).toBe("RESEARCH_ONLY");
  expect(p.methodId).toBe("ALD-CH02-01");
  expect(p.pieces.map(x=>x.section)).toEqual(["FRONT_RESEARCH","BACK_RESEARCH"]);
  expect(p.pieces[0].points).toHaveLength(12);
  expect(p.pieces[1].points.length).toBeGreaterThan(7);
  expect(p.pieces.flatMap(x=>x.edges).every(e=>e.role==="DEPENDENCY_CONNECTOR")).toBe(true);
  expect(p.pieces.flatMap(x=>x.annotations)).toEqual([]);
  expect(p.pieces.flatMap(x=>x.allowances)).toEqual([]);
  expect(q.state).toBe("PASS_RESEARCH_TRACE_ONLY");
  expect(q.cutReady).toBe(false);
 });
 it("CH02 two-piece re-executes all known points and trace evidence",()=>{
  const p=createCh02SemanticResearch("TWO_PIECE",basic);
  expect(p.pieces[0].points).toHaveLength(16);
  expect(p.pieces[1].points.length).toBeGreaterThan(10);
  expect(p.evidence.length).toBe(p.pieces.flatMap(x=>x.edges).length);
  expect(p.evidence.every(e=>e.kind==="TRACE_DERIVED_NOT_BOOK_LINE")).toBe(true);
  expect(p.evidence.every(e=>e.source?.pdfPage===33)).toBe(true);
  const back=p.pieces[1];
  expect(back.edges.some(e=>e.toId==="23"&&e.fromId==="18")).toBe(true);
  expect(back.edges.some(e=>e.toId==="25"&&e.fromId==="15")).toBe(true);
  expect(p.release.cutReady).toBe(false);
 });
 it("research builder adjusts body inputs and garment variant without creating seams",()=>{
  const p=createCh02SemanticResearch("TWO_PIECE",basic);
  const q=createCh02SemanticResearch("TWO_PIECE",{
   seatMm:1080,bodyRiseMm:300,insideLegMm:840,variant:"EASY"
  });
  const first=p.pieces[0].points.find(t=>t.id==="4")!;
  const second=q.pieces[0].points.find(t=>t.id==="4")!;
  expect(first.positionMm.x).toBe(-295);
  expect(second.positionMm.x).toBe(-350);
  expect(q.pieces.flatMap(x=>x.edges).every(e=>e.role==="DEPENDENCY_CONNECTOR")).toBe(true);
 });
 it("normalized output is deep copied and does not retain caller objects",()=>{
  const input=synthetic();
  const output=validateGarmentSemanticProject(input);
  input.pieces[0].points[0].positionMm.x=500;
  expect(output.pieces[0].points[0].positionMm.x).toBe(0);
  expect(validateGarmentSemanticProject(output)).toEqual(output);
 });
 it("is deterministic even when other methods are executed in between",()=>{
  const a=createCh02SemanticResearch("ONE_PIECE",easy);
  createCh02SemanticResearch("TWO_PIECE",basic);
  const b=createCh02SemanticResearch("ONE_PIECE",easy);
  expect(a).toEqual(b);
 });
 it("rejects unknown schema, units, safety bypass and hidden production field",()=>{
  rejects(p=>{p.formatVersion="99" as GarmentSemanticProject["formatVersion"];});
  rejects(p=>{p.unit="cm" as "mm";});
  rejects(p=>{p.release.cutReady=true as false;});
  rejects(p=>{(p as unknown as Record<string,unknown>).productionReady=true;});
  rejects(p=>{(p.pieces[0] as unknown as Record<string,unknown>).cutReady=true;});
 });
 it("rejects duplicate IDs across points, edges, evidence and pieces",()=>{
  rejects(p=>{p.evidence.push(cloned(p.evidence[0]));});
  rejects(p=>{p.pieces.push(cloned(p.pieces[0]));});
  rejects(p=>{p.pieces[0].points.push(cloned(p.pieces[0].points[0]));});
  rejects(p=>{p.pieces[0].edges.push(cloned(p.pieces[0].edges[0]));});
 });
 it("rejects missing references, zero-length and mirrored duplicate edges",()=>{
  rejects(p=>{p.pieces[0].edges[0].fromId="MISSING";});
  rejects(p=>{p.pieces[0].edges[0].toId="A";});
  rejects(p=>{p.pieces[0].edges[0].evidenceId="bad";});
  rejects(p=>{p.pieces[0].edges.push({
   id:"another-seam",fromId:"B",toId:"A",role:"SEAM_LINE",evidenceId:"e1"
  });});
 });
 it("rejects nonfinite points and excessively large geometry",()=>{
  rejects(p=>{p.pieces[0].points[0].positionMm.x=Infinity;});
  rejects(p=>{p.pieces[0].points[0].positionMm.y=NaN;});
  rejects(p=>{p.pieces[0].points[0].positionMm.x=1e9;});
 });
 it("allows edge-indexed synthetic allowance declaration without performing offsets",()=>{
  const p=synthetic();
  p.pieces[0].allowances[0].treatment="OFFSET_NEEDED_NOT_EXECUTED";
  const out=validateGarmentSemanticProject(p);
  expect(out.pieces[0].allowances[0].treatment).toBe("OFFSET_NEEDED_NOT_EXECUTED");
  expect("offsetResult" in out.pieces[0].allowances[0]).toBe(false);
  expect(out.release.cutReady).toBe(false);
 });
 it("rejects double-counted, disconnected, or invalid allowances",()=>{
  rejects(p=>p.pieces[0].allowances.push({
   id:"twice",seamEdgeId:"seam",widthMm:10,
   treatment:"OFFSET_NEEDED_NOT_EXECUTED",evidenceId:"e1"
  }));
  rejects(p=>p.pieces[0].allowances[0].seamEdgeId="cut");
  rejects(p=>p.pieces[0].allowances[0].widthMm=-1);
  rejects(p=>p.pieces[0].allowances[0].widthMm=Infinity);
  rejects(p=>p.pieces[0].allowances[0].treatment="ADDED_ALREADY" as "ALREADY_INCLUDED_IN_BLOCK");
 });
 it("rejects unreferenced or misplaced synthetic notch and grainline",()=>{
  rejects(p=>{
   const x=p.pieces[0].annotations[0];
   if(x.kind==="NOTCH")x.edgeId="fold";
  });
  rejects(p=>{
   const x=p.pieces[0].annotations[0];
   if(x.kind==="NOTCH")x.fraction=1;
  });
  rejects(p=>{
   const x=p.pieces[0].annotations[1];
   if(x.kind==="GRAINLINE")x.toId="MISSING";
  });
  rejects(p=>p.pieces[0].annotations.push(cloned(p.pieces[0].annotations[0])));
 });
 it("rejects additions of stitch, cut, fold or synthetic evidence to CH02",()=>{
  rejects(p=>{p.pieces[0].edges[0].role="SEAM_LINE";},"RESEARCH_ONLY");
  rejects(p=>{p.pieces[0].edges[0].role="CUT_LINE";},"RESEARCH_ONLY");
  rejects(p=>{p.pieces[0].edges[0].role="FOLD_LINE";},"RESEARCH_ONLY");
  rejects(p=>{p.pieces[0].evidenceId="wrong" as never;},"RESEARCH_ONLY");
  rejects(p=>p.pieces[0].allowances.push({
   id:"allow",seamEdgeId:p.pieces[0].edges[0].id,widthMm:10,
   treatment:"ALREADY_INCLUDED_IN_BLOCK",evidenceId:p.evidence[0].id
  }),"RESEARCH_ONLY");
  rejects(p=>p.pieces[0].annotations.push({
   id:"grain",kind:"GRAINLINE",fromId:"0",toId:"1",evidenceId:p.evidence[0].id
  }),"RESEARCH_ONLY");
  rejects(p=>{p.evidence[0].kind="SYNTHETIC_FIXTURE";},"RESEARCH_ONLY");
 });
 it("rejects pretending synthetic polygon is book-reviewed garment",()=>{
  rejects(p=>p.purpose="RESEARCH_ONLY");
  rejects(p=>p.pieces[0].status="CONSTRUCTION_CONTAINER");
  rejects(p=>p.pieces[0].section="FRONT_RESEARCH");
  rejects(p=>p.evidence[0].kind="TRACE_DERIVED_NOT_BOOK_LINE");
 });
 it("cannot report physical fit as approved in either mode",()=>{
  rejects(p=>{p.release.physicalFit="PASS" as "NOT_RUN";});
  rejects(p=>{p.release.physicalFit="PASS" as "NOT_RUN";},"RESEARCH_ONLY");
 });
});
