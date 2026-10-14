/**
 * Read-only research presentation model for the existing Aldrich CH02 interpreter.
 * Reuses original source programs, resolved book strokes and universal topology.
 * Never creates arbitrary curves or manufacturing geometry.
 */
import topologySource from "../../../docs/domain/CH02-ORIENTED-SOURCE-PATHS-001.json";
import {ch02SourceLineRegister,resolveCh02BookLineCommands} from "./ch02BookLineCommands";
import {draftFlatTrouserSectionsResearch} from "./flatTrouserBackResearch";
import {inspectResearchTopology} from "./topologyResearch";
import type {FrontMethod,FrontVariant} from "./aldCh02FlatTrouserProgram";
import type {Vec2} from "./domain";

export type Ch02ResearchMeasurements={
  seatMm:number;bodyRiseMm:number;insideLegMm:number;variant:FrontVariant
};
export type Ch02ResearchModel={
  purpose:"RESEARCH_ONLY"; cutReady:false;
  method:FrontMethod; variant:FrontVariant;
  points:{id:string;pointMm:Vec2;section:"FRONT"|"BACK"}[];
  strokes:ReturnType<typeof resolveCh02BookLineCommands>["strokes"];
  paths:{id:string;orderedPointIds:string[];unresolvedCurveCount:number}[];
  sourceStraightCount:number;unresolvedCurveCount:number;
  sourcePage:number;allowanceRegions:string[];
  exportAllowed:false;mirrorPerformed:false;
};

const finitePositive=(n:number)=>Number.isFinite(n)&&n>0&&n<10000;

export function buildCh02ResearchModel(
 method:FrontMethod,
 measurements:Ch02ResearchMeasurements
):Ch02ResearchModel {
 if(!["ONE_PIECE","TWO_PIECE"].includes(method))throw new RangeError("Método CH02 inválido");
 if(!["BASIC","EASY"].includes(measurements.variant))throw new RangeError("Variante CH02 inválida");
 for(const [key,value] of Object.entries(measurements)) {
   if(key==="variant")continue;
   if(typeof value!=="number"||!finitePositive(value))
     throw new RangeError("Medida inválida: "+key);
 }
 const geometry=draftFlatTrouserSectionsResearch(method,measurements);
 const commands=resolveCh02BookLineCommands(method,measurements);
 const inspected=inspectResearchTopology(topologySource,ch02SourceLineRegister.lineCommands);
 const paths=inspected.paths.filter(p=>p.method===method);
 if(paths.length!==2 || inspected.cutReady!==false || commands.noCut!==true)
   throw new Error("Contrato CH02 não autorizado");
 for(const path of paths)
   for(const id of path.orderedPointIds)
     if(!geometry.pointsMm[id]||!Number.isFinite(geometry.pointsMm[id].x)||
        !Number.isFinite(geometry.pointsMm[id].y))
       throw new Error("Ponto de fonte ausente: "+id);
 const points=Object.entries(geometry.pointsMm).map(([id,pointMm])=>({
   id,pointMm,section:(geometry.frontPointIds.includes(id)?"FRONT":"BACK") as "FRONT"|"BACK"
 }));
 const straight=commands.strokes.filter(s=>s.geometry==="STRAIGHT");
 const curves=commands.strokes.filter(s=>s.geometry==="CURVE");
 if(method==="ONE_PIECE"&&(straight.length!==3||curves.length!==4))throw new Error("Cobertura CH02: uma peça");
 if(method==="TWO_PIECE"&&(straight.length!==5||curves.length!==4))throw new Error("Cobertura CH02: duas peças");
 return {
   purpose:"RESEARCH_ONLY",cutReady:false,method,variant:measurements.variant,
   points,strokes:commands.strokes,
   paths:paths.map(p=>({id:p.id,orderedPointIds:p.orderedPointIds,
     unresolvedCurveCount:p.unresolvedCurveCount})),
   sourceStraightCount:straight.length,unresolvedCurveCount:curves.length,
   sourcePage:method==="ONE_PIECE"?32:33,
   allowanceRegions:commands.allowanceRegionLabels.map(x=>x.region),
   exportAllowed:false,mirrorPerformed:false
 };
}