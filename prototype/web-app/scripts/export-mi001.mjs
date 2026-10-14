/** Generate deterministic MI-001 diagnostic deliverables from the browser's own core. */
import {build} from 'esbuild';
import {mkdtemp,writeFile,readFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const temp=await mkdtemp(join(tmpdir(),'menswear-mi001-'));
try{
 const source=join(temp,'entry.ts'),target=join(temp,'entry.mjs');
 await writeFile(source,`export {createShirtProject,serializeShirtProject,changeShirtMeasurement} from ${JSON.stringify(resolve('src/flatShirtProject.ts'))};\nexport {exportShirtSvg,exportShirtPdf,exportCalibrationPdf} from ${JSON.stringify(resolve('src/flatShirtExport.ts'))};\nexport {compareShirtArmholesToHalfSleeve,exportCavaMangaOverlaySvg} from ${JSON.stringify(resolve('src/flatShirtSeamDiagnostic.ts'))};\n`);
 await build({entryPoints:[source],outfile:target,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const x=await import(pathToFileURL(target).href);
 const project=x.createShirtProject();
 const regenerated=x.changeShirtMeasurement(project,'chest',1120);
 const dir=resolve('mi001-artifacts');await mkdir(dir,{recursive:true});
 const files=[
  ['flat-shirt-core-initial.draft.json',x.serializeShirtProject(project)],
  ['flat-shirt-core-chest112.draft.json',x.serializeShirtProject(regenerated)],
  ['flat-shirt-core-diagnostic-1to1.svg',x.exportShirtSvg(regenerated)],
  ['flat-shirt-core-diagnostic-1to1.pdf',x.exportShirtPdf(regenerated)],
  ['calibracao-a4-100percent.pdf',x.exportCalibrationPdf()],
  ['cava-manga-chest100.diagnostic.json',JSON.stringify(x.compareShirtArmholesToHalfSleeve(project),null,2)+'\n'],
  ['cava-manga-chest112.diagnostic.json',JSON.stringify(x.compareShirtArmholesToHalfSleeve(regenerated),null,2)+'\n'],
  ['cava-manga-chest100.overlay.svg',x.exportCavaMangaOverlaySvg(project)],
  ['cava-manga-chest112.overlay.svg',x.exportCavaMangaOverlaySvg(regenerated)],
  ['mi001-status.json',JSON.stringify({format:'MI001-report/0.1.0',method:regenerated.method,pieces:regenerated.pieces.map(p=>({id:p.id,points:p.points.length,edges:p.edges.length})),projectRevision:regenerated.revision,cutReady:false,scalePhysical:'NOT_RUN',assembly:'NOT_RUN',fit:'NOT_RUN'},null,2)+'\n']
 ];
 for(const [name,data] of files){await writeFile(join(dir,name),data);console.log('MI001 GENERATED',name,(await readFile(join(dir,name))).length);}
}finally{await rm(temp,{recursive:true,force:true});}
