/**
 * Synthetic CAD sketch transactions — schema 0.3.0.
 * INDEPENDENT of garment/production semantics. Never suitable for cutting.
 * Supports MOVE_POINT, ADD_ENTITY and REMOVE_ENTITY with reversible event history.
 */
import type { Vec2 } from "./domain";
import {
  createSceneEditor, exampleScene, validateScene
} from "./scene";
import type { SketchEntity, SketchPiece, SceneProject } from "./scene";

export type SceneEventV3 =
  | { kind:"MOVE_POINT"; revision:number; entityId:string; pointIndex:number; before:Vec2; after:Vec2 }
  | { kind:"ADD_ENTITY"|"REMOVE_ENTITY"; revision:number; index:number; entity:SketchEntity };

export type SceneProjectV3 = Omit<SceneProject,"formatVersion"|"history"> & {
  formatVersion:"0.3.0";
  /** Immutable genesis snapshot for deterministic event replay and integrity checks. */
  initialEntities:SketchEntity[];
  history:SceneEventV3[];
};

export type SceneEditorV3 = {
  project:SceneProjectV3;
  past:SceneProjectV3[];
  future:SceneProjectV3[];
};

const isRecord=(x:unknown):x is Record<string,unknown> =>
  typeof x==="object"&&x!==null&&!Array.isArray(x);
const isId=(x:unknown):x is string =>
  typeof x==="string"&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(x);
const pt=(x:unknown):x is Vec2 =>
  isRecord(x)&&typeof x.x==="number"&&Number.isFinite(x.x)
  &&typeof x.y==="number"&&Number.isFinite(x.y);
const samePt=(a:Vec2,b:Vec2)=>a.x===b.x&&a.y===b.y;
const copyPt=(p:Vec2):Vec2=>({x:p.x,y:p.y});
const copyEntity=(e:SketchEntity):SketchEntity=>({
  id:e.id,pieceId:e.pieceId,kind:e.kind,mode:e.mode,
  pointsMm:e.pointsMm.map(copyPt)
});
const sameEntity=(a:SketchEntity,b:SketchEntity):boolean =>
  a.id===b.id&&a.pieceId===b.pieceId&&a.kind===b.kind&&a.mode===b.mode
  &&a.pointsMm.length===b.pointsMm.length
  &&a.pointsMm.every((p,i)=>samePt(p,b.pointsMm[i]));
const safeIndex=(n:unknown)=>Number.isSafeInteger(n)&&Number(n)>=0;
const validEntity=(x:unknown,pieces:readonly SketchPiece[]):x is SketchEntity=>{
  if(!isRecord(x)||!isId(x.id)||!isId(x.pieceId)
     ||!pieces.some(p=>p.id===x.pieceId)
     ||(x.kind!=="LINE"&&x.kind!=="CUBIC_BEZIER")
     ||(x.mode!=="FREE"&&x.mode!=="PARAMETRIC"&&x.mode!=="PARAMETRIC_OVERRIDE")
     ||!Array.isArray(x.pointsMm)
     ||x.pointsMm.length!==(x.kind==="LINE"?2:4)) return false;
  return x.pointsMm.every(pt);
};
function copyEvent(e:SceneEventV3):SceneEventV3{
  return e.kind==="MOVE_POINT"
    ?{kind:e.kind,revision:e.revision,entityId:e.entityId,pointIndex:e.pointIndex,before:copyPt(e.before),after:copyPt(e.after)}
    :{kind:e.kind,revision:e.revision,index:e.index,entity:copyEntity(e.entity)};
}
function parseEvent(x:unknown,revision:number,pieces:readonly SketchPiece[]):SceneEventV3{
  if(!isRecord(x)||x.revision!==revision)throw new Error("Revisão de evento inválida");
  if(x.kind==="MOVE_POINT"){
    if(!isId(x.entityId)||!safeIndex(x.pointIndex)||!pt(x.before)||!pt(x.after)
       ||samePt(x.before,x.after)) throw new Error("Evento MOVE_POINT inválido");
    return {kind:"MOVE_POINT",revision,entityId:x.entityId,
      pointIndex:x.pointIndex as number,before:copyPt(x.before),after:copyPt(x.after)};
  }
  if(x.kind==="ADD_ENTITY"||x.kind==="REMOVE_ENTITY"){
    if(!safeIndex(x.index)||!validEntity(x.entity,pieces))
      throw new Error("Evento de entidade inválido");
    return {kind:x.kind,revision,index:x.index as number,entity:copyEntity(x.entity)};
  }
  throw new Error("Comando desconhecido — arquivo bloqueado");
}
function ensureIdentity(entities:SketchEntity[],pieces:SketchPiece[]):void{
  if(entities.length>500)throw new Error("Limite de 500 entidades");
  const seen=new Set<string>();
  for(const e of entities){
    if(!validEntity(e,pieces)||seen.has(e.id))throw new Error("Entidade duplicada ou inválida");
    seen.add(e.id);
  }
}
/** Pure forward replay with precondition checks — rejects command tampering. */
function apply(entities:readonly SketchEntity[],event:SceneEventV3,pieces:SketchPiece[]):SketchEntity[]{
  const next=entities.map(copyEntity);
  if(event.kind==="MOVE_POINT"){
    const e=next.find(e=>e.id===event.entityId);
    if(!e||e.mode!=="FREE"||event.pointIndex>=e.pointsMm.length
       ||!samePt(e.pointsMm[event.pointIndex],event.before))
      throw new Error("MOVE_POINT incompatível com o estado anterior");
    e.pointsMm[event.pointIndex]=copyPt(event.after);
  }else if(event.kind==="ADD_ENTITY"){
    if(event.index>next.length||next.some(e=>e.id===event.entity.id))
      throw new Error("ADD_ENTITY em posição ou ID inválido");
    next.splice(event.index,0,copyEntity(event.entity));
  }else{
    if(event.index>=next.length||!sameEntity(next[event.index],event.entity))
      throw new Error("REMOVE_ENTITY não corresponde ao estado anterior");
    next.splice(event.index,1);
  }
  ensureIdentity(next,pieces);
  return next;
}
/** Pure reversal, independent of session snapshots. */
function invert(entities:readonly SketchEntity[],event:SceneEventV3,pieces:SketchPiece[]):SketchEntity[]{
  const next=entities.map(copyEntity);
  if(event.kind==="MOVE_POINT"){
    const e=next.find(e=>e.id===event.entityId);
    if(!e||e.mode!=="FREE"||event.pointIndex>=e.pointsMm.length
       ||!samePt(e.pointsMm[event.pointIndex],event.after))
      throw new Error("Histórico MOVE_POINT adulterado");
    e.pointsMm[event.pointIndex]=copyPt(event.before);
  }else if(event.kind==="ADD_ENTITY"){
    if(event.index>=next.length||!sameEntity(next[event.index],event.entity))
      throw new Error("Histórico ADD_ENTITY adulterado");
    next.splice(event.index,1);
  }else{
    if(event.index>next.length||next.some(e=>e.id===event.entity.id))
      throw new Error("Histórico REMOVE_ENTITY adulterado");
    next.splice(event.index,0,copyEntity(event.entity));
  }
  ensureIdentity(next,pieces);
  return next;
}

export function validateSceneV3(input:unknown):SceneProjectV3{
  if(!isRecord(input)||input.formatVersion!=="0.3.0")
    throw new Error("Versão de cena não suportada: esperado 0.3.0");
  if(input.purpose!=="SYNTHETIC_ONLY"||input.unit!=="mm"||!isId(input.id))
    throw new Error("Somente cena sintética em milímetros");
  if(!safeIndex(input.revision)||Number(input.revision)>5000)
    throw new Error("Revisão de cena inválida");
  if(!Array.isArray(input.pieces)||input.pieces.length<1||input.pieces.length>50)
    throw new Error("Grupos inválidos");
  const pieces:SketchPiece[]=[];
  const pieceIds=new Set<string>();
  for(const group of input.pieces){
    if(!isRecord(group)||!isId(group.id)||pieceIds.has(group.id)
      ||typeof group.name!=="string"||group.name.length<1||group.name.length>100)
      throw new Error("Grupo inválido/duplicado");
    pieceIds.add(group.id);
    pieces.push({id:group.id,name:group.name});
  }
  if(!Array.isArray(input.entities)||input.entities.length>500)
    throw new Error("Entidades inválidas");
  const entities:SketchEntity[]=[];
  for(const entity of input.entities){
    if(!validEntity(entity,pieces))throw new Error("Entidade inválida");
    entities.push(copyEntity(entity));
  }
  ensureIdentity(entities,pieces);
  if(!Array.isArray(input.initialEntities)||input.initialEntities.length>500)
    throw new Error("Estado inicial obrigatório para conferir eventos");
  const initialEntities:SketchEntity[]=[];
  for(const raw of input.initialEntities){
    if(!validEntity(raw,pieces))throw new Error("Entidade inicial inválida");
    initialEntities.push(copyEntity(raw));
  }
  ensureIdentity(initialEntities,pieces);
  if(!Array.isArray(input.history)||input.history.length!==input.revision)
    throw new Error("Histórico/revisão inconsistentes");
  const history=input.history.map((item,i)=>parseEvent(item,i+1,pieces));
  let base=entities.map(copyEntity);
  for(let i=history.length-1;i>=0;i--) base=invert(base,history[i],pieces);
  if(base.length!==initialEntities.length ||
     base.some((entity,i)=>!sameEntity(entity,initialEntities[i])))
    throw new Error("Histórico não coincide com o estado inicial");
  // An entity ID cannot be reused after deletion. This preserves permanent identity.
  const seen=new Set(base.map(e=>e.id));
  let replay=base;
  for(const event of history){
    if(event.kind==="ADD_ENTITY"){
      if(seen.has(event.entity.id))throw new Error("Reutilização de ID histórico proibida");
      seen.add(event.entity.id);
    }
    replay=apply(replay,event,pieces);
  }
  if(replay.length!==entities.length||replay.some((e,i)=>!sameEntity(e,entities[i])))
    throw new Error("Histórico difere da cena final");
  return {
    formatVersion:"0.3.0",purpose:"SYNTHETIC_ONLY",id:input.id,
    unit:"mm",revision:input.revision as number,pieces,entities,initialEntities,history
  };
}

export function exampleSceneV3():SceneProjectV3{
  const legacy=exampleScene();
  return {...legacy,formatVersion:"0.3.0",initialEntities:legacy.entities.map(copyEntity),history:[]};
}

/** Explicit migration only. Caller must ask user before using this function. */
export function migrateSceneV2(input:unknown):SceneProjectV3{
  const v2=validateScene(input);
  const editor=createSceneEditor(v2);
  const genesis=editor.past[0]?.entities??v2.entities;
  return validateSceneV3({
    ...v2,formatVersion:"0.3.0",initialEntities:genesis.map(copyEntity),
    history:v2.history.map(e=>({
      kind:"MOVE_POINT",revision:e.revision,entityId:e.entityId,
      pointIndex:e.pointIndex,before:e.before,after:e.after
    }))
  });
}

export function createSceneEditorV3(input:SceneProjectV3=exampleSceneV3()):SceneEditorV3{
  const project=validateSceneV3(input);
  let cursor=project;
  const past:SceneProjectV3[]=[];
  for(let i=project.history.length-1;i>=0;i--){
    const previous:SceneProjectV3={
      ...cursor,
      entities:invert(cursor.entities,cursor.history[i],cursor.pieces),
      revision:cursor.revision-1,history:cursor.history.slice(0,-1)
    };
    past.unshift(previous);
    cursor=previous;
  }
  return {project,past,future:[]};
}
function commit(editor:SceneEditorV3,event:SceneEventV3):SceneEditorV3{
  if(editor.project.history.length>=5000)throw new Error("Histórico cheio");
  const entities=apply(editor.project.entities,event,editor.project.pieces);
  const next:SceneProjectV3={
    ...editor.project,revision:event.revision,entities,
    history:[...editor.project.history,copyEvent(event)]
  };
  return {project:next,past:[...editor.past,editor.project],future:[]};
}

export function addSceneEntity(editor:SceneEditorV3,entity:SketchEntity,index=editor.project.entities.length):SceneEditorV3{
  if(!validEntity(entity,editor.project.pieces))throw new Error("Nova entidade inválida");
  if(!safeIndex(index))throw new Error("Posição de inserção inválida");
  const idUsed=editor.project.entities.some(e=>e.id===entity.id)||
    editor.project.history.some(ev=>ev.kind==="ADD_ENTITY"&&ev.entity.id===entity.id);
  if(idUsed)throw new Error("ID duplicado ou anteriormente utilizado");
  return commit(editor,{
    kind:"ADD_ENTITY",revision:editor.project.revision+1,index,entity:copyEntity(entity)
  });
}
export function removeSceneEntity(editor:SceneEditorV3,entityId:string):SceneEditorV3{
  const index=editor.project.entities.findIndex(e=>e.id===entityId);
  if(index<0)throw new Error("Entidade não encontrada para remoção");
  const entity=editor.project.entities[index];
  if(entity.mode!=="FREE")throw new Error("Remoção de entidade paramétrica exige desvinculação explícita");
  return commit(editor,{
    kind:"REMOVE_ENTITY",revision:editor.project.revision+1,index,entity:copyEntity(entity)
  });
}
export function moveScenePointV3(editor:SceneEditorV3,entityId:string,index:number,p:Vec2):SceneEditorV3{
  if(!pt(p))throw new Error("Ponto não finito");
  const e=editor.project.entities.find(e=>e.id===entityId);
  if(!e)throw new Error("Entidade não encontrada");
  if(e.mode!=="FREE")throw new Error("Modo paramétrico bloqueia arraste");
  if(!safeIndex(index)||index>=e.pointsMm.length)throw new Error("Índice de ponto inválido");
  const before=e.pointsMm[index];
  if(samePt(before,p))return editor;
  return commit(editor,{
    kind:"MOVE_POINT",revision:editor.project.revision+1,
    entityId,pointIndex:index,before:copyPt(before),after:copyPt(p)
  });
}
export function sceneUndoV3(s:SceneEditorV3):SceneEditorV3{
  if(!s.past.length)return s;
  return {project:s.past[s.past.length-1],past:s.past.slice(0,-1),future:[...s.future,s.project]};
}
export function sceneRedoV3(s:SceneEditorV3):SceneEditorV3{
  if(!s.future.length)return s;
  return {project:s.future[s.future.length-1],past:[...s.past,s.project],future:s.future.slice(0,-1)};
}
export function serializeSceneV3(project:SceneProjectV3):string{
  return JSON.stringify(validateSceneV3(project),null,2)+"\n";
}
export function parseSceneV3(text:string):SceneProjectV3{
  if(text.length>1024*1024)throw new Error("JSON excede 1 MB");
  return validateSceneV3(JSON.parse(text) as unknown);
}
