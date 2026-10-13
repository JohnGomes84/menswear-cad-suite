import { describe,expect,it } from "vitest";
import { exampleSceneV3, createSceneEditorV3,moveScenePointV3 } from "./sceneV3";
import type { DirectedConstraint } from "./constraints";
import {
 addDirectedConstraintV4,createConstrainedEditorV4,
 createConstrainedV4,migrateV3ToConstrainedV4,moveDrivingPointV4,
 parseConstrainedV4,redoConstrainedV4,removeDirectedConstraintV4,
 serializeConstrainedV4,undoConstrainedV4,validateConstrainedV4
} from "./constrainedSceneV4";

const ref=(entityId:string,pointIndex:number)=>({entityId,pointIndex});
const lineRule:DirectedConstraint={
  id:"h1",kind:"HORIZONTAL",source:ref("line-a",0),target:ref("line-a",1)
};
const base=()=>createConstrainedEditorV4(createConstrainedV4(exampleSceneV3()));

describe("Persistent directed constraints — scene 0.4 research overlay",()=>{
 it("creates separate explicit 0.4 document without altering 0.3 scene",()=>{
   const source=exampleSceneV3();
   const doc=migrateV3ToConstrainedV4(source);
   expect(doc.formatVersion).toBe("0.4.0");
   expect(doc.purpose).toBe("SYNTHETIC_ONLY");
   expect(doc.unit).toBe("mm");
   expect(doc.baseScene).toEqual(source);
   expect(doc.constraints).toHaveLength(0);
   expect(doc.resolvedEntities).toEqual(source.entities);
   expect(source.formatVersion).toBe("0.3.0");
 });
 it("persists horizontal alignment separately from authored driver geometry",()=>{
   const doc=addDirectedConstraintV4(base(),lineRule).project;
   expect(doc.revision).toBe(1);
   expect(doc.history[0].kind).toBe("ADD_CONSTRAINT");
   expect(doc.driverEntities[1].pointsMm[1]).toEqual({x:105,y:95});
   expect(doc.resolvedEntities[1].pointsMm[1]).toEqual({x:105,y:115});
   expect(doc.constraints).toEqual([lineRule]);
   expect(parseConstrainedV4(serializeConstrainedV4(doc))).toEqual(doc);
 });
 it("reactively updates dependent point after moving driver across a session",()=>{
   let state=addDirectedConstraintV4(base(),lineRule);
   state=moveDrivingPointV4(state,ref("line-a",0),{x:20,y:140});
   expect(state.project.driverEntities[1].pointsMm[0].y).toBe(140);
   expect(state.project.resolvedEntities[1].pointsMm[1].y).toBe(140);
   const loaded=createConstrainedEditorV4(parseConstrainedV4(serializeConstrainedV4(state.project)));
   expect(loaded.past).toHaveLength(2);
   const restored=undoConstrainedV4(loaded);
   expect(restored.project.resolvedEntities[1].pointsMm[1].y).toBe(115);
   expect(redoConstrainedV4(restored).project).toEqual(state.project);
 });
 it("removing a constraint restores original driver coordinates",()=>{
   let s=addDirectedConstraintV4(base(),lineRule);
   s=removeDirectedConstraintV4(s,"h1");
   expect(s.project.constraints).toHaveLength(0);
   expect(s.project.resolvedEntities[1].pointsMm[1].y).toBe(95);
   expect(undoConstrainedV4(s).project.resolvedEntities[1].pointsMm[1].y).toBe(115);
 });
 it("supports coincidence across groups with live recalculation",()=>{
   const rule:DirectedConstraint={
    id:"cross",kind:"COINCIDENT",
    source:ref("curve-a",0),target:ref("curve-b",3)
   };
   let s=addDirectedConstraintV4(base(),rule);
   expect(s.project.resolvedEntities[2].pointsMm[3]).toEqual({x:20,y:115});
   s=moveDrivingPointV4(s,ref("curve-a",0),{x:40,y:99});
   expect(s.project.resolvedEntities[2].pointsMm[3]).toEqual({x:40,y:99});
   expect(s.project.driverEntities[2].pointsMm[3]).toEqual({x:215,y:115});
 });
 it("does not move a dependent target directly",()=>{
   const s=addDirectedConstraintV4(base(),lineRule);
   expect(()=>moveDrivingPointV4(s,ref("line-a",1),{x:3,y:4}))
     .toThrow(/destino condicionado/);
 });
 it("rejects two rules on a target until a simultaneous solver is available",()=>{
   const s=addDirectedConstraintV4(base(),lineRule);
   const vertical:DirectedConstraint={
     id:"v1",kind:"VERTICAL",
     source:ref("line-a",0),target:ref("line-a",1)
   };
   expect(()=>addDirectedConstraintV4(s,vertical)).toThrow(/DUPLICATE_TARGET/);
   expect(s.project.constraints).toHaveLength(1);
 });
 it("rejects directed constraint cycles",()=>{
   const s=addDirectedConstraintV4(base(),lineRule);
   const cycle:DirectedConstraint={
     id:"cycle",kind:"COINCIDENT",
     source:ref("line-a",1),target:ref("line-a",0)
   };
   expect(()=>addDirectedConstraintV4(s,cycle)).toThrow(/CYCLIC_DEPENDENCY/);
 });
 it("rejects reusing a constraint ID after removal",()=>{
   let s=addDirectedConstraintV4(base(),lineRule);
   s=removeDirectedConstraintV4(s,"h1");
   expect(()=>addDirectedConstraintV4(s,lineRule)).toThrow(/reutilizado/);
 });
 it("supports a distance rule and explicit undetermined direction",()=>{
   const distance:DirectedConstraint={
     id:"d1",kind:"DISTANCE",distanceMm:50,
     source:ref("line-a",0),target:ref("line-a",1)
   };
   let s=addDirectedConstraintV4(base(),distance);
   const a=s.project.resolvedEntities[1].pointsMm[0];
   const b=s.project.resolvedEntities[1].pointsMm[1];
   expect(Math.hypot(a.x-b.x,a.y-b.y)).toBeCloseTo(50,7);
   expect(()=>moveDrivingPointV4(s,ref("line-a",0),{x:105,y:95}))
     .toThrow(/UNDETERMINED_DIRECTION/);
   expect(s.project.revision).toBe(1);
 });
 it("preserves an old 0.3 move when explicitly building 0.4",()=>{
   const before=moveScenePointV3(createSceneEditorV3(),"curve-a",0,{x:17,y:16}).project;
   const overlay=migrateV3ToConstrainedV4(before);
   expect(overlay.baseScene.history).toHaveLength(1);
   expect(overlay.resolvedEntities[0].pointsMm[0]).toEqual({x:17,y:16});
 });
 it("rejects version mismatch instead of silently importing a 0.3 project",()=>{
   expect(()=>parseConstrainedV4(JSON.stringify(exampleSceneV3()))).toThrow(/0.4.0/);
 });
 it("rejects tampering with projected results during import",()=>{
   const state=addDirectedConstraintV4(base(),lineRule);
   const raw=JSON.parse(serializeConstrainedV4(state.project));
   raw.resolvedEntities[1].pointsMm[1].y=110;
   expect(()=>validateConstrainedV4(raw)).toThrow(/não corresponde/);
 });
 it("rejects event revision tampering or partial history",()=>{
   const state=addDirectedConstraintV4(base(),lineRule);
   const raw=JSON.parse(serializeConstrainedV4(state.project));
   raw.history[0].revision=2;
   expect(()=>validateConstrainedV4(raw)).toThrow(/Revisão/);
   raw.history=[];
   expect(()=>validateConstrainedV4(raw)).toThrow(/Histórico/);
 });
 it("rejects corrupt REMOVE_CONSTRAINT payload",()=>{
   let state=addDirectedConstraintV4(base(),lineRule);
   state=removeDirectedConstraintV4(state,"h1");
   const raw=JSON.parse(serializeConstrainedV4(state.project));
   raw.history[1].constraint.target.pointIndex=0;
   expect(()=>validateConstrainedV4(raw)).toThrow(/não corresponde/);
 });
 it("supports undo/redo of removal across saved sessions",()=>{
   let state=addDirectedConstraintV4(base(),lineRule);
   state=removeDirectedConstraintV4(state,"h1");
   const restored=createConstrainedEditorV4(parseConstrainedV4(serializeConstrainedV4(state.project)));
   const previous=undoConstrainedV4(restored);
   expect(previous.project.constraints).toHaveLength(1);
   expect(redoConstrainedV4(previous).project.constraints).toHaveLength(0);
 });
 it("rejects unknown events and unsafe constraint geometry",()=>{
   const state=addDirectedConstraintV4(base(),lineRule);
   const raw=JSON.parse(serializeConstrainedV4(state.project));
   raw.history[0].kind="EVAL_SCRIPT";
   expect(()=>validateConstrainedV4(raw)).toThrow(/desconhecido/);
   raw.history[0].kind="ADD_CONSTRAINT";
   raw.history[0].constraint.source.entityId="missing";
   expect(()=>validateConstrainedV4(raw)).toThrow(/UNKNOWN_POINT/);
 });
 it("rejects malformed resolved geometry without crashing on untrusted fields",()=>{
   const s=addDirectedConstraintV4(base(),lineRule);
   const raw=JSON.parse(serializeConstrainedV4(s.project));
   raw.resolvedEntities[0]=null;
   expect(()=>validateConstrainedV4(raw)).toThrow(/não corresponde/);
   raw.resolvedEntities=[];
   expect(()=>validateConstrainedV4(raw)).toThrow(/não corresponde/);
 });
 it("rejects oversized event history before replay",()=>{
   const s=addDirectedConstraintV4(base(),lineRule);
   const raw=JSON.parse(serializeConstrainedV4(s.project));
   raw.history=Array(257).fill(raw.history[0]);
   raw.revision=257;
   expect(()=>validateConstrainedV4(raw)).toThrow(/limite experimental/);
 });
 it("does not include garment seams and never claims production validation",()=>{
   const s=addDirectedConstraintV4(base(),lineRule).project;
   expect("seamPair" in s).toBe(false);
   expect("cutContour" in s).toBe(false);
   expect(s.purpose).toBe("SYNTHETIC_ONLY");
 });
});
