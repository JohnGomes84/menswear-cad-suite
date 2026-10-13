/**
 * Experimental reactive constraint overlay for an immutable SceneProject 0.3.
 * Format 0.4.0 is explicit: no silent upgrades and NO real garment semantics.
 *
 * Authored driver coordinates are kept apart from projected coordinates.
 * Commands and their preconditions are replayed during JSON import.
 * The underlying directed solver still supports ONE rule per target; it is
 * not a general simultaneous parametric solver.
 */
import type { Vec2 } from "./domain";
import type { SketchEntity } from "./scene";
import { validateSceneV3 } from "./sceneV3";
import type { SceneProjectV3 } from "./sceneV3";
import { solveDirectedConstraints } from "./constraints";
import type { ControlRef, DirectedConstraint } from "./constraints";

export type ConstraintEventV4 =
  | {kind:"ADD_CONSTRAINT"|"REMOVE_CONSTRAINT";revision:number;constraint:DirectedConstraint}
  | {kind:"MOVE_DRIVER";revision:number;ref:ControlRef;before:Vec2;after:Vec2};
export type ConstrainedSceneV4 = {
  formatVersion:"0.4.0";
  purpose:"SYNTHETIC_ONLY";
  unit:"mm";
  baseScene:SceneProjectV3;
  revision:number;
  history:ConstraintEventV4[];
  constraints:DirectedConstraint[];
  driverEntities:SketchEntity[];
  resolvedEntities:SketchEntity[];
};
export type ConstrainedEditorV4 = {
  project:ConstrainedSceneV4;
  past:ConstrainedSceneV4[];
  future:ConstrainedSceneV4[];
};
const record=(v:unknown):v is Record<string,unknown> =>
  typeof v==="object"&&v!==null&&!Array.isArray(v);
const finite=(n:unknown):n is number => typeof n==="number"&&Number.isFinite(n);
const point=(v:unknown):v is Vec2 => record(v)&&finite(v.x)&&finite(v.y);
const ref=(v:unknown):v is ControlRef =>
  record(v)&&typeof v.entityId==="string"&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(v.entityId)&&
  Number.isSafeInteger(v.pointIndex)&&Number(v.pointIndex)>=0;
const name=(v:unknown):v is string =>
  typeof v==="string"&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(v);
const copyPoint=(p:Vec2):Vec2=>({x:p.x,y:p.y});
const copyEntity=(e:SketchEntity):SketchEntity=>({
  id:e.id,pieceId:e.pieceId,kind:e.kind,mode:e.mode,
  pointsMm:e.pointsMm.map(copyPoint)
});
const eqPoint=(a:Vec2,b:Vec2)=>a.x===b.x&&a.y===b.y;
const eqEntities=(a:readonly SketchEntity[],b:unknown):boolean =>
  Array.isArray(b) && a.length===b.length && a.every((v,i)=>{
    const w:unknown=b[i];
    if(!record(w))return false;
    const points:unknown=w.pointsMm;
    if(!Array.isArray(points)||points.length!==v.pointsMm.length)return false;
    return v.id===w.id&&v.pieceId===w.pieceId&&v.kind===w.kind&&
      v.mode===w.mode&&v.pointsMm.every((p,j)=>{
        const q:unknown=points[j];
        return point(q)&&eqPoint(p,q);
      });
  });
const copyConstraint=(c:DirectedConstraint):DirectedConstraint =>
  c.kind==="DISTANCE"
   ?{id:c.id,kind:"DISTANCE",source:{...c.source},target:{...c.target},distanceMm:c.distanceMm}
   :{id:c.id,kind:c.kind,source:{...c.source},target:{...c.target}};
const eqConstraint=(a:DirectedConstraint,b:DirectedConstraint):boolean=>
  a.id===b.id&&a.kind===b.kind&&a.source.entityId===b.source.entityId&&
  a.source.pointIndex===b.source.pointIndex&&
  a.target.entityId===b.target.entityId&&a.target.pointIndex===b.target.pointIndex&&
  (a.kind!=="DISTANCE" || (b.kind==="DISTANCE"&&a.distanceMm===b.distanceMm));
const eqConstraints=(a:readonly DirectedConstraint[],b:readonly DirectedConstraint[]) =>
  a.length===b.length&&a.every((c,i)=>eqConstraint(c,b[i]));

function parseConstraint(v:unknown):DirectedConstraint{
  if(!record(v)||!name(v.id)||!ref(v.source)||!ref(v.target))
    throw new Error("Constraint persistida inválida");
  const source={entityId:v.source.entityId,pointIndex:v.source.pointIndex};
  const target={entityId:v.target.entityId,pointIndex:v.target.pointIndex};
  if(v.kind==="COINCIDENT"||v.kind==="HORIZONTAL"||v.kind==="VERTICAL")
    return {id:v.id,kind:v.kind,source,target};
  if(v.kind==="DISTANCE"&&finite(v.distanceMm)&&v.distanceMm>=0)
    return {id:v.id,kind:"DISTANCE",source,target,distanceMm:v.distanceMm};
  throw new Error("Tipo de constraint desconhecido ou distância inválida");
}
function parseEvent(raw:unknown,index:number):ConstraintEventV4{
  if(!record(raw)||raw.revision!==index+1)throw new Error("Revisão de evento inválida");
  if(raw.kind==="ADD_CONSTRAINT"||raw.kind==="REMOVE_CONSTRAINT")
    return {kind:raw.kind,revision:index+1,constraint:parseConstraint(raw.constraint)};
  if(raw.kind==="MOVE_DRIVER"){
    if(!ref(raw.ref)||!point(raw.before)||!point(raw.after)||
       eqPoint(raw.before,raw.after))throw new Error("MOVE_DRIVER inválido");
    return {kind:"MOVE_DRIVER",revision:index+1,ref:{...raw.ref},
      before:copyPoint(raw.before),after:copyPoint(raw.after)};
  }
  throw new Error("Evento de constraints desconhecido");
}
const targetKey=(r:ControlRef)=>`${r.entityId}#${r.pointIndex}`;
function findPoint(entities:SketchEntity[],r:ControlRef):{entity:SketchEntity;p:Vec2}{
  const entity=entities.find(e=>e.id===r.entityId);
  if(!entity||r.pointIndex>=entity.pointsMm.length)
    throw new Error("Referência geométrica inexistente");
  return {entity,p:entity.pointsMm[r.pointIndex]};
}

function build(baseScene:SceneProjectV3,events:readonly ConstraintEventV4[]):{
  frames:ConstrainedSceneV4[]
}{
  const base=validateSceneV3(baseScene);
  if(events.length>256)throw new Error("Limite experimental de 256 eventos de constraints");
  const frames:ConstrainedSceneV4[]=[];
  let drivers=base.entities.map(copyEntity);
  let constraints:DirectedConstraint[]=[];
  const seenIds=new Set<string>();
  const history:ConstraintEventV4[]=[];
  const frame=():ConstrainedSceneV4=>{
    const solution=solveDirectedConstraints(drivers,constraints);
    if(solution.status!=="SOLVED")
      throw new Error(`Solver bloqueou projeto 0.4: ${solution.finding.code} — ${solution.finding.message}`);
    return {
      formatVersion:"0.4.0",purpose:"SYNTHETIC_ONLY",unit:"mm",
      baseScene:base,revision:history.length,history:[...history],
      constraints:constraints.map(copyConstraint),
      driverEntities:drivers.map(copyEntity),
      resolvedEntities:solution.entities.map(copyEntity)
    };
  };
  frames.push(frame());
  for(let i=0;i<events.length;i++){
    const event=parseEvent(events[i],i);
    if(event.kind==="ADD_CONSTRAINT"){
      if(seenIds.has(event.constraint.id)||constraints.some(c=>c.id===event.constraint.id))
        throw new Error("ID de constraint reutilizado");
      seenIds.add(event.constraint.id);
      constraints=[...constraints,copyConstraint(event.constraint)];
    }else if(event.kind==="REMOVE_CONSTRAINT"){
      const existing=constraints.find(c=>c.id===event.constraint.id);
      if(!existing||!eqConstraint(existing,event.constraint))
        throw new Error("REMOVE_CONSTRAINT não corresponde à regra ativa");
      constraints=constraints.filter(c=>c.id!==event.constraint.id);
    }else if(event.kind==="MOVE_DRIVER"){
      if(constraints.some(c=>targetKey(c.target)===targetKey(event.ref)))
        throw new Error("Ponto de destino condicionado: edite a origem da relação");
      const found=findPoint(drivers,event.ref);
      if(found.entity.mode!=="FREE"||!eqPoint(found.p,event.before))
        throw new Error("MOVE_DRIVER viola estado inicial ou modo de edição");
      found.entity.pointsMm[event.ref.pointIndex]=copyPoint(event.after);
    }
    history.push(event);
    frames.push(frame());
  }
  return {frames};
}

/** Validate redundant stored views against complete deterministic replay. */
export function validateConstrainedV4(raw:unknown):ConstrainedSceneV4{
  if(!record(raw)||raw.formatVersion!=="0.4.0"||
     raw.purpose!=="SYNTHETIC_ONLY"||raw.unit!=="mm")
    throw new Error("Formato 0.4.0 sintético obrigatório");
  if(!Number.isSafeInteger(raw.revision)||Number(raw.revision)<0||
     !Array.isArray(raw.history)||raw.revision!==raw.history.length)
    throw new Error("Histórico de constraints inconsistente");
  if(!Array.isArray(raw.constraints)||!Array.isArray(raw.driverEntities)||
     !Array.isArray(raw.resolvedEntities))
    throw new Error("Estado calculado ausente");
  if(raw.history.length>256)
    throw new Error("Histórico 0.4 excede limite experimental");
  const base=validateSceneV3(raw.baseScene);
  const events=raw.history.map((ev,i)=>parseEvent(ev,i));
  const final=build(base,events).frames.at(-1)!;
  const sourceConstraints=raw.constraints.map(parseConstraint);
  if(!eqConstraints(final.constraints,sourceConstraints)||
     !eqEntities(final.driverEntities,raw.driverEntities)||
     !eqEntities(final.resolvedEntities,raw.resolvedEntities))
    throw new Error("Cena 0.4 não corresponde ao histórico de comandos");
  return final;
}
export function createConstrainedV4(baseScene:SceneProjectV3):ConstrainedSceneV4{
  return build(validateSceneV3(baseScene),[]).frames[0];
}
/** Explicit user-authorized initialization, NOT automatic import migration. */
export function migrateV3ToConstrainedV4(baseScene:SceneProjectV3):ConstrainedSceneV4{
  return createConstrainedV4(baseScene);
}
export function createConstrainedEditorV4(project:ConstrainedSceneV4):ConstrainedEditorV4{
  const valid=validateConstrainedV4(project);
  const frames=build(valid.baseScene,valid.history).frames;
  return {project:valid,past:frames.slice(0,-1),future:[]};
}
function commit(s:ConstrainedEditorV4,event:ConstraintEventV4):ConstrainedEditorV4{
  const events=[...s.project.history,event];
  const final=build(s.project.baseScene,events).frames.at(-1)!;
  return {project:final,past:[...s.past,s.project],future:[]};
}
export function addDirectedConstraintV4(
  s:ConstrainedEditorV4,rule:DirectedConstraint
):ConstrainedEditorV4{
  return commit(s,{
    kind:"ADD_CONSTRAINT",revision:s.project.revision+1,
    constraint:parseConstraint(rule)
  });
}
export function removeDirectedConstraintV4(
  s:ConstrainedEditorV4,id:string
):ConstrainedEditorV4{
  const rule=s.project.constraints.find(c=>c.id===id);
  if(!rule)throw new Error("Constraint não encontrada");
  return commit(s,{
    kind:"REMOVE_CONSTRAINT",revision:s.project.revision+1,
    constraint:copyConstraint(rule)
  });
}
export function moveDrivingPointV4(
  s:ConstrainedEditorV4,reference:ControlRef,after:Vec2
):ConstrainedEditorV4{
  if(!ref(reference)||!point(after))throw new Error("Novo ponto inválido");
  const found=findPoint(s.project.driverEntities,reference);
  if(eqPoint(found.p,after))return s;
  return commit(s,{
    kind:"MOVE_DRIVER",revision:s.project.revision+1,ref:{...reference},
    before:copyPoint(found.p),after:copyPoint(after)
  });
}
export function undoConstrainedV4(s:ConstrainedEditorV4):ConstrainedEditorV4{
  if(!s.past.length)return s;
  return {project:s.past[s.past.length-1],past:s.past.slice(0,-1),
    future:[...s.future,s.project]};
}
export function redoConstrainedV4(s:ConstrainedEditorV4):ConstrainedEditorV4{
  if(!s.future.length)return s;
  return {project:s.future[s.future.length-1],
    past:[...s.past,s.project],future:s.future.slice(0,-1)};
}
export function serializeConstrainedV4(project:ConstrainedSceneV4):string{
  return JSON.stringify(validateConstrainedV4(project),null,2)+"\n";
}
export function parseConstrainedV4(source:string):ConstrainedSceneV4{
  if(source.length>1024*1024)throw new Error("JSON 0.4 excede 1 MB");
  return validateConstrainedV4(JSON.parse(source) as unknown);
}
