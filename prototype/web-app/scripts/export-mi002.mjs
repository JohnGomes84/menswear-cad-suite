/** Produce MI002 artifacts using exactly the code bundled into the browser. */
import {build} from 'esbuild';
import {mkdtemp,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
const temp=await mkdtemp(join(tmpdir(),'menswear-mi002-'));
try{
 const entry=join(temp,'entry.ts'),target=join(temp,'entry.mjs');
 await writeFile(entry,`export {createShortProject,saveShortProject,shortDiagnostic,changeShortMeasure} from ${JSON.stringify(resolve('src/shortProject.ts'))};\nexport {exportShortSvg,exportShortA4,paginateShortA4,shortExportRecord} from ${JSON.stringify(resolve('src/shortExport.ts'))};\n`);
 await build({entryPoints:[entry],outfile:target,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const mod=await import(pathToFileURL(target).href);
 const project=mod.createShortProject(),updated=mod.changeShortMeasure(project,'hip',1060);
 const sha=process.env.MI001_COMMIT_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const meta={commitSha:sha,generatedAtISO:new Date().toISOString()};
 const diag=mod.shortDiagnostic(project),pages=mod.paginateShortA4(project);
 const dest=resolve('mi002-artifacts');await mkdir(dest,{recursive:true});
 const assets=[
  ['mi002-short-example.draft.json',mod.saveShortProject(project)],
  ['mi002-short-hip106.draft.json',mod.saveShortProject(updated)],
  ['mi002-short-diagnostic.svg',mod.exportShortSvg(project)],
  ['mi002-short-a4-100percent.pdf',mod.exportShortA4(project,meta)],
  ['mi002-short-page-map.json',JSON.stringify(mod.shortExportRecord(project,meta),null,2)+'\n'],
  ['mi002-short-length-diagnostic.json',JSON.stringify(diag,null,2)+'\n'],
  ['mi002-short-status.json',JSON.stringify({commitSha:sha,method:project.method,
    decisions:project.decisions,release:project.release,pieces:project.pieces.map(x=>({id:x.id,points:x.points.length,edges:x.edges.length})),
    printPages:pages.length,physicalApproval:'NOT_RUN'},null,2)+'\n']
 ];
 for(const [name,data] of assets){await writeFile(join(dest,name),data);console.log('MI002 GENERATED',name,typeof data==='string'?data.length:data.length);}
}finally{await rm(temp,{recursive:true,force:true});}
