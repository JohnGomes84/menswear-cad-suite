/** Generate deterministic MI-001 diagnostic deliverables from the browser's own core. */
import {build} from 'esbuild';
import {mkdtemp,writeFile,readFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
const temp=await mkdtemp(join(tmpdir(),'menswear-mi001-'));
try{
 const source=join(temp,'entry.ts'),target=join(temp,'entry.mjs');
 await writeFile(source,`export {createShirtProject,serializeShirtProject,changeShirtMeasurement} from ${JSON.stringify(resolve('src/flatShirtProject.ts'))};\nexport {exportShirtSvg,exportShirtPdf,exportCalibrationPdf,exportShirtTiledA4Pdf,exportPhysicalCalibrationProtocolPdf,paginateFlatShirtA4,A4_PRINT} from ${JSON.stringify(resolve('src/flatShirtExport.ts'))};\nexport {compareShirtArmholesToHalfSleeve,exportCavaMangaOverlaySvg} from ${JSON.stringify(resolve('src/flatShirtSeamDiagnostic.ts'))};\n`);
 await build({entryPoints:[source],outfile:target,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const x=await import(pathToFileURL(target).href);
 const project=x.createShirtProject();
 const regenerated=x.changeShirtMeasurement(project,'chest',1120);
 const dir=resolve('mi001-artifacts');await mkdir(dir,{recursive:true});
 const sha=process.env.MI001_COMMIT_SHA || execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const printMeta={commitSha:sha,generatedAtISO:new Date().toISOString()};
 const tiled=x.paginateFlatShirtA4(regenerated);
 const pageMap={format:'MI001-A4-PAGE-MAP/1.0.0',projectId:regenerated.projectId,method:regenerated.method,
  metadata:printMeta,pageSizeMm:[210,297],tileFrameMm:x.A4_PRINT,unit:'mm',scale:'100%',
  physicalScale:'NOT_RUN',stitchLineStatus:'NOT_IDENTIFIED',release:regenerated.release,
  pages:tiled};
 const instructions=[
  'MI001 A4 NOMINAL 100 PERCENT - DRAFT / NO CUT / PROVISIONAL GEOMETRY',
  'Print at ACTUAL SIZE / 100%, portrait A4 210 x 297 mm. DISABLE fit-to-page, borderless resize, scaling and automatic rotation.',
  'Pages are grouped by FRONT, BACK and SLEEVE; keep every page at 100%. Only 10mm REGISTRATION OVERLAP is repeated between adjacent tiles; this is NOT a garment allowance.',
  'Align printed crosshair labels using the SAME WORLD X/Y coordinate in millimetres and page-neighbor map, never using cutting lines as marks.',
  'Measure 100mm reference and 25x25mm square on a physical sheet. Fill the separate interactive physical protocol with printer/settings, measurements and evidence.',
  'Do NOT assume printed precision. scalePhysical=NOT_RUN until user submits physical observations. Assembly=NOT_RUN. Fit=NOT_RUN. cutReady=false.',
  'Commit SHA: '+sha,'Generated UTC: '+printMeta.generatedAtISO,'Pages: '+tiled.length
 ].join('\n')+'\n';
 const files=[
  ['flat-shirt-core-initial.draft.json',x.serializeShirtProject(project)],
  ['flat-shirt-core-chest112.draft.json',x.serializeShirtProject(regenerated)],
  ['flat-shirt-core-diagnostic-1to1.svg',x.exportShirtSvg(regenerated)],
  ['flat-shirt-core-diagnostic-1to1.pdf',x.exportShirtPdf(regenerated)],
  ['calibracao-a4-100percent.pdf',x.exportCalibrationPdf()],
  ['flat-shirt-core-a4-100percent.pdf',x.exportShirtTiledA4Pdf(regenerated,printMeta)],
  ['mi001-protocolo-fisico-preenchivel.pdf',x.exportPhysicalCalibrationProtocolPdf(regenerated,printMeta)],
  ['mi001-a4-page-map.json',JSON.stringify(pageMap,null,2)+'\n'],
  ['mi001-a4-instrucoes-impressao.txt',instructions],
  ['cava-manga-chest100.diagnostic.json',JSON.stringify(x.compareShirtArmholesToHalfSleeve(project),null,2)+'\n'],
  ['cava-manga-chest112.diagnostic.json',JSON.stringify(x.compareShirtArmholesToHalfSleeve(regenerated),null,2)+'\n'],
  ['cava-manga-chest100.overlay.svg',x.exportCavaMangaOverlaySvg(project)],
  ['cava-manga-chest112.overlay.svg',x.exportCavaMangaOverlaySvg(regenerated)],
  ['mi001-status.json',JSON.stringify({format:'MI001-report/0.1.0',method:regenerated.method,pieces:regenerated.pieces.map(p=>({id:p.id,points:p.points.length,edges:p.edges.length})),projectRevision:regenerated.revision,cutReady:false,scalePhysical:'NOT_RUN',assembly:'NOT_RUN',fit:'NOT_RUN'},null,2)+'\n']
 ];
 for(const [name,data] of files){await writeFile(join(dir,name),data);console.log('MI001 GENERATED',name,(await readFile(join(dir,name))).length);}
}finally{await rm(temp,{recursive:true,force:true});}
