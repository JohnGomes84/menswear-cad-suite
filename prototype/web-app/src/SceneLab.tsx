import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, PointerEvent } from "react";
import {
  createSceneEditor, exampleScene, parseScene, sceneMove,
  sceneRedo, sceneUndo, serializeScene
} from "./scene";
import type { SceneEditor, SketchEntity } from "./scene";
import type { Vec2 } from "./domain";
import { evaluateSyntheticCurve } from "./geometry";
import type { CubicControls } from "./geometry";

type View={x:number;y:number;width:number;height:number};
type Drag=
 | {type:"MOVE";pointerId:number;entityId:string;pointIndex:number}
 | {type:"PAN";pointerId:number;lastX:number;lastY:number};
const initialView:View={x:0,y:0,width:240,height:160};
const position=(p:Vec2)=>`${p.x.toFixed(2)}, ${p.y.toFixed(2)} mm`;

export default function SceneLab({onBack}:{onBack:()=>void}) {
 const [editor,setEditor]=useState<SceneEditor>(()=>createSceneEditor());
 const [view,setView]=useState<View>(initialView);
 const [selectedId,setSelectedId]=useState<string>("curve-a");
 const [selectedPoint,setSelectedPoint]=useState<number|null>(null);
 const [preview,setPreview]=useState<{entityId:string;pointIndex:number;p:Vec2}|null>(null);
 const [message,setMessage]=useState("");
 const svgRef=useRef<SVGSVGElement>(null);
 const dragRef=useRef<Drag|null>(null);
 const fileRef=useRef<HTMLInputElement>(null);
 const entities=editor.project.entities;
 const chosen=entities.find(e=>e.id===selectedId)??entities[0];
 const currentPoints=(entity:SketchEntity):Vec2[]=>
   entity.pointsMm.map((p,i)=>preview?.entityId===entity.id&&preview.pointIndex===i?preview.p:p);
 const inspect=useMemo(()=>{
   if(chosen.kind==="LINE"){
     const a=chosen.pointsMm[0],b=chosen.pointsMm[1];
     const lengthMm=Math.hypot(b.x-a.x,b.y-a.y);
     return lengthMm<=1e-9
       ? {state:"FAIL" as const,message:"Linha degenerada"}
       : {state:"PASS" as const,lengthMm,notches:[]};
   }
   const controls=chosen.pointsMm as unknown as CubicControls;
   return evaluateSyntheticCurve(controls);
 },[chosen]);
 const toWorld=(e:PointerEvent<SVGSVGElement>):Vec2=>{
   const svg=svgRef.current;
   const matrix=svg?.getScreenCTM();
   if(!svg||!matrix) return {x:0,y:0};
   const p=svg.createSVGPoint();
   p.x=e.clientX;p.y=e.clientY;
   const world=p.matrixTransform(matrix.inverse());
   return {x:Math.round(world.x*1000)/1000,y:Math.round(world.y*1000)/1000};
 };
 const startMove=(e:PointerEvent<SVGCircleElement>,entity:SketchEntity,index:number)=>{
   if(entity.mode!=="FREE"){setMessage("Entidade paramétrica: edição exige override explícito");return;}
   e.stopPropagation();e.preventDefault();
   setSelectedId(entity.id);setSelectedPoint(index);setMessage("");
   svgRef.current?.setPointerCapture(e.pointerId);
   dragRef.current={type:"MOVE",pointerId:e.pointerId,entityId:entity.id,pointIndex:index};
 };
 const startPan=(e:PointerEvent<SVGSVGElement>)=>{
   const t=e.target as SVGElement;
   if(t===e.currentTarget||t.dataset.pan==="true"){
     e.currentTarget.setPointerCapture(e.pointerId);
     dragRef.current={type:"PAN",pointerId:e.pointerId,lastX:e.clientX,lastY:e.clientY};
   }
 };
 const move=(e:PointerEvent<SVGSVGElement>)=>{
   const drag=dragRef.current;
   if(!drag||drag.pointerId!==e.pointerId)return;
   if(drag.type==="MOVE")setPreview({entityId:drag.entityId,pointIndex:drag.pointIndex,p:toWorld(e)});
   else{
     const svg=svgRef.current,matrix=svg?.getScreenCTM();
     if(!svg||!matrix)return;
     const a=svg.createSVGPoint(),b=svg.createSVGPoint();
     a.x=drag.lastX;a.y=drag.lastY;b.x=e.clientX;b.y=e.clientY;
     const aw=a.matrixTransform(matrix.inverse()),bw=b.matrixTransform(matrix.inverse());
     setView(v=>({...v,x:v.x-(bw.x-aw.x),y:v.y-(bw.y-aw.y)}));
     drag.lastX=e.clientX;drag.lastY=e.clientY;
   }
 };
 const end=(e:PointerEvent<SVGSVGElement>)=>{
   const drag=dragRef.current;
   if(!drag||drag.pointerId!==e.pointerId)return;
   if(drag.type==="MOVE"){
     const point=toWorld(e);
     try{setEditor(s=>sceneMove(s,drag.entityId,drag.pointIndex,point));}
     catch(err){setMessage(err instanceof Error?err.message:String(err));}
     setPreview(null);
   }
   dragRef.current=null;
   if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
 };
 const zoom=(factor:number)=>{
   setView(v=>({...v,x:v.x+(v.width-v.width*factor)/2,y:v.y+(v.height-v.height*factor)/2,width:v.width*factor,height:v.height*factor}));
 };
 const download=()=>{
   const blob=new Blob([serializeScene(editor.project)],{type:"application/json"});
   const url=URL.createObjectURL(blob);
   const a=document.createElement("a");a.href=url;a.download="cena-sintetica-0.2.cadlab.json";a.click();
   URL.revokeObjectURL(url);
 };
 const open=async(e:ChangeEvent<HTMLInputElement>)=>{
   const file=e.target.files?.[0];if(!file)return;
   try{
     const project=parseScene(await file.text());
     setEditor(createSceneEditor(project));
     setSelectedId(project.entities[0].id);setSelectedPoint(null);setPreview(null);setMessage("");
   }catch(err){setMessage(err instanceof Error?err.message:String(err));}
   finally{e.target.value="";}
 };
 return <div className="app">
   <aside className="sidebar">
     <div className="brand"><div className="brand-mark">M</div><div><strong>Menswear CAD</strong><span>Laboratório multi-entidades</span></div></div>
     <div className="menu-title">NAVEGAÇÃO</div>
     <button className="nav-button" onClick={onBack}>← Editor inicial</button>
     <button className="nav-button active">▧ Cena multi-entidades</button>
     <div className="sidebar-foot"><span className="status-dot"/> Schema 0.2.0 sintético<br/><small>Molde real: NO-GO</small></div>
   </aside>
   <main className="workspace">
     <header className="topbar">
       <div><span className="breadcrumb">Workspace / Laboratório / </span><strong>Cena multi-entidades</strong></div>
       <div className="top-actions">
         <button onClick={()=>{setEditor(createSceneEditor(exampleScene()));setSelectedId("curve-a");setView(initialView);setMessage("");}}>Novo exemplo</button>
         <button onClick={()=>fileRef.current?.click()}>Abrir JSON 0.2</button>
         <button className="primary" onClick={download}>Salvar JSON 0.2</button>
         <input ref={fileRef} type="file" hidden accept=".json,application/json" onChange={open}/>
       </div>
     </header>
     <div className="content">
       <div className="heading"><div><h1>Editor CAD — múltiplas entidades</h1><p>Linhas e curvas em grupos independentes, com seleção e histórico reversível.</p></div><span className="pill">LABORATÓRIO 0.2</span></div>
       <div className="warning"><strong>Geometria sintética — não utilizar para corte.</strong> Grupos de desenho não representam peças de vestuário aprovadas.</div>
       {message&&<div className="error" role="alert">{message}</div>}
       <div className="editor-layout">
         <section className="board">
           <div className="toolbar">
             <div className="tool-left"><span className="tool-label">MULTI-ENTITY SKETCH</span><button onClick={()=>setEditor(sceneUndo)} disabled={!editor.past.length}>↶ Desfazer</button><button onClick={()=>setEditor(sceneRedo)} disabled={!editor.future.length}>↷ Refazer</button></div>
             <div className="tool-right"><button onClick={()=>zoom(1.2)}>−</button><span>{Math.round(240/view.width*100)}%</span><button onClick={()=>zoom(1/1.2)}>+</button><button onClick={()=>setView(initialView)}>Enquadrar</button></div>
           </div>
           <svg ref={svgRef} className="drawing" viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} onPointerDown={startPan} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
             <defs><pattern id="lab-grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="#dbe5f1" strokeWidth=".25"/></pattern></defs>
             <rect data-pan="true" x="-2000" y="-2000" width="5000" height="5000" fill="#fbfdff"/>
             <rect data-pan="true" x="-2000" y="-2000" width="5000" height="5000" fill="url(#lab-grid)"/>
             {entities.map(e=>{
               const pts=currentPoints(e);
               const d=e.kind==="LINE"
                 ?`M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`
                 :`M ${pts[0].x} ${pts[0].y} C ${pts[1].x} ${pts[1].y}, ${pts[2].x} ${pts[2].y}, ${pts[3].x} ${pts[3].y}`;
               const active=selectedId===e.id;
               return <g key={e.id}>
                 <path d={d} fill="none" stroke={active?"#2358bb":"#7895bc"} strokeWidth={active?1.6:1.1}
                   onClick={()=>{setSelectedId(e.id);setSelectedPoint(null);}} style={{cursor:"pointer"}}/>
                 {active&&pts.map((p,i)=><g key={i}>
                   <circle cx={p.x} cy={p.y} r="4" fill="transparent" onPointerDown={ev=>startMove(ev,e,i)} style={{cursor:"grab"}}/>
                   <circle cx={p.x} cy={p.y} r="1.6" fill="#fff" stroke="#2358bb" strokeWidth=".7" pointerEvents="none"/>
                   <text x={p.x+4} y={p.y-4} fontSize="3.6" fill="#506e96" pointerEvents="none">P{i}</text>
                 </g>)}
               </g>;
             })}
           </svg>
           <div className="board-footer"><span>Selecione uma entidade, arraste pontos ou navegue pelo fundo.</span><span>mm • Canvas vetorial</span></div>
         </section>
         <aside className="inspector">
           <h2>Grupos e entidades</h2>
           {editor.project.pieces.map(piece=><div key={piece.id}>
             <h3>{piece.name}</h3>
             {entities.filter(e=>e.pieceId===piece.id).map(e=>
               <button key={e.id} className={`point-row ${e.id===selectedId?"chosen":""}`}
                 onClick={()=>{setSelectedId(e.id);setSelectedPoint(null);}}>
                 <b>{e.id}</b><span>{e.kind==="LINE"?"Linha":"Bézier"}</span>
               </button>
             )}
           </div>)}
           <hr/><h3>Selecionada: {chosen.id}</h3>
           <div className="inspector-item"><span>Grupo</span><strong>{chosen.pieceId}</strong></div>
           <div className="inspector-item"><span>Modo</span><strong>{chosen.mode}</strong></div>
           <div className="inspector-item"><span>Comprimento sintético</span><strong>{inspect.state==="PASS"?inspect.lengthMm.toFixed(2)+" mm":"FAIL"}</strong></div>
           {chosen.pointsMm.map((p,i)=><button key={i} className={`point-row ${selectedPoint===i?"chosen":""}`} onClick={()=>setSelectedPoint(i)}>
             <b>P{i}</b><span>{position(p)}</span>
           </button>)}
           <div className="inspector-note">Esta cena é um experimento de geometria multi-entidades. Costuras, margens, pences e caimento: NOT_YET_DEFINED.</div>
         </aside>
       </div>
       <div className="stats">
         <div><span>Grupos</span><strong>{editor.project.pieces.length}</strong></div>
         <div><span>Entidades</span><strong>{entities.length}</strong></div>
         <div><span>Revisão</span><strong>{editor.project.revision}</strong></div>
         <div><span>Formato</span><strong>0.2.0</strong></div>
       </div>
     </div>
   </main>
 </div>;
}
