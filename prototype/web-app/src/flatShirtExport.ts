/** MI-001 read-only rendering/export adapter. All geometry originates in flatShirtProject.
 * SVG/PDF use physical mm geometry; neither establishes printer accuracy or cut status.
 */
import type { ShirtProject, ShirtPiece, ShirtEdge } from './flatShirtProject';
import {validateShirtProject} from './flatShirtProject';
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
 const tags=project.pieces.map(piece=>{
   const items=segments(piece).map(({edge,from,to,controls})=>{
     const d=`M ${n(from.x)} ${n(from.y)} ${controls?`C ${n(controls[0].x)} ${n(controls[0].y)} ${n(controls[1].x)} ${n(controls[1].y)} ${n(to.x)} ${n(to.y)}`:`L ${n(to.x)} ${n(to.y)}`}`;
     const dash=edge.origin==='TECHNICAL_DECISION'?' stroke-dasharray="5,3"':'';
     return `<path id="${esc(edge.id)}" d="${d}" fill="none" stroke="#253d66" stroke-width="0.5"${dash} data-origin="${edge.origin}" data-role="${edge.role}" data-review="${edge.review.state}" data-solution="${esc(edge.solution)}"/>`;
   }).join('\n');
   return `<g id="${piece.id}"><text x="${placement[piece.id].x}" y="35" font-size="10">${piece.id} / EXPERIMENTAL</text>${items}</g>`;
 }).join('\n');
 const decisions=project.decisions.map(x=>x.id+'@'+x.version).join(', ');
 return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${SHEET.widthMm}mm" height="${SHEET.heightMm}mm" viewBox="0 0 ${SHEET.widthMm} ${SHEET.heightMm}">\n<title>Flat Shirt Core diagnostic - NOT FOR CUTTING</title><desc>PROJECT ${esc(project.projectId)} METHOD ${project.method.id}@${project.method.version}; cutReady=false; physical scale NOT_RUN. ${esc(decisions)}</desc><rect width="100%" height="100%" fill="white"/>\n<text x="25" y="17" font-size="12" font-weight="bold" fill="#a11d2d">${water}</text><text x="25" y="29" font-size="6">Projeto ${esc(project.projectId)} revision ${project.revision} | PDF pp. 35, 36, 38 | cm entrada / mm geometria | CutReady=false</text>\n${tags}\n<g stroke="black" stroke-width="0.35" fill="none"><rect x="990" y="785" width="25" height="25"/><path d="M 990 822 L 1090 822"/></g><g font-size="5"><text x="990" y="781">Quadrado de 25 mm</text><text x="990" y="831">Referencia de 100 mm - imprimir a 100%</text><text x="350" y="824">Calibracao fisica: NOT_RUN | Montagem: NOT_RUN | Caimento: NOT_RUN</text></g></svg>\n`;
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
