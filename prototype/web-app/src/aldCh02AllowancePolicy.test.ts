import {describe,expect,it} from "vitest";
import {
 assessCh02Allowance,flatTrouserAllowancePolicy
} from "./aldCh02AllowancePolicy";

describe("Aldrich CH02 allowance source gate (PDF p.31)",()=>{
 it("preserves the statement: 10 mm are already included, except explicit exclusions",()=>{
  const rule=flatTrouserAllowancePolicy;
  expect(rule.source).toEqual({
   chapter:2,pdfPage:31,claim:"BLOCK_LEVEL_GENERAL_ALLOWANCE"
  });
  expect(rule.nominalIncludedMm).toBe(10);
  expect(rule.generalRule).toBe("ALREADY_INCLUDED_IN_BLOCK");
  expect(rule.exceptionLabel).toBe("NO_SEAM_ALLOWANCE");
  expect(rule.edgeMapping).toBe("NOT_YET_DEFINED");
 });
 it("never adds a second 10mm offset to an unidentified edge",()=>{
  for(const method of ["ONE_PIECE","TWO_PIECE"] as const)
   for(const variant of ["BASIC","EASY"] as const){
    const r=assessCh02Allowance(method,variant,"unknown-waist-segment");
    expect(r.automaticOffsetAllowed).toBe(false);
    expect(r.decision).toBe("BLOCKED_UNTIL_SOURCE_EDGE_TOPOLOGY_REVIEW");
    expect(r.exceptionHandling).toBe("REQUIRES_DIAGRAM_EDGE_MAPPING");
    expect(r.nominalIncludedMm).toBe(10);
   }
 });
 it("returns provenance but no invented seam/cut geometry",()=>{
  const result=assessCh02Allowance("TWO_PIECE","BASIC","seam-candidate");
  expect(result.source.pdfPage).toBe(31);
  expect("offsetPath" in result).toBe(false);
  expect("cutLine" in result).toBe(false);
  expect("seamLine" in result).toBe(false);
 });
 it("rejects invalid method, variant or edge identifiers",()=>{
  expect(()=>assessCh02Allowance("SHIRT" as "ONE_PIECE","BASIC","e")).toThrow();
  expect(()=>assessCh02Allowance("ONE_PIECE","CUSTOM" as "EASY","e")).toThrow();
  expect(()=>assessCh02Allowance("ONE_PIECE","BASIC","")).toThrow();
  expect(()=>assessCh02Allowance("ONE_PIECE","BASIC","with spaces")).toThrow();
 });
});
