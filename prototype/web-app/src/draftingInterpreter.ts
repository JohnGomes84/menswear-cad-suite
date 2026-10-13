/**
 * Generic metric drafting instruction interpreter (research).
 *
 * Executes authored mathematical steps in the order given by a source method.
 * It knows nothing about trousers, shirts, stitch lines or cutting contours.
 * The text/diagram-derived method is data; SVG is never geometric authority.
 */
import type { Vec2 } from "./domain";

export type ScalarExpr =
  | { op:"LITERAL_MM"; value:number }
  | { op:"MEASURE_MM"; name:string }
  | { op:"DISTANCE_MM"; from:string; to:string }
  | { op:"ADD" | "SUBTRACT"; a:ScalarExpr; b:ScalarExpr }
  | { op:"MULTIPLY"; value:ScalarExpr; factor:number };

export type SourceTrace = {
  sourceId:string;
  chapter:number;
  pdfPage:number;
  instruction:string;
  interpretation:"TEXT" | "TEXT_AND_DIAGRAM";
};

type InstructionBase={stepId:string;pointId:string;source:SourceTrace};
export type DraftInstruction =
  | (InstructionBase & {op:"ORIGIN";xMm:number;yMm:number})
  | (InstructionBase & {
      op:"OFFSET";from:string;
      direction:"LEFT"|"RIGHT"|"UP"|"DOWN";lengthMm:ScalarExpr;
    })
  | (InstructionBase & {op:"PROJECT_AXES";xFrom:string;yFrom:string})
  | (InstructionBase & {
      op:"INTERSECT_LINE_AT_Y";lineStart:string;lineEnd:string;yFrom:string;
    })
  | (InstructionBase & {
      op:"MIRROR_ABOUT_VERTICAL";point:string;axisPoint:string;
    });

export type DraftProgram={
  programId:string;
  purpose:"RESEARCH_ONLY";
  unit:"mm";
  sourceBook:string;
  instructions:readonly DraftInstruction[];
};

export type DraftStepResult={
  stepId:string;pointId:string;positionMm:Vec2;
  source:SourceTrace;
  usedPoints:readonly string[];
  lengthMm?:number;
};
export type DraftResult={
  purpose:"RESEARCH_ONLY";
  programId:string;
  unit:"mm";
  pointsMm:Readonly<Record<string,Vec2>>;
  trace:readonly DraftStepResult[];
};
const finite=(n:unknown):n is number => typeof n==="number"&&Number.isFinite(n);
function inputError(message:string,stepId:string):never {
  throw new RangeError(`Construção bloqueada no passo ${stepId}: ${message}`);
}
const safePoint=(x:number,y:number,stepId:string):Vec2=>{
  if(!finite(x)||!finite(y))inputError("coordenada não finita",stepId);
  return {x,y};
};
function evalScalar(
  expr:ScalarExpr, measures:Readonly<Record<string,number>>,
  points:Readonly<Record<string,Vec2>>, stepId:string, depth=0
):number{
  if(depth>20)inputError("expressão excessivamente profunda",stepId);
  let v:number;
  switch(expr.op){
    case "LITERAL_MM": v=expr.value;break;
    case "MEASURE_MM":{
      if(!Object.prototype.hasOwnProperty.call(measures,expr.name))
        inputError(`medida ausente: ${expr.name}`,stepId);
      v=measures[expr.name];break;
    }
    case "DISTANCE_MM":{
      const a=points[expr.from],b=points[expr.to];
      if(!a||!b)inputError("pontos da distância ainda não construídos",stepId);
      v=Math.hypot(b.x-a.x,b.y-a.y);break;
    }
    case "ADD":
      v=evalScalar(expr.a,measures,points,stepId,depth+1)+
        evalScalar(expr.b,measures,points,stepId,depth+1);break;
    case "SUBTRACT":
      v=evalScalar(expr.a,measures,points,stepId,depth+1)-
        evalScalar(expr.b,measures,points,stepId,depth+1);break;
    case "MULTIPLY":
      v=evalScalar(expr.value,measures,points,stepId,depth+1)*expr.factor;break;
    default:return inputError("expressão não suportada",stepId);
  }
  if(!finite(v))inputError("resultado escalar não finito",stepId);
  return v;
}

function dependencies(ins:DraftInstruction):string[]{
  switch(ins.op){
    case "ORIGIN":return [];
    case "OFFSET":return [ins.from];
    case "PROJECT_AXES":return [ins.xFrom,ins.yFrom];
    case "INTERSECT_LINE_AT_Y":return [ins.lineStart,ins.lineEnd,ins.yFrom];
    case "MIRROR_ABOUT_VERTICAL":return [ins.point,ins.axisPoint];
  }
}

/** Execute sequentially; fail on forward references, invalid input or ambiguity. */
export function executeDraftProgram(
 program:DraftProgram, measures:Readonly<Record<string,number>>
):DraftResult {
 if(program.purpose!=="RESEARCH_ONLY"||program.unit!=="mm"||
    !program.programId||!program.sourceBook||
    !Array.isArray(program.instructions)||program.instructions.length<1||
    program.instructions.length>500)
   throw new RangeError("Contrato do programa de modelagem inválido");
 for(const [key,v] of Object.entries(measures)){
   if(!key||!finite(v)||v<=0)throw new RangeError(`Medida inválida: ${key}`);
 }
 const points:Record<string,Vec2>=Object.create(null) as Record<string,Vec2>;
 const trace:DraftStepResult[]=[];
 const usedIds=new Set<string>();
 for(const ins of program.instructions){
   if(!ins.stepId||!ins.pointId||usedIds.has(ins.stepId)||
      Object.prototype.hasOwnProperty.call(points,ins.pointId)||
      !ins.source||ins.source.sourceId!==program.programId||
      !Number.isSafeInteger(ins.source.pdfPage)||ins.source.pdfPage<1||
      !ins.source.instruction)
     inputError("identidade ou proveniência inválida/duplicada",ins.stepId);
   usedIds.add(ins.stepId);
   const refs=dependencies(ins);
   for(const ref of refs){
     if(!Object.prototype.hasOwnProperty.call(points,ref))
       inputError(`referência ainda não construída: ${ref}`,ins.stepId);
   }
   let next:Vec2;
   let distance:number|undefined;
   switch(ins.op){
     case "ORIGIN":next=safePoint(ins.xMm,ins.yMm,ins.stepId);break;
     case "OFFSET":{
       distance=evalScalar(ins.lengthMm,measures,points,ins.stepId);
       if(distance<0)inputError("deslocamento negativo",ins.stepId);
       const p=points[ins.from];
       switch(ins.direction){
         case "LEFT":next=safePoint(p.x-distance,p.y,ins.stepId);break;
         case "RIGHT":next=safePoint(p.x+distance,p.y,ins.stepId);break;
         case "UP":next=safePoint(p.x,p.y-distance,ins.stepId);break;
         case "DOWN":next=safePoint(p.x,p.y+distance,ins.stepId);break;
         default:return inputError("direção de deslocamento não suportada",ins.stepId);
       }break;
     }
     case "PROJECT_AXES":
       next=safePoint(points[ins.xFrom].x,points[ins.yFrom].y,ins.stepId);
       break;
     case "INTERSECT_LINE_AT_Y":{
       const a=points[ins.lineStart],b=points[ins.lineEnd],target=points[ins.yFrom].y;
       const denominator=b.y-a.y;
       if(!finite(denominator)||Math.abs(denominator)<1e-10)
         inputError("linha sem cruzamento único no nível indicado",ins.stepId);
       const t=(target-a.y)/denominator;
       if(!finite(t)||t < -1e-10||t>1+1e-10)
         inputError("interseção fora do segmento definido",ins.stepId);
       next=safePoint(a.x+t*(b.x-a.x),target,ins.stepId);
       break;
     }
     case "MIRROR_ABOUT_VERTICAL":{
       const p=points[ins.point],axis=points[ins.axisPoint];
       next=safePoint(2*axis.x-p.x,p.y,ins.stepId);
       break;
     }
     default:return inputError("operação geométrica não suportada",ins.stepId);
   }
   points[ins.pointId]=next;
   trace.push({
     stepId:ins.stepId,pointId:ins.pointId,
     positionMm:{...next},source:{...ins.source},
     usedPoints:refs.slice(),...(distance===undefined?{}:{lengthMm:distance})
   });
 }
 return {purpose:"RESEARCH_ONLY",programId:program.programId,unit:"mm",
   pointsMm:points,trace};
}

export const mm=(value:number):ScalarExpr=>({op:"LITERAL_MM",value});
export const measure=(name:string):ScalarExpr=>({op:"MEASURE_MM",name});
export const span=(from:string,to:string):ScalarExpr=>({op:"DISTANCE_MM",from,to});
export const plus=(a:ScalarExpr,b:ScalarExpr):ScalarExpr=>({op:"ADD",a,b});
export const minus=(a:ScalarExpr,b:ScalarExpr):ScalarExpr=>({op:"SUBTRACT",a,b});
export const times=(value:ScalarExpr,factor:number):ScalarExpr=>({op:"MULTIPLY",value,factor});
