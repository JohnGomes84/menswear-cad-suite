/**
 * Aldrich CH02 SOURCE line commands: source text is the authority, not
 * implementation dependency-connectors. A straight text command is safe
 * to represent in mm, but still has NO industrial cut/seam classification.
 */
import registryFile from "../../../docs/domain/CH02-SOURCE-LINES-001.json";
import { draftFlatTrouserSectionsResearch } from "./flatTrouserBackResearch";
import type { TrouserSectionInputs } from "./flatTrouserBackResearch";
import type { FrontMethod } from "./aldCh02FlatTrouserProgram";
import type { Vec2 } from "./domain";

export type SourceLineCommand = {
 id:string;method:FrontMethod;section:"FRONT"|"BACK";
 geometry:"STRAIGHT"|"CURVE";pointIds:string[];
 source:{methodId:"ALD-CH02-01";chapter:2;pdfPage:32|33;diagramPdfPage:34;
         basis:"EXPLICIT_TEXT_COMMAND_DIAGRAM_PARTIAL"};
 description:string;industrialRole:"UNCLASSIFIED_NOT_CUT"
};
export type SourceLabel={
 id:string;method:FrontMethod;region:"UPPER_WAIST"|"LOWER_HEM";
 textMeaning:"NO_SEAM_ALLOWANCE";diagramPdfPage:34;
 scope:"REGION_CONFIRMED_EDGE_SCOPE_NOT_MAPPED"
};
export type SourceLineRegister={
 schema:"book-command-line-register/0.1.0";
 source:{title:string;edition:5;chapter:2;diagramPdfPage:34};
 purpose:"RESEARCH_ONLY";diagramReview:"PARTIAL_TWO_FLAT_TROUSER_BLOCKS";
 statements:{
  bookAllowance:{sourcePdfPage:31;widthMm:10;includedInBlock:true;
     exceptionRequiresEdgeReview:true;application:"NO_AUTOMATIC_OFFSET"};
  assembly:{method:"ONE_PIECE";sourcePdfPage:32;
     operation:"TRACE_BACK_AND_FRONT_MIRROR_FRONT_ALIGN_SIDE_SEAMS";
     status:"DOCUMENTED_OPERATION_NOT_EXECUTED"};
 };
 lineCommands:SourceLineCommand[];
 figureLabels:SourceLabel[];
 prohibitedClaims:string[]
};
const isRecord=(x:unknown):x is Record<string,unknown>=>typeof x==="object"&&x!==null&&!Array.isArray(x);
const nonempty=(s:unknown):s is string=>typeof s==="string"&&s.length>0&&s.length<300;
const ids=(v:unknown):v is string[]=>Array.isArray(v)&&v.every(
 x=>typeof x==="string"&&/^\d{1,3}$/.test(x)
);
function guard(condition:unknown,msg:string):asserts condition{
 if(!condition)throw new RangeError("Line source register inválido: "+msg);
}
const allowedLabels=new Set(["ONE_PIECE:UPPER_WAIST","ONE_PIECE:LOWER_HEM","TWO_PIECE:UPPER_WAIST","TWO_PIECE:LOWER_HEM"]);
const allowedClaims=new Set([
 "COMPLETE_DIAGRAM_EDGE_MAP","SEAM_LINE","CUT_LINE","CUT_ON_FOLD",
 "SEAM_ALLOWANCE_OFFSET","FIT_VALIDATED","PRODUCTION_APPROVED"
]);

/** Reject tainted records, copy all fields, and keep user edits out of authority. */
export function validateCh02SourceLineRegister(value:unknown):SourceLineRegister{
 guard(isRecord(value)&&value.schema==="book-command-line-register/0.1.0"&&
       value.purpose==="RESEARCH_ONLY"&&value.diagramReview==="PARTIAL_TWO_FLAT_TROUSER_BLOCKS","header");
 guard(isRecord(value.source)&&value.source.title==="Metric Pattern Cutting for Menswear"&&
       value.source.edition===5&&value.source.chapter===2&&value.source.diagramPdfPage===34,"source");
 guard(isRecord(value.statements)&&isRecord(value.statements.bookAllowance)&&
       isRecord(value.statements.assembly),"book statements");
 const allowance=value.statements.bookAllowance,assembly=value.statements.assembly;
 guard(allowance.sourcePdfPage===31&&allowance.widthMm===10&&
       allowance.includedInBlock===true&&allowance.exceptionRequiresEdgeReview===true&&
       allowance.application==="NO_AUTOMATIC_OFFSET","included allowance");
 guard(assembly.method==="ONE_PIECE"&&assembly.sourcePdfPage===32&&
       assembly.operation==="TRACE_BACK_AND_FRONT_MIRROR_FRONT_ALIGN_SIDE_SEAMS"&&
       assembly.status==="DOCUMENTED_OPERATION_NOT_EXECUTED","assembly trace vs operation");
 guard(Array.isArray(value.lineCommands)&&value.lineCommands.length===16,"command count");
 const usedIds=new Set<string>();const rows:SourceLineCommand[]=[];
 const triplets=new Set<string>();
 for(const row of value.lineCommands){
  guard(isRecord(row)&&nonempty(row.id)&&!usedIds.has(row.id)&&
        ["ONE_PIECE","TWO_PIECE"].includes(String(row.method))&&
        ["FRONT","BACK"].includes(String(row.section))&&
        ["CURVE","STRAIGHT"].includes(String(row.geometry))&&
        ids(row.pointIds)&&row.pointIds.length>1&&row.pointIds.length<=3&&
        new Set(row.pointIds).size===row.pointIds.length&&
        nonempty(row.description)&&row.industrialRole==="UNCLASSIFIED_NOT_CUT"&&
        isRecord(row.source),"command "+String(row?.id));
  const src=row.source;
  guard(src.methodId==="ALD-CH02-01"&&src.chapter===2&&src.diagramPdfPage===34&&
        src.basis==="EXPLICIT_TEXT_COMMAND_DIAGRAM_PARTIAL"&&
        src.pdfPage===(row.method==="ONE_PIECE"?32:33),"source provenance");
  guard(row.geometry!=="STRAIGHT"||row.pointIds.length===2,"straight anchor count");
  usedIds.add(row.id);
  const key=[row.method,row.section,row.geometry,row.pointIds.join("-")].join(":");
  guard(!triplets.has(key),"duplicate geometry command");
  triplets.add(key);
  rows.push({
   id:row.id,method:row.method as FrontMethod,
   section:row.section as SourceLineCommand["section"],
   geometry:row.geometry as SourceLineCommand["geometry"],
   pointIds:[...row.pointIds],
   source:{methodId:"ALD-CH02-01",chapter:2,
     pdfPage:src.pdfPage as 32|33,diagramPdfPage:34,
     basis:"EXPLICIT_TEXT_COMMAND_DIAGRAM_PARTIAL"},
   description:row.description,industrialRole:"UNCLASSIFIED_NOT_CUT"
  });
 }
 guard(Array.isArray(value.figureLabels)&&value.figureLabels.length===4,"figure label count");
 const labels:SourceLabel[]=[];const uniqueLabels=new Set<string>();
 for(const row of value.figureLabels){
  guard(isRecord(row)&&nonempty(row.id)&&
       ["ONE_PIECE","TWO_PIECE"].includes(String(row.method))&&
       ["UPPER_WAIST","LOWER_HEM"].includes(String(row.region))&&
       row.textMeaning==="NO_SEAM_ALLOWANCE"&&row.diagramPdfPage===34&&
       row.scope==="REGION_CONFIRMED_EDGE_SCOPE_NOT_MAPPED","diagram labels");
  const key=row.method+":"+row.region;
  guard(allowedLabels.has(key)&&!uniqueLabels.has(key),"label scope/duplicate");
  uniqueLabels.add(key);
  labels.push({
   id:row.id,method:row.method as FrontMethod,
   region:row.region as SourceLabel["region"],
   textMeaning:"NO_SEAM_ALLOWANCE",diagramPdfPage:34,
   scope:"REGION_CONFIRMED_EDGE_SCOPE_NOT_MAPPED"
  });
 }
 guard(Array.isArray(value.prohibitedClaims)&&
       new Set(value.prohibitedClaims).size===allowedClaims.size&&
       value.prohibitedClaims.every((x:unknown)=>allowedClaims.has(String(x))),
       "release prohibitions");
 return {
  schema:"book-command-line-register/0.1.0",
  source:{title:"Metric Pattern Cutting for Menswear",edition:5,chapter:2,diagramPdfPage:34},
  purpose:"RESEARCH_ONLY",diagramReview:"PARTIAL_TWO_FLAT_TROUSER_BLOCKS",
  statements:{
   bookAllowance:{sourcePdfPage:31,widthMm:10,includedInBlock:true,
    exceptionRequiresEdgeReview:true,application:"NO_AUTOMATIC_OFFSET"},
   assembly:{method:"ONE_PIECE",sourcePdfPage:32,
    operation:"TRACE_BACK_AND_FRONT_MIRROR_FRONT_ALIGN_SIDE_SEAMS",
    status:"DOCUMENTED_OPERATION_NOT_EXECUTED"}
  },
  lineCommands:rows,figureLabels:labels,
  prohibitedClaims:[...allowedClaims]
 };
}
export const ch02SourceLineRegister:SourceLineRegister=
  validateCh02SourceLineRegister(registryFile);

export type SourceLineResolved =
 | {id:string;section:"FRONT"|"BACK";geometry:"STRAIGHT";
    status:"TEXT_EXPLICIT_STRAIGHT_NO_INDUSTRIAL_ROLE";
    pointIds:readonly string[];source:SourceLineCommand["source"];
    startMm:Vec2;endMm:Vec2;lengthMm:number;
    technicalRole:"DOCUMENTED_LINE_UNCLASSIFIED" }
 | {id:string;section:"FRONT"|"BACK";geometry:"CURVE";
    status:"SOURCE_CURVE_REQUIREMENTS_PENDING";
    pointIds:readonly string[];source:SourceLineCommand["source"];
    anchorsMm:readonly Vec2[];hasSpline:false;
    technicalRole:"DOCUMENTED_CURVE_UNRESOLVED" };

export function resolveCh02BookLineCommands(
 method:FrontMethod,inputs:TrouserSectionInputs,
 sourceRegister:unknown=ch02SourceLineRegister
):{
 purpose:"RESEARCH_ONLY";unit:"mm";method:FrontMethod;
 strokes:SourceLineResolved[];allowanceRegionLabels:SourceLabel[];
 noCut:true;offsetAllowed:false;mirrorPerformed:false
}{
 const book=validateCh02SourceLineRegister(sourceRegister);
 const drafted=draftFlatTrouserSectionsResearch(method,inputs);
 const selected=book.lineCommands.filter(cmd=>cmd.method===method);
 guard(selected.length===(method==="ONE_PIECE"?7:9),"method coverage");
 const strokes=selected.map((cmd):SourceLineResolved=>{
  const positions=cmd.pointIds.map(id=>{
   const p=drafted.pointsMm[id];
   guard(p&&Number.isFinite(p.x)&&Number.isFinite(p.y),"missing book point "+id);
   return {x:p.x,y:p.y};
  });
  if(cmd.geometry==="CURVE"){
   return {id:cmd.id,section:cmd.section,geometry:"CURVE",
     status:"SOURCE_CURVE_REQUIREMENTS_PENDING",
     pointIds:[...cmd.pointIds],source:cmd.source,anchorsMm:positions,
     hasSpline:false,technicalRole:"DOCUMENTED_CURVE_UNRESOLVED"};
  }
  const [startMm,endMm]=positions;
  const lengthMm=Math.hypot(startMm.x-endMm.x,startMm.y-endMm.y);
  guard(Number.isFinite(lengthMm)&&lengthMm>1e-8,"degenerate documented line "+cmd.id);
  return {id:cmd.id,section:cmd.section,geometry:"STRAIGHT",
    status:"TEXT_EXPLICIT_STRAIGHT_NO_INDUSTRIAL_ROLE",
    pointIds:[...cmd.pointIds],source:cmd.source,
    startMm,endMm,lengthMm,technicalRole:"DOCUMENTED_LINE_UNCLASSIFIED"};
 });
 return {purpose:"RESEARCH_ONLY",unit:"mm",method,strokes,
  allowanceRegionLabels:book.figureLabels.filter(label=>label.method===method),
  noCut:true,offsetAllowed:false,mirrorPerformed:false};
}
