/**
 * Aldrich, Metric Pattern Cutting for Menswear, 5th ed., Chapter 2.
 * Back-section POINTS AND STRAIGHT CONSTRUCTION GUIDES ONLY.
 *
 * Source: PDF text pp. 32 (one piece) / 33 (two piece),
 * direction checked against source figure PDF p. 34.
 * No back crotch spline, side seam contour, cut edge or garment validity.
 */
import type { DraftInstruction, DraftProgram, ScalarExpr } from "./draftingInterpreter";
import { mm, plus, span, times } from "./draftingInterpreter";
import {
  flatTrouserFrontProgram
} from "./aldCh02FlatTrouserProgram";
import type {
  FrontMethod, FrontVariant
} from "./aldCh02FlatTrouserProgram";

type Direction="LEFT"|"RIGHT"|"UP"|"DOWN";

/**
 * Executes front references first, then the source's back-section
 * instructions. Point IDs refer to the same figure throughout.
 */
export function flatTrouserConstructionProgram(
  method:FrontMethod,variant:FrontVariant
):DraftProgram {
  const front=flatTrouserFrontProgram(method,variant);
  const programId=front.programId.replace("-FRONT-","-FRONT-BACK-");
  const easy=variant==="EASY";
  const pdfPage=method==="ONE_PIECE"?32:33;
  const source=(instruction:string)=>({
    sourceId:programId,chapter:2,pdfPage,instruction,
    interpretation:"TEXT_AND_DIAGRAM" as const
  });
  const offset=(
    pointId:string,from:string,direction:Direction,lengthMm:ScalarExpr,
    instruction:string
  ):DraftInstruction=>({
    op:"OFFSET",stepId:pointId,pointId,from,direction,lengthMm,
    source:source(instruction)
  });
  const intersection=(
    pointId:string,lineStart:string,lineEnd:string,yFrom:string,
    instruction:string
  ):DraftInstruction=>({
    op:"INTERSECT_LINE_AT_Y",stepId:pointId,pointId,
    lineStart,lineEnd,yFrom,source:source(instruction)
  });
  // Step IDs and point IDs are unique within each method, and follow
  // the exact printed construction order for their own section.
  const onePiece:DraftInstruction[]=[
    offset("12","6","RIGHT",mm(35),
      "6→12 35 mm along the upper horizontal, towards right of 6"),
    offset("13","12","UP",mm(easy?45:35),
      "From 12, construct upward 35/45 mm to 13"),
    offset("14","4","UP",times(span("4","5"),1/2),
      "4→14 equals half the vertical 4→5"),
    offset("15","8","LEFT",plus(span("4","8"),mm(easy?10:5)),
      "8→15 equals 4→8 plus 5/10 mm, extended left"),
    offset("16","15","DOWN",mm(10),
      "15→16 down 10 mm"),
    offset("17","9","LEFT",mm(20),
      "9→17 left 20 mm on hem"),
    offset("18","11","LEFT",mm(30),
      "11→18 left 30 mm on knee")
  ];
  const twoPiece:DraftInstruction[]=[
    offset("16","6","RIGHT",mm(50),
      "6→16 right 50 mm"),
    offset("17","16","UP",mm(40),
      "16→17 up 40 mm"),
    offset("18","0","RIGHT",mm(easy?50:40),
      "0→18 right 40/50 mm on waist level"),
    offset("19","4","UP",times(span("4","5"),1/2),
      "4→19 equals half the vertical 4→5"),
    offset("20","8","LEFT",plus(span("4","8"),mm(easy?10:5)),
      "8→20 extended left by 4→8 plus 5/10 mm"),
    offset("21","20","DOWN",mm(10),
      "20→21 downward 10 mm"),
    offset("22","12","RIGHT",mm(10),
      "12→22 right 10 mm at hem"),
    intersection("23","18","22","3",
      "23: 18→22 straight guide intersects knee line 3"),
    offset("24","13","LEFT",mm(10),
      "13→24 left 10 mm on hem"),
    offset("25","15","LEFT",span("14","23"),
      "15→25 left by knee distance 14→23")
  ];
  return {
    ...front,programId,
    sourceBook:"Metric Pattern Cutting for Menswear, 5th ed., chapter 2; PDF pp. 32–34",
    instructions:[
      ...front.instructions.map(step=>({
        ...step,source:{...step.source,sourceId:programId}
      })),
      ...(method==="ONE_PIECE"?onePiece:twoPiece)
    ]
  };
}
