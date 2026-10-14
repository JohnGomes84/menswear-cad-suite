/** MI-001 Flat Shirt Core — draft project, NOT a cutting pattern.
 * Uses the existing source-traced interpreter. All invented interpolation/closure
 * is versioned as a TECHNICAL_DECISION, never a textual instruction of Aldrich.
 */
import { executeDraftProgram, measure, mm, minus, plus, times } from './draftingInterpreter';
import type { DraftInstruction, DraftProgram, SourceTrace, ScalarExpr } from './draftingInterpreter';
import type { Vec2 } from './domain';

export const SHIRT_METHOD='ALD-FLAT-SHIRT-CORE' as const;
export const SHIRT_VERSION='research-0.1.1' as const;
export const SHIRT_FORMAT='menswear-garment-project/0.1.0' as const;
export type ShirtMeasureKey='chest'|'scye_depth'|'back_neck_to_waist'|'neck_size'|'half_back'|'garment_length'|'one_piece_sleeve_length'|'close_wrist';
export const SHIRT_KEYS: readonly ShirtMeasureKey[]=['chest','scye_depth','back_neck_to_waist','neck_size','half_back','garment_length','one_piece_sleeve_length','close_wrist'];
export type Measurement={valueMm:number;displayUnit:'cm';origin:'BOOK_SIZE_EXAMPLE'|'USER_INPUT';source:'Aldrich5-p35'|'USER';};
export type MeasureSet=Record<ShirtMeasureKey,Measurement>;
export type EdgeOrigin='SOURCE_LINE'|'DERIVED_LINE'|'TECHNICAL_DECISION';
export type EdgeRole='CONSTRUCTION'|'SEAM'|'CUT'|'FOLD'|'MARK'|'UNCLASSIFIED';
export type Review={state:'RESEARCH'|'DRAFT'|'GEOMETRY_REVIEWED';evidence:string[];reviewer?:string};
export type ShirtPoint={id:string;positionMm:Vec2;dependsOn:string[];origin:'SOURCE_INSTRUCTION'|'DERIVED_CONSTRUCTION'|'TECHNICAL_DECISION';solution:string;source:string;role:'CONSTRUCTION'|'UNCLASSIFIED';review:Review};
export type ShirtEdge={id:string;from:string;to:string;kind:'LINE'|'CUBIC_BEZIER';controlsMm?:[Vec2,Vec2];origin:EdgeOrigin;solution:string;source:string;role:EdgeRole;review:Review;dependsOn:string[]};
export type ShirtPiece={id:'FRONT'|'BACK'|'SLEEVE';points:ShirtPoint[];edges:ShirtEdge[];status:'EXPERIMENTAL_CONTOUR_ONLY'};
export type TechDecision={id:string;version:string;status:'PROVISIONAL';description:string;sourceBasis:string};
export type Evidence={id:string;state:'PENDING'|'REVIEWED'|'STALE';evidenceRef:string|null;dependsOn:{measurements:ShirtMeasureKey[];decisions:string[];exportConfig:boolean};evaluatedRevision:number|null;basisFingerprint:string|null};
export type ShirtProject={format:typeof SHIRT_FORMAT;projectId:string;method:{id:typeof SHIRT_METHOD;version:typeof SHIRT_VERSION;book:'Aldrich5';pdfPages:number[]};unit:'mm';measurements:MeasureSet;decisions:TechDecision[];revision:number;pieces:ShirtPiece[];evidence:Evidence[];release:{cutReady:false;scalePhysical:'NOT_RUN';assembly:'NOT_RUN';fit:'NOT_RUN'};};
const decisionList:TechDecision[]=[
 {id:'BODY_SPLIT',version:'1.0.0',status:'PROVISIONAL',description:'Treat the common body block as two independent front/back diagnostic shapes, retaining different neck curves.',sourceBasis:'PDF p38 common body schematic; separation not uniquely specified'},
 {id:'NECK_INTERPOLATION',version:'1.0.0',status:'PROVISIONAL',description:'Choose editable cubic Bezier handles for the front and back neckline.',sourceBasis:'PDF p35-36 order neck curve, no handle coordinates'},
 {id:'ARMHOLE_INTERPOLATION',version:'1.0.0',status:'PROVISIONAL',description:'Two cubic segments pass through points 17,12,5. Handles remain technical proposals.',sourceBasis:'PDF p36 armhole through 17,12,5'},
 {id:'SLEEVE_HEAD_INTERPOLATION',version:'1.0.1',status:'PROVISIONAL',description:'Versioned cubic proposal: 7.5mm at section 5, raised interpolation between 7 and 8. Chosen direction and tangencies require review.',sourceBasis:'PDF p36 and diagram p38; interpolation/offset direction need review'},
 {id:'SLEEVE_DIAGONAL_PROJECTION',version:'1.0.0',status:'PROVISIONAL',description:'Derive horizontal offset of sleeve point 3 from 0-3 diagonal and the sleeve cap height by Pythagoras.',sourceBasis:'PDF p36 defines 0-3 length and 0-1 cap rise; p38 positions 3 on level 1'},
 {id:'CLOSURE_EXPERIMENT',version:'1.0.0',status:'PROVISIONAL',description:'Connect side, hem and centre into closed diagnostic polygons; industrial edge roles not assigned.',sourceBasis:'PDF p38 diagram, centre and no-hem callouts; not a cut boundary'}
];
const researchReview=():Review=>({state:'DRAFT',evidence:[]});
const clone=<T>(v:T):T=>JSON.parse(JSON.stringify(v)) as T;
const num=(v:number)=>Number.isFinite(v);
function checkMeasures(v:MeasureSet){
 if(!v||typeof v!=='object'||Object.keys(v).length!==SHIRT_KEYS.length)throw new RangeError('Conjunto de medidas inválido');
 for(const key of SHIRT_KEYS){const m=v[key];if(!m||!num(m.valueMm)||m.valueMm<=0||m.valueMm>2500||m.displayUnit!=='cm'|| !['BOOK_SIZE_EXAMPLE','USER_INPUT'].includes(m.origin)||!['Aldrich5-p35','USER'].includes(m.source))throw new RangeError('Medida inválida: '+key);}
 if(v.garment_length.valueMm<=v.scye_depth.valueMm+40)throw new RangeError('Comprimento da camisa incompatível com altura da cava');
}
const evidenceInit=():Evidence[]=>[
 {id:'BODY_GEOMETRY',state:'PENDING',evidenceRef:null,dependsOn:{measurements:['chest','scye_depth','back_neck_to_waist','neck_size','half_back','garment_length'],decisions:['BODY_SPLIT','NECK_INTERPOLATION','ARMHOLE_INTERPOLATION','CLOSURE_EXPERIMENT'],exportConfig:false},evaluatedRevision:null,basisFingerprint:null},
 {id:'SLEEVE_GEOMETRY',state:'PENDING',evidenceRef:null,dependsOn:{measurements:[...SHIRT_KEYS],decisions:['ARMHOLE_INTERPOLATION','SLEEVE_HEAD_INTERPOLATION'],exportConfig:false},evaluatedRevision:null,basisFingerprint:null},
 {id:'PRINT_CALIBRATION',state:'PENDING',evidenceRef:null,dependsOn:{measurements:[],decisions:[],exportConfig:true},evaluatedRevision:null,basisFingerprint:null}
];
const book='Metric Pattern Cutting for Menswear, 5th ed.';
const trace=(programId:string,page:number,description:string):SourceTrace=>({sourceId:programId,chapter:2,pdfPage:page,instruction:description,interpretation:'TEXT_AND_DIAGRAM'});
const bodyProgram=():DraftProgram=>{
 const id='ALD-FLAT-SHIRT-BODY-v1', ins:DraftInstruction[]=[];
 const o=(p:string,x:number,y:number,txt:string)=>ins.push({op:'ORIGIN',stepId:p,pointId:p,xMm:x,yMm:y,source:trace(id,35,txt)});
 const off=(p:string,from:string,direction:'LEFT'|'RIGHT'|'UP'|'DOWN',lengthMm:ReturnType<typeof mm>,txt:string,page=35)=>ins.push({op:'OFFSET',stepId:p,pointId:p,from,direction,lengthMm,source:trace(id,page,txt)});
 const proj=(p:string,xFrom:string,yFrom:string,txt:string)=>ins.push({op:'PROJECT_AXES',stepId:p,pointId:p,xFrom,yFrom,source:trace(id,35,txt)});
 o('0',0,0,'Square both ways from 0');off('1','0','DOWN',mm(30),'0-1=30mm');
 off('2','1','DOWN',plus(measure('scye_depth'),mm(40)),'1-2=scye depth+40');
 off('3','1','DOWN',measure('back_neck_to_waist'),'1-3=back neck to waist');
 off('4','1','DOWN',measure('garment_length'),'1-4=chosen shirt length (user style)');
 off('5','2','RIGHT',plus(times(measure('chest'),.25),mm(65)),'2-5=1/4 chest +65');
 proj('6','5','0','square up from 5');proj('7','5','3','square down from 5 to waist');proj('8','5','4','square down from 5 to hem');
 off('9','1','RIGHT',minus(times(measure('neck_size'),.2),mm(6)),'1-9=1/5 neck-6');
 off('10','9','UP',mm(30),'9-10=30 up');
 off('11','1','DOWN',times(plus(measure('scye_depth'),mm(40)),.5),'1-11=half 1-2');
 off('12','11','RIGHT',plus(measure('half_back'),mm(50)),'11-12=half back+50');
 proj('13','12','2','square down to scye line');proj('14','12','0','square up to top');
 off('15','1','DOWN',minus(times(measure('scye_depth'),.125),mm(3)),'1-15=1/8 scye depth-3');
 proj('16','12','15','square across to 16');off('17','16','RIGHT',mm(15),'16-17=15',36);
 off('18','1','DOWN',minus(times(measure('neck_size'),.2),mm(20)),'1-18=1/5 neck-20',36);
 return {programId:id,purpose:'RESEARCH_ONLY',unit:'mm',sourceBook:book,instructions:ins};
};
const sleeveProgram=():DraftProgram=>{
 const id='ALD-FLAT-SHIRT-SLEEVE-v1';const ins:DraftInstruction[]=[];
 const add=(p:string,x:DraftInstruction)=>ins.push(x);
 add('0',{op:'ORIGIN',stepId:'0',pointId:'0',xMm:0,yMm:0,source:trace(id,36,'Square down from 0')});
 const off=(p:string,from:string,direction:'LEFT'|'DOWN',lengthMm:ReturnType<typeof mm>,txt:string)=>add(p,{op:'OFFSET',stepId:p,pointId:p,from,direction,lengthMm,source:trace(id,36,txt)});
 off('1','0','DOWN',times(plus(measure('scye_depth'),mm(40)),1/3),'0-1=1/3 of body 1-2');
 off('2','0','DOWN',minus(measure('one_piece_sleeve_length'),mm(20)),'0-2=sleeve length-20');
 off('3','1','LEFT',measure('sleeve_horizontal_0_3'),'0-3 length body diagonal 5-17+30; horizontal offset calculated as technical derived projection');
 off('4','2','LEFT',plus(times(measure('close_wrist'),.5),mm(50)),'2-4=1/2 close wrist+50');
 return {programId:id,purpose:'RESEARCH_ONLY',unit:'mm',sourceBook:book,instructions:ins};
};
const cp=(a:Vec2,b:Vec2,t:number):Vec2=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const pnt=(id:string,positionMm:Vec2,origin:ShirtPoint['origin'],source:string,dependsOn:string[],solution:string):ShirtPoint=>({id,positionMm:{...positionMm},origin,source,solution,role:'CONSTRUCTION',review:researchReview(),dependsOn});
function generate(measurements:MeasureSet):ShirtPiece[]{
 checkMeasures(measurements);
 const m=Object.fromEntries(SHIRT_KEYS.map(k=>[k,measurements[k].valueMm]));
 const body=executeDraftProgram(bodyProgram(),m), b=body.pointsMm;
 const diagonal=Math.hypot(b['5'].x-b['17'].x,b['5'].y-b['17'].y);
 const height=(m.scye_depth+40)/3;
 const diagonal0to3=diagonal+30;
 if(diagonal0to3<=height)throw new RangeError('Cabeça da manga: diagonal inferior à altura');
 const horizontal=Math.sqrt(diagonal0to3**2-height**2);
 const sleeve=executeDraftProgram(sleeveProgram(),{...m,sleeve_horizontal_0_3:horizontal}),s=sleeve.pointsMm;
 const measureRefs=(expr:ScalarExpr):string[]=>{
  switch(expr.op){case 'MEASURE_MM':return [expr.name];case 'DISTANCE_MM':return [];case 'LITERAL_MM':return [];case 'MULTIPLY':return measureRefs(expr.value);case 'ADD':case 'SUBTRACT':return [...measureRefs(expr.a),...measureRefs(expr.b)];}
 };
 const sourceDeps=(id:string,kind:'BODY'|'SLEEVE')=>{
  const result=kind==='BODY'?body:sleeve;
  const t=result.trace.find(x=>x.pointId===id);
  const step=(kind==='BODY'?bodyProgram():sleeveProgram()).instructions.find(x=>x.pointId===id);
  const ms=step?.op==='OFFSET'?measureRefs(step.lengthMm):[];
  if(kind==='SLEEVE'&&id==='3')ms.push('chest','scye_depth','neck_size','half_back','BODY:5','BODY:17');
  return [...new Set([...(t?.usedPoints.map(x=>kind+':'+x)??[]),...ms.filter(x=>x!=='sleeve_horizontal_0_3')])];
 };
 const bodyPoints=(kind:'FRONT'|'BACK')=>[...body.trace.map(t=>pnt(kind+':'+t.pointId,t.positionMm,'SOURCE_INSTRUCTION',`Aldrich5-PDF${t.source.pdfPage}: ${t.source.instruction}`,sourceDeps(t.pointId,'BODY').map(x=>x.replace('BODY:',kind+':')),'BODY_INTERPRETER@research-0.1.0'))];
 const mkEdges=(piece:'FRONT'|'BACK'|'SLEEVE')=>{const edges:ShirtEdge[]=[];let n=0;
  const e=(from:string,to:string,origin:EdgeOrigin,solution:string,source:string,role:EdgeRole,dependsOn:string[],controlsMm?:[Vec2,Vec2])=>{edges.push({id:`${piece}:E${String(++n).padStart(2,'0')}`,from:`${piece}:${from}`,to:`${piece}:${to}`,kind:controlsMm?'CUBIC_BEZIER':'LINE',...(controlsMm?{controlsMm}:{}),origin,solution,source,role,review:researchReview(),dependsOn})};
  if(piece==='SLEEVE')return {edges,e};
  const start=piece==='FRONT'?'18':'1';const y=b[start].y;
  e(start,'10','TECHNICAL_DECISION','NECK_INTERPOLATION@1.0.0','Aldrich5 PDF pp35-36: neckline ordered; handles proposed','UNCLASSIFIED',['neck_size','NECK_INTERPOLATION'],[{x:b[start].x+25,y},{x:b['10'].x,y:b['10'].y+18}]);
  e('10','17','SOURCE_LINE','JOIN_10_17','Aldrich5 PDF p36: join 10-17','UNCLASSIFIED',['chest','neck_size','scye_depth','half_back']);
  e('17','12','TECHNICAL_DECISION','ARMHOLE_INTERPOLATION@1.0.0','Aldrich5 PDF p36: curve through 17,12,5; first span','UNCLASSIFIED',['scye_depth','half_back','ARMHOLE_INTERPOLATION'],[{x:b['17'].x+3,y:b['17'].y+25},{x:b['12'].x+1,y:b['12'].y-30}]);
  e('12','5','TECHNICAL_DECISION','ARMHOLE_INTERPOLATION@1.0.0','Aldrich5 PDF p36: curve through 17,12,5; second span','UNCLASSIFIED',['scye_depth','half_back','chest','ARMHOLE_INTERPOLATION'],[{x:b['12'].x,y:b['12'].y+75},{x:b['5'].x-48,y:b['5'].y-10}]);
  e('5','8','DERIVED_LINE','BODY_SIDE_GUIDE','Aldrich5 PDF p35: project 5 down to 8','UNCLASSIFIED',['chest','garment_length']);
  e('8','4','TECHNICAL_DECISION','CLOSURE_EXPERIMENT@1.0.0','Aldrich5 PDF p38: no hem allowance; diagnostic hem join','UNCLASSIFIED',['chest','garment_length','CLOSURE_EXPERIMENT']);
  e('4',start,'TECHNICAL_DECISION','CLOSURE_EXPERIMENT@1.0.0','Aldrich5 PDF p38: centre front and back; no assumed fold/cut','UNCLASSIFIED',['garment_length','neck_size','CLOSURE_EXPERIMENT']);
  return {edges,e};
 };
 const front:ShirtPiece={id:'FRONT',points:bodyPoints('FRONT'),edges:mkEdges('FRONT').edges,status:'EXPERIMENTAL_CONTOUR_ONLY'};
 const back:ShirtPiece={id:'BACK',points:bodyPoints('BACK'),edges:mkEdges('BACK').edges,status:'EXPERIMENTAL_CONTOUR_ONLY'};
 const spoints=[...sleeve.trace.map(t=>pnt('SLEEVE:'+t.pointId,t.positionMm,'SOURCE_INSTRUCTION',`Aldrich5-PDF36: ${t.source.instruction}`,sourceDeps(t.pointId,'SLEEVE'),t.pointId==='3'?'SLEEVE_DIAGONAL_PROJECTION@1.0.0':'SLEEVE_INTERPRETER@research-0.1.0'))];
 // Source requests fifth divisions, but the interpreter has no generic interpolation
 // operator. Record interpolation explicitly as TECHNICAL_DECISION, never as source formula.
 // Technical proposal: 7.5mm displacement at reference 5, not a source-defined cubic.
 const adj=[0,-7.5,-6,-7.5,-7.5,0];
 for(let i=1;i<=4;i++){const at=cp(s['3'],s['0'],i/5);at.y+=adj[i];spoints.push(pnt('SLEEVE:'+String(i+4),at,'TECHNICAL_DECISION','Aldrich5 PDF p36: fifth points; sleeve head offsets provisional',['SLEEVE:0','SLEEVE:3','SLEEVE_HEAD_INTERPOLATION'],'SLEEVE_HEAD_INTERPOLATION@1.0.1'));}
 const coords=Object.fromEntries(spoints.map(p=>[p.id.split(':')[1],p.positionMm]));
 const sl=mkEdges('SLEEVE');const ids=['0','8','7','6','5','3'];
 for(let i=0;i<ids.length-1;i++){
  const a=coords[ids[i]],b2=coords[ids[i+1]];
  // Local smoothness is a visual proposal, not an Aldrich tangent prescription.
  const prev=coords[ids[Math.max(0,i-1)]],next=coords[ids[Math.min(ids.length-1,i+2)]];
  const c1={x:a.x+(b2.x-prev.x)/6,y:a.y+(b2.y-prev.y)/6};
  const c2={x:b2.x-(next.x-a.x)/6,y:b2.y-(next.y-a.y)/6};
  if(ids[i]==='7'&&ids[i+1]==='8'){c1.y-=20;c2.y-=20;} // 15mm at cubic midpoint relative to unmodified segment
  sl.e(ids[i],ids[i+1],'TECHNICAL_DECISION','SLEEVE_HEAD_INTERPOLATION@1.0.1','Aldrich5 PDF p36: sleeve head follows fifths; cubic controls proposed','UNCLASSIFIED',['one_piece_sleeve_length','close_wrist','scye_depth','chest','half_back','SLEEVE_HEAD_INTERPOLATION'],[c1,c2]);
 }
 sl.e('3','4','SOURCE_LINE','JOIN_3_4','Aldrich5 PDF p36: join 3-4','UNCLASSIFIED',['close_wrist','one_piece_sleeve_length','chest']);
 sl.e('4','2','TECHNICAL_DECISION','CLOSURE_EXPERIMENT@1.0.0','Aldrich5 PDF p38: no hem allowance','UNCLASSIFIED',['close_wrist','CLOSURE_EXPERIMENT']);
 sl.e('2','0','DERIVED_LINE','SLEEVE_CENTRE_GUIDE','Aldrich5 PDF p38: centre line, no seam allowance','CONSTRUCTION',['one_piece_sleeve_length']);
 const slp:ShirtPiece={id:'SLEEVE',points:spoints,edges:sl.edges,status:'EXPERIMENTAL_CONTOUR_ONLY'};
 return [front,back,slp];
}
export const exampleShirtMeasurements=():MeasureSet=>{
 const values:Record<ShirtMeasureKey,number>={chest:1000,scye_depth:244,back_neck_to_waist:442,neck_size:400,half_back:200,garment_length:700,one_piece_sleeve_length:650,close_wrist:178};
 return Object.fromEntries(SHIRT_KEYS.map(k=>[k,{valueMm:values[k],displayUnit:'cm',origin:k==='garment_length'?'USER_INPUT':'BOOK_SIZE_EXAMPLE',source:k==='garment_length'?'USER':'Aldrich5-p35'}])) as MeasureSet;
};
export function createShirtProject(measurements=exampleShirtMeasurements(),projectId='flat-shirt-core-experimental-001'):ShirtProject{
 if(!/^[a-z0-9][a-z0-9-]{1,79}$/.test(projectId))throw new Error('ID do projeto inválido');
 const ms=clone(measurements);checkMeasures(ms);
 return {format:SHIRT_FORMAT,projectId,method:{id:SHIRT_METHOD,version:SHIRT_VERSION,book:'Aldrich5',pdfPages:[35,36,38]},unit:'mm',measurements:ms,decisions:clone(decisionList),revision:0,pieces:generate(ms),evidence:evidenceInit(),release:{cutReady:false,scalePhysical:'NOT_RUN',assembly:'NOT_RUN',fit:'NOT_RUN'}};
}
const equals=(a:unknown,b:unknown):boolean=>JSON.stringify(a)===JSON.stringify(b);
/** Evidence scope is bound to the actual source inputs and technical-decision versions,
 * not to unrelated project revisions. Export template is stable in MI-001.
 */
export function evidenceFingerprint(p:ShirtProject,ev:Evidence):string{
 return JSON.stringify({measurements:ev.dependsOn.measurements.map(k=>[k,p.measurements[k].valueMm]),decisions:ev.dependsOn.decisions.map(id=>{
 const d=p.decisions.find(x=>x.id===id);return [id,d?.version??null];
 }),exportConfig:ev.dependsOn.exportConfig?'nominal-1200x850-v1':null});
}
export function validateShirtProject(raw:unknown):ShirtProject{
 if(!raw||typeof raw!=='object')throw new Error('Projeto não é objeto');
 const p=raw as ShirtProject;
 if(p.format!==SHIRT_FORMAT||p.method?.id!==SHIRT_METHOD||p.method.version!==SHIRT_VERSION||p.method.book!=='Aldrich5'||!equals(p.method.pdfPages,[35,36,38]))throw new Error('Versão de método incompatível: requer migração explícita; original não alterado');
 if(p.unit!=='mm'||p.release?.cutReady!==false||p.release.scalePhysical!=='NOT_RUN'||p.release.assembly!=='NOT_RUN'||p.release.fit!=='NOT_RUN')throw new Error('Estado de release proibido');
 if(!Number.isSafeInteger(p.revision)||p.revision<0||!equals(p.decisions,decisionList)||!/^[a-z0-9][a-z0-9-]{1,79}$/.test(p.projectId))throw new Error('Decisões, identidade ou revisão incompatíveis');
 checkMeasures(p.measurements);
 if(!equals(p.pieces,generate(p.measurements)))throw new Error('Peças não reproduzem a fonte e as decisões fixadas');
 if(!Array.isArray(p.evidence)||p.evidence.length!==3||!p.evidence.every((e,i)=>e.id===evidenceInit()[i].id&&equals(e.dependsOn,evidenceInit()[i].dependsOn)&&['PENDING','REVIEWED','STALE'].includes(e.state)&&((e.state==='REVIEWED'&&typeof e.evidenceRef==='string'&&e.evidenceRef.length>0&&Number.isSafeInteger(e.evaluatedRevision)&&e.evaluatedRevision!==null&&e.evaluatedRevision<=p.revision&&e.basisFingerprint===evidenceFingerprint(p,e))||(e.state!=='REVIEWED'&&(e.evidenceRef===null||typeof e.evidenceRef==='string')&&(e.basisFingerprint===null||typeof e.basisFingerprint==='string')&&(e.evaluatedRevision===null||Number.isSafeInteger(e.evaluatedRevision)&&e.evaluatedRevision<=p.revision)))))throw new Error('Evidências inválidas ou desatualizadas incorretamente');
 return clone(p);
}
export function changeShirtMeasurement(original:ShirtProject,key:ShirtMeasureKey,valueMm:number):ShirtProject{
 const p=validateShirtProject(original);
 if(!SHIRT_KEYS.includes(key))throw new Error('Campo de medida não reconhecido');
 if(!num(valueMm)||valueMm<=0)throw new RangeError('Medida não finita ou não positiva');
 if(p.measurements[key].valueMm===valueMm)return p;
 const next:ShirtProject={...p,revision:p.revision+1,measurements:{...p.measurements,[key]:{valueMm,displayUnit:'cm',origin:'USER_INPUT',source:'USER'}}};
 next.pieces=generate(next.measurements); // all-or-nothing, original object unchanged
 next.evidence=p.evidence.map(ev=>ev.dependsOn.measurements.includes(key)&&ev.state==='REVIEWED'?{...ev,state:'STALE' as const}:ev);
 return validateShirtProject(next);
}
export const serializeShirtProject=(p:ShirtProject)=>JSON.stringify(validateShirtProject(p),null,2)+'\n';
export const parseShirtProject=(text:string)=>{
 if(text.length>2_000_000)throw new Error('Projeto excede limite experimental de 2 MB');
 return validateShirtProject(JSON.parse(text) as unknown);
};
