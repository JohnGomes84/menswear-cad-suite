import { describe, expect, it } from "vitest";
import { solveDirectedConstraints } from "./constraints";
import type { DirectedConstraint } from "./constraints";
import { exampleSceneV3 } from "./sceneV3";
import type { SketchEntity } from "./scene";

const ref=(entityId:string,pointIndex:number)=>({entityId,pointIndex});
const base=()=>exampleSceneV3().entities;
const c=(id:string,kind:"COINCIDENT"|"HORIZONTAL"|"VERTICAL",source=ref("line-a",0),target=ref("line-a",1)):DirectedConstraint=>
  ({id,kind,source,target});
const solved=(rules:DirectedConstraint[],entities:SketchEntity[]=base())=>{
  const r=solveDirectedConstraints(entities,rules);
  if(r.status!=="SOLVED")throw new Error(r.finding.message);
  return r;
};

describe("universal directed CAD constraints — synthetic geometry",()=>{
  it("aligns a line horizontally, keeping x and source point stable",()=>{
    const input=base(), original=structuredClone(input);
    const r=solved([c("h","HORIZONTAL")],input);
    expect(r.entities[1].pointsMm[1]).toEqual({x:105,y:115});
    expect(r.entities[1].pointsMm[0]).toEqual({x:20,y:115});
    expect(input).toEqual(original);
    expect(r.residualsMm.h).toBe(0);
  });
  it("aligns vertically, preserving the dependent point y",()=>{
    const r=solved([c("v","VERTICAL")]);
    expect(r.entities[1].pointsMm[1]).toEqual({x:20,y:95});
  });
  it("coincides points across different groups without copying identities",()=>{
    const r=solved([c("join","COINCIDENT",ref("curve-a",0),ref("curve-b",3))]);
    expect(r.entities[2].pointsMm[3]).toEqual({x:20,y:115});
    expect(r.entities[2].id).toBe("curve-b");
    expect(r.entities[0].id).toBe("curve-a");
    expect(r.moves).toHaveLength(1);
  });
  it("sets an explicit distance in mm, maintaining the initial direction",()=>{
    const rule:DirectedConstraint={
      id:"L",kind:"DISTANCE",distanceMm:50,
      source:ref("line-a",0),target:ref("line-a",1)
    };
    const r=solved([rule]);
    const a=r.entities[1].pointsMm[0],b=r.entities[1].pointsMm[1];
    expect(Math.hypot(b.x-a.x,b.y-a.y)).toBeCloseTo(50,8);
    expect(b.x).toBeGreaterThan(a.x);
    expect(r.residualsMm.L).toBeLessThan(1e-8);
  });
  it("treats zero-distance as coincidence",()=>{
    const rule:DirectedConstraint={id:"zero",kind:"DISTANCE",distanceMm:0,source:ref("line-a",0),target:ref("line-a",1)};
    const r=solved([rule]);
    expect(r.entities[1].pointsMm[1]).toEqual(r.entities[1].pointsMm[0]);
  });
  it("chains multiple constraints in dependency order, not authoring order",()=>{
    const rule1=c("first","HORIZONTAL",ref("curve-a",0),ref("line-a",0));
    const rule2=c("second","COINCIDENT",ref("line-a",0),ref("curve-b",0));
    const forward=solved([rule1,rule2]);
    const backward=solved([rule2,rule1]);
    expect(forward.entities).toEqual(backward.entities);
    expect(forward.entities[2].pointsMm[0].y).toBe(115);
  });
  it("detects cyclic dependencies without providing partial output",()=>{
    const a=c("a","COINCIDENT",ref("line-a",0),ref("line-a",1));
    const b=c("b","HORIZONTAL",ref("line-a",1),ref("line-a",0));
    const r=solveDirectedConstraints(base(),[a,b]);
    expect(r.status).toBe("BLOCKED");
    if(r.status==="BLOCKED")expect(r.finding.code).toBe("CYCLIC_DEPENDENCY");
  });
  it("rejects multiple constraints directed at the same target",()=>{
    const r=solveDirectedConstraints(base(),[c("h","HORIZONTAL"),c("v","VERTICAL")]);
    expect(r.status).toBe("BLOCKED");
    if(r.status==="BLOCKED")expect(r.finding.code).toBe("DUPLICATE_TARGET");
  });
  it("returns explicit underdetermined direction for positive distance and coincident controls",()=>{
    const entities=base();
    entities[1].pointsMm[1]={...entities[1].pointsMm[0]};
    const r=solveDirectedConstraints(entities,[{
      id:"unorient",kind:"DISTANCE",distanceMm:15,
      source:ref("line-a",0),target:ref("line-a",1)
    }]);
    expect(r.status).toBe("BLOCKED");
    if(r.status==="BLOCKED")expect(r.finding.code).toBe("UNDETERMINED_DIRECTION");
  });
  it("rejects unknown points, invalid length and nonfinite coordinates",()=>{
    const invalidRef=c("missing","COINCIDENT",ref("missing",0));
    expect(solveDirectedConstraints(base(),[invalidRef]).status).toBe("BLOCKED");
    const badLength:DirectedConstraint={id:"neg",kind:"DISTANCE",distanceMm:-1,source:ref("line-a",0),target:ref("line-a",1)};
    expect(solveDirectedConstraints(base(),[badLength]).status).toBe("BLOCKED");
    const entities=base();entities[0].pointsMm[0].y=NaN;
    expect(solveDirectedConstraints(entities,[c("h","HORIZONTAL")]).status).toBe("BLOCKED");
  });
  it("detects duplicate constraint IDs and duplicate entity IDs",()=>{
    expect(solveDirectedConstraints(base(),[c("dup","HORIZONTAL"),c("dup","VERTICAL")]).status).toBe("BLOCKED");
    const entities=base();entities[1].id=entities[0].id;
    expect(solveDirectedConstraints(entities,[c("h","HORIZONTAL")]).status).toBe("BLOCKED");
  });
  it("rejects invalid experimental tolerance",()=>{
    const r=solveDirectedConstraints(base(),[c("h","HORIZONTAL")],{toleranceMm:0});
    expect(r.status).toBe("BLOCKED");
  });
  it("has no automatic garment seam, allowance or easing semantics",()=>{
    const r=solved([c("h","HORIZONTAL")]);
    expect("seamPair" in r).toBe(false);
    expect("fabric" in r).toBe(false);
    expect(r.status).toBe("SOLVED"); // Numeric projection only, not sewing approval
  });
  it("returns unchanged scene when there are no constraints",()=>{
    const entities=base();
    const r=solved([],entities);
    expect(r.entities).toEqual(entities);
    expect(r.moves).toHaveLength(0);
  });
  it("blocks extreme overflow instead of exposing nonfinite coordinates",()=>{
    const entities=base();
    entities[1].pointsMm[0]={x:1e308,y:1e308};
    entities[1].pointsMm[1]={x:-1e308,y:-1e308};
    const r=solveDirectedConstraints(entities,[{
      id:"overflow",kind:"DISTANCE",distanceMm:10,
      source:ref("line-a",0),target:ref("line-a",1)
    }]);
    expect(r.status).toBe("BLOCKED");
  });
});
