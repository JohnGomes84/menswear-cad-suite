/**
 * Provider-independent topology RESEARCH contract.
 * No garment type, Bézier interpolation, offset or manufacturing readiness.
 * A continuous stroke chain is NOT a closed industrial cutting boundary.
 */
export type SourceStroke = {
  id: string;
  method: string;
  section: string;
  geometry: "STRAIGHT" | "CURVE";
  pointIds: readonly string[];
};

type Traversal = "FORWARD" | "REVERSED";
type GeometryKnowledge = "STRAIGHT_ENDPOINTS_ONLY" | "CURVE_REQUIREMENTS_PENDING";
type Segment = {
  id: string;
  sourceCommandId: string;
  traversal: Traversal;
  fromPointId: string;
  toPointId: string;
  geometryKnowledge: GeometryKnowledge;
};
type ResearchPath = {
  id: string;
  method: string;
  section: string;
  layer: "SOURCE_CONSTRUCTION";
  status: "OPEN_SOURCE_STROKE_CHAIN";
  segments: Segment[];
};
type PendingOperation = {
  id: string;
  method: string;
  operation: "MIRROR_FRONT_AND_ALIGN_SIDE";
  sourcePdfPage: number;
  status: "DOCUMENTED_NOT_EXECUTED";
};
type BlockedPerimeter = {
  id: string;
  method: string;
  section: string;
  layer: "INDUSTRIAL_PERIMETER";
  relatedPathId: string;
  status: "NOT_YET_DEFINED";
  approvedEdgeIds: [];
};
type UnmappedAllowance = {
  id: string;
  method: string;
  region: "UPPER_WAIST" | "LOWER_HEM";
  status: "REGION_CONFIRMED_EDGE_SCOPE_NOT_MAPPED";
  edgeIds: [];
  offsetAllowed: false;
};
export type ResearchTopology = {
  schema: "topology-research/0.1.0";
  purpose: "RESEARCH_ONLY";
  unit: "mm";
  sourceMethodId: string;
  paths: ResearchPath[];
  pendingOperations: PendingOperation[];
  blockedPerimeters: BlockedPerimeter[];
  unmappedAllowances: UnmappedAllowance[];
  release: { cutReady: false; physicalFit: "NOT_RUN" };
};
export type InspectedPath = {
  id: string;
  method: string;
  section: string;
  startPointId: string;
  endPointId: string;
  orderedPointIds: string[];
  segmentCount: number;
  unresolvedCurveCount: number;
  isGeometricallyResolved: false;
  isCutBoundary: false;
};
export type TopologyResearchReport = {
  status: "PASS_RESEARCH_TOPOLOGY_ONLY";
  cutReady: false;
  sourceStrokeCount: number;
  paths: InspectedPath[];
  pendingOperations: number;
  blockedPerimeters: number;
  unmappedAllowances: number;
};

function fail(why: string): never {
  throw new Error(`Topologia de pesquisa bloqueada: ${why}`);
}
function record(v: unknown, ctx: string): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) fail(`${ctx}: objeto esperado`);
  return v as Record<string, unknown>;
}
function exact(o: Record<string, unknown>, keys: readonly string[], ctx: string): void {
  const expected = new Set(keys);
  for (const key of Object.keys(o)) if (!expected.has(key)) fail(`${ctx}: campo inesperado ${key}`);
  for (const key of keys) if (!(key in o)) fail(`${ctx}: campo ausente ${key}`);
}
function array(v: unknown, ctx: string): unknown[] {
  if (!Array.isArray(v)) fail(`${ctx}: array esperado`);
  return v as unknown[];
}
function id(v: unknown, ctx: string): string {
  if (typeof v !== "string" || v.trim().length === 0) fail(`${ctx}: ID vazio/inválido`);
  return v as string;
}
function fixed(v: unknown, expected: string | boolean, ctx: string): void {
  if (v !== expected) fail(`${ctx}: esperado ${String(expected)}`);
}
function unique(v: string, seen: Set<string>, ctx: string): void {
  if (seen.has(v)) fail(`${ctx}: ID duplicado ${v}`);
  seen.add(v);
}

/**
 * Validates a diagnostic topology description against independent source stroke
 * references. Does not generate geometry or authorize garment manufacturing.
 */
export function inspectResearchTopology(input: unknown, source: readonly SourceStroke[]): TopologyResearchReport {
  const d = record(input, "documento");
  exact(d, ["schema", "purpose", "unit", "sourceMethodId", "paths", "pendingOperations", "blockedPerimeters", "unmappedAllowances", "release"], "documento");
  fixed(d.schema, "topology-research/0.1.0", "schema");
  fixed(d.purpose, "RESEARCH_ONLY", "purpose");
  fixed(d.unit, "mm", "unit");
  id(d.sourceMethodId, "sourceMethodId");
  const release = record(d.release, "release");
  exact(release, ["cutReady", "physicalFit"], "release");
  fixed(release.cutReady, false, "cutReady");
  fixed(release.physicalFit, "NOT_RUN", "physicalFit");
  if (!Array.isArray(source) || source.length === 0) fail("registro de traçados de fonte ausente");
  const commandMap = new Map<string, SourceStroke>();
  for (const cmd of source) {
    const commandId = id(cmd.id, "sourceCommandId");
    if (commandMap.has(commandId)) fail(`comando de fonte duplicado ${commandId}`);
    if (cmd.geometry !== "STRAIGHT" && cmd.geometry !== "CURVE") fail(`comando fonte sem tipo: ${commandId}`);
    if (!Array.isArray(cmd.pointIds) || cmd.pointIds.length < 2) fail(`comando sem pontos: ${commandId}`);
    cmd.pointIds.forEach((v: string) => id(v, `ponto ${commandId}`));
    if (cmd.pointIds[0] === cmd.pointIds[cmd.pointIds.length - 1]) fail(`comando degenerado ${commandId}`);
    commandMap.set(commandId, cmd);
  }
  const seenPaths = new Set<string>();
  const seenSegments = new Set<string>();
  const paths = array(d.paths, "paths");
  if (paths.length === 0) fail("nenhum percurso de pesquisa");
  const results: InspectedPath[] = [];
  for (const rawPath of paths) {
    const p = record(rawPath, "path");
    exact(p, ["id", "method", "section", "layer", "status", "segments"], "path");
    const pathId = id(p.id, "path id");
    unique(pathId, seenPaths, "path");
    const method = id(p.method, `method ${pathId}`);
    const section = id(p.section, `section ${pathId}`);
    fixed(p.layer, "SOURCE_CONSTRUCTION", `layer ${pathId}`);
    fixed(p.status, "OPEN_SOURCE_STROKE_CHAIN", `status ${pathId}`);
    const segments = array(p.segments, `segments ${pathId}`);
    if (segments.length === 0) fail(`path ${pathId} sem segmentos`);
    const ordered: string[] = [];
    let curves = 0;
    for (const [index, rawSegment] of segments.entries()) {
      const segment = record(rawSegment, `segment ${index}`);
      exact(segment, ["id", "sourceCommandId", "traversal", "fromPointId", "toPointId", "geometryKnowledge"], `segment ${pathId}:${index}`);
      unique(id(segment.id, "segment id"), seenSegments, "segment");
      const cmdId = id(segment.sourceCommandId, `comando ${pathId}:${index}`);
      const cmd = commandMap.get(cmdId);
      if (!cmd) fail(`comando desconhecido ${cmdId}`);
      if (cmd.method !== method || cmd.section !== section) fail(`comando de outra seção/método ${cmdId}`);
      if (segment.traversal !== "FORWARD" && segment.traversal !== "REVERSED") fail(`sentido não definido ${cmdId}`);
      const traversal = segment.traversal as Traversal;
      const orderedCmdPoints = traversal === "FORWARD" ? [...cmd.pointIds] : [...cmd.pointIds].reverse();
      const from = id(segment.fromPointId, `from ${cmdId}`);
      const to = id(segment.toPointId, `to ${cmdId}`);
      if (from !== orderedCmdPoints[0] || to !== orderedCmdPoints[orderedCmdPoints.length - 1]) fail(`sentido/extremos incompatíveis ${cmdId}`);
      const expectedGeometry = cmd.geometry === "CURVE" ? "CURVE_REQUIREMENTS_PENDING" : "STRAIGHT_ENDPOINTS_ONLY";
      fixed(segment.geometryKnowledge, expectedGeometry, `geometria ${cmdId}`);
      if (cmd.geometry === "CURVE") curves++;
      if (index > 0 && ordered[ordered.length - 1] !== from) fail(`descontinuidade ${pathId}: ${ordered[ordered.length - 1]} != ${from}`);
      ordered.push(...(index === 0 ? orderedCmdPoints : orderedCmdPoints.slice(1)));
    }
    if (ordered[0] === ordered[ordered.length - 1]) fail(`percurso ${pathId} fecha ciclo e não pode ser declarado aberto`);
    results.push({
      id: pathId, method, section,
      startPointId: ordered[0], endPointId: ordered[ordered.length - 1],
      orderedPointIds: ordered, segmentCount: segments.length,
      unresolvedCurveCount: curves, isGeometricallyResolved: false, isCutBoundary: false,
    });
  }
  const pending = array(d.pendingOperations, "pendingOperations");
  const seenOps = new Set<string>();
  for (const raw of pending) {
    const o = record(raw, "operação");
    exact(o, ["id", "method", "operation", "sourcePdfPage", "status"], "operação");
    unique(id(o.id, "operation id"), seenOps, "operação");
    id(o.method, "operation method");
    fixed(o.operation, "MIRROR_FRONT_AND_ALIGN_SIDE", "operation");
    fixed(o.status, "DOCUMENTED_NOT_EXECUTED", "operation status");
    if (typeof o.sourcePdfPage !== "number" || !Number.isInteger(o.sourcePdfPage) || o.sourcePdfPage < 1) fail("operação sem página de fonte");
  }
  const perimeters = array(d.blockedPerimeters, "blockedPerimeters");
  const seenPerimeters = new Set<string>();
  if (perimeters.length !== paths.length) fail("exigir um bloqueio de perímetro para cada path de fonte");
  const coveredPaths = new Set<string>();
  for (const raw of perimeters) {
    const p = record(raw, "perímetro");
    exact(p, ["id", "method", "section", "layer", "relatedPathId", "status", "approvedEdgeIds"], "perímetro");
    unique(id(p.id, "perimeter id"), seenPerimeters, "perímetro");
    fixed(p.layer, "INDUSTRIAL_PERIMETER", "perimeter layer");
    fixed(p.status, "NOT_YET_DEFINED", "perimeter status");
    if (array(p.approvedEdgeIds, "approved edges").length !== 0) fail("aresta industrial prematura");
    const candidate = results.find((x) => x.id === p.relatedPathId);
    if (!candidate || candidate.method !== p.method || candidate.section !== p.section) fail("perímetro não corresponde à origem");
    if (coveredPaths.has(candidate.id)) fail("perímetro duplicado para o mesmo percurso");
    coveredPaths.add(candidate.id);
  }
  const exceptions = array(d.unmappedAllowances, "unmappedAllowances");
  const seenExceptions = new Set<string>();
  for (const raw of exceptions) {
    const a = record(raw, "margem");
    exact(a, ["id", "method", "region", "status", "edgeIds", "offsetAllowed"], "margem");
    unique(id(a.id, "allowance id"), seenExceptions, "margem");
    id(a.method, "allowance method");
    if (a.region !== "UPPER_WAIST" && a.region !== "LOWER_HEM") fail("região de margem não suportada nesta revisão");
    fixed(a.status, "REGION_CONFIRMED_EDGE_SCOPE_NOT_MAPPED", "margem status");
    if (array(a.edgeIds, "edgeIds").length !== 0) fail("margem atribuída sem evidência por aresta");
    fixed(a.offsetAllowed, false, "offsetAllowed");
  }
  return {
    status: "PASS_RESEARCH_TOPOLOGY_ONLY", cutReady: false,
    sourceStrokeCount: commandMap.size, paths: results,
    pendingOperations: pending.length, blockedPerimeters: perimeters.length,
    unmappedAllowances: exceptions.length,
  };
}
