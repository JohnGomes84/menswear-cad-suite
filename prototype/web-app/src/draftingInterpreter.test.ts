import {describe,expect,it} from "vitest";
import type {DraftProgram} from "./draftingInterpreter";
import {
 executeDraftProgram,mm,measure,plus,minus,times,span
} from "./draftingInterpreter";

const src=(step:string)=>({
 sourceId:"fixture-generic",chapter:1,pdfPage:9,
 instruction:`Fixture matemática: ${step}`,interpretation:"TEXT" as const
});
const program:DraftProgram={
 programId:"fixture-generic",purpose:"RESEARCH_ONLY",unit:"mm",
 sourceBook:"Unit fixture, not a clothing construction",
 instructions:[
  {op:"ORIGIN",stepId:"A",pointId:"A",xMm:0,yMm:0,source:src("A")},
  {op:"OFFSET",stepId:"B",pointId:"B",from:"A",direction:"DOWN",
   lengthMm:plus(measure("rise"),mm(20)),source:src("B")},
  {op:"OFFSET",stepId:"C",pointId:"C",from:"B",direction:"LEFT",
   lengthMm:times(measure("seat"),1/4),source:src("C")},
  {op:"PROJECT_AXES",stepId:"D",pointId:"D",xFrom:"C",yFrom:"A",
   source:src("D")},
  {op:"OFFSET",stepId:"E",pointId:"E",from:"C",direction:"DOWN",
   lengthMm:times(span("A","B"),1/2),source:src("E")},
  {op:"INTERSECT_LINE_AT_Y",stepId:"F",pointId:"F",
   lineStart:"B",lineEnd:"E",yFrom:"C",source:src("F")},
  {op:"MIRROR_ABOUT_VERTICAL",stepId:"G",pointId:"G",
   point:"C",axisPoint:"B",source:src("G")}
 ]
};
const inputs={rise:280,seat:1000};
const run=(input:DraftProgram=program)=>executeDraftProgram(input,inputs);

describe("Generic sequential drafting interpreter — no garment assumptions",()=>{
 it("builds results strictly in instruction order with provenance",()=>{
  const r=run();
  expect(Object.keys(r.pointsMm)).toEqual(["A","B","C","D","E","F","G"]);
  expect(r.trace.map(e=>e.stepId)).toEqual(["A","B","C","D","E","F","G"]);
  expect(r.trace.every(e=>e.source.pdfPage===9)).toBe(true);
  expect(r.trace[1].lengthMm).toBe(300);
  expect(r.purpose).toBe("RESEARCH_ONLY");
 });
 it("performs metric formulas and geometry independent of clothing",()=>{
  const p=run().pointsMm;
  expect(p.A).toEqual({x:0,y:0});
  expect(p.B).toEqual({x:0,y:300});
  expect(p.C).toEqual({x:-250,y:300});
  expect(p.D).toEqual({x:-250,y:0});
  expect(p.E).toEqual({x:-250,y:450});
  expect(p.F).toEqual({x:0,y:300});
  expect(p.G).toEqual({x:250,y:300});
 });
 it("changing the body measurements recalculates subsequent dependent steps",()=>{
  const p=executeDraftProgram(program,{rise:300,seat:1080}).pointsMm;
  expect(p.B.y).toBe(320);
  expect(p.C.x).toBe(-270);
  expect(p.E.y).toBe(480);
  expect(p.G.x).toBe(270);
 });
 it("supports arithmetic subtraction without baked garment formulas",()=>{
  const p:DraftProgram={...program,instructions:[
   ...program.instructions.slice(0,1),
   {op:"OFFSET",stepId:"B",pointId:"B",from:"A",direction:"RIGHT",
     lengthMm:minus(measure("seat"),mm(500)),source:src("B")}
  ]};
  expect(run(p).pointsMm.B.x).toBe(500);
 });
 it("rejects out-of-order dependent points, rather than reordering the book",()=>{
  const p:DraftProgram={...program,instructions:[
   program.instructions[0],program.instructions[2],program.instructions[1]
  ]};
  expect(()=>run(p)).toThrow(/referência ainda não construída/);
 });
 it("rejects duplicate output point IDs and duplicated step IDs",()=>{
  const original=program.instructions[1];
  const duplicated={...original,stepId:"duplicate-step"};
  expect(()=>run({...program,instructions:[...program.instructions,duplicated]}))
    .toThrow(/duplicada/);
  expect(()=>run({...program,instructions:[...program.instructions,original]}))
    .toThrow(/duplicada/);
 });
 it("rejects missing measurements and nonpositive input",()=>{
  expect(()=>executeDraftProgram(program,{rise:280})).toThrow(/medida ausente/);
  expect(()=>executeDraftProgram(program,{rise:280,seat:NaN})).toThrow(/Medida inválida/);
  expect(()=>executeDraftProgram(program,{rise:0,seat:1000})).toThrow(/Medida inválida/);
 });
 it("rejects misleading source identity in step provenance",()=>{
  const corrupted:DraftProgram={...program,instructions:[
   {...program.instructions[0],source:{...src("A"),sourceId:"another"}},
   ...program.instructions.slice(1)
  ]};
  expect(()=>run(corrupted)).toThrow(/proveniência/);
 });
 it("rejects an ambiguous horizontal segment intersection",()=>{
  const p:DraftProgram={...program,instructions:[
   ...program.instructions.slice(0,4),
   {op:"INTERSECT_LINE_AT_Y",stepId:"X",pointId:"X",
     lineStart:"A",lineEnd:"D",yFrom:"B",source:src("X")}
  ]};
  expect(()=>run(p)).toThrow(/sem cruzamento único/);
 });
 it("rejects intersection outside declared segment",()=>{
  const p:DraftProgram={...program,instructions:[
   ...program.instructions.slice(0,5),
   {op:"INTERSECT_LINE_AT_Y",stepId:"X",pointId:"X",
     lineStart:"B",lineEnd:"E",yFrom:"D",source:src("X")}
  ]};
  expect(()=>run(p)).toThrow(/fora do segmento/);
 });
 it("rejects negative displacement and nonfinite scalar overflow",()=>{
  const negative:DraftProgram={...program,instructions:[
   ...program.instructions.slice(0,1),
   {op:"OFFSET",stepId:"X",pointId:"X",from:"A",
    direction:"RIGHT",lengthMm:minus(mm(1),mm(3)),source:src("X")}
  ]};
  expect(()=>run(negative)).toThrow(/deslocamento negativo/);
  const overflow:DraftProgram={...program,instructions:[
   ...program.instructions.slice(0,1),
   {op:"OFFSET",stepId:"X",pointId:"X",from:"A",
    direction:"RIGHT",lengthMm:times(mm(1e308),1e308),source:src("X")}
  ]};
  expect(()=>run(overflow)).toThrow(/não finito/);
 });
 it("rejects unverified or non-metric execution contract",()=>{
  expect(()=>run({...program,unit:"cm" as "mm"})).toThrow(/Contrato/);
  expect(()=>run({...program,purpose:"APPROVED" as "RESEARCH_ONLY"})).toThrow(/Contrato/);
 });
 it("does not pretend to produce sewing or cutting contours",()=>{
  const r=run();
  expect("seamPairs" in r).toBe(false);
  expect("cutContour" in r).toBe(false);
  expect("svg" in r).toBe(false);
 });
});
