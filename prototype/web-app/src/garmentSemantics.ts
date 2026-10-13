/**
 * Independent garment semantics contract (0.1.0) — NOT a production pattern.
 *
 * Source methods are separate from geometric carriers (FreeSewing, SVG, etc).
 * An item being representable in CAD does not establish it as a real seam/cut.
 * Source-mode only accepts explicit dependency traces, never inferred contours.
 */
import type { Vec2 } from "./domain";
import { draftFlatTrouserSectionsResearch } from "./flatTrouserBackResearch";
import type {
  TrouserSectionInputs
} from "./flatTrouserBackResearch";
import type { FrontMethod } from "./aldCh02FlatTrouserProgram";

export type DraftPurpose = "RESEARCH_ONLY" | "SYNTHETIC_ONLY";
export type PieceSection = "FRONT_RESEARCH" | "BACK_RESEARCH" | "SYNTHETIC_PIECE";
export type EdgeRole =
  | "DEPENDENCY_CONNECTOR"
  | "CONSTRUCTION_LINE"
  | "SEAM_LINE"
  | "CUT_LINE"
  | "FOLD_LINE"
  | "HEM_LINE";
export type EvidenceKind = "TRACE_DERIVED_NOT_BOOK_LINE" | "SYNTHETIC_FIXTURE";
export type DraftEvidence = {
  id: string;
  kind: EvidenceKind;
  description: string;
  source?: {
    methodId: string;
    chapter: number;
    pdfPage: number;
    stepId: string;
  };
};
export type SemanticPoint = { id: string; positionMm: Vec2 };
export type SemanticEdge = {
  id: string;
  fromId: string;
  toId: string;
  role: EdgeRole;
  evidenceId: string;
};
export type AllowanceDeclaration = {
  id: string;
  seamEdgeId: string;
  widthMm: number;
  treatment: "ALREADY_INCLUDED_IN_BLOCK" | "OFFSET_NEEDED_NOT_EXECUTED";
  evidenceId: string;
};
export type AnnotationDeclaration =
  | {
      id: string;
      kind: "GRAINLINE";
      fromId: string;
      toId: string;
      evidenceId: string;
    }
  | {
      id: string;
      kind: "NOTCH";
      edgeId: string;
      fraction: number;
      evidenceId: string;
    };
export type SemanticPiece = {
  id: string;
  section: PieceSection;
  status: "CONSTRUCTION_CONTAINER" | "SYNTHETIC_EXAMPLE";
  points: SemanticPoint[];
  edges: SemanticEdge[];
  allowances: AllowanceDeclaration[];
  annotations: AnnotationDeclaration[];
};
export type GarmentSemanticProject = {
  formatVersion: "garment-semantic/0.1.0";
  purpose: DraftPurpose;
  methodId: string;
  unit: "mm";
  evidence: DraftEvidence[];
  pieces: SemanticPiece[];
  release: { cutReady: false; physicalFit: "NOT_RUN" };
};

const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const rec = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const identifier = (s: unknown): s is string =>
  typeof s === "string" && /^[A-Za-z0-9:_-]{1,120}$/.test(s);
const positive = (n: number) => finite(n) && n > 0 && n < 1e7;
const roles: EdgeRole[] = [
  "DEPENDENCY_CONNECTOR", "CONSTRUCTION_LINE", "SEAM_LINE",
  "CUT_LINE", "FOLD_LINE", "HEM_LINE"
];
const sameKeys = (v: Record<string, unknown>, keys: string[]) =>
  Object.keys(v).every(key => keys.includes(key));
function fail(message: string): never {
  throw new RangeError("Contrato de vestuário bloqueado: " + message);
}
function exact(v: unknown, keys: string[], where: string): asserts v is Record<string, unknown> {
  if (!rec(v) || !sameKeys(v, keys)) fail("campos não autorizados em " + where);
}
const location = (p: unknown): p is Vec2 =>
  rec(p) && sameKeys(p, ["x", "y"]) &&
  finite(p.x) && finite(p.y) &&
  Math.abs(p.x) <= 1e7 && Math.abs(p.y) <= 1e7;

/**
 * Validate untrusted JSON and clone into a canonical provider-independent type.
 * Research-mode edge roles are *exclusively* trace visualization connectors.
 * Synthetic-mode tests data relationships but can never authorize production.
 */
export function validateGarmentSemanticProject(value: unknown): GarmentSemanticProject {
  exact(value, ["formatVersion", "purpose", "methodId", "unit", "evidence", "pieces", "release"], "projeto");
  const root = value;
  if (root.formatVersion !== "garment-semantic/0.1.0" ||
      (root.purpose !== "RESEARCH_ONLY" && root.purpose !== "SYNTHETIC_ONLY") ||
      !identifier(root.methodId) || root.unit !== "mm") fail("versão, origem ou unidade inválida");
  exact(root.release, ["cutReady", "physicalFit"], "gate");
  if (root.release.cutReady !== false || root.release.physicalFit !== "NOT_RUN")
    fail("proibido promover projeto sem validação física");
  if (!Array.isArray(root.evidence) || !root.evidence.length || root.evidence.length > 500)
    fail("evidências ausentes ou excessivas");
  if (!Array.isArray(root.pieces) || !root.pieces.length || root.pieces.length > 30)
    fail("peças inexistentes ou excessivas");

  const evidence = new Map<string, DraftEvidence>();
  for (const raw of root.evidence as unknown[]) {
    exact(raw, ["id", "kind", "description", "source"], "evidência");
    if (!identifier(raw.id) || evidence.has(raw.id) ||
        typeof raw.description !== "string" || !raw.description.trim() ||
        raw.description.length > 400 ||
        !["TRACE_DERIVED_NOT_BOOK_LINE", "SYNTHETIC_FIXTURE"].includes(String(raw.kind)))
      fail("evidência duplicada ou malformada");
    const kind = raw.kind as EvidenceKind;
    if (root.purpose === "RESEARCH_ONLY" && kind !== "TRACE_DERIVED_NOT_BOOK_LINE")
      fail("pesquisa não admite evidência sintética para desenho de produção");
    if (root.purpose === "SYNTHETIC_ONLY" && kind !== "SYNTHETIC_FIXTURE")
      fail("modelo sintético não pode alegar evidência do livro");
    let source: DraftEvidence["source"];
    if (kind === "TRACE_DERIVED_NOT_BOOK_LINE") {
      exact(raw.source, ["methodId", "chapter", "pdfPage", "stepId"], "origem");
      if (raw.source.methodId !== root.methodId ||
          !Number.isSafeInteger(raw.source.chapter) || (raw.source.chapter as number) < 1 ||
          !Number.isSafeInteger(raw.source.pdfPage) || (raw.source.pdfPage as number) < 1 ||
          !identifier(raw.source.stepId))
        fail("referência bibliográfica e etapa inválidas");
      source = {
        methodId: raw.source.methodId as string,
        chapter: raw.source.chapter as number,
        pdfPage: raw.source.pdfPage as number,
        stepId: raw.source.stepId as string
      };
    } else if (raw.source !== undefined) fail("sintético não pode citar método como evidência");
    evidence.set(raw.id as string,{
      id:raw.id as string,kind,
      description:raw.description as string,
      ...(source ? {source} : {})
    });
  }

  const pieceIds = new Set<string>();
  const pieces: SemanticPiece[]=[];
  for (const raw of root.pieces as unknown[]) {
    exact(raw, ["id","section","status","points","edges","allowances","annotations"],"peça");
    if (!identifier(raw.id) || pieceIds.has(raw.id) ||
        !["FRONT_RESEARCH","BACK_RESEARCH","SYNTHETIC_PIECE"].includes(String(raw.section)) ||
        !["CONSTRUCTION_CONTAINER","SYNTHETIC_EXAMPLE"].includes(String(raw.status)) ||
        !Array.isArray(raw.points) || !raw.points.length || raw.points.length>2000 ||
        !Array.isArray(raw.edges) || raw.edges.length>2000 ||
        !Array.isArray(raw.allowances) || raw.allowances.length>2000 ||
        !Array.isArray(raw.annotations) || raw.annotations.length>2000)
      fail("estrutura ou identificadores inválidos da peça");
    if (root.purpose==="RESEARCH_ONLY" &&
      (raw.status!=="CONSTRUCTION_CONTAINER" || raw.section==="SYNTHETIC_PIECE"))
      fail("não classificar contêiner pesquisado como peça de roupa");
    if (root.purpose==="SYNTHETIC_ONLY" &&
      (raw.status!=="SYNTHETIC_EXAMPLE" || raw.section!=="SYNTHETIC_PIECE"))
      fail("modelo sintético não representa peça da obra");
    pieceIds.add(raw.id as string);

    const points = new Map<string, SemanticPoint>();
    for (const point of raw.points as unknown[]) {
      exact(point, ["id","positionMm"],"ponto");
      if(!identifier(point.id) || points.has(point.id) || !location(point.positionMm))
        fail("ponto duplicado, não finito ou inválido");
      points.set(point.id as string,{
        id:point.id as string,positionMm:{
          x:(point.positionMm as Vec2).x,y:(point.positionMm as Vec2).y
        }
      });
    }
    const edges = new Map<string, SemanticEdge>();
    const edgeGeometry = new Set<string>();
    for (const edge of raw.edges as unknown[]) {
      exact(edge, ["id","fromId","toId","role","evidenceId"],"aresta");
      if (!identifier(edge.id) || edges.has(edge.id) || !identifier(edge.fromId) ||
          !identifier(edge.toId) || edge.fromId===edge.toId ||
          !points.has(edge.fromId) || !points.has(edge.toId) ||
          !roles.includes(edge.role as EdgeRole) ||
          !identifier(edge.evidenceId) || !evidence.has(edge.evidenceId))
        fail("aresta sem ponto, papel ou evidência válida");
      if (root.purpose==="RESEARCH_ONLY" &&
        (edge.role!=="DEPENDENCY_CONNECTOR" ||
         evidence.get(edge.evidenceId)!.kind!=="TRACE_DERIVED_NOT_BOOK_LINE"))
        fail("sem autorização do livro para costura, corte ou dobra");
      if (root.purpose==="SYNTHETIC_ONLY" &&
        edge.role==="DEPENDENCY_CONNECTOR")
        fail("dependências do livro não fazem parte do experimento sintético");
      const a=points.get(edge.fromId)!.positionMm,b=points.get(edge.toId)!.positionMm;
      if (!positive(Math.hypot(a.x-b.x,a.y-b.y))) fail("linha degenerada ou excessiva");
      const orientation=[edge.fromId,edge.toId].sort().join("|");
      const geometryKey=edge.role+":"+orientation;
      if (edgeGeometry.has(geometryKey)) fail("aresta semântica repetida");
      edgeGeometry.add(geometryKey);
      edges.set(edge.id as string,{
        id:edge.id as string,fromId:edge.fromId as string,toId:edge.toId as string,
        role:edge.role as EdgeRole,evidenceId:edge.evidenceId as string
      });
    }

    if (root.purpose==="RESEARCH_ONLY" &&
        ((raw.allowances as unknown[]).length || (raw.annotations as unknown[]).length))
      fail("pesquisa parcial não autoriza margens, fio ou piques");

    const allowances:AllowanceDeclaration[]=[];
    const allowanceEdges=new Set<string>();
    const allowanceIds=new Set<string>();
    for (const allowance of raw.allowances as unknown[]) {
      exact(allowance, ["id","seamEdgeId","widthMm","treatment","evidenceId"],"margem");
      if (!identifier(allowance.id) || allowanceIds.has(allowance.id) || !identifier(allowance.seamEdgeId) ||
          allowanceEdges.has(allowance.seamEdgeId) ||
          edges.get(allowance.seamEdgeId)?.role!=="SEAM_LINE" ||
          !finite(allowance.widthMm) || allowance.widthMm<0 || allowance.widthMm>100 ||
          !["ALREADY_INCLUDED_IN_BLOCK","OFFSET_NEEDED_NOT_EXECUTED"].includes(String(allowance.treatment)) ||
          !identifier(allowance.evidenceId) || !evidence.has(allowance.evidenceId))
        fail("margem sem costura, repetida, sem evidência ou fora da faixa");
      allowanceEdges.add(allowance.seamEdgeId as string);
      allowanceIds.add(allowance.id as string);
      allowances.push({
        id:allowance.id as string,seamEdgeId:allowance.seamEdgeId as string,
        widthMm:allowance.widthMm as number,
        treatment:allowance.treatment as AllowanceDeclaration["treatment"],
        evidenceId:allowance.evidenceId as string
      });
    }
    const annotations:AnnotationDeclaration[]=[];
    const annotationIds=new Set<string>();
    for (const mark of raw.annotations as unknown[]) {
      if(!rec(mark))fail("anotação malformada");
      if(mark.kind==="GRAINLINE"){
        exact(mark,["id","kind","fromId","toId","evidenceId"],"fio");
        if (!identifier(mark.id) || annotationIds.has(mark.id) ||
            !identifier(mark.fromId) || !identifier(mark.toId) ||
            mark.fromId===mark.toId || !points.has(mark.fromId) ||
            !points.has(mark.toId) || !identifier(mark.evidenceId) ||
            !evidence.has(mark.evidenceId)) fail("linha do fio sem referências verificáveis");
        const grainFrom=points.get(mark.fromId as string)!.positionMm;
        const grainTo=points.get(mark.toId as string)!.positionMm;
        if(!positive(Math.hypot(grainTo.x-grainFrom.x,grainTo.y-grainFrom.y)))
          fail("fio de comprimento nulo ou excessivo");
        annotations.push({id:mark.id as string,kind:"GRAINLINE",
          fromId:mark.fromId as string,toId:mark.toId as string,
          evidenceId:mark.evidenceId as string});
      } else if(mark.kind==="NOTCH") {
        exact(mark,["id","kind","edgeId","fraction","evidenceId"],"pique");
        if (!identifier(mark.id) || annotationIds.has(mark.id) ||
            !identifier(mark.edgeId) ||
            !["SEAM_LINE","CUT_LINE"].includes(String(edges.get(mark.edgeId)?.role)) ||
            !finite(mark.fraction) || mark.fraction<=0 || mark.fraction>=1 ||
            !identifier(mark.evidenceId) || !evidence.has(mark.evidenceId))
          fail("pique fora de aresta costurável ou sem proporção");
        annotations.push({id:mark.id as string,kind:"NOTCH",
          edgeId:mark.edgeId as string,fraction:mark.fraction,
          evidenceId:mark.evidenceId as string});
      } else fail("tipo de anotação desconhecido");
      annotationIds.add(mark.id as string);
    }
    pieces.push({
      id:raw.id as string,section:raw.section as PieceSection,
      status:raw.status as SemanticPiece["status"],
      points:[...points.values()],edges:[...edges.values()],allowances,annotations
    });
  }
  return {
    formatVersion:"garment-semantic/0.1.0",
    purpose:root.purpose as DraftPurpose,
    methodId:root.methodId as string,unit:"mm",
    evidence:[...evidence.values()],pieces,
    release:{cutReady:false,physicalFit:"NOT_RUN"}
  };
}

export function createCh02SemanticResearch(
  method:FrontMethod,measurements:TrouserSectionInputs
):GarmentSemanticProject {
  const construction=draftFlatTrouserSectionsResearch(method,measurements);
  const evidence:DraftEvidence[]=[];
  const pieces:SemanticPiece[]=[];
  const traceById=new Map(construction.sourceTrace.map(step=>[step.pointId,step]));
  for (const [section,stepIds] of [
    ["FRONT_RESEARCH",construction.frontPointIds],
    ["BACK_RESEARCH",construction.backPointIds]
  ] as const){
    const allIds=new Set<string>(stepIds);
    const edges:SemanticEdge[]=[];
    for (const id of stepIds) {
      const step=traceById.get(id);
      if(!step)fail("ponto não possui instrução de origem");
      const parent=step.usedPoints[0];
      if (!parent)continue;
      if(!traceById.has(parent))fail("dependência desconhecida na receita");
      allIds.add(parent);
      const evidenceId="step:"+step.stepId;
      evidence.push({
        id:evidenceId,kind:"TRACE_DERIVED_NOT_BOOK_LINE",
        description:"Conector de dependência calculada; não é necessariamente linha do desenho.",
        source:{
          methodId:"ALD-CH02-01",chapter:step.source.chapter,
          pdfPage:step.source.pdfPage,stepId:step.stepId
        }
      });
      edges.push({
        id:"dependency:"+step.stepId,fromId:parent,toId:id,
        role:"DEPENDENCY_CONNECTOR",evidenceId
      });
    }
    pieces.push({
      id:section==="FRONT_RESEARCH"?"ch02-front-trace":"ch02-back-trace",
      section,status:"CONSTRUCTION_CONTAINER",
      points:[...allIds].sort((a,b)=>Number(a)-Number(b)).map(id=>{
        const positionMm=construction.pointsMm[id];
        if(!positionMm)fail("ponto incompleto no método");
        return {id,positionMm:{...positionMm}};
      }),
      edges,allowances:[],annotations:[]
    });
  }
  return validateGarmentSemanticProject({
    formatVersion:"garment-semantic/0.1.0",purpose:"RESEARCH_ONLY",
    methodId:"ALD-CH02-01",unit:"mm",evidence,pieces,
    release:{cutReady:false,physicalFit:"NOT_RUN"}
  });
}

export function assessSemanticRelease(project:GarmentSemanticProject){
  const validated=validateGarmentSemanticProject(project);
  return {
    state: validated.purpose==="RESEARCH_ONLY"
      ? "PASS_RESEARCH_TRACE_ONLY" as const
      : "PASS_SYNTHETIC_SCHEMA_ONLY" as const,
    cutReady:false as const,
    measuredFit:"NOT_RUN" as const,
    blockers:[
      "BOOK_CONTOURS_NOT_VERIFIED",
      "SEAM_CUT_TOPOLOGY_NOT_APPROVED",
      "GRAIN_NOTCH_AND_ALLOWANCE_NOT_RELEASED",
      "PHYSICAL_FIT_NOT_RUN"
    ] as const,
    counts:{
      pieces:validated.pieces.length,
      edges:validated.pieces.reduce((n,p)=>n+p.edges.length,0),
      allowances:validated.pieces.reduce((n,p)=>n+p.allowances.length,0),
      annotations:validated.pieces.reduce((n,p)=>n+p.annotations.length,0)
    }
  };
}
