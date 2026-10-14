import { describe, expect, it } from "vitest";
import sourceRegistry from "../../../docs/domain/CH02-SOURCE-LINES-001.json";
import pathRegistry from "../../../docs/domain/CH02-ORIENTED-SOURCE-PATHS-001.json";
import { inspectResearchTopology } from "./topologyResearch";

const source = sourceRegistry.lineCommands.map(x => ({...x, geometry: x.geometry as "STRAIGHT" | "CURVE"}));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
function reject(change: (doc: any) => void, contains: RegExp) {
  const doc = clone(pathRegistry);
  change(doc);
  expect(() => inspectResearchTopology(doc, source)).toThrow(contains);
}

describe("Universal topology research — no garment-specific industrial inference", () => {
  it("audits four continuous, OPEN source chains, independent of renderer", () => {
    const r = inspectResearchTopology(pathRegistry, source);
    expect(r.status).toBe("PASS_RESEARCH_TOPOLOGY_ONLY");
    expect(r.sourceStrokeCount).toBe(16);
    expect(r.paths.map(p => [p.method, p.section, p.orderedPointIds.join("-"), p.unresolvedCurveCount])).toEqual([
      ["ONE_PIECE", "FRONT", "6-7-8-11-9", 2],
      ["ONE_PIECE", "BACK", "13-14-16-18-17", 2],
      ["TWO_PIECE", "FRONT", "6-7-8-15-13", 2],
      ["TWO_PIECE", "BACK", "17-19-21-25-24", 2],
    ]);
    expect(r.paths.every(p => p.segmentCount === 3 && !p.isCutBoundary && !p.isGeometricallyResolved)).toBe(true);
    expect(r.cutReady).toBe(false);
    expect(r.pendingOperations).toBe(1);
    expect(r.blockedPerimeters).toBe(4);
    expect(r.unmappedAllowances).toBe(4);
  });
  it("fails if a claimed path segment stops matching a cited book command", () => {
    reject(d => { d.paths[0].segments[0].toPointId = "11"; }, /extremos incompatíveis/);
  });
  it("fails a false reverse direction on the lower inseam", () => {
    reject(d => { d.paths[0].segments[2].traversal = "FORWARD"; }, /extremos incompatíveis/);
  });
  it("fails if continuous endpoint is broken between source strokes", () => {
    reject(d => { d.paths[0].segments.splice(1, 1); }, /descontinuidade/);
  });
  it("fails if an unknown command is inserted", () => {
    reject(d => { d.paths[0].segments[1].sourceCommandId = "FAKE_CURVE"; }, /comando desconhecido/);
  });
  it("fails if a curve is declared exactly resolved", () => {
    reject(d => { d.paths[0].segments[0].geometryKnowledge = "STRAIGHT_ENDPOINTS_ONLY"; }, /geometria/);
  });
  it("fails if a stroke from another method is silently reused", () => {
    reject(d => { d.paths[0].segments[1].sourceCommandId = "ALD-CH02-2P-FRONT_UPPER_INSEAM"; }, /outra seção\/método/);
  });
  it("does not admit SEAM_LINE / CUT_LINE / FOLD_LINE claims via hidden fields", () => {
    reject(d => { d.paths[0].segments[1].role = "CUT_LINE"; }, /campo inesperado/);
    reject(d => { d.paths[0].layer = "INDUSTRIAL_PERIMETER"; }, /layer/);
  });
  it("blocks approved industrial edges, missing perimeter blockers or false cut-ready", () => {
    reject(d => { d.blockedPerimeters[0].approvedEdgeIds = ["CUT_A"]; }, /aresta industrial/);
    reject(d => { d.blockedPerimeters.pop(); }, /bloqueio de perímetro/);
    reject(d => { d.release.cutReady = true; }, /cutReady/);
  });
  it("preserves exceptions by region only: no inferred seam offset", () => {
    reject(d => { d.unmappedAllowances[0].edgeIds = ["LINE_A"]; }, /margem atribuída/);
    reject(d => { d.unmappedAllowances[0].offsetAllowed = true; }, /offsetAllowed/);
  });
  it("blocks premature execution of one-piece mirroring", () => {
    reject(d => { d.pendingOperations[0].status = "EXECUTED"; }, /operation status/);
  });
  it("rejects source ambiguity and duplicate entity IDs", () => {
    reject(d => { d.paths[1].id = d.paths[0].id; }, /ID duplicado/);
    reject(d => { d.paths[0].segments[1].id = d.paths[0].segments[0].id; }, /ID duplicado/);
    const conflictingSource = [...source, {...source[0]}];
    expect(() => inspectResearchTopology(pathRegistry, conflictingSource)).toThrow(/comando de fonte duplicado/);
  });
  it("works for an unrelated abstract design without clothing-specific coordinates", () => {
    const sample = clone(pathRegistry);
    sample.paths = [
      {id:"OTHER:BASE:CHAIN",method:"OTHER",section:"BASE",layer:"SOURCE_CONSTRUCTION",status:"OPEN_SOURCE_STROKE_CHAIN",segments:[
        {id:"other:1",sourceCommandId:"other-stroke",traversal:"FORWARD",fromPointId:"P",toPointId:"Q",geometryKnowledge:"STRAIGHT_ENDPOINTS_ONLY"}
      ]}
    ];
    sample.blockedPerimeters = [{id:"OTHER:BASE:PERIMETER",method:"OTHER",section:"BASE",layer:"INDUSTRIAL_PERIMETER",relatedPathId:"OTHER:BASE:CHAIN",status:"NOT_YET_DEFINED",approvedEdgeIds:[]}];
    sample.pendingOperations = [];
    sample.unmappedAllowances = [];
    const r=inspectResearchTopology(sample, [{id:"other-stroke",method:"OTHER",section:"BASE",geometry:"STRAIGHT",pointIds:["P","Q"]}]);
    expect(r.paths[0].orderedPointIds).toEqual(["P","Q"]);
    expect(r.cutReady).toBe(false);
  });
});
