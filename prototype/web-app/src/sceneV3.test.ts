import { describe,expect,it } from "vitest";
import type { SketchEntity } from "./scene";
import {
 addSceneEntity,createSceneEditorV3,exampleSceneV3,migrateSceneV2,
 moveScenePointV3,parseSceneV3,removeSceneEntity,sceneRedoV3,sceneUndoV3,
 serializeSceneV3,validateSceneV3
} from "./sceneV3";
import {createSceneEditor,exampleScene,sceneMove} from "./scene";

const line=(id:string,pieceId="sketch-b"):SketchEntity=>({
 id,pieceId,kind:"LINE",mode:"FREE",
 pointsMm:[{x:25,y:35},{x:55,y:60}]
});
const cubic=(id:string,pieceId="sketch-a"):SketchEntity=>({
 id,pieceId,kind:"CUBIC_BEZIER",mode:"FREE",
 pointsMm:[{x:30,y:40},{x:60,y:20},{x:70,y:90},{x:110,y:55}]
});
const move=(state:ReturnType<typeof createSceneEditorV3>)=>
 moveScenePointV3(state,"line-new",0,{x:33,y:48});

describe("scene 0.3 transactional event sourcing",()=>{
 it("starts with multi-group synthetic scene",()=>{
  const p=validateSceneV3(exampleSceneV3());
  expect(p.formatVersion).toBe("0.3.0");
  expect(p.pieces).toHaveLength(2);
  expect(p.entities).toHaveLength(3);
 });
 it("adds a line in a second group with stable identity",()=>{
  const state=addSceneEntity(createSceneEditorV3(),line("line-new"));
  expect(state.project.entities.at(-1)?.pieceId).toBe("sketch-b");
  expect(state.project.history.at(-1)?.kind).toBe("ADD_ENTITY");
  expect(state.project.revision).toBe(1);
 });
 it("adds a cubic at a specified insertion position",()=>{
  const state=addSceneEntity(createSceneEditorV3(),cubic("extra-curve"),1);
  expect(state.project.entities[1].id).toBe("extra-curve");
  expect(sceneUndoV3(state).project.entities).toEqual(exampleSceneV3().entities);
  expect(sceneRedoV3(sceneUndoV3(state)).project).toEqual(state.project);
 });
 it("rejects duplicate or historically reused IDs",()=>{
  const a=addSceneEntity(createSceneEditorV3(),line("line-new"));
  expect(()=>addSceneEntity(a,line("line-new"))).toThrow(/ID duplicado/);
  const removed=removeSceneEntity(a,"line-new");
  expect(()=>addSceneEntity(removed,line("line-new"))).toThrow(/ID duplicado/);
 });
 it("removes existing entity, restores it via undo",()=>{
  const a=removeSceneEntity(createSceneEditorV3(),"curve-b");
  expect(a.project.entities.map(x=>x.id)).not.toContain("curve-b");
  const previous=sceneUndoV3(a);
  expect(previous.project.entities).toEqual(exampleSceneV3().entities);
  expect(sceneRedoV3(previous).project).toEqual(a.project);
 });
 it("permits zero entities after removing all; can undo to recover",()=>{
  let state=createSceneEditorV3();
  for(const id of ["curve-a","line-a","curve-b"])state=removeSceneEntity(state,id);
  expect(state.project.entities).toEqual([]);
  const restored=createSceneEditorV3(parseSceneV3(serializeSceneV3(state.project)));
  expect(restored.past).toHaveLength(3);
  expect(sceneUndoV3(sceneUndoV3(sceneUndoV3(restored))).project.entities).toHaveLength(3);
 });
 it("persisted mixed events reconstruct undo/redo identically",()=>{
  let s=createSceneEditorV3();
  s=addSceneEntity(s,line("line-new"));
  s=move(s);
  s=removeSceneEntity(s,"curve-a");
  s=addSceneEntity(s,cubic("new-cubic"));
  s=removeSceneEntity(s,"line-new");
  const reopened=createSceneEditorV3(parseSceneV3(serializeSceneV3(s.project)));
  expect(reopened.past).toHaveLength(5);
  let backward=reopened;
  for(let i=0;i<5;i++)backward=sceneUndoV3(backward);
  expect(backward.project).toEqual(exampleSceneV3());
  for(let i=0;i<5;i++)backward=sceneRedoV3(backward);
  expect(backward.project).toEqual(s.project);
 });
 it("branching after undo clears redo and preserves exported history",()=>{
  let s=addSceneEntity(createSceneEditorV3(),line("line-new"));
  s=move(s);
  s=sceneUndoV3(s);
  s=addSceneEntity(s,cubic("other-curve"));
  expect(s.future).toHaveLength(0);
  expect(parseSceneV3(serializeSceneV3(s.project)).history.map(e=>e.kind)).toEqual(["ADD_ENTITY","ADD_ENTITY"]);
 });
 it("rejects forged remove payload instead of removing different entity",()=>{
  const s=removeSceneEntity(createSceneEditorV3(),"curve-a");
  const raw=JSON.parse(serializeSceneV3(s.project));
  raw.history[0].entity.pointsMm[0].x=999;
  expect(()=>validateSceneV3(raw)).toThrow(/adulterado|incompatível/i);
 });
 it("rejects forged add payload instead of silently replacing geometry",()=>{
  const s=addSceneEntity(createSceneEditorV3(),line("line-new"));
  const raw=JSON.parse(serializeSceneV3(s.project));
  raw.history[0].entity.pointsMm[0].y=-42;
  expect(()=>validateSceneV3(raw)).toThrow(/adulterado|incompatível/i);
 });
 it("rejects bogus command, event revision gaps, duplicate pieces and nonfinite values",()=>{
  const s=addSceneEntity(createSceneEditorV3(),line("line-new"));
  const invalid=JSON.parse(serializeSceneV3(s.project));
  invalid.history[0].kind="RUN_SCRIPT";
  expect(()=>validateSceneV3(invalid)).toThrow(/Comando desconhecido/);
  invalid.history[0].kind="ADD_ENTITY";
  invalid.history[0].revision=4;
  expect(()=>validateSceneV3(invalid)).toThrow(/Revisão/);
  const dup=exampleSceneV3();dup.pieces.push({...dup.pieces[0]});
  expect(()=>validateSceneV3(dup)).toThrow(/Grupo/);
  const bad=exampleSceneV3();bad.entities[0].pointsMm[0].x=Infinity;
  expect(()=>validateSceneV3(bad)).toThrow(/Entidade/);
 });
 it("prevents arbitrary edits/removal of parametric entity",()=>{
  const s=exampleSceneV3();s.entities[0].mode="PARAMETRIC";
  const editor=createSceneEditorV3(s);
  expect(()=>moveScenePointV3(editor,"curve-a",0,{x:20,y:21})).toThrow(/paramétrico/);
  expect(()=>removeSceneEntity(editor,"curve-a")).toThrow(/paramétrica/);
 });
 it("supports explicit 0.2 migration preserving earlier moves",()=>{
  const legacy=sceneMove(createSceneEditor(exampleScene()),"curve-a",1,{x:48,y:40});
  const migrated=migrateSceneV2(legacy.project);
  expect(migrated.formatVersion).toBe("0.3.0");
  expect(migrated.history[0].kind).toBe("MOVE_POINT");
  expect(createSceneEditorV3(migrated).past).toHaveLength(1);
  expect(()=>parseSceneV3(JSON.stringify(legacy.project))).toThrow(/Versão/);
 });
 it("rejects corrupt 0.2 before explicit migration",()=>{
  const legacy=exampleScene();
  legacy.entities[1].id=legacy.entities[0].id;
  expect(()=>migrateSceneV2(legacy)).toThrow();
 });
 it("retains original object immutability for moves and removals",()=>{
  const base=createSceneEditorV3();
  const added=addSceneEntity(base,line("line-new"));
  const moved=move(added);
  const removed=removeSceneEntity(moved,"line-new");
  expect(base.project.entities).toHaveLength(3);
  expect(added.project.entities.at(-1)?.pointsMm[0].x).toBe(25);
  expect(moved.project.entities.at(-1)?.pointsMm[0].x).toBe(33);
  expect(removed.project.entities).toHaveLength(3);
 });
});
