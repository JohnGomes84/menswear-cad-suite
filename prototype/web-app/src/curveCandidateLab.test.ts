import {describe,expect,it} from "vitest";
import {cubicDerivative,cubicPoint} from "./geometry";
import {
 midpointSagittaCandidate,threePointG1Candidate,radialDistanceEnvelope
} from "./curveCandidateLab";
import type {Vec2} from "./domain";

const p=(x:number,y:number):Vec2=>({x,y});
const signed=(a:Vec2,b:Vec2,c:Vec2)=>{
 const delta=p(b.x-a.x,b.y-a.y);
 const diff=p(c.x-a.x,c.y-a.y);
 return (delta.x*diff.y-delta.y*diff.x)/Math.hypot(delta.x,delta.y);
};

describe("Generic G1 cubic curve candidates — research, not tailor-approved",()=>{
 it("interpolates all three anchors exactly with shared G1 direction",()=>{
  const a=p(0,0),b=p(40,60),c=p(105,82);
  const r=threePointG1Candidate(a,b,c,1/3);
  expect(r.status).toBe("CANDIDATE_UNVERIFIED");
  expect(r.purpose).toBe("RESEARCH_ONLY");
  expect(r.pieces).toHaveLength(2);
  expect(cubicPoint(r.pieces[0],0)).toEqual(a);
  expect(cubicPoint(r.pieces[0],1)).toEqual(b);
  expect(cubicPoint(r.pieces[1],0)).toEqual(b);
  expect(cubicPoint(r.pieces[1],1)).toEqual(c);
  const d1=cubicDerivative(r.pieces[0],1),d2=cubicDerivative(r.pieces[1],0);
  const cross=d1.x*d2.y-d1.y*d2.x;
  expect(Math.abs(cross)).toBeLessThan(1e-7);
  expect(d1.x*d2.x+d1.y*d2.y).toBeGreaterThan(0);
  expect(r.diagnostics.joinAngleDeg).toBeLessThan(0.00001);
  expect(r.diagnostics.sampledSelfIntersections).toBe(0);
 });
 it("reproduces straight line exactly when three anchors are collinear",()=>{
  const r=threePointG1Candidate(p(0,0),p(10,0),p(20,0),1/3);
  expect(r.lengthMm).toBeCloseTo(20,7);
  expect(cubicPoint(r.pieces[0],0.5)).toEqual({x:5,y:0});
  expect(cubicPoint(r.pieces[1],0.5)).toEqual({x:15,y:0});
 });
 it("changing handle fraction changes candidate, not specified source points",()=>{
  const a=p(0,0),b=p(40,50),c=p(110,95);
  const first=threePointG1Candidate(a,b,c,0.2);
  const second=threePointG1Candidate(a,b,c,0.4);
  expect(first.pieces[0][1]).not.toEqual(second.pieces[0][1]);
  expect(first.pieces[0][3]).toEqual(second.pieces[0][3]);
  expect(first.pieces[1][0]).toEqual(second.pieces[1][0]);
  expect(first.pieces[1][3]).toEqual(second.pieces[1][3]);
  expect(first.assumptions.join(" ")).toMatch(/NÃO pelo livro/);
 });
 it("blocks coincident points, tangent reversal and ill-defined handle fractions",()=>{
  expect(()=>threePointG1Candidate(p(0,0),p(0,0),p(20,0),1/3)).toThrow();
  expect(()=>threePointG1Candidate(p(0,0),p(10,0),p(0,0),1/3)).toThrow();
  expect(()=>threePointG1Candidate(p(0,0),p(10,20),p(20,10),0)).toThrow();
  expect(()=>threePointG1Candidate(p(0,0),p(10,20),p(20,10),1)).toThrow();
 });
 it("radial envelope remains inconclusive about a 30mm book contact point",()=>{
  const c=threePointG1Candidate(p(0,0),p(10,0),p(20,0),1/3);
  const r=radialDistanceEnvelope(c,p(10,10),10);
  expect(r.targetWithinEnvelope).toBe(true);
  expect(r.minimumMm).toBeCloseTo(10,5);
  expect(r.touchingCondition).toBe("UNRESOLVED_DIRECTION_AND_CONTACT");
 });
});

describe("Generic sagitta research hypothesis",()=>{
 it("places exact 10mm midpoint sagitta on explicitly chosen side",()=>{
  const a=p(0,0),b=p(100,0);
  const c=midpointSagittaCandidate(a,b,10,"LEFT_OF_DIRECTED_CHORD");
  expect(c.pieces).toHaveLength(1);
  expect(cubicPoint(c.pieces[0],0)).toEqual(a);
  expect(cubicPoint(c.pieces[0],1)).toEqual(b);
  expect(cubicPoint(c.pieces[0],0.5).x).toBeCloseTo(50,9);
  expect(signed(a,b,cubicPoint(c.pieces[0],0.5))).toBeCloseTo(10,9);
  expect(c.diagnostics.midpointSignedSagittaMm).toBe(10);
  expect(c.diagnostics.sampledSelfIntersections).toBe(0);
  expect(c.lengthMm).toBeGreaterThan(100);
 });
 it("choosing the opposite side reverses signed sagitta, but does not change endpoints",()=>{
  const left=midpointSagittaCandidate(p(0,0),p(100,0),20,"LEFT_OF_DIRECTED_CHORD");
  const right=midpointSagittaCandidate(p(0,0),p(100,0),20,"RIGHT_OF_DIRECTED_CHORD");
  expect(cubicPoint(left.pieces[0],0.5)).toEqual({x:50,y:20});
  expect(cubicPoint(right.pieces[0],0.5)).toEqual({x:50,y:-20});
  expect(left.lengthMm).toBeCloseTo(right.lengthMm,8);
  expect(right.diagnostics.midpointSignedSagittaMm).toBe(-20);
 });
 it("works in oblique chord local coordinates without pixel assumptions",()=>{
  const a=p(10,40),b=p(70,120),s=15;
  const c=midpointSagittaCandidate(a,b,s,"LEFT_OF_DIRECTED_CHORD");
  const mid=cubicPoint(c.pieces[0],0.5);
  expect(signed(a,b,mid)).toBeCloseTo(s,8);
  const chordMid=p((a.x+b.x)/2,(a.y+b.y)/2);
  expect((mid.x-chordMid.x)*(b.x-a.x)+(mid.y-chordMid.y)*(b.y-a.y))
    .toBeCloseTo(0,8);
 });
 it("rejects missing side, zero-length chords and invalid depths",()=>{
  expect(()=>midpointSagittaCandidate(p(0,0),p(0,0),10,"LEFT_OF_DIRECTED_CHORD")).toThrow();
  expect(()=>midpointSagittaCandidate(p(0,0),p(10,0),0,"LEFT_OF_DIRECTED_CHORD")).toThrow();
  expect(()=>midpointSagittaCandidate(p(0,0),p(10,0),-1,"LEFT_OF_DIRECTED_CHORD")).toThrow();
  expect(()=>midpointSagittaCandidate(p(0,0),p(10,0),10,"UP" as "LEFT_OF_DIRECTED_CHORD")).toThrow();
 });
 it("never labels a mathematically smooth spline as approved for cutting",()=>{
  const c=midpointSagittaCandidate(p(0,0),p(100,0),10,"RIGHT_OF_DIRECTED_CHORD");
  expect(c.status).toBe("CANDIDATE_UNVERIFIED");
  expect("seamPair" in c).toBe(false);
  expect("cutContour" in c).toBe(false);
  expect(c.assumptions.join(" ")).toMatch(/not asserted by the book/);
 });
});
