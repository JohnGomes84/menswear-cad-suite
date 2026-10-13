/**
 * Experimental, multi-entity sketch model (0.2.0).
 * This is NOT an approved sewing pattern schema or garment construction model.
 * Curves and lines are stored in canonical millimetres; SVG is only a view.
 */
import type { EditMode, Vec2 } from "./domain";

export type SketchKind = "LINE" | "CUBIC_BEZIER";
export type SketchEntity = {
  id: string;
  pieceId: string;
  kind: SketchKind;
  mode: EditMode;
  pointsMm: Vec2[];
};
export type SketchPiece = { id: string; name: string };
export type SceneMove = {
  kind: "MOVE_POINT";
  revision: number;
  entityId: string;
  pointIndex: number;
  before: Vec2;
  after: Vec2;
};
export type SceneProject = {
  formatVersion: "0.2.0";
  purpose: "SYNTHETIC_ONLY";
  id: string;
  unit: "mm";
  revision: number;
  pieces: SketchPiece[];
  entities: SketchEntity[];
  history: SceneMove[];
};
export type SceneEditor = {
  project: SceneProject;
  past: SceneProject[];
  future: SceneProject[];
};

const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const validPoint = (v: unknown): v is Vec2 =>
  record(v) && finite(v.x) && finite(v.y);
const validId = (v: unknown): v is string =>
  typeof v === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(v);
const validMode = (v: unknown): v is EditMode =>
  v === "FREE" || v === "PARAMETRIC" || v === "PARAMETRIC_OVERRIDE";
const expectedPointCount = (kind: SketchKind): number => kind === "LINE" ? 2 : 4;

function copyPoint(p: Vec2): Vec2 { return { x:p.x, y:p.y }; }
function copyEntity(e: SketchEntity): SketchEntity {
  return { ...e, pointsMm: e.pointsMm.map(copyPoint) };
}
function same(a:Vec2,b:Vec2):boolean { return a.x===b.x && a.y===b.y; }

/** Two sketch groups, two cubic curves, one line. No garment semantics. */
export function exampleScene():SceneProject {
  return {
    formatVersion:"0.2.0", purpose:"SYNTHETIC_ONLY", id:"multientity-lab",
    unit:"mm", revision:0,
    pieces:[
      {id:"sketch-a",name:"Grupo A — demonstração"},
      {id:"sketch-b",name:"Grupo B — demonstração"}
    ],
    entities:[
      {id:"curve-a",pieceId:"sketch-a",kind:"CUBIC_BEZIER",mode:"FREE",
        pointsMm:[{x:20,y:115},{x:35,y:25},{x:90,y:20},{x:105,y:95}]},
      {id:"line-a",pieceId:"sketch-a",kind:"LINE",mode:"FREE",
        pointsMm:[{x:20,y:115},{x:105,y:95}]},
      {id:"curve-b",pieceId:"sketch-b",kind:"CUBIC_BEZIER",mode:"FREE",
        pointsMm:[{x:135,y:110},{x:130,y:45},{x:190,y:30},{x:215,y:115}]}
    ],
    history:[]
  };
}

/**
 * Validate every identity and every historical move before accepting a file.
 * The 0.2.0 lab format allows only linear MOVE_POINT history on fixed entities.
 * No adding/removing pieces or importing external code is supported yet.
 */
export function validateScene(input:unknown):SceneProject {
  if(!record(input)) throw new Error("Cena inválida");
  if(input.formatVersion!=="0.2.0") throw new Error("Versão da cena não suportada");
  if(input.purpose!=="SYNTHETIC_ONLY" || input.unit!=="mm") {
    throw new Error("Somente laboratório sintético em mm");
  }
  if(!validId(input.id)) throw new Error("Identificador de cena inválido");
  if(!Number.isSafeInteger(input.revision) || (input.revision as number)<0 || (input.revision as number)>5000) {
    throw new Error("Revisão da cena inválida");
  }
  if(!Array.isArray(input.pieces) || input.pieces.length<1 || input.pieces.length>50) {
    throw new Error("Grupos da cena inválidos");
  }
  const pieces:SketchPiece[]=[];
  const pieceIds=new Set<string>();
  for(const p of input.pieces) {
    if(!record(p) || !validId(p.id) || typeof p.name!=="string" ||
        p.name.length<1 || p.name.length>100 || pieceIds.has(p.id)) {
      throw new Error("Grupo duplicado ou inválido");
    }
    pieceIds.add(p.id);
    pieces.push({id:p.id,name:p.name});
  }
  if(!Array.isArray(input.entities) || input.entities.length<1 || input.entities.length>500) {
    throw new Error("Lista de entidades inválida");
  }
  const entities:SketchEntity[]=[];
  const entityIds=new Set<string>();
  for(const e of input.entities) {
    if(!record(e) || !validId(e.id) || entityIds.has(e.id) ||
        !pieceIds.has(e.pieceId as string) ||
        (e.kind!=="LINE" && e.kind!=="CUBIC_BEZIER") ||
        !validMode(e.mode) || !Array.isArray(e.pointsMm) ||
        e.pointsMm.length!==expectedPointCount(e.kind as SketchKind) ||
        !e.pointsMm.every(validPoint)) {
      throw new Error("Entidade inválida ou grupo inexistente");
    }
    entityIds.add(e.id);
    entities.push({
      id:e.id, pieceId:e.pieceId as string,
      kind:e.kind as SketchKind, mode:e.mode as EditMode,
      pointsMm:(e.pointsMm as Vec2[]).map(copyPoint)
    });
  }
  if(!Array.isArray(input.history) || input.history.length!==input.revision ||
      input.history.length>5000) throw new Error("Histórico da cena inconsistente");
  const history:SceneMove[]=[];
  const byId=new Map(entities.map(e=>[e.id,e]));
  for(let i=0;i<input.history.length;i++){
    const ev=input.history[i];
    if(!record(ev) || ev.kind!=="MOVE_POINT" || ev.revision!==i+1 ||
        !entityIds.has(ev.entityId as string) ||
        !Number.isSafeInteger(ev.pointIndex) ||
        !validPoint(ev.before) || !validPoint(ev.after) ||
        same(ev.before,ev.after)) {
      throw new Error("Evento de cena inválido");
    }
    const entity=byId.get(ev.entityId as string)!;
    if(entity.mode!=="FREE" || (ev.pointIndex as number)<0 ||
       (ev.pointIndex as number)>=entity.pointsMm.length) {
      throw new Error("Evento incompatível com entidade/mode");
    }
    history.push({
      kind:"MOVE_POINT", revision:ev.revision as number,
      entityId:ev.entityId as string, pointIndex:ev.pointIndex as number,
      before:copyPoint(ev.before),after:copyPoint(ev.after)
    });
  }
  const backwards=new Map(entities.map(e=>[e.id,copyEntity(e)]));
  for(let i=history.length-1;i>=0;i--){
    const ev=history[i],entity=backwards.get(ev.entityId)!;
    if(!same(entity.pointsMm[ev.pointIndex],ev.after)) {
      throw new Error("Cadeia de movimentos da cena adulterada");
    }
    entity.pointsMm[ev.pointIndex]=copyPoint(ev.before);
  }
  return {
    formatVersion:"0.2.0",purpose:"SYNTHETIC_ONLY",id:input.id as string,
    unit:"mm",revision:input.revision as number,pieces,entities,history
  };
}
export function createSceneEditor(input:SceneProject=exampleScene()):SceneEditor {
  const project=validateScene(input);
  let cursor=project;
  const past:SceneProject[]=[];
  for(let i=project.history.length-1;i>=0;i--){
    const last=cursor.history[cursor.history.length-1];
    const entities=cursor.entities.map(copyEntity);
    const entity=entities.find(e=>e.id===last.entityId)!;
    entity.pointsMm[last.pointIndex]=copyPoint(last.before);
    const previous:SceneProject={
      ...cursor,revision:cursor.revision-1,
      entities,history:cursor.history.slice(0,-1)
    };
    past.unshift(previous);
    cursor=previous;
  }
  return {project,past,future:[]};
}
export function sceneMove(
  editor:SceneEditor,entityId:string,pointIndex:number,after:Vec2
):SceneEditor{
  if(!validPoint(after)) throw new Error("Coordenada não finita");
  const target=editor.project.entities.find(e=>e.id===entityId);
  if(!target) throw new Error("Entidade não encontrada");
  if(target.mode!=="FREE") throw new Error("Entidade paramétrica não pode ser editada diretamente");
  if(!Number.isSafeInteger(pointIndex)||pointIndex<0||pointIndex>=target.pointsMm.length) {
    throw new Error("Ponto inexistente");
  }
  const before=target.pointsMm[pointIndex];
  if(same(before,after)) return editor;
  const nextRevision=editor.project.revision+1;
  if(nextRevision>5000) throw new Error("Limite de histórico do laboratório");
  const entities=editor.project.entities.map(e=>{
    if(e.id!==entityId)return e;
    const points=e.pointsMm.map(copyPoint);
    points[pointIndex]=copyPoint(after);
    return {...e,pointsMm:points};
  });
  const next:SceneProject={
    ...editor.project,revision:nextRevision,entities,
    history:[...editor.project.history,{
      kind:"MOVE_POINT",revision:nextRevision,entityId,pointIndex,
      before:copyPoint(before),after:copyPoint(after)
    }]
  };
  return {project:next,past:[...editor.past,editor.project],future:[]};
}
export function sceneUndo(editor:SceneEditor):SceneEditor {
  if(!editor.past.length) return editor;
  return {project:editor.past[editor.past.length-1],
    past:editor.past.slice(0,-1),future:[...editor.future,editor.project]};
}
export function sceneRedo(editor:SceneEditor):SceneEditor {
  if(!editor.future.length) return editor;
  return {project:editor.future[editor.future.length-1],
    past:[...editor.past,editor.project],future:editor.future.slice(0,-1)};
}
export function serializeScene(scene:SceneProject):string {
  return JSON.stringify(validateScene(scene),null,2)+"\n";
}
export function parseScene(text:string):SceneProject {
  if(text.length>1024*1024)throw new Error("JSON excede 1 MB");
  return validateScene(JSON.parse(text) as unknown);
}
