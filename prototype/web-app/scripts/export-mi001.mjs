/** Generate deterministic MI-001 diagnostic deliverables from the browser's own core. */
import {build} from 'esbuild';
import {mkdtemp,writeFile,readFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const temp=await mkdtemp(join(tmpdir(),'menswear-mi001-'));
try{
 const source=join(temp,'entry.ts'),target=join(temp,'entry.mjs');
 await writeFile(source,`export {createShirtProject,serializeShirtProject,changeShirtMeasurement} from ${JSON.stringify(resolve('src/flatShirtProject.ts'))};\nexport {exportShirtSvg,exportShirtPdf,exportCalibrationPdf} from ${JSON.stringify(resolve('src/flatShirtExport.ts'))};\nexport {cubicLength} from ${JSON.stringify(resolve('src/geometry.ts'))};\n`);
 await build({entryPoints:[source],outfile:target,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const x=await import(pathToFileURL(target).href);
 const project=x.createShirtProject();
 const regenerated=x.changeShirtMeasurement(project,'chest',1120);
 const dir=resolve('mi001-artifacts');await mkdir(dir,{recursive:true});
 const diagnostic=(p)=>{
  const pts=piece=>Object.fromEntries(piece.points.map(pt=>[pt.id,pt.positionMm]));
  const len=(e,points)=>e.controlsMm?x.cubicLength([points[e.from],...e.controlsMm,points[e.to]]):Math.hypot(points[e.to].x-points[e.from].x,points[e.to].y-points[e.from].y);
  const armholes=p.pieces.filter(q=>['FRONT','BACK'].includes(q.id)).map(piece=>{
   const points=pts(piece);
   const edges=piece.edges.filter(e=>(e.from.endsWith(':17')&&e.to.endsWith(':12'))||(e.from.endsWith(':12')&&e.to.endsWith(':5')));
   return {pieceId:piece.id,segments:edges.map(e=>({id:e.id,from:e.from,to:e.to,role:e.role,sourceSolution:e.solution,lengthMm:len(e,points)})),totalMm:edges.reduce((v,e)=>v+len(e,points),0)};
  });
  const sleeve=p.pieces.find(q=>q.id==='SLEEVE'),points=pts(sleeve),cap=sleeve.edges.filter(e=>e.solution==='SLEEVE_HEAD_INTERPOLATION@1.0.2');
  const sleeveTotalMm=cap.reduce((v,e)=>v+len(e,points),0);
  return {warning:'No approved seam pair/ease/assembly; diagnostic only',method:p.method,revision:p.revision,unit:'mm',diagonalMm:Math.hypot(points['SLEEVE:0'].x-points['SLEEVE:3'].x,points['SLEEVE:0'].y-points['SLEEVE:3'].y),sourceFifths:[5,6,7,8].map(i=>({id:i,pointMm:points['SLEEVE:'+i]})),hollow5Mm:points['SLEEVE:HEAD_HOLLOW_5'].y-points['SLEEVE:5'].y,raise78Mm:points['SLEEVE:HEAD_RAISE_78'].y-(points['SLEEVE:7'].y+points['SLEEVE:8'].y)/2,armholes,sleeveCap:{segments:cap.map(e=>({id:e.id,from:e.from,to:e.to,role:e.role,sourceSolution:e.solution,lengthMm:len(e,points)})),totalMm:sleeveTotalMm},sleeveMinusBothArmholesMm:sleeveTotalMm-armholes.reduce((v,a)=>v+a.totalMm,0),release:p.release};
 };
 const files=[
  ['flat-shirt-core-initial.draft.json',x.serializeShirtProject(project)],
  ['flat-shirt-core-chest112.draft.json',x.serializeShirtProject(regenerated)],
  ['flat-shirt-core-diagnostic-1to1.svg',x.exportShirtSvg(regenerated)],
  ['flat-shirt-core-diagnostic-1to1.pdf',x.exportShirtPdf(regenerated)],
  ['calibracao-a4-100percent.pdf',x.exportCalibrationPdf()],
  ['sleeve-cap-numeric-diagnostic.json',JSON.stringify(diagnostic(regenerated),null,2)+'\n'],
  ['mi001-status.json',JSON.stringify({format:'MI001-report/0.1.0',method:regenerated.method,pieces:regenerated.pieces.map(p=>({id:p.id,points:p.points.length,edges:p.edges.length})),projectRevision:regenerated.revision,cutReady:false,scalePhysical:'NOT_RUN',assembly:'NOT_RUN',fit:'NOT_RUN'},null,2)+'\n']
 ];
 for(const [name,data] of files){await writeFile(join(dir,name),data);console.log('MI001 GENERATED',name,(await readFile(join(dir,name))).length);}
}finally{await rm(temp,{recursive:true,force:true});}
