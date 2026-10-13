import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createResearchPartProbe,createSyntheticAnnotationProof,assertResearchRole
} from "../src/partBridge.mjs";
import { createDiagnosticDraft } from "../src/pipeline.mjs";

const basic={method:"TWO_PIECE",variant:"BASIC",
 measurementsMm:{seatMm:1020,bodyRiseMm:282,insideLegMm:800}};
const one={...basic,method:"ONE_PIECE"};
const easy={...basic,variant:"EASY"};

function assertGate(probe){
 assert.equal(probe.formatVersion,"construction-part-probe/0.1.0");
 assert.equal(probe.purpose,"RESEARCH_ONLY");
 assert.equal(probe.parts.length,2);
 assert.equal(probe.gates.CUT_READY,false);
 for(const role of ["SEAM_LINE","CUT_LINE","GRAINLINE","PRODUCTION_NOTCH","SEAM_ALLOWANCE"])
  assert.equal(probe.gates[role],"BLOCKED");
 for(const section of probe.parts){
  assert.equal(section.purpose,"RESEARCH_ONLY");
  assert.equal(section.semanticRole,"CONSTRUCTION_GROUP_NOT_GARMENT_PIECE");
  assert.equal(section.nativeClass,"FreeSewing.Part");
  assert.equal(section.roleInventory.SEAM_LINE,0);
  assert.equal(section.roleInventory.CUT_LINE,0);
  assert.equal(section.roleInventory.PRODUCTION_NOTCH,0);
  assert.ok(section.constructionPointIds.length>0);
  assert.ok(section.traceLinks.length>0);
  assert.equal(Object.keys(section.nativeRenderProps.paths).length,
   section.traceLinks.length);
  assert.equal(Object.keys(section.nativeRenderProps.snippets).length,0);
  assert.ok(section.nativeRenderProps.width>=0);
  assert.ok(section.nativeRenderProps.height>=0);
  assert.ok(Object.keys(section.nativeRenderProps.points).length>0);
  for(const trace of section.traceLinks){
   assert.equal(trace.role,"CONSTRUCTION_TRACE");
   assert.ok(trace.svgPathData.startsWith("M "));
   assert.ok(Number.isFinite(trace.lengthMm));
   const record=section.nativeRenderProps.paths[trace.id];
   assert.ok(record);
   assert.equal(record.ops.length,2);
   assert.equal(record.ops[0].type,"move");
   assert.equal(record.ops[1].type,"line");
   assert.equal(record.d,trace.svgPathData);
  }
 }
}

test("real FreeSewing Part transports only book-source linked construction",()=>{
 const probe=createResearchPartProbe(basic);
 assertGate(probe);
 assert.deepEqual(probe.parts.map(p=>p.section),["FRONT","BACK"]);
 assert.equal(probe.parts[0].constructionPointIds.length,16);
 // BACK may refer to existing FRONT construction points and still isn't seam/cut.
 assert.equal(probe.source.methodId,"ALD-CH02-01");
 assert.equal(probe.method,"TWO_PIECE");
});
test("one-piece and easy variation preserve separate research group roles",()=>{
 for(const input of [one,easy,{...one,variant:"EASY"}]){
  const p=createResearchPartProbe(input);
  assertGate(p);
  assert.equal(p.parts[0].section,"FRONT");
  assert.equal(p.parts[1].section,"BACK");
 }
});
test("all native FreeSewing paths reconcile to same source steps as original vertical proof",()=>{
 const original=createDiagnosticDraft(basic);
 const probe=createResearchPartProbe(basic);
 for(const section of probe.parts){
  const parent=original.groups.find(g=>g.section===section.section);
  assert.deepEqual(section.traceLinks.map(x=>x.sourceStepId),
    parent.guides.map(x=>x.sourceStepId));
  for(const [i,ref] of section.traceLinks.entries()){
   assert.ok(Math.abs(ref.lengthMm-parent.guides[i].lengthMm)<1e-7);
   assert.equal(ref.svgPathData,parent.guides[i].pathD);
  }
 }
});
test("native FreeSewing point labels are diagnostic, not production notches",()=>{
 const p=createResearchPartProbe(basic).parts[0];
 for(const id of p.constructionPointIds){
  const attrs=p.nativeRenderProps.points[`pt_${id}`]?.attributes;
  assert.ok(attrs);
  assert.match(JSON.stringify(attrs),new RegExp(`source-point-number`));
 }
 assert.equal(p.annotations.sewingMarks.length,0);
 assert.equal(p.roleInventory.PRODUCTION_NOTCH,0);
});
test("source-linked parts follow measurements without synthetic coordinate substitutions",()=>{
 const input={...basic,measurementsMm:{seatMm:1080,bodyRiseMm:300,insideLegMm:840}};
 const p=createResearchPartProbe(input);
 assertGate(p);
 assert.notEqual(p.parts[0].nativeRenderProps.width,
   createResearchPartProbe(basic).parts[0].nativeRenderProps.width);
});
test("the source research output remains explicitly without validated sewing data",()=>{
 const p=createResearchPartProbe(basic);
 assert.equal(p.source.completeness,"PARTIAL_CONSTRUCTION_GUIDES_ONLY");
 assert.ok(p.forbiddenRoles.includes("GRAINLINE"));
 assert.ok(p.forbiddenRoles.includes("CUT_LINE"));
 assert.equal(p.parts[1].drawingCompleteness,"PARTIAL_TRACES_NOT_BOOK_CONTOURS");
 assert.equal("cutContour" in p,false);
 assert.equal("seamPairs" in p,false);
 assert.equal("cutInstructions" in p,false);
});
test("cannot relabel lines as sewing, cut, grain, fold, seam allowance or notch",()=>{
 assert.equal(assertResearchRole("CONSTRUCTION_TRACE"),"CONSTRUCTION_TRACE");
 for(const role of ["SEAM_LINE","CUT_LINE","GRAINLINE","CUT_ON_FOLD",
  "SEAM_ALLOWANCE","PRODUCTION_NOTCH","CONSTRUCTION_GUIDE","OTHER"])
  assert.throws(()=>assertResearchRole(role),RangeError);
});
test("invalid anthropometric data fail before FreeSewing Part creation",()=>{
 for(const input of [
  {...basic,measurementsMm:{seatMm:NaN,bodyRiseMm:282,insideLegMm:800}},
  {...basic,measurementsMm:{seatMm:1020,bodyRiseMm:-10,insideLegMm:800}},
  {...basic,method:"JACKET"}
 ])assert.throws(()=>createResearchPartProbe(input),RangeError);
});
test("FreeSewing annotations macro runs for synthetic fixture only",()=>{
 const s=createSyntheticAnnotationProof();
 assert.equal(s.fixtureStatus,"SYNTHETIC_ONLY_DO_NOT_PROMOTE");
 assert.equal(s.provenance,"ENGINEERING_FIXTURE_NOT_ALDRICH");
 assert.equal(s.publishedToGarment,false);
 assert.ok(s.grainlineMacroPathId.includes("grainline"));
 assert.ok(s.executedApis.includes("macro(grainline)"));
 assert.equal(s.notchDemo.def,"notch");
 assert.ok(Number.isFinite(s.notchDemo.anchor.x));
 assert.ok(Number.isFinite(s.notchDemo.anchor.y));
 assert.ok(Math.abs(s.grainlineFromMm.x-10)<1e-8);
 assert.ok(Math.abs(s.grainlineToMm.x-10)<1e-8);
 assert.ok(s.grainlineFromMm.y>s.grainlineToMm.y-200);
});
test("running annotation fixture does not introduce grainline/notches into the book",()=>{
 createSyntheticAnnotationProof();
 const first=createResearchPartProbe(basic);
 const other=createResearchPartProbe(one);
 const last=createResearchPartProbe(basic);
 assert.deepEqual(first,last);
 assert.equal(other.gates.GRAINLINE,"BLOCKED");
 for(const part of last.parts){
  assert.equal(part.roleInventory.GRAINLINE,0);
  assert.equal(part.roleInventory.PRODUCTION_NOTCH,0);
  assert.deepEqual(part.annotations.sewingMarks,[]);
 }
});
