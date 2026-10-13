/**
 * Vertical integration proof: book method (own interpretive program) ->
 * FreeSewing Point/Path -> source-linked guide groups -> SVG diagnostics.
 *
 * Only a partial point construction: NEVER a garment piece or cut contour.
 * FreeSewing code remains an external npm dependency, not copied here.
 */
import { Point, Path, version as freeSewingVersion } from "@freesewing/core";
import { draftFlatTrouserSectionsResearch } from "../generated/aldch02.mjs";

const FORBIDDEN_OUTPUTS=Object.freeze([
  "CUT_CONTOUR", "SEAM_ALLOWANCE", "SEAM_PAIR", "NOTCH_PLACEMENT",
  "SIZE_GRADING", "NESTING", "PRINT_1_TO_1", "PRODUCTION_RELEASE"
]);

function assertInput({method,variant,measurementsMm}={}){
  if(!["ONE_PIECE","TWO_PIECE"].includes(method)||
     !["BASIC","EASY"].includes(variant)||
     !measurementsMm || typeof measurementsMm!=="object")
    throw new RangeError("Método, variante ou perfil de medidas inválidos");
  const keys=["seatMm","bodyRiseMm","insideLegMm"];
  if(Object.keys(measurementsMm).sort().join("|")!==keys.sort().join("|")||
     keys.some(key=>!Number.isFinite(measurementsMm[key])||
       measurementsMm[key]<=0||measurementsMm[key]>=10000))
    throw new RangeError("As três medidas do livro são obrigatórias, finitas e em mm");
}
const safeXml=value=>String(value).replace(/[&<>"']/g,char=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"
})[char]);
const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
const close=(a,b,tolerance=1e-7)=>Math.abs(a-b)<=tolerance;

/** Real external geometry API: Point + Path.move/line/length/asPathstring. */
function nativeGuide(from,to,step){
 const a=new Point(from.x,from.y),b=new Point(to.x,to.y);
 const path=new Path().move(a).line(b);
 const lengthMm=path.length();
 if(!Number.isFinite(lengthMm)||lengthMm<0 ||
    !close(lengthMm,distance(from,to)))
   throw new Error(`Falha numérica no caminho FreeSewing, passo ${step}`);
 const pathD=path.asPathstring();
 if(!/^M [\d, .+\-eE]+ L [\d, .+\-eE]+$/.test(pathD))
   throw new Error(`Caminho vetorial do FreeSewing inesperado: ${step}`);
 return {lengthMm,pathD};
}
function mapGroup(trace,pointIds,points,kind){
 const unique=new Set(pointIds);
 const steps=trace.filter(x=>unique.has(x.pointId));
 const guides=steps.flatMap(step=>{
  // The first dependency yields a TRACE CONNECTOR; it may NOT correspond\n  // to a physical construction line instructed in Aldrich's diagram.
  const fromId=step.usedPoints[0];
  if(!fromId)return [];
  const a=points[fromId],b=points[step.pointId];
  if(!a||!b)throw new Error("Referência geométrica inexistente");
  const native=nativeGuide(a,b,step.stepId);
  return [{
    fromPointId:fromId,toPointId:step.pointId,
    sourceStepId:step.stepId,
    referenceKind:"DEPENDENCY_CONNECTOR_NOT_BOOK_LINE",...native
  }];
 });
 return {
  id:kind.toLowerCase()+"-construction",
  role:"CONSTRUCTION_GROUP_NOT_CUTTING_PIECE",
  section:kind,
  pointIds:[...pointIds],
  guides
 };
}
function assertTrace(research,method,variant,measurementsMm){
 const points=research.pointsMm, trace=research.sourceTrace;
 const keys=Object.keys(points);
 if(trace.length!==keys.length || trace.length>80 ||
    research.purpose!=="RESEARCH_ONLY"||research.unit!=="mm"||
    research.method!==method||research.variant!==variant)
   throw new Error("Inconsistência do programa de construção");
 const known=new Set();
 for(const step of trace){
  if(known.has(step.pointId)||!Object.hasOwn(points,step.pointId)||
     step.source.chapter!==2||
     step.source.pdfPage!==(method==="ONE_PIECE"?32:33)||
     !step.source.sourceId?.includes("ALD-CH02")||
     !Array.isArray(step.usedPoints)||
     step.usedPoints.some(parent=>!known.has(parent))||
     !Number.isFinite(step.positionMm.x)||!Number.isFinite(step.positionMm.y)||
     !close(step.positionMm.x,points[step.pointId].x)||
     !close(step.positionMm.y,points[step.pointId].y))
   throw new Error(`Falha na cadeia de proveniência: ${step.stepId}`);
  known.add(step.pointId);
 }
 const expectedRise=measurementsMm.bodyRiseMm+(variant==="BASIC"?20:40);
 const expectedWidth=measurementsMm.seatMm/4+(variant==="BASIC"?40:80);
 if(!close(points["1"].y-points["0"].y,expectedRise)||
    !close(points["2"].y-points["1"].y,measurementsMm.insideLegMm)||
    !close(points["1"].x-points["4"].x,expectedWidth))
   throw new Error("Dimensões de origem incompatíveis com o método");
 if(method==="TWO_PIECE" &&
   !(points["12"].x>points["11"].x&&points["13"].x<points["11"].x))
   throw new Error("Inversão das direções 11-12 e 11-13");
 return {
  state:"PASS_RESEARCH_ONLY",
  sourceTraceValid:true,usedPointReferencesValid:true,
  valuesInCanonicalMillimeters:true,bookFrontScalarReferencesValid:true,
  bookDiagramDirectionReferencesValid:method==="TWO_PIECE",
  seamLengthReview:"NOT_RUN",cutContourReview:"NOT_RUN",
  sourceDiagramReview:"PARTIAL_ONLY",physicalFitReview:"NOT_RUN"
 };
}
function renderSvg({method,variant,measurementsMm,research,groups}){
 const coords=Object.values(research.pointsMm);
 const minX=Math.min(...coords.map(p=>p.x)),maxX=Math.max(...coords.map(p=>p.x));
 const minY=Math.min(...coords.map(p=>p.y)),maxY=Math.max(...coords.map(p=>p.y));
 const margin=60;
 const box=[minX-margin,minY-margin,(maxX-minX)+2*margin,(maxY-minY)+2*margin];
 const paths=groups.map(group=>
  `<g class="${safeXml(group.section.toLowerCase())}-guides" fill="none" stroke="${group.section==="FRONT"?"#5374a2":"#0a487e"}" stroke-width="1.25" stroke-dasharray="${group.section==="FRONT"?"6 4":"12 4"}">${group.guides.map(g=>
   `<path data-step="${safeXml(g.sourceStepId)}" d="${safeXml(g.pathD)}"/>`
  ).join("")}</g>`
 ).join("");
 const dots=research.sourceTrace.map(step=>
   `<g data-point="${safeXml(step.pointId)}"><circle cx="${step.positionMm.x}" cy="${step.positionMm.y}" r="2.5" fill="#123e75"/><text x="${step.positionMm.x+5}" y="${step.positionMm.y-5}" font-size="11" fill="#1b3052">${safeXml(step.pointId)}</text></g>`
 ).join("");
 const title=`Aldrich CH02 · ${method} · ${variant} · seat ${measurementsMm.seatMm} mm`;
 return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="820" viewBox="${box.join(" ")}" role="img" aria-label="Construction guide research only">
<title>${safeXml(title)}</title>
<desc>DIAGNÓSTICO DE CONSTRUÇÃO. PROIBIDO USAR PARA CORTE. SVG dimensionado para visualização, NÃO calibrado em escala 1:1.</desc>
<rect x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}" fill="#ffffff"/>
${paths}${dots}
<g transform="translate(${box[0]+14} ${box[1]+16})"><rect x="-5" y="-14" width="${Math.max(270,box[2]-28)}" height="40" rx="4" fill="#edf4fe" stroke="#b0c5e1"/><text x="5" y="0" font-size="12" font-weight="700" fill="#0a2466">CONSTRUÇÃO DE PESQUISA — NÃO CORTAR</text><text x="5" y="18" font-size="9" fill="#37577e">Frente: linha tracejada curta · Costas: linha tracejada longa · mm · diagrama parcial</text></g>
</svg>`;
}
export function createDiagnosticDraft(input){
 assertInput(input);
 const {method,variant,measurementsMm}=input;
 const research=draftFlatTrouserSectionsResearch(method,{...measurementsMm,variant});
 const diagnostics=assertTrace(research,method,variant,measurementsMm);
 const groups=[
  mapGroup(research.sourceTrace,research.frontPointIds,research.pointsMm,"FRONT"),
  mapGroup(research.sourceTrace,research.backPointIds,research.pointsMm,"BACK")
 ];
 const svg=renderSvg({method,variant,measurementsMm,research,groups});
 return {
  schemaVersion:"integration-probe/0.1.0",
  purpose:"RESEARCH_ONLY",
  source:{
   methodId:"ALD-CH02-01",book:"Metric Pattern Cutting for Menswear, fifth edition",
   reviewedPdfPages:method==="ONE_PIECE"?[32,34]:[33,34],
   completeness:"PARTIAL_CONSTRUCTION_GUIDES_ONLY"
  },
  integration:{
   externalPackage:"@freesewing/core",externalVersion:freeSewingVersion,
   primitivesUsed:["Point","Path.move","Path.line","Path.length","Path.asPathstring"],
   localComputation:"book-authored sequential drafting interpreter"
  },
  method,variant,measurementsMm:{...measurementsMm},
  construction:{
   trace:research.sourceTrace.map(step=>({
    stepId:step.stepId,pointId:step.pointId,
    positionMm:{...step.positionMm},source:step.source,
    usedPoints:[...step.usedPoints],lengthMm:step.lengthMm
   })),
   pointsMm:Object.fromEntries(Object.entries(research.pointsMm).map(
    ([id,p])=>[id,{...p}]
   ))
  },
  groups,diagnostics,
  blockedOperations:[...FORBIDDEN_OUTPUTS],
  svg
 };
}
