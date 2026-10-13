import {describe,expect,it} from "vitest";
import catalog from "../../../docs/domain/CH02-CURVE-REQUIREMENTS-001.json";
import {assessChapter2Curve} from "./aldCh02CurveCandidateLab";
import type {CurveAssessment} from "./aldCh02CurveCandidateLab";
import {cubicPoint} from "./geometry";

const basic={seatMm:1020,bodyRiseMm:282,insideLegMm:800,variant:"BASIC" as const};
const easy={...basic,variant:"EASY" as const};
const rules=catalog.rules;

function confirmed(r:CurveAssessment):Extract<CurveAssessment,{state:"CANDIDATE_UNVERIFIED"}>{
 if(r.state!=="CANDIDATE_UNVERIFIED")throw new Error(JSON.stringify(r));
 return r;
}
describe("Chapter 2 — source registry + geometric hypotheses kept separate",()=>{
 it("registry has exactly eight rules, distinct by block, side and segment",()=>{
  expect(rules).toHaveLength(8);
  const triples=rules.map(r=>[r.method,r.section,r.kind].join("#"));
  expect(new Set(triples).size).toBe(8);
 });
 it("never creates a candidate without explicit engineering assumptions",()=>{
  for(const rule of rules){
   const out=assessChapter2Curve(rule,basic);
   expect(out.state).toBe("BLOCKED");
   if(out.state==="BLOCKED")expect(out.reason).toBe("HYPOTHESIS_REQUIRED");
  }
 });
 it("all 8 chapter curve candidates remain not approved with numeric diagnostics",()=>{
  for(const rule of rules){
   for(const data of [basic,easy]){
    const hypothesis=rule.kind==="CROTCH"
      ?{handleFraction:1/3}
      :{sagittaSide:"LEFT_OF_DIRECTED_CHORD" as const};
    const r=confirmed(assessChapter2Curve(rule,data,hypothesis));
    expect(r.candidate.status).toBe("CANDIDATE_UNVERIFIED");
    expect(r.candidate.purpose).toBe("RESEARCH_ONLY");
    expect(r.mandatoryUnresolved.length).toBeGreaterThan(0);
    expect(r.sourceConstraint.pdfPage).toBe(rule.sourceRef.pdfPage);
    expect(Number.isFinite(r.candidate.lengthMm)).toBe(true);
    expect(r.candidate.lengthMm).toBeGreaterThan(0);
    expect(r.candidate.diagnostics.sampledSelfIntersections).toBe(0);
    expect("cutContour" in r).toBe(false);
    expect("approved" in r).toBe(false);
   }
  }
 });
 it("gancho is through the three mandatory printed point references",()=>{
  for(const rule of rules.filter(r=>r.kind==="CROTCH")){
   const r=confirmed(assessChapter2Curve(rule,basic,{handleFraction:1/3}));
   expect(r.candidate.pieces).toHaveLength(2);
   const a=r.candidate.pieces[0],b=r.candidate.pieces[1];
   expect(a[3]).toEqual(b[0]);
   expect(r.candidate.diagnostics.joinAngleDeg).toBeLessThan(1e-5);
   expect(r.sourceConstraint.crotchContactReference?.pointId).toBe("4");
   const target=r.section==="FRONT"?30:55;
   expect(r.sourceConstraint.crotchContactReference?.distanceMm).toBe(target);
   expect(r.sourceConstraint.crotchContactReference?.envelope.touchingCondition)
     .toBe("UNRESOLVED_DIRECTION_AND_CONTACT");
  }
 });
 it("source basic/easy radial requirements follow Aldrich and not handle fraction",()=>{
  for(const rule of rules.filter(r=>r.kind==="CROTCH")){
   const a=confirmed(assessChapter2Curve(rule,basic,{handleFraction:0.2}));
   const b=confirmed(assessChapter2Curve(rule,easy,{handleFraction:0.4}));
   expect(a.sourceConstraint.crotchContactReference?.distanceMm)
    .toBe(rule.section==="FRONT"?30:55);
   expect(b.sourceConstraint.crotchContactReference?.distanceMm)
    .toBe(rule.section==="FRONT"?32.5:60);
  }
 });
 it("front and back inseam depth comes from book, side remains a separate hypothesis",()=>{
  for(const rule of rules.filter(r=>r.kind==="INSEAM")){
   const r=confirmed(assessChapter2Curve(rule,basic,{
     sagittaSide:"RIGHT_OF_DIRECTED_CHORD"
   }));
   const expected=rule.section==="FRONT"?10:20;
   expect(r.sourceConstraint.inseamDepthMm).toBe(expected);
   const controls=r.candidate.pieces[0];
   const a=controls[0],b=controls[3],mid=cubicPoint(controls,0.5);
   const signed=((b.x-a.x)*(mid.y-a.y)-(b.y-a.y)*(mid.x-a.x))
     /Math.hypot(b.x-a.x,b.y-a.y);
   expect(signed).toBeCloseTo(-expected,7);
   expect(r.candidate.diagnostics.midpointSignedSagittaMm).toBe(-expected);
   expect(r.mandatoryUnresolved.join(" ")).toMatch(/posição longitudinal/);
  }
 });
 it("blocks promoted source status without bypassing the gate",()=>{
  const tampered={...rules[0],geometryStatus:"APPROVED"};
  const r=assessChapter2Curve(tampered,basic,{handleFraction:1/3});
  expect(r.state).toBe("BLOCKED");
  if(r.state==="BLOCKED")expect(r.reason).toBe("SOURCE_UNVERIFIED");
 });
 it("rejects broken references instead of inventing new points",()=>{
  const tampered={...rules[0],pointPath:["6","7","999"]};
  const r=assessChapter2Curve(tampered,basic,{handleFraction:1/3});
  expect(r.state).toBe("BLOCKED");
  if(r.state==="BLOCKED")expect(r.reason).toBe("INVALID_GEOMETRY");
 });
 it("blocks bad source page and invalid point cardinality",()=>{
  const page={...rules[0],sourceRef:{chapter:2,pdfPage:33}};
  const wrong=assessChapter2Curve(page,basic,{handleFraction:1/3});
  expect(wrong.state).toBe("BLOCKED");
  if(wrong.state==="BLOCKED")expect(wrong.reason).toBe("INVALID_REGISTRY");
  const empty={...rules[0],pointPath:["6"]};
  const r=assessChapter2Curve(empty,basic,{handleFraction:1/3});
  expect(r.state).toBe("BLOCKED");
  if(r.state==="BLOCKED")expect(r.reason).toBe("INVALID_REGISTRY");
 });
 it("rejects omitted or bogus inward side",()=>{
  const row=rules.find(r=>r.kind==="INSEAM")!;
  const r=assessChapter2Curve(row,basic,{sagittaSide:"TOP" as "LEFT_OF_DIRECTED_CHORD"});
  expect(r.state).toBe("BLOCKED");
  if(r.state==="BLOCKED")expect(r.reason).toBe("INVALID_GEOMETRY");
 });
});
