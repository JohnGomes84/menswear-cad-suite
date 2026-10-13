import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assessSemanticRelease,createCh02SemanticResearch,validateGarmentSemanticProject
} from "../generated/garmentSemantics.mjs";
import { createResearchPartProbe,createSyntheticAnnotationProof } from "../src/partBridge.mjs";

const measurements={seatMm:1020,bodyRiseMm:282,insideLegMm:800,variant:"BASIC"};
const input=(method,variant="BASIC")=>({
 method,variant,
 measurementsMm:{
  seatMm:measurements.seatMm,bodyRiseMm:measurements.bodyRiseMm,
  insideLegMm:measurements.insideLegMm
 }
});
const nearly=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`Mismatch: ${a} != ${b}`);
function linked(method,variant="BASIC"){
 const semantic=createCh02SemanticResearch(method,{...measurements,variant});
 const native=createResearchPartProbe(input(method,variant));
 assert.equal(semantic.methodId,"ALD-CH02-01");
 assert.equal(semantic.purpose,"RESEARCH_ONLY");
 assert.equal(native.purpose,"RESEARCH_ONLY");
 assert.equal(semantic.pieces.length,2);
 for(const piece of semantic.pieces){
  const corresponding=native.parts.find(p=>piece.section===p.section+"_RESEARCH");
  assert.ok(corresponding,`Missing native Part for ${piece.section}`);
  assert.equal(corresponding.semanticRole,"CONSTRUCTION_GROUP_NOT_GARMENT_PIECE");
  assert.equal(piece.edges.length,corresponding.traceLinks.length);
  for(const point of piece.points){
   const nativePoint=corresponding.nativeRenderProps.points["pt_"+point.id];
   assert.ok(nativePoint,`Missing native point ${point.id}`);
   nearly(nativePoint.x,point.positionMm.x);
   nearly(nativePoint.y,point.positionMm.y);
  }
  for(const edge of piece.edges){
   assert.equal(edge.role,"DEPENDENCY_CONNECTOR");
   const evidence=semantic.evidence.find(e=>e.id===edge.evidenceId);
   assert.equal(evidence?.kind,"TRACE_DERIVED_NOT_BOOK_LINE");
   const step=evidence.source.stepId;
   const trace=corresponding.traceLinks.find(p=>p.sourceStepId===step);
   assert.ok(trace,`Missing FreeSewing Path for step ${step}`);
   const nativePath=corresponding.nativeRenderProps.paths["construction_"+step];
   assert.ok(nativePath);
   assert.equal(nativePath.d,trace.svgPathData);
   const posA=piece.points.find(p=>p.id===edge.fromId).positionMm;
   const posB=piece.points.find(p=>p.id===edge.toId).positionMm;
   nearly(trace.lengthMm,Math.hypot(posA.x-posB.x,posA.y-posB.y));
  }
  assert.deepEqual(piece.allowances,[]);
  assert.deepEqual(piece.annotations,[]);
  assert.equal(corresponding.roleInventory.CUT_LINE,0);
  assert.equal(corresponding.roleInventory.SEAM_LINE,0);
 }
 const report=assessSemanticRelease(semantic);
 assert.equal(report.cutReady,false);
 assert.equal(report.state,"PASS_RESEARCH_TRACE_ONLY");
 return {semantic,native,report};
}
test("provider-independent semantic model reconciles with FreeSewing Parts, CH02 two-piece",()=>{
 const result=linked("TWO_PIECE");
 assert.equal(result.semantic.evidence.every(x=>x.source?.pdfPage===33),true);
});
test("CH02 one-piece semantics also match native Part geometry and step IDs",()=>{
 const result=linked("ONE_PIECE");
 assert.equal(result.semantic.evidence.every(x=>x.source?.pdfPage===32),true);
});
test("both source variants stay only research traces",()=>{
 for(const method of ["TWO_PIECE","ONE_PIECE"]){
  const {report}=linked(method,"EASY");
  assert.ok(report.counts.edges>0);
  assert.equal(report.counts.allowances,0);
  assert.equal(report.counts.annotations,0);
 }
});
test("malicious semantic promotion is rejected before it can reach FreeSewing",()=>{
 const {semantic}=linked("TWO_PIECE");
 const attempt=structuredClone(semantic);
 attempt.pieces[0].edges[0].role="CUT_LINE";
 assert.throws(()=>validateGarmentSemanticProject(attempt),RangeError);
 attempt.pieces[0].edges[0].role="DEPENDENCY_CONNECTOR";
 attempt.release.cutReady=true;
 assert.throws(()=>validateGarmentSemanticProject(attempt),RangeError);
});
test("synthetic plugin marks can never contaminate Aldrich semantic contract",()=>{
 const fixture=createSyntheticAnnotationProof();
 assert.equal(fixture.publishedToGarment,false);
 assert.equal(fixture.fixtureStatus,"SYNTHETIC_ONLY_DO_NOT_PROMOTE");
 const {semantic}=linked("TWO_PIECE");
 assert.equal(semantic.pieces.flatMap(p=>p.annotations).length,0);
 assert.equal(semantic.pieces.flatMap(p=>p.allowances).length,0);
 assert.equal(semantic.release.cutReady,false);
});
