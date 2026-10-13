/**
 * FreeSewing Part adapter for RESEARCH-only CH02 construction.
 * Real FreeSewing Part/Point/Path objects, but NOT real garment pieces.
 * Never promote implicit point-dependency connectors to seam/cut lines.
 */
import { Part, Point, Path, Design, Snippet } from "@freesewing/core";
import { annotationsPlugin } from "@freesewing/plugin-annotations";
import { createDiagnosticDraft } from "./pipeline.mjs";

const RESEARCH_ROLE="CONSTRUCTION_TRACE";
const BLOCKED_ROLES=Object.freeze(["SEAM_LINE","CUT_LINE","CUT_ON_FOLD","SEAM_ALLOWANCE","GRAINLINE","PRODUCTION_NOTCH"]);
const canFinite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);

export function assertResearchRole(role){
 if(role!==RESEARCH_ROLE)throw new RangeError("Semântica não verificada: apenas traços de construção são permitidos");
 return role;
}
function normalizePoint(point,id){
 if(!canFinite(point)||Math.abs(point.x)>1e7||Math.abs(point.y)>1e7)
  throw new RangeError(`Ponto inválido: ${id}`);
 return new Point(point.x,point.y);
}
function assertPureGuide(guide,steps){
 if(guide.referenceKind!=="CONSTRUCTION_GUIDE"||!steps.has(guide.sourceStepId)||
    !/^\d{1,3}$/.test(guide.fromPointId)||!/^\d{1,3}$/.test(guide.toPointId)||
    !Number.isFinite(guide.lengthMm)||guide.lengthMm<0)
   throw new RangeError("Guia sem referência verificada na cadeia do livro");
}

/** Native FreeSewing Part only as container for source-linked construction traces. */
function fromGroup(group,result){
 if(group.role!=="CONSTRUCTION_GROUP_NOT_CUTTING_PIECE"||
    !["FRONT","BACK"].includes(group.section)||
    !/^(front|back)-construction$/.test(group.id))
  throw new RangeError("Grupo não elegível para adaptação como Part de pesquisa");
 const trace=new Map(result.construction.trace.map(x=>[x.stepId,x]));
 const ids=new Set([...group.pointIds,...group.guides.map(g=>g.fromPointId),...group.guides.map(g=>g.toPointId)]);
 const native=new Part();
 native.name=`research-${group.section.toLowerCase()}`;
 native.attr("data-menswear-stage","RESEARCH_ONLY");
 native.attr("data-menswear-role",RESEARCH_ROLE);
 native.attr("data-source-method",result.source.methodId);
 for(const id of [...ids].sort((a,b)=>Number(a)-Number(b))){
  const p=result.construction.pointsMm[id];
  if(!p)throw new RangeError(`Referência do livro ausente: ${id}`);
  native.points[`pt_${id}`]=normalizePoint(p,id).addText(id,"source-point-number");
 }
 const expectedPaths=[];
 for(const guide of group.guides){
  assertPureGuide(guide,trace);
  const from=native.points[`pt_${guide.fromPointId}`];
  const to=native.points[`pt_${guide.toPointId}`];
  if(!from||!to)throw new RangeError("Pontos da guia faltando na Part");
  const path=new Path().move(from).line(to)
   .attr("data-menswear-role",RESEARCH_ROLE)
   .attr("data-source-step",guide.sourceStepId);
  const key=`construction_${guide.sourceStepId}`;
  if(Object.hasOwn(native.paths,key))throw new RangeError("Guia duplicada");
  if(Math.abs(path.length()-guide.lengthMm)>1e-7)
   throw new RangeError("Divergência entre FreeSewing Path e a construção do livro");
  native.paths[key]=path;
  expectedPaths.push({id:key,role:RESEARCH_ROLE,sourceStepId:guide.sourceStepId,
    lengthMm:path.length(),svgPathData:path.asPathstring()});
 }
 if(Object.keys(native.snippets).length!==0)
  throw new RangeError("Anotações de costura geradas sem método validado");
 // FreeSewing 4.0 API: internal __boundary() is required for asRenderProps().
 // It is tested here only and must not be relied upon by a production adapter.
 const boundary=native.__boundary();
 if(boundary!==native)throw new Error("FreeSewing não conseguiu delimitar o grupo");
 const props=native.asRenderProps();
 if(Object.keys(props.paths).length!==expectedPaths.length ||
    !Number.isFinite(props.width)||!Number.isFinite(props.height)||
    props.width<0||props.height<0)
  throw new Error("FreeSewing Part serializada de forma inconsistente");
 return {
  id:group.id,
  semanticRole:"CONSTRUCTION_GROUP_NOT_GARMENT_PIECE",
  purpose:"RESEARCH_ONLY",
  section:group.section,
  nativeClass:"FreeSewing.Part",
  nativeRenderProps:props,
  traceLinks:expectedPaths,
  constructionPointIds:[...ids],
  roleInventory:{
    CONSTRUCTION_TRACE:expectedPaths.length,
    SEAM_LINE:0,CUT_LINE:0,CUT_ON_FOLD:0,SEAM_ALLOWANCE:0,
    GRAINLINE:0,PRODUCTION_NOTCH:0
  },
  drawingCompleteness:"PARTIAL_TRACES_NOT_BOOK_CONTOURS",
  annotations:{pointLabels:"FreeSewing.Point.addText",sewingMarks:[]}
 };
}
export function createResearchPartProbe(input){
 const result=createDiagnosticDraft(input);
 if(result.purpose!=="RESEARCH_ONLY"||
    result.source.completeness!=="PARTIAL_CONSTRUCTION_GUIDES_ONLY"||
    result.diagnostics.state!=="PASS_RESEARCH_ONLY")
  throw new RangeError("Não é permitida promoção de estado de revisão");
 const parts=result.groups.map(group=>fromGroup(group,result));
 if(parts.length!==2||parts.some(p=>p.roleInventory.SEAM_LINE!==0||p.roleInventory.CUT_LINE!==0))
  throw new Error("Mudança silenciosa na semântica de construção");
 return {
  formatVersion:"construction-part-probe/0.1.0",
  purpose:"RESEARCH_ONLY",
  source:result.source,measurementsMm:result.measurementsMm,
  method:result.method,variant:result.variant,
  externalApi:["FreeSewing.Part","FreeSewing.Point","FreeSewing.Path","Part.asRenderProps"],
  annotationsUsed:["Point.addText"],
  experimentalInternalApi:["Part.__boundary"],
  parts,
  forbiddenRoles:[...BLOCKED_ROLES],
  gates:{
   sourceDiagram:"PARTIAL",sourceTrace:"PASS",
   SEAM_LINE:"BLOCKED",CUT_LINE:"BLOCKED",GRAINLINE:"BLOCKED",
   PRODUCTION_NOTCH:"BLOCKED",SEAM_ALLOWANCE:"BLOCKED",CUT_READY:false
  }
 };
}

/**
 * Synthetic API competence probe, unrelated to Aldrich or real pieces.
 * Executes a REAL plugin annotation macro, on an intentionally artificial
 * fixture. No synthetic grainline or notch ever enters the CH02 result.
 */
export function createSyntheticAnnotationProof(){
 const design={
  name:"annotation-synthetic-probe",
  draft:({points,Point,Path,Snippet,snippets,paths,part,macro})=>{
   points.start=new Point(10,20);
   points.end=new Point(10,220);
   points.notchAnchor=new Point(80,80);
   paths.guide=new Path().move(points.start).line(points.end);
   snippets.demonstration=new Snippet("notch",points.notchAnchor);
   macro("grainline",{from:points.start,to:points.end,id:"synthetic-grainline"});
   return part;
  },
  plugins:[annotationsPlugin]
 };
 const PatternConstructor=new Design({parts:[design],noCorePlugins:true});
 const pattern=new PatternConstructor();
 pattern.draft();
 const native=pattern.parts?.[0]?.[design.name];
 if(!(native instanceof Part))throw new Error("FreeSewing não criou Part do exemplo sintético");
 const generated=Object.entries(native.paths).filter(([name])=>name.includes("grainline"));
 if(generated.length!==1)throw new Error("Macro FreeSewing grainline não gerou exatamente uma guia");
 const [name,path]=generated[0];
 const mark=native.snippets.demonstration;
 if(!(mark instanceof Snippet)||mark.def!=="notch")
  throw new Error("Snippet FreeSewing não criado");
 if(path.attributes.get("marker-start")!=="url(#grainlineFrom)"||
    path.attributes.get("marker-end")!=="url(#grainlineTo)")
  throw new Error("Anotação FreeSewing grainline sem markers");
 return {
  fixtureStatus:"SYNTHETIC_ONLY_DO_NOT_PROMOTE",
  provenance:"ENGINEERING_FIXTURE_NOT_ALDRICH",
  library:"@freesewing/plugin-annotations@4.0.0",
  executedApis:["Design","Part","Snippet","macro(grainline)","Point"],
  grainlineMacroPathId:name,
  grainlineFromMm:{x:path.ops[0].to.x,y:path.ops[0].to.y},
  grainlineToMm:{x:path.ops[1].to.x,y:path.ops[1].to.y},
  notchDemo:mark.asRenderProps(),
  publishedToGarment:false
 };
}
