/**
 * Generic drafting curve CANDIDATES (mathematical experiments only).
 * No automatic copying of book diagrams, no cutting / sewing semantics.
 *
 * A smooth cubic candidate is not automatically the curve described by a
 * patternmaking book: it needs separate constraint and physical validation.
 */
import type {Vec2} from "./domain";
import {cubicPoint,cubicDerivative,cubicLength} from "./geometry";
import type {CubicControls} from "./geometry";

export type CandidateSpline={
  purpose:"RESEARCH_ONLY";
  status:"CANDIDATE_UNVERIFIED";
  construction:"THROUGH_THREE_POINTS_G1" | "MID_CHORD_SAGITTA_HYPOTHESIS";
  pieces:readonly CubicControls[];
  lengthMm:number;
  diagnostics:{
    interpolationResidualMm:number;
    joinAngleDeg:number|null;
    midpointSignedSagittaMm:number|null;
    sampledSelfIntersections:number;
    samplingSegmentsPerPiece:number;
  };
  assumptions:readonly string[];
};
export type CurveSide="LEFT_OF_DIRECTED_CHORD"|"RIGHT_OF_DIRECTED_CHORD";
const finite=(n:number)=>Number.isFinite(n);
const valid=(p:Vec2)=>p&&finite(p.x)&&finite(p.y);
const add=(a:Vec2,b:Vec2):Vec2=>({x:a.x+b.x,y:a.y+b.y});
const sub=(a:Vec2,b:Vec2):Vec2=>({x:a.x-b.x,y:a.y-b.y});
const scale=(a:Vec2,k:number):Vec2=>({x:a.x*k,y:a.y*k});
const length=(a:Vec2)=>Math.hypot(a.x,a.y);
const unit=(a:Vec2):Vec2=>{
 const size=length(a);
 if(!finite(size)||size<=1e-10)throw new RangeError("Pontos coincidentes ou tangente indeterminada");
 return scale(a,1/size);
};
const cross=(a:Vec2,b:Vec2)=>a.x*b.y-a.y*b.x;
const dot=(a:Vec2,b:Vec2)=>a.x*b.x+a.y*b.y;
function verify(pieces:readonly CubicControls[]):void{
 if(pieces.length===0||pieces.length>16)throw new RangeError("Quantidade de trechos inválida");
 for(const controls of pieces){
  if(controls.length!==4||controls.some(p=>!valid(p)||Math.abs(p.x)>1e7||Math.abs(p.y)>1e7))
   throw new RangeError("Pontos de curva inválidos ou fora do limite experimental");
 }
}
function samplingIntersections(pieces:readonly CubicControls[],subdivisions=40):number{
 // Conservative polyline approximation diagnostic, not an exact proof.
 const sampled=pieces.flatMap((c,i)=>Array.from({length:subdivisions+1},(_,j)=>({
   p:cubicPoint(c,j/subdivisions),piece:i,t:j
 })).slice(i===0?0:1));
 let count=0;
 const orient=(a:Vec2,b:Vec2,c:Vec2)=>cross(sub(b,a),sub(c,a));
 for(let i=0;i<sampled.length-1;i++){
  const a=sampled[i].p,b=sampled[i+1].p;
  for(let j=i+2;j<sampled.length-1;j++){
   // Adjacent segments share an endpoint and are not self-intersections.
   if(j===i+1)continue;
   const c=sampled[j].p,d=sampled[j+1].p;
   const v1=orient(a,b,c),v2=orient(a,b,d);
   const v3=orient(c,d,a),v4=orient(c,d,b);
   // Ignore tangencies/collinear ambiguity; investigate separately in QA.
   if(v1*v2 < -1e-18 && v3*v4 < -1e-18)count++;
  }
 }
 return count;
}
function metrics(
 pieces:readonly CubicControls[],assumptions:readonly string[],
 construction:CandidateSpline["construction"],midpointSignedSagittaMm:number|null
):CandidateSpline{
 verify(pieces);
 const lengthMm=pieces.reduce((sum,p)=>sum+cubicLength(p,1e-6),0);
 if(!finite(lengthMm))throw new RangeError("Comprimento não finito");
 let joinAngleDeg:number|null=null;
 if(pieces.length>1){
  let max=0;
  for(let i=0;i<pieces.length-1;i++){
   const a=cubicDerivative(pieces[i],1),b=cubicDerivative(pieces[i+1],0);
   const aSize=length(a),bSize=length(b);
   if(aSize<=1e-9||bSize<=1e-9)throw new RangeError("Tangente degenerada");
   const cos=Math.max(-1,Math.min(1,dot(a,b)/aSize/bSize));
   max=Math.max(max,Math.acos(cos)*180/Math.PI);
  }
  joinAngleDeg=max;
 }
 const interpolationResidualMm=pieces.slice(0,-1).reduce((max,p,i)=>
  Math.max(max,length(sub(p[3],pieces[i+1][0]))),0);
 return {
  purpose:"RESEARCH_ONLY",status:"CANDIDATE_UNVERIFIED",construction,
  pieces,lengthMm,
  diagnostics:{
   interpolationResidualMm,joinAngleDeg,midpointSignedSagittaMm,
   sampledSelfIntersections:samplingIntersections(pieces),
   samplingSegmentsPerPiece:40
  },
  assumptions
 };
}

/**
 * Two cubic Hermite-like segments through exactly A, B, C.
 * Tangent at B is chord-direction bisector: G1 by construction.
 * Control lengths are an explicitly chosen fraction of local chord lengths.
 */
export function threePointG1Candidate(
 a:Vec2,b:Vec2,c:Vec2,handleFraction:number
):CandidateSpline{
 if(!valid(a)||!valid(b)||!valid(c)||
    !finite(handleFraction)||handleFraction<0.1||handleFraction>0.45)
  throw new RangeError("Pontos ou fração de alça inválidos");
 const ab=sub(b,a),bc=sub(c,b);
 const abSize=length(ab),bcSize=length(bc);
 const u=unit(ab),v=unit(bc);
 const tangent=unit(add(u,v)); // reversals are ambiguous: fail closed.
 const p0:CubicControls=[
  {...a},add(a,scale(u,handleFraction*abSize)),
  sub(b,scale(tangent,handleFraction*abSize)),{...b}
 ];
 const p1:CubicControls=[
  {...b},add(b,scale(tangent,handleFraction*bcSize)),
  sub(c,scale(v,handleFraction*bcSize)),{...c}
 ];
 return metrics(
  [p0,p1],
  ["B é atravessado exatamente por dois segmentos de Bézier cúbica",
   "A bissetriz de cordas define a tangente intermediária por escolha CAD, NÃO pelo livro",
   "Fração de alças indicada explicitamente; não é uma cota de Aldrich",
   "Referências de passagem a partir do ponto 4 NÃO estão resolvidas"],
  "THROUGH_THREE_POINTS_G1",null
 );
}

/**
 * Two endpoints and explicitly user-supplied inward side. Sagitta at t=0.5
 * is a chosen engineering interpretation, NOT a source-approved location.
 */
export function midpointSagittaCandidate(
 a:Vec2,b:Vec2,sagittaMm:number,side:CurveSide
):CandidateSpline{
 if(!valid(a)||!valid(b)||!finite(sagittaMm)||sagittaMm<=0||
    sagittaMm>1000||!["LEFT_OF_DIRECTED_CHORD","RIGHT_OF_DIRECTED_CHORD"].includes(side))
  throw new RangeError("Corda, profundidade ou lado inválido");
 const delta=sub(b,a),size=length(delta);
 if(!finite(size)||size<=1e-9)throw new RangeError("Corda de comprimento zero");
 const sign=side==="LEFT_OF_DIRECTED_CHORD"?1:-1;
 const normal=scale({x:-delta.y/size,y:delta.x/size},sign);
 const displacement=scale(normal,4*sagittaMm/3);
 const p:CubicControls=[
  {...a},add(add(a,scale(delta,1/3)),displacement),
  add(add(a,scale(delta,2/3)),displacement),{...b}
 ];
 return metrics(
  [p],
  ["Inward side is an explicit engineering hypothesis",
   "10/20 mm source depth is interpreted at CHORD MIDPOINT, not asserted by the book",
   "Endpoint tangents are not aligned with neighboring sewing edges",
   "Candidate must not be used for cut, seam pairing or fit approval"],
  "MID_CHORD_SAGITTA_HYPOTHESIS",sign*sagittaMm
 );
}

/** Sampled range of radial distances; crossing a circle is NOT proof that
 * the book's intended 'touching point' has been located or its tangent met. */
export function radialDistanceEnvelope(
 curve:CandidateSpline,reference:Vec2,targetMm:number,samplesPerPiece=120
):{
  minimumMm:number;maximumMm:number;
  targetWithinEnvelope:boolean;
  touchingCondition:"UNRESOLVED_DIRECTION_AND_CONTACT";
}{
 if(!valid(reference)||!finite(targetMm)||targetMm<0||
    !Number.isSafeInteger(samplesPerPiece)||samplesPerPiece<10||samplesPerPiece>1000)
  throw new RangeError("Diagnóstico radial inválido");
 let minimumMm=Infinity,maximumMm=0;
 for(const p of curve.pieces)for(let i=0;i<=samplesPerPiece;i++){
  const q=cubicPoint(p,i/samplesPerPiece),r=length(sub(q,reference));
  if(!finite(r))throw new RangeError("Distância radial não finita");
  minimumMm=Math.min(minimumMm,r);maximumMm=Math.max(maximumMm,r);
 }
 return {
  minimumMm,maximumMm,
  targetWithinEnvelope:minimumMm<=targetMm&&targetMm<=maximumMm,
  touchingCondition:"UNRESOLVED_DIRECTION_AND_CONTACT"
 };
}
