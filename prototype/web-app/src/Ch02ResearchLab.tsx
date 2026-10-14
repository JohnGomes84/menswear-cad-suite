import {useMemo,useState} from "react";
import type {FrontMethod,FrontVariant} from "./aldCh02FlatTrouserProgram";
import {buildCh02ResearchModel} from "./ch02ResearchViewModel";
import type {Ch02ResearchMeasurements} from "./ch02ResearchViewModel";

type MeasureKey="seatMm"|"bodyRiseMm"|"insideLegMm";
const defaults:Ch02ResearchMeasurements={
 seatMm:1020,bodyRiseMm:282,insideLegMm:800,variant:"BASIC"
};
const labelMm=(n:number)=>n.toFixed(1).replace(".",",")+" mm";

export default function Ch02ResearchLab({onBack}:{onBack:()=>void}){
 const [method,setMethod]=useState<FrontMethod>("ONE_PIECE");
 const [measurements,setMeasurements]=useState<Ch02ResearchMeasurements>(defaults);
 const [selectedId,setSelectedId]=useState("");
 const [showFront,setShowFront]=useState(true);
 const [showBack,setShowBack]=useState(true);
 const result=useMemo(()=>{
   try{return {model:buildCh02ResearchModel(method,measurements),error:""}}
   catch(error){return {model:null,error:error instanceof Error?error.message:String(error)}}
 },[method,measurements]);
 const model=result.model;
 const visiblePoints=model?.points.filter(p=>(p.section==="FRONT"?showFront:showBack))??[];
 const bounds=useMemo(()=>{
   if(!visiblePoints.length)return {x:-20,y:-20,width:400,height:450};
   const xs=visiblePoints.map(p=>p.pointMm.x),ys=visiblePoints.map(p=>p.pointMm.y);
   const loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys);
   const pad=Math.max(35,Math.max(hiX-loX,hiY-loY)*0.07);
   return {x:loX-pad,y:loY-pad,width:Math.max(hiX-loX+pad*2,100),
     height:Math.max(hiY-loY+pad*2,100)};
 },[visiblePoints]);
 const selected=model?.strokes.find(s=>s.id===selectedId)??model?.strokes[0];
 function changeMeasure(key:MeasureKey,text:string){
   const cm=Number(text);setMeasurements(prev=>({...prev,[key]:text.trim()===""?NaN:cm*10}));
 }
 const methodName=method==="ONE_PIECE"?"Calça plana de uma peça":"Calça plana de duas peças";
 const sectionName=(x:string)=>x==="FRONT"?"Frente":"Costas";
 return <div className="app">
  <aside className="sidebar">
   <div className="brand"><div className="brand-mark">M</div><div><strong>Menswear CAD</strong><span>Pesquisa paramétrica — Aldrich</span></div></div>
   <div className="menu-title">NAVEGAÇÃO</div>
   <button className="nav-button" onClick={onBack}>← Editor inicial</button>
   <button className="nav-button active">▧ Construção CH02</button>
   <button className="nav-button" disabled>✂ Corte industrial <small>não validado</small></button>
   <div className="sidebar-foot"><span className="status-dot"/> Pesquisa CH02 — fonte auditada<br/><small>Molde pronto: NO-GO</small></div>
  </aside>
  <main className="workspace">
   <header className="topbar">
    <div><span className="breadcrumb">Workspace / Pesquisa / </span><strong>Aldrich — capítulo 2</strong></div>
    <div className="top-actions"><button onClick={onBack}>Voltar ao editor</button><button disabled>Exportar para corte — bloqueado</button></div>
   </header>
   <div className="content">
    <div className="heading"><div><h1>Construção paramétrica documentada</h1>
     <p>Pontos calculados em milímetros pelo interpretador de Aldrich; retas prescritas pela fonte.</p></div>
     <span className="pill">PESQUISA · NO-CUT</span>
    </div>
    <div className="warning"><strong>Não utilizar para corte.</strong> As curvas aparecem somente como pontos-âncora, sem interpolação inventada. As linhas exibidas não são classificadas como costura nem linha de corte.</div>
    <div className="ch02-controls">
     <label>Método<select aria-label="Método de construção" value={method} onChange={e=>{setMethod(e.target.value as FrontMethod);setSelectedId("");}}>
       <option value="ONE_PIECE">Uma peça — flat</option><option value="TWO_PIECE">Duas peças — flat</option></select></label>
     <label>Folga<select aria-label="Variante" value={measurements.variant} onChange={e=>setMeasurements(v=>({...v,variant:e.target.value as FrontVariant}))}>
       <option value="BASIC">Básica</option><option value="EASY">Ampla / easy</option></select></label>
     {([
       ["seatMm","Quadril (cm)"],["bodyRiseMm","Altura do gancho (cm)"],["insideLegMm","Entreperna (cm)"]
      ] as [MeasureKey,string][]).map(([key,label])=><label key={key}>{label}
       <input aria-label={label} type="number" min="0.1" max="999.9" step="0.1"
        value={Number.isFinite(measurements[key])?measurements[key]/10:""}
        onChange={e=>changeMeasure(key,e.target.value)}/>
      </label>)}
    </div>
    {result.error&&<div className="error" role="alert">{result.error}</div>}
    {model&&<div className="editor-layout">
     <section className="board">
      <div className="toolbar"><div className="tool-left"><span className="tool-label">{methodName.toUpperCase()}</span><span className="separator"/><span className="ch02-source">Aldrich PDF p. {model.sourcePage} · Diagrama p. 34</span></div>
       <div className="tool-right"><label className="ch02-check"><input type="checkbox" checked={showFront} onChange={e=>setShowFront(e.target.checked)}/>Frente</label>
        <label className="ch02-check"><input type="checkbox" checked={showBack} onChange={e=>setShowBack(e.target.checked)}/>Costas</label></div>
      </div>
      <svg data-testid="ch02-source-viewport" className="drawing ch02-drawing" viewBox={bounds.x+" "+bounds.y+" "+bounds.width+" "+bounds.height} aria-label="Pontos de construção e retas auditadas, não aptos para corte">
       <rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} fill="#fcfdff"/>
       {model.strokes.filter(s=>s.geometry==="STRAIGHT"&&(s.section==="FRONT"?showFront:showBack)).map(stroke=>{
        if(stroke.geometry!=="STRAIGHT")return null;
        return <line data-testid={"book-line-"+stroke.id} key={stroke.id}
         x1={stroke.startMm.x} y1={stroke.startMm.y} x2={stroke.endMm.x} y2={stroke.endMm.y}
         vectorEffect="non-scaling-stroke" stroke={selected?.id===stroke.id?"#1749ad":stroke.section==="FRONT"?"#2b69bd":"#7789a6"}
         strokeWidth={selected?.id===stroke.id?3:1.7} onClick={()=>setSelectedId(stroke.id)} style={{cursor:"pointer"}}/>;
       })}
       {visiblePoints.map(p=><g key={p.id}>
        <circle cx={p.pointMm.x} cy={p.pointMm.y} r="4" fill={p.section==="FRONT"?"#316cba":"#a3b0c0"} stroke="#ffffff" strokeWidth="1"/>
        <text x={p.pointMm.x+6} y={p.pointMm.y-6} fontSize="12" fill="#385572" fontWeight="600">{p.id}</text>
       </g>)}
      </svg>
      <div className="board-footer"><span>Retas: traços sólidos. Curvas: apenas referências pontuais, sem linhas simuladas.</span><span>Coordenadas em mm · sem escala de impressão</span></div>
     </section>
     <aside className="inspector">
      <h2>Inspeção da fonte</h2>
      <div className="diagnostic"><span>Retas executáveis</span><strong>{model.sourceStraightCount}</strong></div>
      <div className="diagnostic"><span>Curvas não resolvidas</span><strong>{model.unresolvedCurveCount}</strong></div>
      <div className="diagnostic"><span>Cadeias orientadas abertas</span><strong>{model.paths.length}</strong></div>
      <hr/><h3>Traços documentados</h3>
      <div className="ch02-strokes">{model.strokes.map(stroke=><button type="button" key={stroke.id}
       className={"point-row "+(selected?.id===stroke.id?"chosen":"")}
       onClick={()=>setSelectedId(stroke.id)}>
        <b>{sectionName(stroke.section)}</b><span>{stroke.pointIds.join("–")}</span>
        <span>{stroke.geometry==="STRAIGHT"?"Reta":"Curva pendente"}</span>
       </button>)}</div>
      {selected&&<div className="ch02-selected">
       <h3>Entidade selecionada</h3>
       <div className="inspector-item"><span>ID da origem</span><strong>{selected.id}</strong></div>
       <div className="inspector-item"><span>Página PDF</span><strong>{selected.source.pdfPage}</strong></div>
       <div className="inspector-item"><span>Função industrial</span><strong>Não classificada</strong></div>
       {selected.geometry==="STRAIGHT"?<div className="inspector-item"><span>Comprimento geométrico</span><strong>{labelMm(selected.lengthMm)}</strong></div>
        :<div className="inspector-note">Curva aguardando solução geométrica documentada. A seleção mostra referências, não uma Bézier presumida.</div>}
      </div>}
      <hr/><h3>Bloqueios de segurança</h3>
      <div className="diagnostic"><span>Margem já incluída no bloco</span><strong>10 mm (fonte)</strong></div>
      <div className="diagnostic"><span>Exceções sem aresta definida</span><strong>{model.allowanceRegions.length}</strong></div>
      <div className="diagnostic"><span>Espelhamento</span><strong>Não executado</strong></div>
      <div className="diagnostic"><span>Contorno industrial</span><strong>NOT_YET_DEFINED</strong></div>
      <div className="inspector-note">Os valores publicados são uma fixture de referência, não medidas universais. A origem da construção é Aldrich 5ª ed.; a vista em SVG não define a geometria canônica.</div>
     </aside>
    </div>}
    {model&&<div className="stats">
     <div><span>Pontos calculados</span><strong>{model.points.length}</strong></div>
     <div><span>Comandos da fonte</span><strong>{model.strokes.length}</strong></div>
     <div><span>Curvas pendentes</span><strong>{model.unresolvedCurveCount}</strong></div>
     <div><span>Corte industrial</span><strong>Bloqueado</strong></div>
    </div>}
   </div>
  </main>
 </div>;
}