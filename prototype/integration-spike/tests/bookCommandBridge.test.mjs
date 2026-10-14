import {test} from "node:test";
import assert from "node:assert/strict";
import {createBookCommandGeometry} from "../src/bookCommandBridge.mjs";
import {
  resolveCh02BookLineCommands
} from "../generated/ch02BookLines.mjs";
const input={seatMm:1020,bodyRiseMm:282,insideLegMm:800};
test("one-piece source-line CAD bridge renders only 3 explicit straight commands",()=>{
 const p=createBookCommandGeometry("ONE_PIECE","BASIC",input);
 assert.equal(p.purpose,"RESEARCH_ONLY");
 assert.equal(p.straights.length,3);
 assert.equal(p.curvesPending.length,4);
 assert.deepEqual(p.straights.map(x=>x.from+"-"+x.to),
  ["9-11","13-0","17-18"]);
 assert.ok(p.straights.every(x=>x.lineRole==="TEXT_COMMAND_NOT_SEAM_OR_CUT"));
 assert.ok(p.straights.every(x=>x.source.pdfPage===32));
 assert.equal(p.gates.cutReady,false);
 assert.equal(p.gates.allowanceOffset,false);
 assert.equal(p.gates.mirrorPerformed,false);
});
test("two-piece source-line CAD bridge renders only 5 explicit straight commands",()=>{
 const p=createBookCommandGeometry("TWO_PIECE","BASIC",input);
 assert.equal(p.straights.length,5);
 assert.equal(p.curvesPending.length,4);
 assert.deepEqual(p.straights.map(x=>x.from+"-"+x.to),
  ["1-12","13-15","17-18","18-22","24-25"]);
 assert.ok(p.curvesPending.every(x=>x.source===undefined));
 assert.ok(p.curvesPending.every(x=>x.evidence.pdfPage===33));
});
test("FreeSewing path length reconciles independently with the source-text resolver",()=>{
 for(const method of ["ONE_PIECE","TWO_PIECE"]){
  for(const variant of ["BASIC","EASY"]){
   const lib=createBookCommandGeometry(method,variant,input);
   const source=resolveCh02BookLineCommands(method,{...input,variant});
   const textLines=source.strokes.filter(x=>x.geometry==="STRAIGHT");
   for(const [i,line] of lib.straights.entries()){
    assert.equal(line.commandId,textLines[i].id);
    assert.ok(Math.abs(line.lengthMm-textLines[i].lengthMm)<1e-7);
    assert.ok(line.pathD.startsWith("M "));
    assert.ok(!/\sZ(?:\s|$)/.test(line.pathD));
   }
  }
 }
});
test("all eight source curves stay instructions, no algorithm or Bézier chosen",()=>{
 for(const method of ["ONE_PIECE","TWO_PIECE"]){
  const p=createBookCommandGeometry(method,"BASIC",input);
  for(const c of p.curvesPending){
   assert.equal(c.curveGenerated,false);
   assert.equal(c.reason,"SOURCE_CURVE_REQUIREMENTS_PENDING");
   assert.ok(c.requiredPoints.length>=2);
  }
  assert.equal("controlPoints" in p,false);
  assert.equal("contour" in p,false);
 }
});
test("figure's visible no-allowance labels stay region-scoped and never apply offset",()=>{
 for(const method of ["ONE_PIECE","TWO_PIECE"]){
  const r=createBookCommandGeometry(method,"BASIC",input);
  assert.equal(r.figureLabels.length,2);
  assert.ok(r.figureLabels.every(x=>x.scope==="REGION_CONFIRMED_EDGE_SCOPE_NOT_MAPPED"));
  assert.equal(r.gates.allowanceOffset,false);
  assert.ok(!r.straights.some(x=>"allowanceMm" in x));
 }
});
test("visual SVG has no closed cut perimeter or 1:1 print dimensions",()=>{
 const r=createBookCommandGeometry("TWO_PIECE","BASIC",input);
 assert.ok(r.svg.includes("NÃO CORTAR"));
 assert.ok(r.svg.includes("NOT printable pattern or scale 1:1"));
 assert.ok(!/\s[Zz][\s"<>]/.test(r.svg));
 assert.ok(!/width="\d+mm"/.test(r.svg));
 assert.equal((r.svg.match(/<path /g)||[]).length,5);
});
test("different anthropometric measures recalculate FreeSewing output",()=>{
 const a=createBookCommandGeometry("TWO_PIECE","BASIC",input);
 const b=createBookCommandGeometry("TWO_PIECE","EASY",{
  seatMm:1080,bodyRiseMm:300,insideLegMm:840
 });
 assert.deepEqual(a.straights.map(x=>x.commandId),b.straights.map(x=>x.commandId));
 assert.notEqual(a.straights[0].lengthMm,b.straights[0].lengthMm);
});
test("incomplete or invalid methods fail without constructing garment lines",()=>{
 assert.throws(()=>createBookCommandGeometry("JACKET","BASIC",input),Error);
 assert.throws(()=>createBookCommandGeometry("ONE_PIECE","BASIC",{
  ...input,seatMm:-10
 }),Error);
});
