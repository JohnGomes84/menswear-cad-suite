/**
 * GEOMETRY-TS-POC: modelo 2D genérico, independente de roupas e do SVG.
 * Não define tolerâncias industriais; apenas valida fixtures sintéticas.
 */
import type { Vec2 } from "./domain";

export type CubicControls = readonly [Vec2, Vec2, Vec2, Vec2];
export type ArcSample = {
  pointMm: Vec2;
  tangent: Vec2;
  t: number;
  arcLengthMm: number;
};
export type SyntheticNotch = ArcSample & { fraction: number };

const finite = (value: number) => Number.isFinite(value);
function assertControls(p: CubicControls): void {
  if (p.length !== 4 || p.some(q => !finite(q.x) || !finite(q.y))) {
    throw new RangeError("Pontos de controle inválidos ou não finitos");
  }
}
function assertT(t: number): void {
  if (!finite(t) || t < 0 || t > 1) throw new RangeError("Parâmetro t fora de [0,1]");
}

export function cubicPoint(p: CubicControls, t: number): Vec2 {
  assertControls(p); assertT(t);
  const u = 1 - t;
  return {
    x: u*u*u*p[0].x + 3*u*u*t*p[1].x + 3*u*t*t*p[2].x + t*t*t*p[3].x,
    y: u*u*u*p[0].y + 3*u*u*t*p[1].y + 3*u*t*t*p[2].y + t*t*t*p[3].y
  };
}

export function cubicDerivative(p: CubicControls, t: number): Vec2 {
  assertControls(p); assertT(t);
  const u = 1-t;
  return {
    x: 3*u*u*(p[1].x-p[0].x) + 6*u*t*(p[2].x-p[1].x) + 3*t*t*(p[3].x-p[2].x),
    y: 3*u*u*(p[1].y-p[0].y) + 6*u*t*(p[2].y-p[1].y) + 3*t*t*(p[3].y-p[2].y)
  };
}

function speed(p: CubicControls, t: number): number {
  const v = cubicDerivative(p, t);
  const s = Math.hypot(v.x, v.y);
  if (!finite(s)) throw new ArithmeticError("Velocidade geométrica não finita");
  return s;
}

/** Falha explícita se orçamento recursivo for insuficiente; estimativa local não é cota global de precisão. */
export class ArithmeticError extends Error {
  constructor(message: string) { super(message); this.name = "ArithmeticError"; }
}

function simpson(p: CubicControls, a: number, b: number): number {
  const c = (a+b)/2;
  const result = (b-a) * (speed(p,a) + 4*speed(p,c) + speed(p,b))/6;
  if (!finite(result)) throw new ArithmeticError("Quadratura não finita");
  return result;
}

function integrate(
  p: CubicControls, a: number, b: number, epsMm: number, maxDepth: number
): number {
  const whole = simpson(p,a,b);
  const recur = (lo:number, hi:number, original:number, tol:number, leftDepth:number):number => {
    const mid=(lo+hi)/2;
    const left=simpson(p,lo,mid);
    const right=simpson(p,mid,hi);
    const delta=left+right-original;
    if(!finite(delta)) throw new ArithmeticError("Erro de quadratura não finito");
    if(Math.abs(delta)<=15*tol) return left+right+delta/15;
    if(leftDepth<=0 || mid===lo || mid===hi) {
      throw new ArithmeticError("Integração não convergiu com o orçamento solicitado");
    }
    return recur(lo,mid,left,tol/2,leftDepth-1)+recur(mid,hi,right,tol/2,leftDepth-1);
  };
  return recur(a,b,whole,epsMm,maxDepth);
}

export function cubicLength(
  p: CubicControls, epsMm = 1e-7, maxDepth = 24
): number {
  assertControls(p);
  if (!finite(epsMm) || epsMm<=0 || !Number.isSafeInteger(maxDepth) || maxDepth<0) {
    throw new RangeError("Precisão ou profundidade numérica inválida");
  }
  return integrate(p,0,1,epsMm,maxDepth);
}

export function reverseCubic(p:CubicControls):CubicControls {
  assertControls(p);
  return [p[3],p[2],p[1],p[0]];
}

export function pointAtArcLength(
  p:CubicControls, arcLengthMm:number, epsMm=1e-7
):ArcSample {
  const total=cubicLength(p,epsMm);
  if (!finite(arcLengthMm) || arcLengthMm<0 || arcLengthMm>total) {
    throw new RangeError("Comprimento de arco fora da curva");
  }
  if(total<=1e-9) throw new ArithmeticError("Curva degenerada — tangente indefinida");
  let t=0;
  if(arcLengthMm===0) t=0;
  else if(arcLengthMm===total) t=1;
  else {
    let lo=0,hi=1;
    for(let i=0;i<53;i++){
      const mid=(lo+hi)/2;
      const partial=integrate(p,0,mid,Math.max(epsMm/4,1e-12),24);
      if(partial<arcLengthMm)lo=mid;
      else hi=mid;
    }
    t=(lo+hi)/2;
  }
  let d=cubicDerivative(p,t);
  let magnitude=Math.hypot(d.x,d.y);
  if(magnitude<=1e-14 && (t===0 || t===1)){
    const dt=1e-7;
    const a=cubicPoint(p,Math.max(0,t-dt));
    const b=cubicPoint(p,Math.min(1,t+dt));
    d={x:b.x-a.x,y:b.y-a.y};
    magnitude=Math.hypot(d.x,d.y);
  }
  if(!finite(magnitude) || magnitude<=1e-14) throw new ArithmeticError("Tangente indefinida");
  return {
    pointMm:cubicPoint(p,t),
    tangent:{x:d.x/magnitude,y:d.y/magnitude},
    t,
    arcLengthMm
  };
}

export function syntheticNotches(
  p:CubicControls, fractions:readonly number[]=[0.25,0.5,0.75], epsMm=1e-7
):SyntheticNotch[]{
  const length=cubicLength(p,epsMm);
  return fractions.map(fraction=>{
    if(!finite(fraction) || fraction<0 || fraction>1) {
      throw new RangeError("Fração de pique fora de [0,1]");
    }
    return {...pointAtArcLength(p,length*fraction,epsMm),fraction};
  });
}

export function evaluateSyntheticCurve(p:CubicControls):
  | {state:"PASS";lengthMm:number;notches:SyntheticNotch[]}
  | {state:"FAIL";message:string}{
  try{
    const lengthMm=cubicLength(p);
    if(lengthMm<=1e-9) throw new ArithmeticError("Curva degenerada");
    return {state:"PASS",lengthMm,notches:syntheticNotches(p)};
  }catch(error){
    return {state:"FAIL",message:error instanceof Error?error.message:String(error)};
  }
}
