/**
 * Research-only front+back CH02 point scaffold, never a cutting pattern.
 * Curves are intentionally absent until their construction has been validated.
 */
import type {Vec2} from "./domain";
import type {DraftStepResult} from "./draftingInterpreter";
import {executeDraftProgram} from "./draftingInterpreter";
import type {FrontMethod,FrontVariant} from "./aldCh02FlatTrouserProgram";
import {flatTrouserConstructionProgram} from "./aldCh02FlatTrouserBackProgram";

export type TrouserSectionInputs={
  seatMm:number;bodyRiseMm:number;insideLegMm:number;
  variant:FrontVariant;
};
export type TrouserSectionsResearch={
  purpose:"RESEARCH_ONLY";
  method:FrontMethod;
  variant:FrontVariant;
  unit:"mm";
  pointsMm:Readonly<Record<string,Vec2>>;
  frontPointIds:readonly string[];
  backPointIds:readonly string[];
  sourceTrace:readonly DraftStepResult[];
  straightConstructionGuides:ReadonlyArray<readonly [string,string]>;
  withheldGeometry:readonly string[];
};
const positive=(n:number)=>Number.isFinite(n)&&n>0&&n<10000;

export function draftFlatTrouserSectionsResearch(
  method:FrontMethod,values:TrouserSectionInputs
):TrouserSectionsResearch {
  if(!positive(values.seatMm)||!positive(values.bodyRiseMm)||
     !positive(values.insideLegMm))
    throw new RangeError("Medidas inválidas para a pesquisa");
  const program=flatTrouserConstructionProgram(method,values.variant);
  const executed=executeDraftProgram(program,{
    seatMm:values.seatMm,bodyRiseMm:values.bodyRiseMm,
    insideLegMm:values.insideLegMm
  });
  const frontPointCount=method==="ONE_PIECE"?12:16;
  const steps=executed.trace.map(s=>s.pointId);
  return {
    purpose:"RESEARCH_ONLY",method,variant:values.variant,unit:"mm",
    pointsMm:executed.pointsMm,
    frontPointIds:steps.slice(0,frontPointCount),
    backPointIds:steps.slice(frontPointCount),
    sourceTrace:executed.trace,
    straightConstructionGuides:method==="ONE_PIECE"
      ?[["13","0"],["17","18"]]
      :[["17","18"],["18","22"],["24","25"]],
    withheldGeometry:[
      "Curvas 13–14–16 / 17–19–21 com pontos de passagem: não determinam Bézier única",
      "Curvas de entreperna com deslocamento interior de 10/20 mm: ainda sem geometria aprovada",
      "Traçado de costa/frente como contorno completo e fecho do molde",
      "Exceções de margem, costura, espelhamento, conferência física e impressão"
    ]
  };
}
