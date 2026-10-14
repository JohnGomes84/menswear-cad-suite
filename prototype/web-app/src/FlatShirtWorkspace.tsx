import './mi001.css';
import {useMemo,useRef,useState} from 'react';
import type {ChangeEvent} from 'react';
import {SHIRT_KEYS,createShirtProject,changeShirtMeasurement,parseShirtProject,serializeShirtProject} from './flatShirtProject';
import type {ShirtProject,ShirtMeasureKey} from './flatShirtProject';
import {exportShirtSvg,exportShirtPdf,exportCalibrationPdf} from './flatShirtExport';
const labels:Record<ShirtMeasureKey,string>={chest:'Tórax',scye_depth:'Profundidade de cava',back_neck_to_waist:'Nuca à cintura',neck_size:'Pescoço',half_back:'Meia-costas',garment_length:'Comprimento da camisa',one_piece_sleeve_length:'Manga uma folha',close_wrist:'Punho justo'};
function saveFile(data:string|Uint8Array,mime:string,name:string){
 const blob=new Blob([typeof data==='string'?data:new Uint8Array(data).buffer],{type:mime});
 const href=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=href;a.download=name;a.click();URL.revokeObjectURL(href);
}
export default function FlatShirtWorkspace({onBack}:{onBack:()=>void}){
 const [project,setProject]=useState<ShirtProject>(()=>createShirtProject());
 const [error,setError]=useState('');const input=useRef<HTMLInputElement>(null);
 const [selection,setSelection]=useState<string>('FRONT');
 const svg=useMemo(()=>exportShirtSvg(project,false),[project]);
 const selected=project.pieces.find(p=>p.id===selection)??project.pieces[0];
 function diagnosticExport(kind:'SVG'|'PDF'){
  try{
   const data=kind==='SVG'?exportShirtSvg(project):exportShirtPdf(project);
   saveFile(data,kind==='SVG'?'image/svg+xml':'application/pdf',kind==='SVG'?'flat-shirt-core-diagnostic-1to1.svg':'flat-shirt-core-diagnostic-1to1.pdf');
   setError('');
  }catch(err){setError(err instanceof Error?err.message:String(err));}
 }
 function change(key:ShirtMeasureKey,text:string){
  const cm=Number(text);
  try{if(text.trim()===''||!Number.isFinite(cm))throw Error('Informe um número em cm');
   const next=changeShirtMeasurement(project,key,cm*10);setProject(next);setError('');
  }catch(e){setError(e instanceof Error?e.message:String(e));}
 }
 async function open(e:ChangeEvent<HTMLInputElement>){
  const file=e.target.files?.[0];if(!file)return;
  try{const next=parseShirtProject(await file.text());setProject(next);setError('');setSelection('FRONT')}
  catch(err){setError(err instanceof Error?err.message:String(err));}
  finally{e.target.value='';}
 }
 return <div className="app" data-testid="mi001-workspace">
 <aside className="sidebar">
  <div className="brand"><div className="brand-mark">M</div><div><strong>Menswear CAD</strong><span>Marco Integrador 001</span></div></div>
  <div className="menu-title">BIBLIOTECA</div>
  <button className="nav-button" onClick={onBack}>← Voltar</button>
  <button className="nav-button active">Flat Shirt Core — experimental</button>
  <button className="nav-button" disabled>Demais famílias: não liberadas</button>
  <div className="sidebar-foot"><span className="status-dot"/>DRAFT / RESEARCH<br/>cutReady=false<br/>Gate B: NO-GO</div>
 </aside>
 <main className="workspace"><header className="topbar"><div><span className="breadcrumb">Biblioteca / Camisas / </span><strong>Flat Shirt Core</strong></div><div className="top-actions"><button onClick={()=>input.current?.click()}>Abrir projeto</button><button onClick={()=>saveFile(serializeShirtProject(project),'application/json','flat-shirt-core.draft.json')}>Salvar projeto</button></div></header>
 <input ref={input} type="file" accept=".json,application/json" onChange={open} hidden aria-label="Abrir projeto Flat Shirt"/>
 <div className="content">
  <div className="heading"><div><h1>Flat Shirt Core — projeto versionado</h1><p>Método {project.method.id} / {project.method.version} · revisão {project.revision} · mm canônicos</p></div><span className="pill">NÃO CORTAR</span></div>
  <div className="warning" role="status"><strong>Curvas e fechamentos PROVISÓRIOS.</strong> Contornos experimentais para validar o fluxo digital. Escala física, montagem e caimento: NOT_RUN. Não são moldes industriais.</div>
  {error&&<div className="error" role="alert">{error}</div>}
  <div className="mi001-layout">
   <section className="mi001-library">
    <h2>Medidas (cm)</h2>
    <p>Exemplos do livro; comprimento escolhido para demonstração. Alterar uma medida regenera o mesmo projeto.</p>
    {SHIRT_KEYS.map(key=><label className="mi001-field" key={key}>{labels[key]}
      <input aria-label={labels[key]} key={key+project.revision} type="number" min="0.1" step="0.1"
       defaultValue={project.measurements[key].valueMm/10} onBlur={e=>change(key,e.target.value)} />
      <small>{project.measurements[key].origin}</small>
     </label>)}
    <button className="primary" onClick={()=>{setProject(createShirtProject());setError('');}}>Reiniciar exemplo</button>
    <h3>Exportação diagnóstica</h3>
    <div className="mi001-buttons">
     <button onClick={()=>diagnosticExport('SVG')}>Exportar SVG nominal 1:1</button>
     <button onClick={()=>diagnosticExport('PDF')}>Exportar PDF nominal 1:1</button>
     <button onClick={()=>saveFile(exportCalibrationPdf(),'application/pdf','calibracao-a4-100percent.pdf')}>Ficha A4 de calibração</button>
    </div>
    <small>PDF diagnóstico: folha personalizada de 1200 × 850 mm para plotter; sem paginação A4. Exportações falham se peças não couberem sem sobreposição. Imprimir sem ajustar à página. Conferir primeiro o PDF de calibração A4.</small>
   </section>
   <section className="mi001-drafting">
    <h2>Mesa de modelagem · projeção diagnóstica</h2>
    <div className="mi001-canvas" data-testid="shirt-svg-viewport" dangerouslySetInnerHTML={{__html:svg}}/>
    <p>Linhas tracejadas = solução técnica provisória. Nenhum traço está autorizado como linha industrial de corte.</p>
    <div className="mi001-pieces">{project.pieces.map(p=><button key={p.id} className={p.id===selection?'primary':''} onClick={()=>setSelection(p.id)}>{p.id} · {p.edges.length} bordas</button>)}</div>
   </section>
   <aside className="mi001-inspector">
    <h2>Propriedades e evidências</h2>
    <p><strong>{selected.id}</strong> · {selected.points.length} pontos, {selected.edges.length} linhas diagnósticas</p>
    <p>ID e dependências preservados. Papéis industriais indefinidos até revisão.</p>
    <div className="mi001-scroll">{selected.edges.map(e=><div key={e.id} className="mi001-edge"><strong>{e.id}</strong> · {e.kind}<small>{e.origin} / {e.role}</small><small>{e.solution}</small><small>{e.review.state} · {e.source}</small></div>)}</div>
    <h3>Decisões técnicas versionadas</h3>
    <div className="mi001-scroll">{project.decisions.map(d=><p key={d.id}><strong>{d.id}@{d.version}</strong><small> · {d.status}</small><br/><small>{d.description}</small></p>)}</div>
    <h3>Gate e provas</h3>
    <p>cutReady: <strong>false</strong></p><p>Escala física: <strong>{project.release.scalePhysical}</strong></p><p>Montagem: <strong>{project.release.assembly}</strong></p><p>Caimento: <strong>{project.release.fit}</strong></p>
    <div>{project.evidence.map(x=><p key={x.id}>{x.id}: <strong>{x.state}</strong>{x.evidenceRef?' ('+x.evidenceRef+')':''}</p>)}</div>
   </aside>
  </div>
 </div></main></div>;
}
