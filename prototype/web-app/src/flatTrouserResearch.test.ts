import { describe,expect,it } from "vitest";
import { draftFlatTrouserFrontResearch } from "./flatTrouserResearch";

const values={
  seatMm:1020,bodyRiseMm:282,insideLegMm:800,variant:"BASIC" as const
};
const easy={...values,variant:"EASY" as const};
const close=(actual:number,want:number,tol=1e-8)=>
  expect(Math.abs(actual-want)).toBeLessThan(tol);

describe("Chapter 2 flat trouser — source-checked research axes",()=>{
  it("creates verified common grid in mm, keeping vertical down and seat to the left",()=>{
    const a=draftFlatTrouserFrontResearch("ONE_PIECE",values).frontPointsMm;
    expect(a["0"]).toEqual({x:0,y:0});
    expect(a["1"]).toEqual({x:0,y:302});
    expect(a["2"]).toEqual({x:0,y:1102});
    expect(a["3"]).toEqual({x:0,y:702});
    expect(a["4"]).toEqual({x:-295,y:302});
    expect(a["5"]).toEqual({x:-295,y:0});
    expect(a["6"]).toEqual({x:-285,y:0});
    expect(a["7"]).toEqual({x:-295,y:226.5});
    expect(a["8"]).toEqual({x:-363.75,y:302});
  });
  it("one-piece BASIC hem reference follows scalar fixture",()=>{
    const a=draftFlatTrouserFrontResearch("ONE_PIECE",values).frontPointsMm;
    close(a["9"].x,-216.66666666666666);
    close(a["9"].y,1102);
    close(a["10"].x,a["9"].x);
    close(a["10"].y,702);
    close(a["11"].x,a["10"].x-20);
  });
  it("one-piece EASY changes intended widths and rise, not inside leg",()=>{
    const a=draftFlatTrouserFrontResearch("ONE_PIECE",easy).frontPointsMm;
    expect(a["1"].y).toBe(322);
    expect(a["2"].y-a["1"].y).toBe(800);
    expect(a["4"].x).toBe(-335);
    expect(a["8"].x).toBe(-423.75);
    close(a["9"].x,-248.33333333333334);
  });
  it("two-piece BASIC front reference 9,11-13 and mirrored knee guides",()=>{
    const a=draftFlatTrouserFrontResearch("TWO_PIECE",values).frontPointsMm;
    expect(a["9"]).toEqual({x:-157.5,y:302});
    expect(a["10"]).toEqual({x:-157.5,y:702});
    expect(a["11"]).toEqual({x:-157.5,y:1102});
    close(a["12"].x,-265.8333333333333);
    close(a["13"].x,-49.16666666666667);
    close(a["12"].y,1102);
    close(a["13"].y,1102);
    close(a["14"].x,a["12"].x/2);
    close(a["15"].x,2*a["10"].x-a["14"].x);
  });
  it("two-piece EASY applies wider references and keeps common baseline",()=>{
    const a=draftFlatTrouserFrontResearch("TWO_PIECE",easy).frontPointsMm;
    expect(a["1"].y).toBe(322);
    expect(a["4"].x).toBe(-335);
    expect(a["9"].x).toBe(-177.5);
    close(a["12"].x,-299.1666666666667);
    expect(a["2"].y-a["1"].y).toBe(800);
  });
  it("rejects nonphysical or nonfinite fixture values",()=>{
    expect(()=>draftFlatTrouserFrontResearch("ONE_PIECE",{...values,insideLegMm:0})).toThrow(RangeError);
    expect(()=>draftFlatTrouserFrontResearch("TWO_PIECE",{...values,seatMm:NaN})).toThrow(RangeError);
    expect(()=>draftFlatTrouserFrontResearch("TWO_PIECE",{...values,bodyRiseMm:Infinity})).toThrow(RangeError);
  });
  it("does not accidentally declare this scaffold an approved garment pattern",()=>{
    const a=draftFlatTrouserFrontResearch("ONE_PIECE",values);
    expect(a.purpose).toBe("RESEARCH_ONLY");
    expect(a.sourcePdfPage).toBe(34);
    expect(a.unverifiedGeometry.length).toBeGreaterThan(0);
    expect("cutContour" in a).toBe(false);
    expect("seamAllowance" in a).toBe(false);
    expect("seamPair" in a).toBe(false);
    expect(a.frontPointsMm["13"]).toBeUndefined();
  });
  it("research scaffold is reproducible and does not mutate user inputs",()=>{
    const input={...values};
    const a=draftFlatTrouserFrontResearch("ONE_PIECE",input);
    const b=draftFlatTrouserFrontResearch("ONE_PIECE",input);
    expect(a).toEqual(b);
    expect(input).toEqual(values);
  });
});
