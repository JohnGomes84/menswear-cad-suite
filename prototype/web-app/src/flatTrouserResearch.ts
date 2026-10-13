/**
 * CH02 flat-trouser FRONT research wrapper, *not* a usable cutting pattern.
 * Points are produced by generic instruction execution, never pixel tracing.
 */
import type { Vec2 } from "./domain";
import { executeDraftProgram } from "./draftingInterpreter";
import type { DraftStepResult } from "./draftingInterpreter";
import { flatTrouserFrontProgram } from "./aldCh02FlatTrouserProgram";

export type TrouserVariant="BASIC"|"EASY";
export type FlatTrouserResearchKind="ONE_PIECE"|"TWO_PIECE";
export type FlatTrouserInputs={
  seatMm:number;bodyRiseMm:number;insideLegMm:number;variant:TrouserVariant;
};
export type FlatTrouserScaffold={
  purpose:"RESEARCH_ONLY";
  method:FlatTrouserResearchKind;
  variant:TrouserVariant;
  sourcePdfPage:34;
  unit:"mm";
  frontPointsMm:Readonly<Record<string,Vec2>>;
  /** Source-linked execution log, one entry per constructed point. */
  instructionTrace:readonly DraftStepResult[];
  /** Auxiliary construction references, never cut/stitch contours. */
  guides:ReadonlyArray<readonly [string,string]>;
  unverifiedGeometry:readonly string[];
};

const positive=(n:number):boolean=>Number.isFinite(n)&&n>0&&n<10000;

export function draftFlatTrouserFrontResearch(
  method:FlatTrouserResearchKind,values:FlatTrouserInputs
):FlatTrouserScaffold {
  if(!positive(values.seatMm)||!positive(values.bodyRiseMm)||
     !positive(values.insideLegMm))
    throw new RangeError("Medições de pesquisa inválidas");
  const program=flatTrouserFrontProgram(method,values.variant);
  const result=executeDraftProgram(program,{
    seatMm:values.seatMm,bodyRiseMm:values.bodyRiseMm,
    insideLegMm:values.insideLegMm
  });
  const common:ReadonlyArray<readonly [string,string]>=[
    ["0","1"],["1","3"],["3","2"],["1","4"],
    ["4","5"],["5","6"],["4","7"],["4","8"]
  ];
  const append:ReadonlyArray<readonly [string,string]>=method==="ONE_PIECE"
    ?[["2","9"],["9","10"],["10","11"]]
    :[["1","9"],["9","10"],["10","11"],["11","12"],
      ["11","13"],["1","12"],["10","14"],["10","15"]];
  return {
    purpose:"RESEARCH_ONLY",method,variant:values.variant,
    sourcePdfPage:34,unit:"mm",
    frontPointsMm:result.pointsMm,instructionTrace:result.trace,
    guides:[...common,...append],
    unverifiedGeometry:[
      "Curvas de gancho, entreperna e contornos de corte",
      "Construção completa das costas e montagem",
      "Margens por aresta e distinção entre linha de costura e corte",
      "Tangências, continuidade e prova física"
    ]
  };
}
