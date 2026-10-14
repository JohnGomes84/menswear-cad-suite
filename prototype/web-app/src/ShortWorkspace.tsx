import './mi001.css';
import {useMemo,useRef,useState} from 'react';
import type {ChangeEvent} from 'react';
import {SHORT_KEYS,SHORT_LABELS,createShortProject,changeShortMeasure,loadShortProject,saveShortProject,shortDiagnostic,proposeShortAllowance} from './shortProject';
import type {ShortKey,ShortProject} from './shortProject';
import {exportShortSvg,exportShortA4,paginateShortA4,shortExportRecord} from './shortExport';
function save(data:string|Uint8Array,mime:string,filename:string){
 const blob=new Blob([typeof data==='string'?data:new Uint8Array(data).buffer],{type:mime}),href=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=href;a.download=filename;a.click();URL.revokeObjectURL(href);
}
export default function ShortWorkspace({onBack}:{onBack:()=>void}){
 const [project,setProject]=useState<ShortProject>(()=>createShortProject());
 const [selection,setSelection]=useState<'FRONT'|'BACK'>('FRONT'),[error,setError]=useState('');
 const input=useRef<HTMLInputElement>(null);
 const diagnostic=useMemo(()=>shortDiagnostic(project),[project]);
 const svg=useMemo(()=>exportShortSvg(project),[project]);
 const tiles=useMemo(()=>paginateShortA4(project),[project]);
 const selected=project.pieces.find(p=>p.id===selection)!;
 const result=diagnostic.pieces.find(x=>x.id===selection)!;
 const measure=(key:ShortKey,text:string)=>{
  const cm=Number(text);
  try{if(!text.trim()||!Number.isFinite(cm))throw Error('Digite uma medida válida em cm');
   setProject(changeShortMeasure(project,key,cm*10));setError('');
  }catch(e){setError(e instanceof Error?e.message:String(e))}
 };
 const a4=(kind:'PDF'|'MAP')=>{
  try{const meta={commitSha:import.meta.env.VITE_COMMIT_SHA??'',generatedAtISO:new Date().toISOString()};
   if(kind==='PDF')save(exportShortA4(project,meta),'application/pdf','mi002-short-sambacancao-a4-100percent.pdf');
   else save(JSON.stringify(shortExportRecord(project,meta),null,2)+'\n','application/json','mi002-short-a4-paginas.json');
   setError('');
  }catch(e){setError(e instanceof Error?e.message:String(e))}
 };
 const open=async(event:ChangeEvent<HTMLInputElement>)=>{
  const file=event.target.files?.[0];if(!file)return;
  try{const next=loadShortProject(await file.text());setProject(next);setSelection('FRONT');setError('')}
  catch(e){setError(e instanceof Error?e.message:String(e))}finally{event.target.value=''}
 };
 return <div className="app" data-testid="mi002-workspace">
 <aside className="sidebar">
  <div className="brand"><div className="brand-mark">M</div><div><strong>Menswear CAD</strong><span>MI-002 · Short simples</span></div></div>
  <div className="menu-title">BIBLIOTECA</div>
  <button className="nav-button" onClick={onBack}>← Voltar</button>
  <div className="menu-title">BLOCO ATIVO</div><strong>Samba-canção com elástico</strong>
  <small>Duas peças, sem braguilha, bolso, forro ou margens definidas.</small>
  <div className="menu-title">ESTADO DO PROJETO</div><small>{project.projectId}</small>
  <small>{project.method.id}@{project.method.version}</small><small>Revisão {project.revision} · fonte: briefing do titular</small>
 </aside>
 <main className="workspace">
  <header className="workspace-header"><div><h1>MI-002 · Short de elástico simples</h1>
   <p>Geometria técnica candidata · desenho e impressão diagnósticos · sem método industrial aprovado.</p></div>
   <span role="status">DRAFT / NO CUT / PROVISIONAL GEOMETRY</span></header>
  {error&&<div role="alert" className="error">{error}</div>}
  <div className="mi001-layout">
   <section className="mi001-library"><h2>Medidas (cm)</h2>
    <p>Entradas editáveis; armazenamento interno em mm. As fórmulas geométricas são técnicas e aguardam decisão.</p>
    {SHORT_KEYS.map(key=><label className="mi001-field" key={key}>{SHORT_LABELS[key]}
     <input aria-label={SHORT_LABELS[key]} key={key+project.revision} type="number" min="0.1" step="0.1"
      defaultValue={project.measurements[key]/10} onBlur={e=>measure(key,e.target.value)}/>
     <small>{project.measurements[key]} mm</small></label>)}
    <button onClick={()=>{setProject(createShortProject());setError('')}}>Reiniciar exemplo</button>
    <h3>Salvar / abrir / imprimir</h3><div className="mi001-buttons">
     <button onClick={()=>save(saveShortProject(project),'application/json','mi002-short.draft.json')}>Salvar projeto MI-002</button>
     <button onClick={()=>input.current?.click()}>Abrir projeto MI-002</button><input type="file" ref={input} accept=".json" onChange={open} hidden/>
     <button onClick={()=>save(svg,'image/svg+xml','mi002-short-diagnostic.svg')}>Exportar SVG 1:1</button>
     <button onClick={()=>a4('PDF')}>Exportar PDF A4 paginado 100%</button>
     <button onClick={()=>a4('MAP')}>Mapa A4 de montagem</button>
     <button onClick={()=>save(JSON.stringify(diagnostic,null,2)+'\n','application/json','mi002-diagnostico.json')}>Diagnóstico de comprimentos JSON</button>
    </div><small>PDF A4: 100% tamanho real, sem ajustar à página; marcas com coordenadas iguais nas folhas vizinhas. Impressão física ainda NOT_RUN.</small>
   </section>
   <section className="mi001-drafting"><h2>Mesa de modelagem · frente e costas</h2>
    <div className="mi001-canvas" data-testid="mi002-svg-viewport" dangerouslySetInnerHTML={{__html:svg}}/>
    <p>Linhas azuis = propostas de contorno sem papel industrial; tracejadas = construção. Sem margem/corte autorizado.</p>
    <div className="mi001-pieces">{project.pieces.map(p=><button key={p.id} className={p.id===selection?'primary':''}
     onClick={()=>setSelection(p.id)}>{p.id} · {p.edges.length} arestas</button>)}</div>
    <p data-testid="mi002-page-total">Paginação: {tiles.length} folhas A4; frente {tiles.filter(x=>x.piece==='FRONT').length}, costas {tiles.filter(x=>x.piece==='BACK').length}.</p>
   </section>
   <aside className="mi001-inspector"><h2>Diagnóstico · {selection}</h2>
    <p data-testid="mi002-diagnostic">{'Cintura '+result.waistMm.toFixed(2)+' mm · lateral '+result.sideMm.toFixed(2)+
     ' mm · entreperna '+result.inseamMm.toFixed(2)+' mm · gancho '+result.crotchMm.toFixed(2)+' mm · barra '+result.hemMm.toFixed(2)+' mm'}</p>
    <p>cutReady: <strong>false</strong></p><p>Escala: <strong>{project.release.scalePhysical}</strong></p>
    <p>Montagem: <strong>{project.release.assembly}</strong></p><p>Caimento: <strong>{project.release.fit}</strong></p>
    <h3>Classificação e propostas de margem</h3><p>Nenhuma aresta é SEAM_LINE ou CUT_LINE. O valor padrão de margem é indefinido.</p>
    {selected.edges.map(e=><div className="mi001-edge" key={e.id} data-testid={'mi002-edge-'+e.id}>
      <strong>{e.id}</strong> · {e.from.split(':')[1]}→{e.to.split(':')[1]}
      <small>{e.classification} · {e.classificationOrigin} · {e.review}</small>
      <small>origin={e.origin} · solution={e.solution} · role={e.role}</small><small>{e.evidence}</small>
      <label>Margem proposta (mm; NÃO aplicada)
       <input aria-label={'Margem '+e.id} type="number" min="0" step="0.5"
        value={project.edgeAllowances[e.id].proposedMm??''}
        onChange={ev=>{
         try{const v=ev.target.value===''?null:Number(ev.target.value);
          setProject(proposeShortAllowance(project,e.id,v));setError('');
         }catch(err){setError(String(err))}
        }}/></label>
     </div>)}
    <h3>Decisões técnicas ainda pendentes</h3>
    {project.decisions.map(d=><p key={d.id}><strong>{d.id}</strong><small>{d.status} · {d.description}</small></p>)}
   </aside>
  </div>
 </main></div>;
}
