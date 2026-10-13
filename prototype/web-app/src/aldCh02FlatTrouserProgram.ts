/**
 * Winifred Aldrich, Metric Pattern Cutting for Menswear, 5th ed.,
 * PDF pp. 32-34: research interpretation of the FRONT construction steps.
 * Derived from instructions plus diagram directions, not digitized pixels.
 * Do NOT represent curves, back, seams, allowances or a usable garment.
 */
import type { DraftInstruction, DraftProgram, ScalarExpr } from "./draftingInterpreter";
import { measure, mm, plus, span, times } from "./draftingInterpreter";

export type FrontMethod="ONE_PIECE"|"TWO_PIECE";
export type FrontVariant="BASIC"|"EASY";
const width=(easy:boolean):ScalarExpr=>
  plus(times(measure("seatMm"),1/4),mm(easy?80:40));
const gap=(easy:boolean):ScalarExpr=>
  plus(times(span("1","4"),1/4),mm(easy?5:-5));

/** Each entry has an explicit PDF page and is evaluated in construction order. */
export function flatTrouserFrontProgram(
  method:FrontMethod,variant:FrontVariant
):DraftProgram {
 if(method!=="ONE_PIECE"&&method!=="TWO_PIECE")
   throw new RangeError("Bloco de calça inválido");
 if(variant!=="BASIC"&&variant!=="EASY")
   throw new RangeError("Variante de modelagem inválida");
 const easy=variant==="EASY";
 const basePage=method==="ONE_PIECE"?32:33;
 const programId=`ALD-CH02-FLAT-${method}-FRONT-${variant}-DRAFT-0.1`;
 const source=(pdfPage:number,instruction:string)=>({
   sourceId:programId,chapter:2,pdfPage,instruction,
   interpretation:"TEXT_AND_DIAGRAM" as const
 });
 const origin=(id:string,instruction:string):DraftInstruction=>({
   op:"ORIGIN",stepId:id,pointId:id,xMm:0,yMm:0,
   source:source(basePage,instruction)
 });
 const offset=(id:string,from:string,direction:"LEFT"|"RIGHT"|"UP"|"DOWN",
   lengthMm:ScalarExpr,page:number,instruction:string):DraftInstruction=>({
   op:"OFFSET",stepId:id,pointId:id,from,direction,lengthMm,
   source:source(page,instruction)
 });
 const project=(id:string,xFrom:string,yFrom:string,page:number,
   instruction:string):DraftInstruction=>({
   op:"PROJECT_AXES",stepId:id,pointId:id,xFrom,yFrom,
   source:source(page,instruction)
 });
 const common:DraftInstruction[]=[
   origin("0","Origem com eixos perpendiculares, confirmados na figura"),
   offset("1","0","DOWN",plus(measure("bodyRiseMm"),mm(easy?40:20)),basePage,
     "Altura do gancho mais acréscimo da variante"),
   offset("2","1","DOWN",measure("insideLegMm"),basePage,"Comprimento interno"),
   offset("3","1","DOWN",times(span("1","2"),1/2),basePage,
     "Metade do comprimento interno e guia horizontal do joelho"),
   offset("4","1","LEFT",width(easy),basePage,
     "Um quarto do assento mais folga; sentido definido no diagrama"),
   project("5","4","0",basePage,
     "Esquadrar de 4 até a horizontal superior"),
   offset("6","5","RIGHT",mm(10),basePage,"Deslocamento superior 5→6 de 1 cm"),
   offset("7","4","UP",times(span("4","5"),1/4),basePage,
     "Quarto do comprimento vertical 4→5"),
   offset("8","4","LEFT",gap(easy),basePage,
     "Quarto de 1→4 com ajuste; sentido verificado no diagrama")
 ];
 const onePiece:DraftInstruction[]=[
   offset("9","2","LEFT",
     plus(times(span("1","4"),2/3),mm(easy?25:20)),basePage,
     "Referência da barra 2→9"),
   project("10","9","3",basePage,"Projetar a referência 9 na linha do joelho"),
   offset("11","10","LEFT",mm(20),basePage,"Deslocar 2 cm à esquerda do joelho")
 ];
 const twoPiece:DraftInstruction[]=[
   offset("9","1","LEFT",plus(times(span("1","4"),1/2),mm(10)),33,
     "Referência 1→9: meia largura + 1 cm"),
   project("10","9","3",33,"Projetar 9 na linha do joelho"),
   project("11","9","2",33,"Projetar 9 na linha da barra"),
   offset("12","11","RIGHT",plus(times(span("1","4"),1/3),mm(10)),33,
     "Referência da barra 11→12 para a direita, conforme diagrama"),
   offset("13","11","LEFT",plus(times(span("1","4"),1/3),mm(10)),33,
     "Referência 11→13 simétrica à esquerda, conforme diagrama"),
   {op:"INTERSECT_LINE_AT_Y",stepId:"14",pointId:"14",
     lineStart:"1",lineEnd:"12",yFrom:"3",
     source:source(33,"Interseção da guia 1→12 com o nível do joelho")},
   {op:"MIRROR_ABOUT_VERTICAL",stepId:"15",pointId:"15",
     point:"14",axisPoint:"10",
     source:source(33,"10→15 igual a 10→14, no lado oposto")}
 ];
 return {
   programId,purpose:"RESEARCH_ONLY",unit:"mm",
   sourceBook:"Metric Pattern Cutting for Menswear, 5th ed., chapter 2; PDF 32-34",
   instructions:[...common,...(method==="ONE_PIECE"?onePiece:twoPiece)]
 };
}
