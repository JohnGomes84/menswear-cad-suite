/**
 * Chapter 2 requirements adapter. The source registry is provided explicitly
 * (one authority in docs/domain), not duplicated as numeric TS constants.
 * Both candidate families remain blocked until engineering hypotheses are given.
 */
import type {Vec2} from "./domain";
import type {FrontMethod,FrontVariant} from "./aldCh02FlatTrouserProgram";
import type {TrouserSectionInputs} from "./flatTrouserBackResearch";
import {draftFlatTrouserSectionsResearch} from "./flatTrouserBackResearch";
import {
 threePointG1Candidate,midpointSagittaCandidate,radialDistanceEnvelope
} from "./curveCandidateLab";
import type {CandidateSpline,CurveSide} from "./curveCandidateLab";

export type Chapter2CurveInput={
 ruleId:string;
 method:FrontMethod;
 section:"FRONT"|"BACK";
 kind:"CROTCH"|"INSEAM";
 pointPath:readonly string[];
 referencePoint?:string;
 distanceBasicMm?:number;
 distanceEasyMm?:number;
 inwardDepthMm?:number;
 sourceRef:{chapter:2;pdfPage:number};
 geometryStatus:"AMBIGUOUS_GEOMETRY_DO_NOT_RENDER";
};
export type CurveHypothesis={
 /** Explicit G1 handle fraction; source book does not supply this value. */
 handleFraction?:number;
 /** Required for inseam: the source does not unambiguously define the normal. */
 sagittaSide?:CurveSide;
};
export type CurveAssessment=
 | {state:"BLOCKED";ruleId:string;reason:
   "HYPOTHESIS_REQUIRED"|"SOURCE_UNVERIFIED"|"INVALID_REGISTRY"|"INVALID_GEOMETRY";detail:string}
 | {state:"CANDIDATE_UNVERIFIED";ruleId:string;method:FrontMethod;
   section:"FRONT"|"BACK";kind:"CROTCH"|"INSEAM";
   variant:FrontVariant;candidate:CandidateSpline;
   sourceConstraint:{
     pdfPage:number;
     crotchContactReference?:{pointId:string;distanceMm:number;envelope:{
       minimumMm:number;maximumMm:number;targetWithinEnvelope:boolean;
       touchingCondition:"UNRESOLVED_DIRECTION_AND_CONTACT";
     }};
     inseamDepthMm?:number;
   };
   mandatoryUnresolved:readonly string[]
 };

const finite=(v:unknown):v is number=>typeof v==="number"&&Number.isFinite(v);
const record=(v:unknown):v is Record<string,unknown> =>
 typeof v==="object"&&v!==null&&!Array.isArray(v);
const pointId=(v:unknown):v is string=>typeof v==="string"&&/^\d{1,3}$/.test(v);
function getPoint(points:Readonly<Record<string,Vec2>>,id:string):Vec2{
 const p=points[id];
 if(!p||!finite(p.x)||!finite(p.y))
  throw new RangeError(`Ponto do livro inválido: ${id}`);
 return p;
}
export function assessChapter2Curve(
 registryRow:unknown,measurements:TrouserSectionInputs,hypothesis:CurveHypothesis={}
):CurveAssessment{
 const ruleId=record(registryRow)&&typeof registryRow.ruleId==="string"
  ?registryRow.ruleId:"INVALID_RULE";
 const block=(reason:Extract<CurveAssessment,{state:"BLOCKED"}>["reason"],detail:string):CurveAssessment=>
  ({state:"BLOCKED",ruleId,reason,detail});
 if(!record(registryRow) ||!/^ALD-CH02-CURVE-\d{2}$/.test(ruleId) ||
   !["ONE_PIECE","TWO_PIECE"].includes(String(registryRow.method))||
   !["FRONT","BACK"].includes(String(registryRow.section))||
   !["CROTCH","INSEAM"].includes(String(registryRow.kind))||
   !Array.isArray(registryRow.pointPath)||
   !registryRow.pointPath.every(pointId)||
   !record(registryRow.sourceRef)||registryRow.sourceRef.chapter!==2 ||
   ![32,33].includes(Number(registryRow.sourceRef.pdfPage)))
  return block("INVALID_REGISTRY","Requisito de curva sem origem, método ou pontos válidos");
 if(registryRow.geometryStatus!=="AMBIGUOUS_GEOMETRY_DO_NOT_RENDER")
  return block("SOURCE_UNVERIFIED","Tentativa de promover condição de curva não aprovada");
 const rule=registryRow as Record<string,unknown>;
 const method=rule.method as FrontMethod;
 const section=rule.section as "FRONT"|"BACK";
 const kind=rule.kind as "CROTCH"|"INSEAM";
 const page=Number((rule.sourceRef as Record<string,unknown>).pdfPage);
 if((method==="ONE_PIECE"?32:33)!==page)
  return block("INVALID_REGISTRY","Página não corresponde ao método registrado");
 if(kind==="CROTCH" &&
    (rule.pointPath as string[]).length!==3)
  return block("INVALID_REGISTRY","Gancho exige exatamente três pontos de referência");
 if(kind==="INSEAM" &&
    (rule.pointPath as string[]).length!==2)
  return block("INVALID_REGISTRY","Entreperna exige dois pontos extremos");
 if(kind==="CROTCH" &&
   (!pointId(rule.referencePoint)||!finite(rule.distanceBasicMm)||
    !finite(rule.distanceEasyMm)||rule.distanceBasicMm<=0||rule.distanceEasyMm<=0))
  return block("INVALID_REGISTRY","Referência de contato inválida");
 if(kind==="INSEAM"&&(!finite(rule.inwardDepthMm)||rule.inwardDepthMm<=0))
  return block("INVALID_REGISTRY","Profundidade de entrada inválida");
 if((kind==="CROTCH"&&!finite(hypothesis.handleFraction)) ||
    (kind==="INSEAM"&&!hypothesis.sagittaSide))
  return block("HYPOTHESIS_REQUIRED","Definir explicitamente escolha de tangência ou lado de entrada");
 try{
  const research=draftFlatTrouserSectionsResearch(method,measurements);
  const points=(rule.pointPath as string[]).map(id=>getPoint(research.pointsMm,id));
  let candidate:CandidateSpline;
  let sourceConstraint:Extract<CurveAssessment,{state:"CANDIDATE_UNVERIFIED"}>["sourceConstraint"];
  if(kind==="CROTCH"){
   candidate=threePointG1Candidate(points[0],points[1],points[2],hypothesis.handleFraction!);
   const target=measurements.variant==="BASIC"
    ?rule.distanceBasicMm as number:rule.distanceEasyMm as number;
   const reference=rule.referencePoint as string;
   sourceConstraint={
    pdfPage:page,
    crotchContactReference:{
     pointId:reference,distanceMm:target,
     envelope:radialDistanceEnvelope(candidate,getPoint(research.pointsMm,reference),target)
    }
   };
  }else{
   candidate=midpointSagittaCandidate(
    points[0],points[1],rule.inwardDepthMm as number,hypothesis.sagittaSide!
   );
   sourceConstraint={pdfPage:page,inseamDepthMm:rule.inwardDepthMm as number};
  }
  return {
   state:"CANDIDATE_UNVERIFIED",ruleId,method,section,kind,
   variant:measurements.variant,candidate,sourceConstraint,
   mandatoryUnresolved:kind==="CROTCH"
    ?["Exata posição e direção da referência de contato de Aldrich",
      "Tangentes de alfaiataria e trueing das costuras",
      "Prova física/toile antes de qualquer corte"]
    :["Lado interior e posição longitudinal da entrada de Aldrich",
      "Tangentes de junção com a reta de perna e trueing",
      "Prova física/toile antes de qualquer corte"]
  };
 }catch(error){
  return block("INVALID_GEOMETRY",error instanceof Error?error.message:String(error));
 }
}
