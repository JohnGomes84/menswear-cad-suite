import { describe, expect, it } from "vitest";
import {
 createSceneEditor, exampleScene, parseScene, sceneMove, sceneRedo,
 sceneUndo, serializeScene, validateScene
} from "./scene";

describe("Synthetic multi-entity sketch document",()=>{
 it("contains multiple named groups with independently addressable curves and line",()=>{
   const p=validateScene(exampleScene());
   expect(p.pieces).toHaveLength(2);
   expect(p.entities).toHaveLength(3);
   expect(new Set(p.entities.map(e=>e.id)).size).toBe(3);
   expect(p.entities.map(e=>e.kind)).toContain("LINE");
   expect(p.entities.map(e=>e.kind)).toContain("CUBIC_BEZIER");
 });
 it("roundtrips preserving stable IDs and group membership",()=>{
   const p=exampleScene();
   expect(parseScene(serializeScene(p))).toEqual(p);
 });
 it("edits only selected entity and increments global revision",()=>{
   const editor=createSceneEditor();
   const other=editor.project.entities[2];
   const changed=sceneMove(editor,"curve-a",1,{x:52,y:18});
   expect(changed.project.entities[0].pointsMm[1]).toEqual({x:52,y:18});
   expect(changed.project.entities[2]).toEqual(other);
   expect(changed.project.history[0].entityId).toBe("curve-a");
   expect(changed.project.revision).toBe(1);
 });
 it("restores undo/redo across multiple entities after reopening",()=>{
   let s=createSceneEditor();
   s=sceneMove(s,"curve-a",0,{x:30,y:115});
   s=sceneMove(s,"line-a",1,{x:95,y:97});
   s=sceneMove(s,"curve-b",2,{x:199,y:11});
   const initial=createSceneEditor();
   const reopened=createSceneEditor(parseScene(serializeScene(s.project)));
   expect(reopened.past).toHaveLength(3);
   const back=sceneUndo(sceneUndo(sceneUndo(reopened)));
   expect(back.project).toEqual(initial.project);
   expect(sceneRedo(sceneRedo(sceneRedo(back))).project).toEqual(s.project);
 });
 it("invalidates redo after a divergent new edit",()=>{
   const s=sceneMove(createSceneEditor(),"line-a",0,{x:7,y:7});
   const reverted=sceneUndo(s);
   const next=sceneMove(reverted,"curve-b",1,{x:140,y:35});
   expect(next.future).toHaveLength(0);
   expect(sceneRedo(next)).toEqual(next);
 });
 it("does not allow editing a parametric entity",()=>{
   const p=exampleScene();
   p.entities[0].mode="PARAMETRIC";
   const editor=createSceneEditor(p);
   expect(()=>sceneMove(editor,"curve-a",0,{x:8,y:9})).toThrow("paramétrica");
 });
 it("rejects malformed point counts and nonfinite coordinates",()=>{
   const p=exampleScene();
   p.entities[1].pointsMm.push({x:5,y:1});
   expect(()=>validateScene(p)).toThrow("Entidade inválida");
   const q=exampleScene();
   q.entities[0].pointsMm[0].x=Infinity;
   expect(()=>validateScene(q)).toThrow("Entidade inválida");
 });
 it("rejects duplicated IDs and missing piece references",()=>{
   const p=exampleScene();
   p.entities[1].id=p.entities[0].id;
   expect(()=>validateScene(p)).toThrow("Entidade inválida");
   const q=exampleScene();
   q.entities[1].pieceId="nonexistent";
   expect(()=>validateScene(q)).toThrow("Entidade inválida");
 });
 it("rejects tampering with the final entity geometry",()=>{
   const s=sceneMove(createSceneEditor(),"curve-b",2,{x:151,y:27});
   const q=structuredClone(s.project);
   q.entities[2].pointsMm[2].x=200;
   expect(()=>validateScene(q)).toThrow("adulterada");
 });
 it("rejects broken revision chain, absent history and unexpected formats",()=>{
   const s=sceneMove(createSceneEditor(),"curve-b",2,{x:151,y:27});
   const q=structuredClone(s.project);
   q.history[0].revision=2;
   expect(()=>validateScene(q)).toThrow("Evento");
   const r=structuredClone(s.project);
   r.history=[];
   expect(()=>validateScene(r)).toThrow("Histórico");
   const unknown={...s.project,formatVersion:"99.0"};
   expect(()=>validateScene(unknown)).toThrow("Versão");
 });
 it("does not mutate previous snapshot objects",()=>{
   const previous=createSceneEditor();
   const p=previous.project.entities[0].pointsMm[0].x;
   const next=sceneMove(previous,"curve-a",0,{x:p+4,y:115});
   expect(previous.project.entities[0].pointsMm[0].x).toBe(p);
   expect(next.project.entities[0].pointsMm[0].x).toBe(p+4);
 });
 it("has no garment-specific seam or measurement assumptions",()=>{
   const scene=exampleScene();
   expect("seamAllowance" in scene).toBe(false);
   expect("garment" in scene).toBe(false);
   expect(scene.purpose).toBe("SYNTHETIC_ONLY");
 });
});
