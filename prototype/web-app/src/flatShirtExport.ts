/** MI-001 read-only rendering/export adapter. All geometry originates in flatShirtProject.
 * SVG/PDF use physical mm geometry; neither establishes printer accuracy or cut status.
 */
import type { ShirtProject, ShirtPiece, ShirtEdge } from './flatShirtProject';
import {validateShirtProject} from './flatShirtProject';
import {classifyFlatShirtEdges} from './flatShirtSeamDiagnostic';
const PT=72/25.4;
const n=(x:number)=>Number(x.toFixed(5)).toString();
const esc=(x:string)=>x.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const ascii=(x:string)=>x.normalize('NFKD').replace(/[^\x20-\x7E]/g,'?');
// Fixed diagnostic workspace, millimetres, side-by-side across large plotter sheet.
export const placement={FRONT:{x:45,y:63},BACK:{x:435,y:63},SLEEVE:{x:1150,y:63}} as const;
export const SHEET={widthMm:1200,heightMm:850} as const;
const byId=(piece:ShirtPiece,id:string)=>{
 const p=piece.points.find(p=>p.id===id);
 if(!p)throw Error('Missing point '+id);
 return p.positionMm;
};
function segments(piece:ShirtPiece){
 const offset=placement[piece.id];
 const tr=(p:{x:number;y:number})=>({x:p.x+offset.x,y:p.y+offset.y});
 return piece.edges.map(edge=>({edge,from:tr(byId(piece,edge.from)),to:tr(byId(piece,edge.to)),controls:edge.controlsMm?.map(tr)}));
}
/**
 * Conservative full-page proof. Cubic Bézier stays within its control-point hull.
 * Fail closed rather than crop a valid-size garment into a misleading nominal PDF.
 */
export function assertNominalSheetFits(project:ShirtProject):void{
 const p=validateShirtProject(project);
 const boxes=p.pieces.map(piece=>{
  const segmentsForPiece=segments(piece);
  const all=segmentsForPiece.flatMap(({from,to,controls})=>[from,to,...(controls??[])]);
  if(!all.length)throw new Error('Sem geometria diagnóstica para '+piece.id);
  const x0=Math.min(...all.map(x=>x.x)),x1=Math.max(...all.map(x=>x.x));
  const y0=Math.min(...all.map(x=>x.y)),y1=Math.max(...all.map(x=>x.y));
  if(x0<10||y0<50||x1>SHEET.widthMm-10||y1>SHEET.heightMm-12)
   throw new RangeError('EXPORT_PAGE_OVERFLOW: '+piece.id+' ultrapassa 1200 x 850 mm; não é permitido cortar nem redimensionar silenciosamente');
  // The printed calibration zone must remain free of any garment geometry.
  if(x0<1100&&x1>980&&y0<839&&y1>780)
   throw new RangeError('EXPORT_CALIBRATION_OVERLAP: '+piece.id+' ocupa região de calibração');
  return {id:piece.id,x0,x1,y0,y1};
 });
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
  const a=boxes[i],b=boxes[j];
  if(a.x0<b.x1&&a.x1>b.x0&&a.y0<b.y1&&a.y1>b.y0)
   throw new RangeError('EXPORT_PIECE_OVERLAP: '+a.id+' e '+b.id+' ocupam a mesma área na folha');
 }
}

export function exportShirtSvg(raw:ShirtProject,enforcePaperBounds=true):string{
 const project=validateShirtProject(raw), water='DRAFT / NO CUT / GEOMETRIA EXPERIMENTAL';
 if(enforcePaperBounds)assertNominalSheetFits(project);
 const classes=new Map(classifyFlatShirtEdges(project).map(x=>[x.edgeId,x]));
 const tags=project.pieces.map(piece=>{
   const items=segments(piece).map(({edge,from,to,controls})=>{
     const d=`M ${n(from.x)} ${n(from.y)} ${controls?`C ${n(controls[0].x)} ${n(controls[0].y)} ${n(controls[1].x)} ${n(controls[1].y)} ${n(to.x)} ${n(to.y)}`:`L ${n(to.x)} ${n(to.y)}`}`;
     const classification=classes.get(edge.id);
     if(!classification)throw new Error('SVG_EDGE_CLASSIFICATION_MISSING '+edge.id);
     const dash=edge.origin==='TECHNICAL_DECISION'?' stroke-dasharray="5,3"':'';
     return `<path id="${esc(edge.id)}" d="${d}" fill="none" stroke="#253d66" stroke-width="0.5"${dash} data-origin="${edge.origin}" data-role="${edge.role}" data-review="${edge.review.state}" data-solution="${esc(edge.solution)}" data-line-class="${classification.classification}" data-class-origin="${classification.classificationOrigin}" data-role-source="${esc(classification.sourceLocation)}"><title>${esc(edge.id)} | ${classification.classification} | ${classification.classificationOrigin} | ${esc(classification.sourceLocation)}</title></path>`;
   }).join('\n');
   return `<g id="${piece.id}"><text x="${placement[piece.id].x}" y="35" font-size="10">${piece.id} / EXPERIMENTAL</text>${items}</g>`;
 }).join('\n');
 const decisions=project.decisions.map(x=>x.id+'@'+x.version).join(', ');
 return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${SHEET.widthMm}mm" height="${SHEET.heightMm}mm" viewBox="0 0 ${SHEET.widthMm} ${SHEET.heightMm}">\n<title>Flat Shirt Core diagnostic - NOT FOR CUTTING</title><desc>PROJECT ${esc(project.projectId)} METHOD ${project.method.id}@${project.method.version}; cutReady=false; physical scale NOT_RUN. ${esc(decisions)}</desc><rect width="100%" height="100%" fill="white"/>\n<text x="25" y="17" font-size="12" font-weight="bold" fill="#a11d2d">${water}</text><text x="25" y="29" font-size="6">Projeto ${esc(project.projectId)} revision ${project.revision} | PDF pp. 35, 36, 38 | cm entrada / mm geometria | CutReady=false | 22 classes: 4 CONSTRUCTION_LINE; 18 UNCLASSIFIED; 0 SEAM_LINE</text>\n${tags}\n<g stroke="black" stroke-width="0.35" fill="none"><rect x="990" y="785" width="25" height="25"/><path d="M 990 822 L 1090 822"/></g><g font-size="5"><text x="990" y="781">Quadrado de 25 mm</text><text x="990" y="831">Referencia de 100 mm - imprimir a 100%</text><text x="350" y="824">Calibracao fisica: NOT_RUN | Montagem: NOT_RUN | Caimento: NOT_RUN</text></g></svg>\n`;
}
class PdfBuilder{
 private objs:string[]=[];
 add(obj:string){this.objs.push(obj);return this.objs.length;}
 finish():Uint8Array{
  const enc=new TextEncoder();const parts:string[]=['%PDF-1.4\n'];const pos:number[]=[0];
  let off=enc.encode(parts[0]).length;
  this.objs.forEach((obj,i)=>{const entry=`${i+1} 0 obj\n${obj}\nendobj\n`;pos.push(off);parts.push(entry);off+=enc.encode(entry).length;});
  const xref=off;let table=`xref\n0 ${this.objs.length+1}\n0000000000 65535 f \n`;
  for(let i=1;i<pos.length;i++)table+=String(pos[i]).padStart(10,'0')+' 00000 n \n';
  table+=`trailer\n<< /Size ${this.objs.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return enc.encode(parts.join('')+table);
 }
}
const pdfEsc=(v:string)=>ascii(v).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
function makePdf(widthMm:number,heightMm:number,draw:string):Uint8Array{
 const writer=new PdfBuilder();
 writer.add('<< /Type /Catalog /Pages 2 0 R >>');
 writer.add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 writer.add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(widthMm*PT)} ${n(heightMm*PT)}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`);
 writer.add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
 writer.add(`<< /Length ${new TextEncoder().encode(draw).length} >>\nstream\n${draw}\nendstream`);
 return writer.finish();
}
const xy=(x:number,y:number,height:number)=>`${n(x*PT)} ${n((height-y)*PT)}`;
const line=(x1:number,y1:number,x2:number,y2:number,height:number)=>`${xy(x1,y1,height)} m ${xy(x2,y2,height)} l S\n`;
const rect=(x:number,y:number,w:number,h:number,H:number)=>`${xy(x,y+h,H)} ${n(w*PT)} ${n(h*PT)} re S\n`;
const txt=(v:string,x:number,y:number,sizePt:number,H:number)=>`BT /F1 ${n(sizePt)} Tf ${xy(x,y,H)} Td (${pdfEsc(v)}) Tj ET\n`;
export function exportShirtPdf(raw:ShirtProject):Uint8Array{
 const p=validateShirtProject(raw),H=SHEET.heightMm;
 assertNominalSheetFits(p);
 let stream=`0.6 w\n`+txt('DRAFT / NO CUT / EXPERIMENTAL GEOMETRY',25,17,25,H)+txt(`Flat Shirt Core ${p.projectId} r${p.revision} | Method ${p.method.version} | 1:1 nominal mm | physical NOT_RUN`,25,29,12,H);
 for(const piece of p.pieces){
  stream+=txt(piece.id+' - PROVISIONAL',placement[piece.id].x,45,12,H);
  for(const {edge,from,to,controls} of segments(piece)){
    stream+=edge.origin==='TECHNICAL_DECISION'?'[10 7] 0 d\n':'[] 0 d\n';
    if(controls)stream+=`${xy(from.x,from.y,H)} m ${xy(controls[0].x,controls[0].y,H)} ${xy(controls[1].x,controls[1].y,H)} ${xy(to.x,to.y,H)} c S\n`;
    else stream+=line(from.x,from.y,to.x,to.y,H);
  }
 }
 stream+='[] 0 d\n'+rect(990,785,25,25,H)+line(990,822,1090,822,H)+txt('25 mm square',990,778,10,H)+txt('100 mm bar - print 100%',990,832,10,H)+txt('Scale verification: NOT_RUN | Assembly: NOT_RUN | Fit: NOT_RUN',360,832,10,H);
 return makePdf(SHEET.widthMm,H,stream);
}
export function exportCalibrationPdf():Uint8Array{
 const H=297;let content='0.7 w\n';
 content+=txt('MENSWEAR CAD / PRINT SCALE CHECK / NO CUT',20,20,14,H);
 content+=txt('A4 portrait 210 x 297 mm. Print ACTUAL SIZE / 100%, no Fit to Page.',20,32,10,H);
 content+=rect(25,50,100,100,H)+rect(25,50,25,25,H);
 content+=line(25,172,125,172,H)+txt('100 mm',25,179,12,H)+txt('25 x 25 mm square (inside large frame)',25,46,10,H);
 content+=txt('RECORD MEASUREMENT - physical result is NOT_RUN until signed',20,201,10,H);
 content+=txt('Printer/model: ___________________________________________',20,212,11,H);
 content+=txt('Paper / scaling setting: __________________________________',20,223,11,H);
 content+=txt('Measured 100 mm line (mm): _____________________________',20,234,11,H);
 content+=txt('Measured 25 mm square W/H (mm): ________________________',20,245,11,H);
 content+=txt('Date / reviewer / evidence: _______________________________',20,256,11,H);
 content+=txt('Decision and approved tolerance (if defined): ______________',20,267,11,H);
 content+=txt('Scale NOT_RUN | Assembly NOT_RUN | Fit NOT_RUN | cutReady=false',20,281,9,H);
 return makePdf(210,H,content);
}

/** A4 tiled diagnostic output on the exact existing garment coordinates.
 * Tile overlap is a paper registration mechanism, not a garment allowance.
 * This module never transforms or recomputes a pattern curve. */
export type PrintA4Metadata={commitSha:string;generatedAtISO:string};
export const A4_PRINT={pageWidthMm:210,pageHeightMm:297,frameXmm:15,frameYmm:36,frameWidthMm:180,frameHeightMm:214,overlapMm:10,strideXmm:170,strideYmm:204,paddingMm:5} as const;
export type TiledPage={index:number;piece:ShirtPiece['id'];row:number;col:number;rows:number;cols:number;originXmm:number;originYmm:number;worldRightMm:number;worldBottomMm:number;neighbors:{left:number|null;right:number|null;up:number|null;down:number|null}};
const exact=(v:number)=>Number(v.toFixed(6));
export function assertPrintA4Metadata(meta:PrintA4Metadata):void{
 if(!meta||!(/^[0-9a-f]{40}$/i).test(meta.commitSha))throw new Error('A4_COMMIT_SHA_REQUIRED: valid 40-digit source commit SHA');
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(meta.generatedAtISO)||!Number.isFinite(Date.parse(meta.generatedAtISO)))
  throw new Error('A4_GENERATED_AT_REQUIRED: valid ISO UTC generation date');
}
const bounded=(piece:ShirtPiece)=>{
 const all=piece.edges.flatMap(e=>{
  const from=byId(piece,e.from),to=byId(piece,e.to);
  return [from,to,...(e.controlsMm??[])];
 });
 if(!all.length||all.some(pt=>!Number.isFinite(pt.x)||!Number.isFinite(pt.y)))throw new Error('A4_INVALID_GEOMETRY '+piece.id);
 const xs=all.map(pt=>pt.x),ys=all.map(pt=>pt.y);
 return {x0:Math.min(...xs)-A4_PRINT.paddingMm,x1:Math.max(...xs)+A4_PRINT.paddingMm,
  y0:Math.min(...ys)-A4_PRINT.paddingMm,y1:Math.max(...ys)+A4_PRINT.paddingMm};
};
export function assertTiledPageLayout(pages:readonly TiledPage[],project:ShirtProject):void{
 const seen=new Set<string>();const keys=new Set(pages.map(p=>p.index));
 if(keys.size!==pages.length||!pages.length)throw new Error('A4_DUPLICATE_OR_MISSING_PAGE');
 for(const page of pages){
  const key=page.piece+'/'+page.row+'/'+page.col;
  if(seen.has(key)||!Number.isFinite(page.originXmm)||!Number.isFinite(page.originYmm)||
   page.index<1||page.row<0||page.col<0||page.row>=page.rows||page.col>=page.cols||
   page.worldRightMm!==exact(page.originXmm+A4_PRINT.frameWidthMm)||
   page.worldBottomMm!==exact(page.originYmm+A4_PRINT.frameHeightMm))
   throw new Error('A4_DUPLICATE_OR_INVALID_TILE '+key);
  seen.add(key);
 }
 for(let i=0;i<pages.length;i++)for(let j=i+1;j<pages.length;j++){
  const a=pages[i],b=pages[j];if(a.piece!==b.piece)continue;
  const ox=Math.max(0,Math.min(a.worldRightMm,b.worldRightMm)-Math.max(a.originXmm,b.originXmm));
  const oy=Math.max(0,Math.min(a.worldBottomMm,b.worldBottomMm)-Math.max(a.originYmm,b.originYmm));
  if(ox>A4_PRINT.overlapMm+1e-5&&oy>A4_PRINT.overlapMm+1e-5)throw new Error('A4_UNEXPECTED_TILE_OVERLAP '+a.index+'/'+b.index);
 }
 for(const piece of project.pieces){
  const own=pages.filter(p=>p.piece===piece.id);
  if(!own.length)throw new Error('A4_MISSING_PIECE '+piece.id);
  const {x0,x1,y0,y1}=bounded(piece);
  const cols=own[0].cols,rows=own[0].rows;
  if(own.length!==rows*cols)throw new Error('A4_TILE_GAP '+piece.id);
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const p=own.find(p=>p.row===row&&p.col===col);
   if(!p||p.rows!==rows||p.cols!==cols||Math.abs(p.originXmm-(x0+col*A4_PRINT.strideXmm))>1e-5||
    Math.abs(p.originYmm-(y0+row*A4_PRINT.strideYmm))>1e-5)
    throw new Error('A4_TILE_GAP_OR_SHIFT '+piece.id+'/'+row+'/'+col);
  }
  const last=own.find(p=>p.row===rows-1&&p.col===cols-1)!;
  if(own[0].originXmm>x0+1e-5||own[0].originYmm>y0+1e-5||last.worldRightMm<x1-1e-5||last.worldBottomMm<y1-1e-5)
   throw new Error('A4_GEOMETRY_NOT_COVERED '+piece.id);
 }
}
export function paginateFlatShirtA4(raw:ShirtProject):TiledPage[]{
 const project=validateShirtProject(raw);
 // A piece is never co-printed with another piece. The only overlap allowed
 // is the exactly 10mm registration strip between adjacent tiles of THAT piece.
 const pending:{piece:TiledPage['piece'];row:number;col:number;rows:number;cols:number;originXmm:number;originYmm:number}[]=[];
 for(const piece of project.pieces){
  const b=bounded(piece),cols=Math.max(1,Math.ceil((b.x1-b.x0-A4_PRINT.overlapMm)/A4_PRINT.strideXmm));
  const rows=Math.max(1,Math.ceil((b.y1-b.y0-A4_PRINT.overlapMm)/A4_PRINT.strideYmm));
  if(rows*cols>200||pending.length+rows*cols>200)throw new RangeError('A4_TOO_MANY_PAGES: diagnostic output exceeds 200 pages');
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)pending.push({piece:piece.id,row,col,rows,cols,
   originXmm:exact(b.x0+col*A4_PRINT.strideXmm),originYmm:exact(b.y0+row*A4_PRINT.strideYmm)});
 }
 const indexMap=new Map(pending.map((p,i)=>[p.piece+'/'+p.row+'/'+p.col,i+1]));
 const neighbor=(piece:string,row:number,col:number):number|null=>indexMap.get(piece+'/'+row+'/'+col)??null;
 const pages=pending.map((p,i):TiledPage=>({...p,index:i+1,worldRightMm:exact(p.originXmm+A4_PRINT.frameWidthMm),
  worldBottomMm:exact(p.originYmm+A4_PRINT.frameHeightMm),neighbors:{left:neighbor(p.piece,p.row,p.col-1),right:neighbor(p.piece,p.row,p.col+1),up:neighbor(p.piece,p.row-1,p.col),down:neighbor(p.piece,p.row+1,p.col)}}));
 assertTiledPageLayout(pages,project);return pages;
}
function makeMultipagePdf(draws:readonly string[]):Uint8Array{
 if(!draws.length)throw new Error('A4_NO_PAGES');
 const writer=new PdfBuilder();
 writer.add('<< /Type /Catalog /Pages 2 0 R >>');
 writer.add(`<< /Type /Pages /Kids [${draws.map((_,i)=>`${4+2*i} 0 R`).join(' ')}] /Count ${draws.length} >>`);
 writer.add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
 draws.forEach((draw,i)=>{
  const contentId=5+2*i;
  writer.add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(210*PT)} ${n(297*PT)}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
  writer.add(`<< /Length ${new TextEncoder().encode(draw).length} >>\nstream\n${draw}\nendstream`);
 });
 return writer.finish();
}
const fmtMm=(v:number)=>exact(v).toString();
function a4TileDraw(project:ShirtProject,page:TiledPage,total:number,meta:PrintA4Metadata):string{
 const A=A4_PRINT,H=A.pageHeightMm,piece=project.pieces.find(p=>p.id===page.piece)!;
 let d='0.48 w\n';
 d+=txt(`PAGE ${page.index}/${total} | ${page.piece} | C${page.col+1}/${page.cols} R${page.row+1}/${page.rows} | DRAFT / NO CUT / PROVISIONAL GEOMETRY`,11,10,9,H);
 d+=txt(`Project: ${project.projectId} | Method: ${project.method.id} @ ${project.method.version}`,11,17,8,H);
 d+=txt(`Commit SHA: ${meta.commitSha}`,11,24,7,H);
 d+=txt(`Generated (UTC): ${meta.generatedAtISO}  |  1:1  /  100%  /  mm`,11,30,8,H);
 // Frame and calibration are on the physical page, OUTSIDE the clipped motif.
 d+='0.65 G\n'+rect(A.frameXmm,A.frameYmm,A.frameWidthMm,A.frameHeightMm,H)+'0 G\n';
 d+=`q\n${xy(A.frameXmm,A.frameYmm+A.frameHeightMm,H)} ${n(A.frameWidthMm*PT)} ${n(A.frameHeightMm*PT)} re W n\n`;
 const tr=(pt:{x:number;y:number})=>({x:A.frameXmm+pt.x-page.originXmm,y:A.frameYmm+pt.y-page.originYmm});
 // One native mm remains exactly 72/25.4 PDF points. The clipping window does
 // not scale or omit the part of an edge that continues on an adjacent page.
 for(const edge of piece.edges){
  const a=tr(byId(piece,edge.from)),b=tr(byId(piece,edge.to));
  d+=edge.origin==='TECHNICAL_DECISION'?'[7 4] 0 d\n':'[] 0 d\n';
  if(edge.controlsMm){const p1=tr(edge.controlsMm[0]),p2=tr(edge.controlsMm[1]);
   d+=`${xy(a.x,a.y,H)} m ${xy(p1.x,p1.y,H)} ${xy(p2.x,p2.y,H)} ${xy(b.x,b.y,H)} c S\n`;
  }else d+=line(a.x,a.y,b.x,b.y,H);
 }
 d+='Q\n[] 0 d\n';
 // Registration crosshairs in the *shared* 10mm strip. Equal world coordinates
 // appear on two adjacent sheets, at local 175mm / 5mm (or 209mm / 5mm).
 const mark=(x:number,y:number)=>{d+='0.45 G\n'+line(x-2,y,x+2,y,H)+line(x,y-2,x,y+2,H)+'0 G\n';};
 const around=(label:string,v:number,nbr:number|null,x:number,y:number)=>{
  if(nbr===null)return;
  mark(x,y);
  d+=txt(`${label} p${nbr} ${fmtMm(v)}mm`,label==='RIGHT'?125:label==='LEFT'?16:label==='DOWN'?89:16,
   label==='DOWN'?259:label==='UP'?259:label==='RIGHT'?265:272,6,H);
 };
 around('LEFT',page.originXmm+5,page.neighbors.left,20,60);
 around('RIGHT',page.originXmm+175,page.neighbors.right,190,60);
 around('UP',page.originYmm+5,page.neighbors.up,65,41);
 around('DOWN',page.originYmm+209,page.neighbors.down,65,245);
 // Full rectangle coordinates and connection metadata cannot be placed
 // in the geometry frame, where they would cover the actual pattern.
 d+=txt(`Tile X=[${fmtMm(page.originXmm)}, ${fmtMm(page.worldRightMm)}] mm  Y=[${fmtMm(page.originYmm)}, ${fmtMm(page.worldBottomMm)}] mm`,11,263,7,H);
 d+=txt('Adjacent tile alignment strip: 10mm overlap. Connect matching world-coordinate crosses.',11,269,7,H);
 d+=txt(`L:${page.neighbors.left??'-'} R:${page.neighbors.right??'-'} U:${page.neighbors.up??'-'} D:${page.neighbors.down??'-'}   |  scalePhysical=NOT_RUN   cutReady=false`,11,275,7,H);
 // Calibration is printed on EVERY sheet, in its own reserved footer.
 d+=line(20,290,120,290,H)+line(20,288.5,20,291.5,H)+line(120,288.5,120,291.5,H);
 d+=txt('100mm ruler - measure on paper',20,286,7,H);
 d+=rect(167,268,25,25,H)+txt('25x25 mm',166,265,6,H);
 return d;
}
export function exportShirtTiledA4Pdf(raw:ShirtProject,meta:PrintA4Metadata):Uint8Array{
 assertPrintA4Metadata(meta);const p=validateShirtProject(raw),tiles=paginateFlatShirtA4(p);
 return makeMultipagePdf(tiles.map(t=>a4TileDraw(p,t,tiles.length,meta)));
}

/** Editable AcroForm: observations do NOT change the original project status. */
export type PhysicalFieldName='printer'|'driverConfiguration'|'paper'|'selectedScale'|'printDate'|'responsible'|'measuredRuler100Mm'|'measuredSquareWidth25Mm'|'measuredSquareHeight25Mm'|'observations'|'evidenceReference';
export const PHYSICAL_FORM_FIELDS:readonly PhysicalFieldName[]=['printer','driverConfiguration','paper','selectedScale','printDate','responsible','measuredRuler100Mm','measuredSquareWidth25Mm','measuredSquareHeight25Mm','observations','evidenceReference'];
export function exportPhysicalCalibrationProtocolPdf(raw:ShirtProject,meta:PrintA4Metadata):Uint8Array{
 assertPrintA4Metadata(meta);const p=validateShirtProject(raw),H=297;
 const writer=new PdfBuilder();
 // PDF object positions: Catalog(1), Pages(2), Page(3), Font(4), Stream(5),
 // AcroForm(6), then 11 PDF text widgets (7..17).
 const indexes=PHYSICAL_FORM_FIELDS.map((_,i)=>7+i);
 writer.add('<< /Type /Catalog /Pages 2 0 R /AcroForm 6 0 R >>');
 writer.add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 writer.add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(210*PT)} ${n(297*PT)}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R /Annots [${indexes.map(i=>`${i} 0 R`).join(' ')}] >>`);
 writer.add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
 let d=txt('MI-001 | PROTOCOLO DE CALIBRACAO FISICA | DRAFT / NO CUT',11,14,13,H);
 d+=txt(`Project ${p.projectId} | ${p.method.id}@${p.method.version}`,11,22,8,H);
 d+=txt(`SHA ${meta.commitSha}`,11,29,7,H);
 d+=txt(`Generated UTC ${meta.generatedAtISO} | cutReady=false`,11,35,8,H);
 d+=txt('NAO VALIDAR ESCALA SEM MEDICOES REAIS EM PAPEL.',11,43,9,H);
 d+=txt('Scale: NOT_RUN     Assembly: NOT_RUN     Fit: NOT_RUN',11,50,8,H);
 d+=line(11,55,199,55,H);
 const descriptors:[PhysicalFieldName,string,number,number][]=[
  ['printer','Impressora / modelo',64,10],['driverConfiguration','Driver / configuracao',82,10],
  ['paper','Papel / tamanho',100,10],['selectedScale','Escala selecionada (usar 100%)',118,10],
  ['printDate','Data real da impressao',136,10],['responsible','Responsavel pela medicao',154,10],
  ['measuredRuler100Mm','Regua real de 100mm (mm)',172,10],
  ['measuredSquareWidth25Mm','Quadrado largura real (mm)',190,10],
  ['measuredSquareHeight25Mm','Quadrado altura real (mm)',208,10],
  ['observations','Observacoes',226,10],['evidenceReference','Evidencia / arquivo',244,10]
 ];
 for(const [,label,y] of descriptors){d+=txt(label,11,y,9,H);d+='0.7 G\n'+rect(78,y+1,121,11,H)+'0 G\n';}
 d+=txt('Registro de observacoes, NAO aprovacao de escala, modelagem, montagem ou caimento.',11,267,8,H);
 d+=txt('Preencha o PDF com medidas reais e devolva para revisao. Nenhum aceite automatico.',11,276,8,H);
 d+=txt('Status: PENDING_OWNER_DECISION / PHYSICALLY_VALIDATED = NOT_RUN',11,286,8,H);
 writer.add(`<< /Length ${new TextEncoder().encode(d).length} >>\nstream\n${d}\nendstream`);
 writer.add(`<< /Fields [${indexes.map(i=>`${i} 0 R`).join(' ')}] /DR << /Font << /F1 4 0 R >> >> /DA (/F1 10 Tf 0 g) /NeedAppearances true >>`);
 for(const [id,,y] of descriptors){
  const top=(y+1)*PT,bottom=(y+12)*PT;
  const rectTop=n(297*PT-top),rectBottom=n(297*PT-bottom);
  writer.add(`<< /Type /Annot /Subtype /Widget /FT /Tx /T (${pdfEsc(id)}) /V () /F 4 /Ff 0 /P 3 0 R /Rect [${n(78*PT)} ${rectBottom} ${n(199*PT)} ${rectTop}] /BS << /W 0.5 /S /S >> /MK << /BG [1 1 1] >> /DA (/F1 10 Tf 0 g) >>`);
 }
 return writer.finish();
}
