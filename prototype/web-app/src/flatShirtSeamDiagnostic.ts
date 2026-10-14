/** Read-only MI-001 cava–manga comparison.
 * Consumes the existing version-locked Flat Shirt project and geometry kernel.
 * No seam roles, pitch marks, allowances or ease are inferred.
 */
import type { ShirtProject, ShirtPiece, ShirtEdge } from './flatShirtProject';
import {validateShirtProject} from './flatShirtProject';
import {cubicLength, reverseCubic} from './geometry';
import type { CubicControls } from './geometry';
import type {Vec2} from './domain';

/**
 * MI-001 classification of the existing edge IDs. This is *not* the
 * construction provenance: it independently records the evidence for an
 * industrial function. "1 cm allowance included" (PDF p35) does not tell us
 * which draft stroke is the stitch line. No inferred seam or fold is allowed.
 */
export type LineClass='SEAM_LINE'|'CONSTRUCTION_LINE'|'FOLD_LINE'|'MARK'|'UNCLASSIFIED';
export type ClassificationOrigin='SOURCE_EXPLICIT'|'SOURCE_INFERRED'|'TECHNICAL_DECISION'|'PENDING_REVIEW';
export type EdgeClassification={
 edgeId:string;from:string;to:string;previousRole:ShirtEdge['role'];
 classification:LineClass;classificationOrigin:ClassificationOrigin;
 sourceLocation:string;sourceEvidence:string;justification:string;
 solution:string;geometryOrigin:ShirtEdge['origin'];roleRevision:'DRAFT';stitchLineConfirmed:false;
};
type LineClassificationSpec={
 id:string;from:string;to:string;classification:LineClass;
 classificationOrigin:ClassificationOrigin;sourceLocation:string;
 sourceEvidence:string;justification:string;
};
const uncertain=(id:string,from:string,to:string,sourceLocation:string,sourceEvidence:string,justification:string):LineClassificationSpec=>({
 id,from,to,classification:'UNCLASSIFIED',classificationOrigin:'PENDING_REVIEW',
 sourceLocation,sourceEvidence,justification
});
const construction=(id:string,from:string,to:string,origin:'SOURCE_EXPLICIT'|'SOURCE_INFERRED',sourceLocation:string,sourceEvidence:string,justification:string):LineClassificationSpec=>({
 id,from,to,classification:'CONSTRUCTION_LINE',classificationOrigin:origin,
 sourceLocation,sourceEvidence,justification
});
const edgeClassificationContract:readonly LineClassificationSpec[]=[
 uncertain('FRONT:E01','18','10','PDF p.35–36; fig. p.38','Front neck to fitting line 1 cm below 10','Neck edge is ordered but a stitch line is not identified; diagram also notes no seam allowance near neck'),
 uncertain('FRONT:E02','10','17','PDF p.36; fig. p.38','Join 10–17','Join establishes geometry, not its seam or cutting role'),
 uncertain('FRONT:E03','17','12','PDF p.36; fig. p.38','Armhole curve passes through 17,12,5','Curve is provisional and seam versus cut line is unverified'),
 uncertain('FRONT:E04','12','5','PDF p.36; fig. p.38','Armhole curve passes through 17,12,5','Curve is provisional and seam versus cut line is unverified'),
 uncertain('FRONT:E05','5','8','PDF p.35; fig. p.38','Square through 5 to waist 7 and hem 8','May form side boundary; original square-down instruction does not identify a stitch line'),
 uncertain('FRONT:E06','8','4','PDF p.35; fig. p.38','Hem shown with no hem allowance','Hem boundary is not one of the requested roles; do not mislabel as seam/fold'),
 construction('FRONT:E07','4','18','SOURCE_INFERRED','PDF p.35–36; fig. p.38','Centre front/back and vertical drafting axis; no seam allowance marked at centre','Digital 4→18 coincides with the central drafting axis, not an approved fold'),
 uncertain('BACK:E01','1','10','PDF p.35; fig. p.38','Back neck to fitting line 1 cm below 10','Neck curve role unverified; no seam allowance callout does not prove a stitch line'),
 uncertain('BACK:E02','10','17','PDF p.36; fig. p.38','Join 10–17','Join is a construction order; no industrial role demonstrated'),
 uncertain('BACK:E03','17','12','PDF p.36; fig. p.38','Armhole curve passes through 17,12,5','Identical provisional front/back curvature; stitch line not identified'),
 uncertain('BACK:E04','12','5','PDF p.36; fig. p.38','Armhole curve passes through 17,12,5','Identical provisional front/back curvature; stitch line not identified'),
 uncertain('BACK:E05','5','8','PDF p.35; fig. p.38','Square through 5 to waist 7 and hem 8','Outer boundary may be used for assembly, but not proven as seam line'),
 uncertain('BACK:E06','8','4','PDF p.35; fig. p.38','Hem shown with no hem allowance','Do not infer a seam from no-hem-allowance caption'),
 construction('BACK:E07','4','1','SOURCE_INFERRED','PDF p.35; fig. p.38','Centre front/back and 0→4 vertical axis','Digital 4→1 is the central construction reference; no fold instruction'),
 uncertain('SLEEVE:E01','0','HEAD_RAISE_78','PDF p.36; fig. p.38','Raise cap contour 1.5 cm between references 7 and 8','Candidate cap Bézier; not confirmed as stitch line'),
 uncertain('SLEEVE:E02','HEAD_RAISE_78','6','PDF p.36; fig. p.38','Divide diagonal into fifths and draw sleeve head','Candidate cap Bézier; no industrial seam role established'),
 uncertain('SLEEVE:E03','6','HEAD_HOLLOW_5','PDF p.36; fig. p.38','Draw sleeve head; hollow 0.75 cm at 5','Candidate cap Bézier; no industrial seam role established'),
 uncertain('SLEEVE:E04','HEAD_HOLLOW_5','3','PDF p.36; fig. p.38','Hollow curve near reference 5','Candidate cap Bézier; no industrial seam role established'),
 construction('SLEEVE:E05','3','0','SOURCE_INFERRED','PDF p.36; fig. p.38','0–3 diagonal measured from body 5–17 plus 3 cm, then divided into five','Construction diagonal defining sleeve head references; not the cap contour'),
 uncertain('SLEEVE:E06','3','4','PDF p.36; fig. p.38','Join 3–4','No textual seam-line role; diagram is not a stitch-line annotation'),
 uncertain('SLEEVE:E07','4','2','PDF p.36; fig. p.38','Sleeve hem marked no hem allowance','Hem boundary must not be promoted to seam or fold'),
 construction('SLEEVE:E08','2','0','SOURCE_EXPLICIT','PDF p.36; fig. p.38','Centre line / no seam allowance on sleeve 0–2','Diagram explicitly calls it centre line; not an instruction to fold')
];
export function classifyFlatShirtEdges(raw:ShirtProject):EdgeClassification[]{
 const project=validateShirtProject(raw);
 const edges=project.pieces.flatMap(piece=>piece.edges);
 if(edges.length!==edgeClassificationContract.length)throw new Error('LINE_CLASSIFICATION_EDGE_COUNT_CHANGED');
 const map=new Map(edgeClassificationContract.map(x=>[x.id,x]));
 if(map.size!==edgeClassificationContract.length)throw new Error('LINE_CLASSIFICATION_DUPLICATE_ID');
 return edges.map(e=>{
  const spec=map.get(e.id);
  if(!spec||e.from!==e.id.split(':')[0]+':'+spec.from||e.to!==e.id.split(':')[0]+':'+spec.to)
   throw new Error('LINE_CLASSIFICATION_EDGE_CONTRACT_CHANGED '+e.id);
  if(spec.classification==='SEAM_LINE'||spec.classification==='FOLD_LINE')
   throw new Error('LINE_CLASSIFICATION_REQUIRES_INDEPENDENT_SOURCE_EVIDENCE '+e.id);
  return {edgeId:e.id,from:e.from,to:e.to,previousRole:e.role,
   classification:spec.classification,classificationOrigin:spec.classificationOrigin,
   sourceLocation:spec.sourceLocation,sourceEvidence:spec.sourceEvidence,
   justification:spec.justification,solution:e.solution,geometryOrigin:e.origin,
   roleRevision:'DRAFT' as const,stitchLineConfirmed:false as const};
 });
}

export const ARMHOLE_CHAIN = [
  {edgeId:'E04', from:'5',to:'12', orientation:'REVERSED'},
  {edgeId:'E03', from:'12',to:'17', orientation:'REVERSED'},
] as const;
export const HALF_SLEEVE_HEAD_CHAIN = [
  {edgeId:'E04',from:'3',to:'HEAD_HOLLOW_5',orientation:'REVERSED'},
  {edgeId:'E03',from:'HEAD_HOLLOW_5',to:'6',orientation:'REVERSED'},
  {edgeId:'E02',from:'6',to:'HEAD_RAISE_78',orientation:'REVERSED'},
  {edgeId:'E01',from:'HEAD_RAISE_78',to:'0',orientation:'REVERSED'},
] as const;

type PieceId=ShirtPiece['id'];
export type MeasuredSegment={pieceId:PieceId;edgeId:string;from:string;to:string;lengthMm:number;unit:'mm';source:string;sourceInstruction:string;origin:ShirtEdge['origin'];solution:string;role:ShirtEdge['role'];review:ShirtEdge['review']['state'];orientation:'REVERSED'};
export type MeasuredChain={pieceId:PieceId;segments:MeasuredSegment[];totalMm:number;unit:'mm';geometry:'EXPERIMENTAL_CUBIC_PATH';industrialRole:'UNCLASSIFIED'};
export type SeamComparison={
  format:'MI001-CAVA-MANGA-DIAGNOSTIC/1.0.0';
  projectId:string;projectRevision:number;method:ShirtProject['method'];unit:'mm';
  verdict:'INDEFINITE';
  edgeClassifications:EdgeClassification[];
  reason:string;
  scope:{frontArmhole:'5→12→17';backArmhole:'5→12→17';halfSleeveHead:'3→HEAD_HOLLOW_5→6→HEAD_RAISE_78→0';source:'Aldrich 5, PDF pp.35–36 + p.38';currentGeometry:'ARMHOLE_INTERPOLATION@1.0.0 / SLEEVE_HEAD_INTERPOLATION@1.0.2'};
  front:MeasuredChain;back:MeasuredChain;halfSleeveHead:MeasuredChain;
  construction:{bodyChord5to17Mm:number;sleeveDiagonal3to0Mm:number;sourceAddedToDiagonalMm:number;hollow5Mm:number;riseBetween7and8Mm:number;frontBackArcDifferenceMm:number};
  differences:{halfHeadMinusFrontMm:number;halfHeadMinusBackMm:number;twoMirroredHalvesMinusBothArmholesMm:number};
  geometricExcess:{
    basis:'MIRRORED_HALF_CAP_VS_UNCLASSIFIED_ARMHOLE_CONTOURS';
    headTotalHypothesisMm:number;armscyeFrontMm:number;armscyeBackMm:number;armscyeTotalMm:number;
    excessTotalMm:number;excessFrontHalfMm:number;excessBackHalfMm:number;
    stitchLineStatus:'NOT_IDENTIFIED';approvedTargetMm:null;approvedToleranceMm:null;
    frontNotch:null;backNotch:null;upperZoneMm:null;lowerFrontZoneMm:null;lowerBackZoneMm:null;
    designIntent:'UNDEFINED';distribution:'UNDEFINED';releaseStatus:'GEOMETRIC_FACT_NOT_ASSEMBLY_APPROVAL';
  };
  halfToFull:{representation:'HALF_SLEEVE_DIAGRAM';centreGuideId:'SLEEVE:E08';hypothesis:'MIRROR_ABOUT_0_TO_2_NOT_APPROVED';fullHeadIfMirroredMm:number;remark:string};
  matchCandidates:{sleeveEndpoint:string;bodyEndpoint:string;kind:'GEOMETRIC_REGISTRATION_NOT_NOTCH';approved:false}[];
  classifications:{item:string;class:'SOURCE_DERIVED'|'GEOMETRY_CALCULATION'|'TECHNICAL_DECISION_PENDING';basis:string}[];
  release:ShirtProject['release'];
};
const point=(piece:ShirtPiece,id:string):Vec2=>{
 const p=piece.points.find(x=>x.id===piece.id+':'+id);
 if(!p)throw new Error('DIAGNOSTIC_MISSING_POINT '+piece.id+':'+id);
 return p.positionMm;
};
const pieceOf=(project:ShirtProject,id:PieceId):ShirtPiece=>{
 const piece=project.pieces.find(p=>p.id===id);
 if(!piece)throw new Error('DIAGNOSTIC_MISSING_PIECE '+id);
 return piece;
};
type ChainSpec=readonly {readonly edgeId:string;readonly from:string;readonly to:string;readonly orientation:'REVERSED'}[];
function chain(piece:ShirtPiece,spec:ChainSpec,expectedSolution:string):MeasuredChain{
 const segments:MeasuredSegment[]=[];
 for(const ref of spec){
  const edge=piece.edges.find(x=>x.id===piece.id+':'+ref.edgeId);
  if(!edge||edge.from!==piece.id+':'+ref.to||edge.to!==piece.id+':'+ref.from||edge.kind!=='CUBIC_BEZIER'||!edge.controlsMm||edge.solution!==expectedSolution||edge.role!=='UNCLASSIFIED')
   throw new Error('DIAGNOSTIC_SEGMENT_CONTRACT_CHANGED '+piece.id+':'+ref.edgeId);
  const controls: CubicControls=[point(piece,ref.to),edge.controlsMm[0],edge.controlsMm[1],point(piece,ref.from)];
  const oriented=reverseCubic(controls);
  segments.push({pieceId:piece.id,edgeId:edge.id,from:piece.id+':'+ref.from,to:piece.id+':'+ref.to,lengthMm:cubicLength(oriented),unit:'mm',source:edge.source,sourceInstruction:piece.id==='SLEEVE'?'Aldrich5 PDF p36 and diagram p38: five diagonal divisions; hollow 7.5mm at 5, rise 15mm between 7–8':'Aldrich5 PDF p36: curved armhole must pass 17,12,5',origin:edge.origin,solution:edge.solution,role:edge.role,review:edge.review.state,orientation:'REVERSED'});
 }
 for(let i=1;i<segments.length;i++)if(segments[i-1].to!==segments[i].from)throw new Error('DIAGNOSTIC_DISCONTIGUOUS_PATH');
 return {pieceId:piece.id,segments,totalMm:segments.reduce((sum,x)=>sum+x.lengthMm,0),unit:'mm',geometry:'EXPERIMENTAL_CUBIC_PATH',industrialRole:'UNCLASSIFIED'};
}
const mmDistance=(a:Vec2,b:Vec2)=>Math.hypot(a.x-b.x,a.y-b.y);
const clean=(v:number)=>Math.abs(v)<1e-10?0:v;
export function compareShirtArmholesToHalfSleeve(raw:ShirtProject):SeamComparison{
 const project=validateShirtProject(raw);
 const frontPiece=pieceOf(project,'FRONT'),backPiece=pieceOf(project,'BACK'),sleevePiece=pieceOf(project,'SLEEVE');
 const front=chain(frontPiece,ARMHOLE_CHAIN,'ARMHOLE_INTERPOLATION@1.0.0');
 const back=chain(backPiece,ARMHOLE_CHAIN,'ARMHOLE_INTERPOLATION@1.0.0');
 const halfSleeveHead=chain(sleevePiece,HALF_SLEEVE_HEAD_CHAIN,'SLEEVE_HEAD_INTERPOLATION@1.0.2');
 const bodyChord5to17Mm=mmDistance(point(frontPiece,'5'),point(frontPiece,'17'));
 const sleeveDiagonal3to0Mm=mmDistance(point(sleevePiece,'3'),point(sleevePiece,'0'));
 const hollow5Mm=point(sleevePiece,'HEAD_HOLLOW_5').y-point(sleevePiece,'5').y;
 const riseBetween7and8Mm=(point(sleevePiece,'7').y+point(sleevePiece,'8').y)/2-point(sleevePiece,'HEAD_RAISE_78').y;
 return {
  format:'MI001-CAVA-MANGA-DIAGNOSTIC/1.0.0',projectId:project.projectId,projectRevision:project.revision,method:project.method,unit:'mm',verdict:'INDEFINITE',
  reason:'Excedente geométrico total mensurável = 2 × cabeça da meia manga − (cava frente + cava costas). A hipótese de espelhamento não classifica o traço como linha de costura. Frente/costas possuem curvas idênticas por decisão provisória, sem correspondência de lados, SeamPair, piques, zonas, alvo ou tolerância aprovados. A intenção de modelagem permanece INDEFINITE.',
  scope:{frontArmhole:'5→12→17',backArmhole:'5→12→17',halfSleeveHead:'3→HEAD_HOLLOW_5→6→HEAD_RAISE_78→0',source:'Aldrich 5, PDF pp.35–36 + p.38',currentGeometry:'ARMHOLE_INTERPOLATION@1.0.0 / SLEEVE_HEAD_INTERPOLATION@1.0.2'},
  front,back,halfSleeveHead,
  edgeClassifications:classifyFlatShirtEdges(project),
  construction:{bodyChord5to17Mm,sleeveDiagonal3to0Mm,sourceAddedToDiagonalMm:clean(sleeveDiagonal3to0Mm-bodyChord5to17Mm),hollow5Mm,riseBetween7and8Mm,frontBackArcDifferenceMm:clean(front.totalMm-back.totalMm)},
  differences:{halfHeadMinusFrontMm:halfSleeveHead.totalMm-front.totalMm,halfHeadMinusBackMm:halfSleeveHead.totalMm-back.totalMm,twoMirroredHalvesMinusBothArmholesMm:2*halfSleeveHead.totalMm-front.totalMm-back.totalMm},
  geometricExcess:{
    basis:'MIRRORED_HALF_CAP_VS_UNCLASSIFIED_ARMHOLE_CONTOURS',
    headTotalHypothesisMm:2*halfSleeveHead.totalMm,
    armscyeFrontMm:front.totalMm,
    armscyeBackMm:back.totalMm,
    armscyeTotalMm:front.totalMm+back.totalMm,
    excessTotalMm:2*halfSleeveHead.totalMm-front.totalMm-back.totalMm,
    excessFrontHalfMm:halfSleeveHead.totalMm-front.totalMm,
    excessBackHalfMm:halfSleeveHead.totalMm-back.totalMm,
    stitchLineStatus:'NOT_IDENTIFIED',
    approvedTargetMm:null,approvedToleranceMm:null,
    frontNotch:null,backNotch:null,upperZoneMm:null,lowerFrontZoneMm:null,lowerBackZoneMm:null,
    designIntent:'UNDEFINED',distribution:'UNDEFINED',
    releaseStatus:'GEOMETRIC_FACT_NOT_ASSEMBLY_APPROVAL'
  },
  halfToFull:{representation:'HALF_SLEEVE_DIAGRAM',centreGuideId:'SLEEVE:E08',hypothesis:'MIRROR_ABOUT_0_TO_2_NOT_APPROVED',fullHeadIfMirroredMm:2*halfSleeveHead.totalMm,remark:'O desenho executado representa a meia manga. Duplicar por espelhamento sobre 0–2 só fornece hipótese matemática; não identifica qual metade encontra frente/costas e não define piques, folga, margens, dobra ou costura.'},
  matchCandidates:[{sleeveEndpoint:'SLEEVE:3',bodyEndpoint:'FRONT:5',kind:'GEOMETRIC_REGISTRATION_NOT_NOTCH',approved:false},{sleeveEndpoint:'SLEEVE:3',bodyEndpoint:'BACK:5',kind:'GEOMETRIC_REGISTRATION_NOT_NOTCH',approved:false},{sleeveEndpoint:'SLEEVE:0',bodyEndpoint:'FRONT:17',kind:'GEOMETRIC_REGISTRATION_NOT_NOTCH',approved:false},{sleeveEndpoint:'SLEEVE:0',bodyEndpoint:'BACK:17',kind:'GEOMETRIC_REGISTRATION_NOT_NOTCH',approved:false}],
  classifications:[
   {item:'Body armhole reference points 17,12,5',class:'SOURCE_DERIVED',basis:'Aldrich5 PDF p36: instrução de curva por 17,12,5'},
   {item:'Sleeve diagonal 3→0, divisions 5–8, hollow 7.5mm and raise 15mm',class:'SOURCE_DERIVED',basis:'Aldrich5 PDF p36 with diagram p38; actual offset direction captured in geometric decision'},
   {item:'Bezier armhole geometry',class:'TECHNICAL_DECISION_PENDING',basis:'ARMHOLE_INTERPOLATION@1.0.0: front and back share identical control points'},
   {item:'Bezier half-sleeve geometry',class:'TECHNICAL_DECISION_PENDING',basis:'SLEEVE_HEAD_INTERPOLATION@1.0.2; derived 3D instruction converted to C1 cubic handles'},
   {item:'Numeric arc length and algebraic differences',class:'GEOMETRY_CALCULATION',basis:'cubicLength() in geometry.ts, mm units, independently reference-testable'},
   {item:'Observed geometric excess, under mirrored-half hypothesis',class:'GEOMETRY_CALCULATION',basis:'2 × meia cabeça − (cava frente + cava costas); contour roles UNCLASSIFIED; not approved seamline ease'},
   {item:'Easing distribution, pitch notches and desired assembly target',class:'TECHNICAL_DECISION_PENDING',basis:'No stitch-line mapping, ease target, zones, notches, seam pair or flat-sleeve assembly method yet approved'},
   {item:'Sleeve end registration 3↔5 and 0↔17',class:'TECHNICAL_DECISION_PENDING',basis:'Graphical anchor comparison only; no approved seam mapping or notch'},
   {item:'Full cap as mirrored halves',class:'TECHNICAL_DECISION_PENDING',basis:'Mathematical doubling about construction centre 0→2, NOT yet a garment instruction'}
  ],release:project.release
 };
}

// Rigid transformations only (rotation + translation). No scaling or fitting.
const rad=(p:Vec2,q:Vec2)=>Math.atan2(q.y-p.y,q.x-p.x);
const transform=(reference:Vec2,tip:Vec2,displayUnderarm:Vec2)=>(pt:Vec2):Vec2=>{
 const alpha=-Math.PI/2-rad(reference,tip),dx=pt.x-reference.x,dy=pt.y-reference.y;
 return {x:displayUnderarm.x+dx*Math.cos(alpha)-dy*Math.sin(alpha),y:displayUnderarm.y+dx*Math.sin(alpha)+dy*Math.cos(alpha)};
};
const fixed=(n:number)=>Number(n.toFixed(4)).toString();
const xml=(str:string)=>str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function pathOf(piece:ShirtPiece,chain:MeasuredChain,map:(p:Vec2)=>Vec2):string{
 return chain.segments.map(seg=>{
  const edge=piece.edges.find(x=>x.id===seg.edgeId)!;
  const source=[point(piece,seg.to.slice(piece.id.length+1)),...edge.controlsMm!,point(piece,seg.from.slice(piece.id.length+1))] as CubicControls;
  const cubic=reverseCubic(source).map(map);
  return `M ${fixed(cubic[0].x)} ${fixed(cubic[0].y)} C ${fixed(cubic[1].x)} ${fixed(cubic[1].y)} ${fixed(cubic[2].x)} ${fixed(cubic[2].y)} ${fixed(cubic[3].x)} ${fixed(cubic[3].y)}`;
 }).join(' ');
}
export function exportCavaMangaOverlaySvg(raw:ShirtProject):string{
 const p=validateShirtProject(raw),r=compareShirtArmholesToHalfSleeve(p);
 const f=pieceOf(p,'FRONT'),b=pieceOf(p,'BACK'),s=pieceOf(p,'SLEEVE');
 const base={x:245,y:426};
 const tf=transform(point(f,'5'),point(f,'17'),base);
 const tb=transform(point(b,'5'),point(b,'17'),base);
 const ts=transform(point(s,'3'),point(s,'0'),base);
 const n=(v:number)=>v.toFixed(3);
 const marker=(at:Vec2,label:string,color:string,dx=7,dy=-5)=>`<circle cx="${fixed(at.x)}" cy="${fixed(at.y)}" r="2" fill="${color}"/><text x="${fixed(at.x+dx)}" y="${fixed(at.y+dy)}" font-size="5.7" fill="${color}">${xml(label)}</text>`;
 const armF=pathOf(f,r.front,tf),armB=pathOf(b,r.back,tb),cap=pathOf(s,r.halfSleeveHead,ts);
 const matched=marker(base,'F/B:5 ≈ S:3 (registro de origem; não pique)','#1b283b',7,17);
 const labels=[matched,marker(tf(point(f,'12')),'F/B:12','#21669b',10,-1),marker(tf(point(f,'17')),'F/B:17','#21669b',10,-5),marker(ts(point(s,'0')),'S:0','#0a745e',12,-6),marker(ts(point(s,'6')),'S:6','#0a745e',11,-3),marker(ts(point(s,'HEAD_HOLLOW_5')),'S:H5','#0a745e',9,-2),marker(ts(point(s,'HEAD_RAISE_78')),'S:R78','#0a745e',13,3)];
 const sourceFifths=['5','6','7','8'].map(k=>{const pos=ts(point(s,k));return `<circle cx="${fixed(pos.x)}" cy="${fixed(pos.y)}" r="1.3" fill="#65758a"/><text x="${fixed(pos.x-12)}" y="${fixed(pos.y+3)}" font-size="4.5" fill="#65758a">${k}</text>`}).join('');
 const tableRows=[
  ['Cava frente 5→12→17',r.front.totalMm],
  ['Cava costas 5→12→17',r.back.totalMm],
  ['TOTAL das cavas',r.geometricExcess.armscyeTotalMm],
  ['Meia cabeça 3→0',r.halfSleeveHead.totalMm],
  ['Cabeça 2× (hipótese)',r.geometricExcess.headTotalHypothesisMm],
  ['EXCEDENTE geométrico',r.geometricExcess.excessTotalMm],
  ['Δ meia cabeça − frente',r.geometricExcess.excessFrontHalfMm],
  ['Δ meia cabeça − costas',r.geometricExcess.excessBackHalfMm],
  ['Acréscimo à diagonal fonte',r.construction.sourceAddedToDiagonalMm]
 ];
 const table=tableRows.map(([label,value],i)=>`<text x="535" y="${143+i*23}" font-size="8.2" fill="#203549">${xml(String(label))}</text><text x="855" y="${143+i*23}" font-size="9" text-anchor="end" font-weight="600" fill="#203549">${n(Number(value))} mm</text>`).join('');
 const refs=r.halfSleeveHead.segments.map((edge,i)=>`<text x="535" y="${362+i*17}" font-size="7.2" fill="#285b52">${xml(edge.edgeId)} ${xml(edge.from.split(':')[1])}→${xml(edge.to.split(':')[1])}: ${n(edge.lengthMm)} mm</text>`).join('');
 return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="910mm" height="520mm" viewBox="0 0 910 520" data-geometric-excess-mm="${n(r.geometricExcess.excessTotalMm)}" role="img" aria-label="Comparação diagnóstica de cavas e cabeça da meia manga, em milímetros, sem escala física verificada"><title>MI-001 — comparação cava e meia cabeça | ${xml(p.method.version)}</title><desc>SVG com sobreposição por registro de origem e rotação rígida, SEM escala alterada; áreas F/B coincidem exatamente por decisão provisória. DRAFT NO CUT. NO SEAM PAIR. physical NOT_RUN. Veredito INDEFINITE.</desc><rect width="910" height="520" fill="#fff"/><text x="25" y="24" font-size="16" font-weight="700" fill="#17365b">MI-001 | CAVA × MEIA CABEÇA — ${r.verdict}</text><text x="25" y="39" font-size="8" fill="#ab2435">DRAFT · PROVISÓRIO · NÃO CORTAR · escala física NOT_RUN · método ${xml(p.method.version)} · revisão ${p.revision}</text><line x1="475" x2="475" y1="55" y2="485" stroke="#ced8e2" stroke-width=".4"/><text x="25" y="58" font-size="8.2" fill="#244560">SOBREPOSIÇÃO RÍGIDA — mesma escala em mm, sem deformação</text><text x="25" y="70" font-size="6.6" fill="#526777">Coincide S:3 com F/B:5; rotações independentes alinham cordas verticalmente.</text>
<path d="M ${fixed(base.x)} ${fixed(base.y)} L ${fixed(tf(point(f,'17')).x)} ${fixed(tf(point(f,'17')).y)}" fill="none" stroke="#a8b3c2" stroke-width=".45" stroke-dasharray="4,4"/>
<path d="M ${fixed(base.x)} ${fixed(base.y)} L ${fixed(ts(point(s,'0')).x)} ${fixed(ts(point(s,'0')).y)}" fill="none" stroke="#6a938a" stroke-width=".45" stroke-dasharray="3,4"/>
<path id="front-armhole" data-edges="FRONT:E04 FRONT:E03" d="${armF}" fill="none" stroke="#2c7fb8" stroke-width="1.8"/>
<path id="back-armhole" data-edges="BACK:E04 BACK:E03" d="${armB}" fill="none" stroke="#dd8a21" stroke-width="1.1" stroke-dasharray="3,2"/>
<path id="half-sleeve-head" data-edges="SLEEVE:E04 SLEEVE:E03 SLEEVE:E02 SLEEVE:E01" d="${cap}" fill="none" stroke="#0d8c73" stroke-width="2.0"/>
${sourceFifths}${labels.join('')}
<rect x="18" y="83" width="315" height="365" fill="none" stroke="#d9e0e8" stroke-width=".45" rx="5"/>
<text x="25" y="466" font-size="7.4" fill="#2c7fb8">━━ Frente: 5→12→17</text><text x="25" y="479" font-size="7.4" fill="#dd8a21">┄┄ Costas: 5→12→17 (mesma geometria da frente)</text><text x="25" y="492" font-size="7.4" fill="#0d8c73">━━ Manga: 3→H5→6→R78→0 (meia cabeça)</text>
<text x="535" y="75" font-size="11" font-weight="700" fill="#1b3554">COMPRIMENTOS DIAGNÓSTICOS</text><text x="535" y="91" font-size="7" fill="#526777">Origem: Aldrich p.36/p.38; curvas propostas v1.0.0/v1.0.2</text><text x="535" y="106" font-size="7" fill="#526777">Excedente geométrico ≠ folga de costura aprovada.</text>${table}
<text x="535" y="345" font-size="9" font-weight="700" fill="#1b3554">TRECHOS INDIVIDUAIS DA MEIA CABEÇA</text>${refs}
<text x="535" y="449" font-size="8.2" font-weight="700" fill="#b53e32">VEREDITO: INDEFINITE</text><text x="535" y="464" font-size="6.7" fill="#4b5f74">Excedente medido; costura, piques, zonas indefinidos.</text><text x="535" y="477" font-size="6.7" fill="#4b5f74">Espelhar/dobrar a meia manga é hipótese, não prova.</text><text x="535" y="490" font-size="6.7" fill="#4b5f74">Nenhum contorno, margem ou tolerância alterados.</text><text x="25" y="511" font-size="6.5" fill="#5d6f80">Pontos de registro = hipótese visual, NÃO são pontos de encaixe/costura aprovados. SVG mm NOMINAL. ${xml(p.projectId)}</text></svg>\n`;
}
