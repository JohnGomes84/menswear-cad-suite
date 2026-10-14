/** MI-002: original, OWNER-SPECIFIED short diagnostic candidate. NOT an Aldrich drafting method.
 * No implicit ease, margins, stitch/cut classification, or fit approval.
 * Core points are executed by the shared metric drafting interpreter.
 */
import {executeDraftProgram as interpretDraft} from './draftingInterpreter';
import type {DraftProgram,DraftInstruction,SourceTrace} from './draftingInterpreter';
import {cubicLength} from './geometry';
import type {Vec2} from './domain';
export const SHORT_METHOD='MI002-ELASTIC-BOXER' as const;
export const SHORT_VERSION='research-0.1.0' as const;
export const SHORT_FORMAT='menswear-mi002-short/0.1.0' as const;
export const SHORT_KEYS=['waist','hip','total_length','front_rise','back_rise','inseam','hem_width','elastic_width'] as const;
export type ShortKey=typeof SHORT_KEYS[number];
export const SHORT_LABELS:Record<ShortKey,string>={
 waist:'Cintura',hip:'Quadril',total_length:'Comprimento total',
 front_rise:'Gancho frontal',back_rise:'Gancho traseiro',inseam:'Entreperna',
 hem_width:'Largura da barra (por painel)',elastic_width:'Largura do elástico'};
export type Semantic='CONSTRUCTION_LINE'|'SEAM_LINE'|'FOLD_LINE'|'CUT_LINE'|'UNCLASSIFIED';
export type Origin='OWNER_SPECIFICATION'|'DERIVED_GEOMETRY'|'TECHNICAL_DECISION';
export type ClassOrigin='SOURCE_EXPLICIT'|'SOURCE_INFERRED'|'TECHNICAL_DECISION'|'PENDING_OWNER_DECISION';
export type Review='DRAFT'|'PENDING_OWNER_DECISION';
export type ShortPoint={id:string;positionMm:Vec2;origin:Origin;solution:string;role:'CONSTRUCTION'|'UNCLASSIFIED';review:Review;classificationOrigin:ClassOrigin;evidence:string;dependsOn:ShortKey[]};
export type ShortEdge={id:string;from:string;to:string;kind:'LINE'|'CUBIC_BEZIER';controlsMm?:[Vec2,Vec2];origin:Origin;solution:string;role:'CONSTRUCTION'|'UNCLASSIFIED';classification:Semantic;classificationOrigin:ClassOrigin;review:Review;evidence:string;dependsOn:ShortKey[];allowanceMm:null}; 
export type ShortPiece={id:'FRONT'|'BACK';points:ShortPoint[];edges:ShortEdge[];review:'DRAFT'};
export type AllowanceProposal={proposedMm:number|null;approval:'PENDING_OWNER_DECISION'};
export type ShortProject={
 format:typeof SHORT_FORMAT;projectId:string;method:{id:typeof SHORT_METHOD;version:typeof SHORT_VERSION;authority:'OWNER_SPECIFICATION_TECHNICAL_CANDIDATE';externalMethod:null};revision:number;
 purpose:'DIAGNOSTIC_ONLY';warning:'DRAFT / NO CUT / PROVISIONAL GEOMETRY';unit:'mm';measurements:Record<ShortKey,number>;pieces:ShortPiece[];
 edgeAllowances:Record<string,AllowanceProposal>;decisions:{id:string;source:'OWNER_SPECIFICATION'|'TECHNICAL_DECISION';status:'PENDING_OWNER_DECISION';description:string}[];
 release:{cutReady:false;scalePhysical:'NOT_RUN';assembly:'NOT_RUN';fit:'NOT_RUN'};};
export const sampleShortMeasurements=():Record<ShortKey,number>=>({
 waist:900,hip:1020,total_length:420,front_rise:300,back_rise:310,inseam:120,hem_width:310,elastic_width:35
});
const copy=<T,>(v:T):T=>JSON.parse(JSON.stringify(v)) as T;
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const close=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const source=(description:string):SourceTrace=>({sourceId:'MI002-OWNER-BRIEF-2026-10-14',chapter:0,pdfPage:0,instruction:description,interpretation:'TEXT'});
const lit=(value:number)=>({op:'LITERAL_MM',value} as const);
const m=(name:ShortKey)=>({op:'MEASURE_MM',name} as const);
const q=(key:ShortKey,n:number)=>({op:'MULTIPLY',value:m(key),factor:n} as const);
const decisions=()=>[
 {id:'PANEL_QUARTERS',source:'TECHNICAL_DECISION' as const,status:'PENDING_OWNER_DECISION' as const,description:'Each panel waist/hip reference = circumference / 4, WITHOUT ease. Not fit validated.'},
 {id:'CROTCH_EXTENSIONS',source:'TECHNICAL_DECISION' as const,status:'PENDING_OWNER_DECISION' as const,description:'Candidate front/back crotch extensions = max(0,hip-waist)/8 and /4. Not sourced from any sewing method.'},
 {id:'HIP_HEIGHT',source:'TECHNICAL_DECISION' as const,status:'PENDING_OWNER_DECISION' as const,description:'Hip construction guide at half the lesser front/back rise; no industrial standard asserted.'},
 {id:'INSEAM_SOLVE',source:'TECHNICAL_DECISION' as const,status:'PENDING_OWNER_DECISION' as const,description:'Horizontal displacement solved from input inseam via Pythagorean geometry. Impossible inputs are rejected.'},
 {id:'CROTCH_BEZIER',source:'TECHNICAL_DECISION' as const,status:'PENDING_OWNER_DECISION' as const,description:'Candidate crotch cubic from waist centre to front/back crotch; handles are explicitly provisional.'},
 {id:'WAIST_ELASTIC_GUIDE',source:'OWNER_SPECIFICATION' as const,status:'PENDING_OWNER_DECISION' as const,description:'Elastic width creates construction guide only; no allowance, fold, channel or fastening approved.'}
 ];
function validateMeasurements(ms:Record<ShortKey,number>){
 if(!ms||Object.keys(ms).length!==8||!SHORT_KEYS.every(k=>finite(ms[k])&&ms[k]>0))throw new RangeError('MI002_MEASURE_INVALID');
 const maxRise=Math.max(ms.front_rise,ms.back_rise);
 if(ms.total_length<=maxRise||ms.elastic_width>=Math.min(ms.front_rise,ms.back_rise)/2)
  throw new RangeError('MI002_RISE_OR_ELASTIC_OUTSIDE_LENGTH');
 for(const k of ['front_rise','back_rise'] as const){
  if(ms.inseam<ms.total_length-ms[k]-1e-7)throw new RangeError('MI002_INSEAM_INCOMPATIBLE: '+k);
 }
}
function pieceProgram(id:'FRONT'|'BACK',ms:Record<ShortKey,number>,rise:number,extension:number,dx:number):DraftProgram{
 const hipDepth=Math.min(ms.front_rise,ms.back_rise)/2;
 const ins:DraftInstruction[]=[
  {op:'ORIGIN',stepId:'W0',pointId:'W0',xMm:0,yMm:0,source:source('Waist centre candidate')},
  {op:'OFFSET',stepId:'W1',pointId:'W1',from:'W0',direction:'RIGHT',lengthMm:q('waist',.25),source:source('Quarter waist: technical, no ease')},
  {op:'OFFSET',stepId:'H0',pointId:'H0',from:'W0',direction:'DOWN',lengthMm:lit(hipDepth),source:source('Technical hip reference height')},
  {op:'OFFSET',stepId:'HX',pointId:'HX',from:'W0',direction:'RIGHT',lengthMm:q('hip',.25),source:source('Quarter hip: technical, no ease')},
  {op:'PROJECT_AXES',stepId:'H1',pointId:'H1',xFrom:'HX',yFrom:'H0',source:source('Project hip guide')},
  {op:'ORIGIN',stepId:'R0',pointId:'R0',xMm:-extension,yMm:rise,source:source('Technical crotch tip from entered rise')},
  {op:'ORIGIN',stepId:'B0',pointId:'B0',xMm:-extension+dx,yMm:ms.total_length,source:source('Hem-in point chosen so inseam length matches input')},
  {op:'OFFSET',stepId:'B1',pointId:'B1',from:'B0',direction:'RIGHT',lengthMm:m('hem_width'),source:source('Entered hem panel width exactly')},
  {op:'OFFSET',stepId:'G0',pointId:'G0',from:'W0',direction:'DOWN',lengthMm:m('elastic_width'),source:source('Elastic-width guide, not casing/fold')},
  {op:'ORIGIN',stepId:'G1',pointId:'G1',xMm:ms.waist/4+(ms.hip/4-ms.waist/4)*ms.elastic_width/hipDepth,yMm:ms.elastic_width,source:source('Elastic guide interpolation, not industrial fold')}
 ];
 return {programId:'MI002-'+id+'-OWNER-CANDIDATE',purpose:'RESEARCH_ONLY',unit:'mm',sourceBook:'USER_PRODUCT_SPECIFICATION_NO_EXTERNAL_METHOD',instructions:ins};
}
function draftPiece(id:'FRONT'|'BACK',ms:Record<ShortKey,number>):ShortPiece{
 const rise=ms[id==='FRONT'?'front_rise':'back_rise'];
 const extension=Math.max(0,ms.hip-ms.waist)/(id==='FRONT'?8:4);
 const dy=ms.total_length-rise,dx=Math.sqrt(Math.max(0,ms.inseam**2-dy**2));
 const interpreted=interpretDraft(pieceProgram(id,ms,rise,extension,dx),ms);
 const pts=interpreted.pointsMm;
 const point=(name:string):ShortPoint=>({
  id:id+':'+name,positionMm:pts[name],origin:['W0','W1','B1','G0'].includes(name)?'DERIVED_GEOMETRY':'TECHNICAL_DECISION',
  solution:'MI002-CANDIDATE@research-0.1.0',role:'CONSTRUCTION',review:'PENDING_OWNER_DECISION',
  classificationOrigin:'TECHNICAL_DECISION',evidence:interpreted.trace.find(t=>t.pointId===name)?.source.instruction??'USER_SPECIFICATION',
  dependsOn:[...SHORT_KEYS]});
 const points=interpreted.trace.filter(t=>t.pointId!=='HX').map(t=>point(t.pointId));
 const edges:ShortEdge[]=[];
 const add=(n:number,from:string,to:string,classification:'CONSTRUCTION_LINE'|'UNCLASSIFIED',role:'CONSTRUCTION'|'UNCLASSIFIED',details:string,controls?:[Vec2,Vec2])=>{
  edges.push({id:id+':E'+String(n).padStart(2,'0'),from:id+':'+from,to:id+':'+to,
   kind:controls?'CUBIC_BEZIER':'LINE',controlsMm:controls,origin:classification==='CONSTRUCTION_LINE'?'DERIVED_GEOMETRY':'TECHNICAL_DECISION',
   solution:'MI002-CANDIDATE@research-0.1.0',role,classification,
   classificationOrigin:classification==='CONSTRUCTION_LINE'?'SOURCE_INFERRED':'PENDING_OWNER_DECISION',
   review:'PENDING_OWNER_DECISION',evidence:details,dependsOn:[...SHORT_KEYS],allowanceMm:null});
 };
 add(1,'W0','W1','UNCLASSIFIED','UNCLASSIFIED','Top waist line, elastic on upper edge; no seam/cut');
 add(2,'W1','H1','UNCLASSIFIED','UNCLASSIFIED','Upper side, straight diagnostic candidate');
 add(3,'H1','B1','UNCLASSIFIED','UNCLASSIFIED','Lower side, straight diagnostic candidate');
 add(4,'B1','B0','UNCLASSIFIED','UNCLASSIFIED','Straight bottom, entered panel hem width');
 add(5,'B0','R0','UNCLASSIFIED','UNCLASSIFIED','Straight inseam solved exactly from user value');
 add(6,'R0','W0','UNCLASSIFIED','UNCLASSIFIED','Provisional crotch curve, not a seam or cutting line',
  [{x:-extension,y:rise*.64},{x:0,y:rise*.32}]);
 add(7,'G0','G1','CONSTRUCTION_LINE','CONSTRUCTION','Elastic width reference only, no approved fold/casing');
 add(8,'H0','H1','CONSTRUCTION_LINE','CONSTRUCTION','Hip construction guide only');
 add(9,'W0','H0','CONSTRUCTION_LINE','CONSTRUCTION','Centre construction guide only');
 return {id,points,edges,review:'DRAFT'};
}
const build=(ms:Record<ShortKey,number>):ShortPiece[]=>[draftPiece('FRONT',ms),draftPiece('BACK',ms)];
const marginMap=(pieces:ShortPiece[])=>Object.fromEntries(pieces.flatMap(p=>p.edges.map(e=>[e.id,{proposedMm:null,approval:'PENDING_OWNER_DECISION' as const}])));
export function createShortProject(measurements=sampleShortMeasurements(),projectId='mi002-elastic-boxer-experimental-001'):ShortProject{
 if(!/^[a-z0-9][a-z0-9-]{1,79}$/.test(projectId))throw Error('MI002_PROJECT_ID_INVALID');
 const ms=copy(measurements);validateMeasurements(ms);const pieces=build(ms);
 return {format:SHORT_FORMAT,projectId,method:{id:SHORT_METHOD,version:SHORT_VERSION,authority:'OWNER_SPECIFICATION_TECHNICAL_CANDIDATE',externalMethod:null},
  revision:0,purpose:'DIAGNOSTIC_ONLY',warning:'DRAFT / NO CUT / PROVISIONAL GEOMETRY',unit:'mm',measurements:ms,pieces,
  edgeAllowances:marginMap(pieces),decisions:decisions(),release:{cutReady:false,scalePhysical:'NOT_RUN',assembly:'NOT_RUN',fit:'NOT_RUN'}};
}
export function validateShortProject(input:unknown):ShortProject{
 if(!input||typeof input!=='object')throw Error('MI002_PROJECT_INVALID');
 const p=input as ShortProject;
 if(p.format!==SHORT_FORMAT||p.method?.id!==SHORT_METHOD||p.method.version!==SHORT_VERSION||
  p.method.authority!=='OWNER_SPECIFICATION_TECHNICAL_CANDIDATE'||p.method.externalMethod!==null||
  p.unit!=='mm'||p.purpose!=='DIAGNOSTIC_ONLY'||p.warning!=='DRAFT / NO CUT / PROVISIONAL GEOMETRY')
  throw Error('MI002_METHOD_OR_STATE_INVALID');
 if(!/^[a-z0-9][a-z0-9-]{1,79}$/.test(p.projectId)||!Number.isSafeInteger(p.revision)||p.revision<0)throw Error('MI002_ID_OR_REVISION_INVALID');
 validateMeasurements(p.measurements);
 if(!close(p.pieces,build(p.measurements))||!close(p.decisions,decisions()))throw Error('MI002_GEOMETRY_OR_DECISIONS_ALTERED');
 if(!close(p.release,{cutReady:false,scalePhysical:'NOT_RUN',assembly:'NOT_RUN',fit:'NOT_RUN'}))throw Error('MI002_RELEASE_NOT_ALLOWED');
 const ids=p.pieces.flatMap(x=>x.edges.map(e=>e.id));
 if(!p.edgeAllowances||Object.keys(p.edgeAllowances).length!==ids.length||
  !ids.every(id=>{const a=p.edgeAllowances[id];return a?.approval==='PENDING_OWNER_DECISION'&&
   (a.proposedMm===null||(finite(a.proposedMm)&&a.proposedMm>=0))&&Object.keys(a).length===2;}))
  throw Error('MI002_ALLOWANCE_CONTRACT_INVALID');
 return copy(p);
}
export function changeShortMeasure(raw:ShortProject,key:ShortKey,valueMm:number):ShortProject{
 const p=validateShortProject(raw);
 if(!SHORT_KEYS.includes(key)||!finite(valueMm)||valueMm<=0)throw Error('MI002_INPUT_INVALID');
 if(p.measurements[key]===valueMm)return p;
 const next=createShortProject({...p.measurements,[key]:valueMm},p.projectId);
 next.revision=p.revision+1;
 next.edgeAllowances=copy(p.edgeAllowances);
 return validateShortProject(next);
}
export function proposeShortAllowance(raw:ShortProject,edgeId:string,valueMm:number|null):ShortProject{
 const p=validateShortProject(raw);if(!(edgeId in p.edgeAllowances))throw Error('MI002_EDGE_UNKNOWN');
 if(valueMm!==null&&(!finite(valueMm)||valueMm<0))throw Error('MI002_ALLOWANCE_INVALID');
 p.edgeAllowances[edgeId]={proposedMm:valueMm,approval:'PENDING_OWNER_DECISION'};
 // Does not offset a path, generate cutting geometry or approve a margin.
 return validateShortProject(p);
}
export const saveShortProject=(p:ShortProject)=>JSON.stringify(validateShortProject(p),null,2)+'\n';
export const loadShortProject=(s:string)=>{if(s.length>2_000_000)throw Error('MI002_JSON_TOO_LARGE');return validateShortProject(JSON.parse(s));};
const pById=(piece:ShortPiece,id:string)=>{const pt=piece.points.find(x=>x.id===id);if(!pt)throw Error('MI002_POINT_MISSING '+id);return pt.positionMm;};
export function edgeLengthMm(piece:ShortPiece,edge:ShortEdge):number{
 const a=pById(piece,edge.from),b=pById(piece,edge.to);
 return edge.controlsMm?cubicLength([a,...edge.controlsMm,b]):Math.hypot(b.x-a.x,b.y-a.y);
}
export function shortDiagnostic(raw:ShortProject){
 const p=validateShortProject(raw);
 return {method:p.method,revision:p.revision,unit:'mm',release:p.release,
  warning:'GEOMETRY ONLY; seam/cut/fold identities and margins PENDING_OWNER_DECISION',
  pieces:p.pieces.map(piece=>{
   const ids=['E01','E02','E03','E04','E05','E06'];
   const values=Object.fromEntries(ids.map(s=>[s,edgeLengthMm(piece,piece.edges.find(e=>e.id.endsWith(s))!)]));
   return {id:piece.id,waistMm:values.E01,sideMm:values.E02+values.E03,
    inseamMm:values.E05,crotchMm:values.E06,hemMm:values.E04,
    allEdges:piece.edges.map(e=>({id:e.id,from:e.from,to:e.to,lengthMm:edgeLengthMm(piece,e),
     classification:e.classification,classificationOrigin:e.classificationOrigin,allowance:p.edgeAllowances[e.id]}))};
  })};
}
