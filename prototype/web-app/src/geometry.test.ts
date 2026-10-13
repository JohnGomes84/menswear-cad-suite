import { describe,expect,it } from "vitest";
import type { CubicControls } from "./geometry";
import {
  cubicLength, cubicPoint, pointAtArcLength, reverseCubic,
  syntheticNotches, evaluateSyntheticCurve
} from "./geometry";

const originalFixture:CubicControls=[
  {x:25,y:30},{x:35,y:135},{x:170,y:145},{x:205,y:45}
];
const line345:CubicControls=[
  {x:0,y:0},{x:1,y:4/3},{x:2,y:8/3},{x:3,y:4}
];
const parabola:CubicControls=[
  {x:0,y:0},{x:1/3,y:0},{x:2/3,y:1/3},{x:1,y:1}
];
const close=(a:number,b:number,tol=1e-6)=>expect(Math.abs(a-b)).toBeLessThan(tol);

describe("Generic CAD geometry adapter — independent of clothing",()=>{
  it("matches an analytic 3-4-5 segment",()=>{
    close(cubicLength(line345),5,1e-8);
    const half=pointAtArcLength(line345,2.5);
    close(half.pointMm.x,1.5,1e-7);
    close(half.pointMm.y,2,1e-7);
    close(half.tangent.x,0.6,1e-7);
    close(half.tangent.y,0.8,1e-7);
  });

  it("matches a mathematically exact parabolic arc",()=>{
    const exact=Math.sqrt(5)/2+Math.asinh(2)/4;
    close(cubicLength(parabola),exact,1e-6);
  });

  it("matches original Python fixture cross-language",()=>{
    // Python geometry_poc.py 258.1271065334 mm; mirrored UI curve has identical length.
    close(cubicLength(originalFixture),258.1271065334,1e-6);
    const displayed:CubicControls=originalFixture.map(p=>({x:p.x,y:160-p.y})) as unknown as CubicControls;
    close(cubicLength(displayed),258.1271065334,1e-6);
  });

  it("preserves length and reverses arc mapping",()=>{
    const r=reverseCubic(originalFixture),length=cubicLength(originalFixture);
    close(cubicLength(r),length,1e-6);
    const a=pointAtArcLength(originalFixture,0.37*length);
    const b=pointAtArcLength(r,0.63*length);
    close(a.pointMm.x,b.pointMm.x,1e-6);
    close(a.pointMm.y,b.pointMm.y,1e-6);
    close(a.tangent.x,-b.tangent.x,1e-6);
    close(a.tangent.y,-b.tangent.y,1e-6);
  });

  it("stores synthetic notches by accumulated arc, not by t",()=>{
    const n=syntheticNotches(originalFixture);
    const length=cubicLength(originalFixture);
    expect(n).toHaveLength(3);
    for(const [i,f] of [0.25,0.5,0.75].entries()){
      close(n[i].arcLengthMm,length*f,1e-7);
      close(Math.hypot(n[i].tangent.x,n[i].tangent.y),1,1e-7);
    }
  });

  it("translation and scaling preserve the expected relation",()=>{
    const moved=originalFixture.map(p=>({x:p.x+27,y:p.y-13})) as unknown as CubicControls;
    const scaled=originalFixture.map(p=>({x:3*p.x,y:3*p.y})) as unknown as CubicControls;
    close(cubicLength(moved),cubicLength(originalFixture),1e-6);
    close(cubicLength(scaled)/cubicLength(originalFixture),3,1e-6);
    close(cubicPoint(originalFixture,0.8).x+27,cubicPoint(moved,0.8).x,1e-6);
  });

  it("rejects arc requests outside curve and invalid parameters",()=>{
    const l=cubicLength(line345);
    expect(()=>pointAtArcLength(line345,-0.01)).toThrow(RangeError);
    expect(()=>pointAtArcLength(line345,l+0.01)).toThrow(RangeError);
    expect(()=>cubicLength(line345,0)).toThrow(RangeError);
    expect(()=>cubicPoint(line345,1.2)).toThrow(RangeError);
    expect(()=>syntheticNotches(line345,[-0.5])).toThrow(RangeError);
  });

  it("reports zero-length curve as invalid rather than valid notch",()=>{
    const p:CubicControls=[{x:2,y:2},{x:2,y:2},{x:2,y:2},{x:2,y:2}];
    expect(evaluateSyntheticCurve(p).state).toBe("FAIL");
    expect(()=>pointAtArcLength(p,0)).toThrow("degenerada");
  });

  it("throws when numerical budget cannot converge",()=>{
    expect(()=>cubicLength(originalFixture,1e-16,0)).toThrow("não convergiu");
  });

  it("refuses non-finite control coordinates",()=>{
    const p:CubicControls=[{x:0,y:0},{x:NaN,y:1},{x:3,y:2},{x:9,y:9}];
    expect(evaluateSyntheticCurve(p).state).toBe("FAIL");
  });

  it("does not invent garment fit validation",()=>{
    const e=evaluateSyntheticCurve(line345);
    expect(e.state).toBe("PASS"); // PASS only means valid synthetic numerical experiment.
    expect("seamPair" in e).toBe(false);
  });
});
