import { test } from "node:test";
import assert from "node:assert/strict";
import { createDiagnosticDraft } from "../src/pipeline.mjs";

const basic={
 method:"TWO_PIECE",variant:"BASIC",
 measurementsMm:{seatMm:1020,bodyRiseMm:282,insideLegMm:800}
};
const onePiece={...basic,method:"ONE_PIECE"};
const easy={...basic,variant:"EASY"};
const close=(a,b,tolerance=1e-7)=>assert.ok(Math.abs(a-b)<tolerance,`Expected ${a} to be within ${tolerance} of ${b}`);
const check=(res)=>{
 assert.equal(res.schemaVersion,"integration-probe/0.1.0");
 assert.equal(res.purpose,"RESEARCH_ONLY");
 assert.equal(res.diagnostics.state,"PASS_RESEARCH_ONLY");
 assert.equal(res.diagnostics.physicalFitReview,"NOT_RUN");
 assert.equal(res.diagnostics.seamLengthReview,"NOT_RUN");
 assert.equal(res.diagnostics.cutContourReview,"NOT_RUN");
 assert.equal(res.integration.externalPackage,"@freesewing/core");
 assert.ok(res.integration.externalVersion);
 assert.equal(res.integration.primitivesUsed.includes("Path.length"),true);
 assert.equal(res.groups.length,2);
 assert.ok(res.groups.every(x=>x.role==="CONSTRUCTION_GROUP_NOT_CUTTING_PIECE"));
 assert.ok(res.blockedOperations.includes("PRINT_1_TO_1"));
 assert.ok(res.blockedOperations.includes("PRODUCTION_RELEASE"));
 assert.ok(res.blockedOperations.includes("CUT_CONTOUR"));
 assert.ok(!("cutContour" in res));
 assert.ok(!("seamAllowance" in res));
 assert.ok(res.svg.includes("NÃO CORTAR"));
 assert.ok(res.svg.includes("NÃO calibrado em escala 1:1"));
 assert.ok(res.svg.includes('<path data-step='));
 assert.ok(!/width="[\d.]+mm"/.test(res.svg));
 for(const group of res.groups)for(const edge of group.guides){
   assert.ok(Number.isFinite(edge.lengthMm));
   assert.ok(edge.lengthMm>=0);
   assert.match(edge.pathD,/^M /);
   assert.equal(edge.referenceKind,"CONSTRUCTION_GUIDE");
 }
};

test("two-piece full research chain executes through real FreeSewing point/path APIs",()=>{
 const res=createDiagnosticDraft(basic);
 check(res);
 assert.equal(res.construction.trace.length,26);
 assert.equal(res.groups[0].pointIds.length,16);
 assert.equal(res.groups[1].pointIds.length,10);
 assert.equal(res.source.methodId,"ALD-CH02-01");
 assert.deepEqual(res.source.reviewedPdfPages,[33,34]);
 assert.equal(res.construction.trace[25].pointId,"25");
 assert.deepEqual(res.construction.trace[25].usedPoints,["15","14","23"]);
 const p=res.construction.pointsMm;
 close(p["1"].y-p["0"].y,302);
 close(p["2"].y-p["1"].y,800);
 close(p["4"].x,-295);
 close(p["12"].x,-49.16666666666667);
 close(p["13"].x,-265.8333333333333);
 assert.ok(p["12"].x>p["11"].x&&p["13"].x<p["11"].x);
});

test("one-piece construction uses the same external geometry adapter",()=>{
 const res=createDiagnosticDraft(onePiece);
 check(res);
 assert.equal(res.construction.trace.length,19);
 assert.equal(res.groups[0].pointIds.length,12);
 assert.equal(res.groups[1].pointIds.length,7);
 assert.deepEqual(res.source.reviewedPdfPages,[32,34]);
 close(res.construction.pointsMm["12"].x,-250);
 close(res.construction.pointsMm["17"].y,1102);
});

test("variant EASY changes method distances but preserves trace semantics",()=>{
 const res=createDiagnosticDraft(easy);
 check(res);
 assert.equal(res.construction.trace.length,26);
 close(res.construction.pointsMm["1"].y,322);
 close(res.construction.pointsMm["2"].y,1122);
 close(res.construction.pointsMm["4"].x,-335);
 close(res.construction.pointsMm["12"].x,-55.83333333333333);
});

test("personal body measurements recompute geometry without redefining algorithms",()=>{
 const res=createDiagnosticDraft({...basic,
  measurementsMm:{seatMm:1080,bodyRiseMm:300,insideLegMm:840}
 });
 check(res);
 const p=res.construction.pointsMm;
 close(p["1"].y,320);
 close(p["2"].y,1160);
 close(p["4"].x,-310);
 close(p["3"].y,740);
 assert.equal(res.construction.trace.length,26);
});

test("SVG is visual-only with no closed cutting contours, seam paths or calibrated output",()=>{
 const res=createDiagnosticDraft(basic);
 const xml=res.svg;
 assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
 assert.match(xml,/<svg[^>]*viewBox=/);
 assert.match(xml,/<g class="front-guides"/);
 assert.match(xml,/<g class="back-guides"/);
 assert.ok(!/\sd="[^"]*\s[zZ]"/.test(xml));
 assert.ok(!/<path[^>]*class="cut/i.test(xml));
 assert.ok(!/<line[^>]*data-notch/i.test(xml));
 assert.ok(!/width="\d+(\.\d+)?mm"/.test(xml));
});

test("source trace is immutable description and every external line has a valid step",()=>{
 const res=createDiagnosticDraft(basic);
 const ids=new Set(res.construction.trace.map(x=>x.stepId));
 for(const group of res.groups){
  for(const g of group.guides)assert.ok(ids.has(g.sourceStepId));
 }
 assert.equal(res.construction.trace[0].source.chapter,2);
 assert.ok(res.construction.trace.every(x=>x.source.pdfPage===33));
});

test("invalid or arbitrary body data is refused before generating any visualization",()=>{
 for(const input of [
  {...basic,method:"SHIRT"},
  {...basic,variant:"CUSTOM"},
  {...basic,measurementsMm:{seatMm:-1,bodyRiseMm:282,insideLegMm:800}},
  {...basic,measurementsMm:{seatMm:NaN,bodyRiseMm:282,insideLegMm:800}},
  {...basic,measurementsMm:{seatMm:1020,bodyRiseMm:282}},
  {...basic,measurementsMm:{seatMm:1020,bodyRiseMm:282,insideLegMm:800,extra:123}}
 ])assert.throws(()=>createDiagnosticDraft(input),RangeError);
});

test("deterministic response and SVG independently of other drafts",()=>{
 const a=createDiagnosticDraft(basic);
 createDiagnosticDraft(onePiece);
 const b=createDiagnosticDraft(basic);
 assert.deepEqual(a,b);
});

test("no sewing validation is implied by passed arithmetic and construction-guide tests",()=>{
 const r=createDiagnosticDraft(basic);
 assert.equal(r.diagnostics.state,"PASS_RESEARCH_ONLY");
 for(const key of ["seamLengthReview","cutContourReview","physicalFitReview"])
  assert.equal(r.diagnostics[key],"NOT_RUN");
 assert.equal(r.source.completeness,"PARTIAL_CONSTRUCTION_GUIDES_ONLY");
});
