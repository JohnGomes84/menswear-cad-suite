import {describe,expect,it} from "vitest";
import {
  flatTrouserConstructionProgram
} from "./aldCh02FlatTrouserBackProgram";
import {draftFlatTrouserFrontResearch} from "./flatTrouserResearch";
import {draftFlatTrouserSectionsResearch} from "./flatTrouserBackResearch";
import {executeDraftProgram} from "./draftingInterpreter";

const basic={seatMm:1020,bodyRiseMm:282,insideLegMm:800,variant:"BASIC" as const};
const easy={...basic,variant:"EASY" as const};
const close=(got:number,want:number)=>expect(got).toBeCloseTo(want,7);
const comparePoint=(p:{x:number;y:number},x:number,y:number)=>{
  close(p.x,x);close(p.y,y);
};

describe("CH02 one-piece BACK: printed sequential instructions + diagram",()=>{
 it("constructs every stated back reference 12–18 after front 0–11",()=>{
  const r=draftFlatTrouserSectionsResearch("ONE_PIECE",basic);
  expect(r.frontPointIds).toEqual(Array.from({length:12},(_,i)=>String(i)));
  expect(r.backPointIds).toEqual(["12","13","14","15","16","17","18"]);
  expect(r.sourceTrace.map(s=>s.pointId)).toEqual(
    [...r.frontPointIds,...r.backPointIds]
  );
  expect(r.sourceTrace.every(s=>s.source.pdfPage===32)).toBe(true);
 });
 it("BASIC: back waist and rise are independent arithmetic fixtures",()=>{
  const p=draftFlatTrouserSectionsResearch("ONE_PIECE",basic).pointsMm;
  comparePoint(p["12"],-250,0);
  comparePoint(p["13"],-250,-35);
  comparePoint(p["14"],-295,151);
  comparePoint(p["15"],-437.5,302);
  comparePoint(p["16"],-437.5,312);
 });
 it("BASIC: back hem and knee move away from front (left)",()=>{
  const p=draftFlatTrouserSectionsResearch("ONE_PIECE",basic).pointsMm;
  comparePoint(p["17"],-236.66666666666666,1102);
  comparePoint(p["18"],-266.6666666666667,702);
  expect(p["17"].x).toBeLessThan(p["9"].x);
  expect(p["18"].x).toBeLessThan(p["11"].x);
 });
 it("EASY: variants change rise, offsets and upper back reference",()=>{
  const p=draftFlatTrouserSectionsResearch("ONE_PIECE",easy).pointsMm;
  comparePoint(p["12"],-290,0);
  comparePoint(p["13"],-290,-45);
  comparePoint(p["14"],-335,161);
  comparePoint(p["15"],-522.5,322);
  comparePoint(p["16"],-522.5,332);
  comparePoint(p["17"],-268.3333333333333,1122);
  comparePoint(p["18"],-298.3333333333333,722);
 });
});

describe("CH02 two-piece BACK: source-ordered body construction",()=>{
 it("requires front points 0–15, then computes 16–25",()=>{
  const r=draftFlatTrouserSectionsResearch("TWO_PIECE",basic);
  expect(r.frontPointIds).toEqual(Array.from({length:16},(_,i)=>String(i)));
  expect(r.backPointIds).toEqual(Array.from({length:10},(_,i)=>String(i+16)));
  expect(r.sourceTrace.every(s=>s.source.pdfPage===33)).toBe(true);
  expect(r.straightConstructionGuides).toEqual([
    ["17","18"],["18","22"],["24","25"]
  ]);
 });
 it("BASIC: back upper offsets 6→16, 16→17, 0→18 and 4→19",()=>{
  const p=draftFlatTrouserSectionsResearch("TWO_PIECE",basic).pointsMm;
  comparePoint(p["16"],-235,0);
  comparePoint(p["17"],-235,-40);
  comparePoint(p["18"],40,0);
  comparePoint(p["19"],-295,151);
 });
 it("BASIC: back fork, waist, hem, knee intersection and opposite point",()=>{
  const p=draftFlatTrouserSectionsResearch("TWO_PIECE",basic).pointsMm;
  comparePoint(p["20"],-437.5,302);
  comparePoint(p["21"],-437.5,312);
  comparePoint(p["22"],-39.16666666666667,1102);
  comparePoint(p["23"],-10.43103448275862,702);
  comparePoint(p["24"],-275.8333333333333,1102);
  comparePoint(p["25"],-304.5689655172414,702);
  expect(p["22"].x).toBeGreaterThan(p["12"].x);
  expect(p["23"].x).toBeGreaterThan(p["14"].x);
  expect(p["24"].x).toBeLessThan(p["13"].x);
  expect(p["25"].x).toBeLessThan(p["15"].x);
 });
 it("checks knee reference 23 by independent line interpolation",()=>{
  const p=draftFlatTrouserSectionsResearch("TWO_PIECE",basic).pointsMm;
  const proportion=(p["3"].y-p["18"].y)/(p["22"].y-p["18"].y);
  close(p["23"].x,p["18"].x+(p["22"].x-p["18"].x)*proportion);
  close(Math.abs(p["25"].x-p["15"].x),Math.abs(p["23"].x-p["14"].x));
 });
 it("EASY: carries additional fitting offsets through all the back",()=>{
  const p=draftFlatTrouserSectionsResearch("TWO_PIECE",easy).pointsMm;
  comparePoint(p["16"],-275,0);
  comparePoint(p["17"],-275,-40);
  comparePoint(p["18"],50,0);
  comparePoint(p["19"],-335,161);
  comparePoint(p["20"],-522.5,322);
  comparePoint(p["21"],-522.5,332);
  comparePoint(p["22"],-45.83333333333333,1122);
  comparePoint(p["23"],-11.668152109328581,722);
  comparePoint(p["24"],-309.1666666666667,1122);
  comparePoint(p["25"],-343.3318478906714,722);
 });
});

describe("Research gate and source fidelity",()=>{
 it("does not alter previously established front geometry",()=>{
  for(const method of ["ONE_PIECE","TWO_PIECE"] as const){
   for(const input of [basic,easy]){
    const front=draftFlatTrouserFrontResearch(method,input).frontPointsMm;
    const result=draftFlatTrouserSectionsResearch(method,input).pointsMm;
    for(const [id,p] of Object.entries(front))expect(result[id]).toEqual(p);
   }
  }
 });
 it("records the back's source steps and exact point dependencies",()=>{
  const r=draftFlatTrouserSectionsResearch("TWO_PIECE",basic);
  const byPoint=Object.fromEntries(r.sourceTrace.map(x=>[x.pointId,x]));
  expect(byPoint["23"].usedPoints).toEqual(["18","22","3"]);
  expect(byPoint["25"].usedPoints).toEqual(["15","14","23"]);
  expect(byPoint["25"].source.pdfPage).toBe(33);
  expect(byPoint["21"].lengthMm).toBe(10);
  expect(byPoint["20"].lengthMm).toBe(73.75);
 });
 it("program is deterministic for different body measures",()=>{
  const prog=flatTrouserConstructionProgram("TWO_PIECE","BASIC");
  const r=executeDraftProgram(prog,{seatMm:1080,bodyRiseMm:300,insideLegMm:840});
  expect(r.pointsMm["1"].y).toBe(320);
  expect(r.pointsMm["3"].y).toBe(740);
  expect(r.pointsMm["19"].y).toBe(160);
  expect(r.pointsMm["23"].y).toBe(740);
  expect(r.trace).toHaveLength(26);
 });
 it("withholds all curves, full pattern edges and cut instructions",()=>{
  for(const method of ["ONE_PIECE","TWO_PIECE"] as const){
    const result=draftFlatTrouserSectionsResearch(method,basic);
    expect(result.purpose).toBe("RESEARCH_ONLY");
    expect(result.withheldGeometry).toHaveLength(4);
    expect("cutContour" in result).toBe(false);
    expect("seamAllowance" in result).toBe(false);
    expect("bezier" in result).toBe(false);
  }
 });
 it("rejects invalid measurements and versions without bypassing the source",()=>{
  expect(()=>draftFlatTrouserSectionsResearch("ONE_PIECE",{...basic,insideLegMm:-1}))
   .toThrow(/Medidas/);
  expect(()=>draftFlatTrouserSectionsResearch("TWO_PIECE",{...basic,seatMm:Infinity}))
   .toThrow(/Medidas/);
  expect(()=>flatTrouserConstructionProgram("OTHER" as "ONE_PIECE","BASIC"))
   .toThrow(/Bloco/);
 });
});
