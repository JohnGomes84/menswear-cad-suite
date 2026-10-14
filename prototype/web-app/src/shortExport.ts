/** MI-002 read-only rendering; shared MI-001 PDF writer, unit and A4 primitives. */
import {validateShortProject,shortDiagnostic} from './shortProject';
import type {ShortPiece,ShortEdge,ShortProject} from './shortProject';
import {A4_PRINT,assertPrintA4Metadata,makeMultipagePdf,xy,line,rect,txt,n,PT} from './flatShirtExport';
import type {PrintA4Metadata} from './flatShirtExport';
const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const number=(v:number)=>Number(v.toFixed(6));
const pt=(piece:ShortPiece,id:string)=>{const p=piece.points.find(x=>x.id===id);if(!p)throw Error('MI002_POINT_MISSING');return p.positionMm};
const allCoords=(p:ShortPiece)=>p.edges.flatMap(e=>[pt(p,e.from),pt(p,e.to),...(e.controlsMm??[])]);
const bounds=(p:ShortPiece)=>{const coords=allCoords(p);return {x0:Math.min(...coords.map(x=>x.x))-5,y0:Math.min(...coords.map(x=>x.y))-5,x1:Math.max(...coords.map(x=>x.x))+5,y1:Math.max(...coords.map(x=>x.y))+5}};
const path=(p:ShortPiece,e:ShortEdge,transform:(v:{x:number;y:number})=>{x:number;y:number})=>{
 const a=transform(pt(p,e.from)),b=transform(pt(p,e.to));const cs=e.controlsMm?.map(transform);
 return 'M '+number(a.x)+' '+number(a.y)+(cs?
  ' C '+number(cs[0].x)+' '+number(cs[0].y)+' '+number(cs[1].x)+' '+number(cs[1].y)+' '+number(b.x)+' '+number(b.y):
  ' L '+number(b.x)+' '+number(b.y));
};
export function exportShortSvg(raw:ShortProject):string{
 const p=validateShortProject(raw);const fb=bounds(p.pieces[0]),bb=bounds(p.pieces[1]);
 const offset={FRONT:{x:20-fb.x0,y:52-fb.y0},BACK:{x:45+(fb.x1-fb.x0)-bb.x0,y:52-bb.y0}};
 const width=Math.ceil(70+(fb.x1-fb.x0)+(bb.x1-bb.x0)),height=Math.ceil(90+Math.max(fb.y1-fb.y0,bb.y1-bb.y0));
 const groups=p.pieces.map(piece=>{
  const off=offset[piece.id];
  const drawings=piece.edges.map(edge=>{
   const role=edge.classification==='CONSTRUCTION_LINE'?'stroke="#7892b1" stroke-dasharray="3 3"':'stroke="#243a5a"';
   return '<path id="'+edge.id+'" d="'+path(piece,edge,v=>({x:v.x+off.x,y:v.y+off.y}))+
    '" fill="none" '+role+' stroke-width="0.65" data-role="'+edge.role+'" data-origin="'+edge.origin+
    '" data-solution="'+edge.solution+'" data-classification="'+edge.classification+
    '" data-classification-origin="'+edge.classificationOrigin+'" data-review="'+edge.review+
    '"><title>'+esc(edge.id+' '+edge.evidence+' | '+edge.classification+' | '+edge.classificationOrigin)+'</title></path>';
  }).join('\n');
  const points=piece.points.map(x=>{const v=x.positionMm;return '<g><circle cx="'+number(v.x+off.x)+'" cy="'+number(v.y+off.y)+'" r="1.3" fill="#2b6cb0"/><text x="'+number(v.x+off.x+3)+'" y="'+number(v.y+off.y-2)+'" font-size="5">'+esc(x.id.split(':')[1])+'</text></g>'}).join('');
  return '<g id="'+piece.id+'"><text x="'+number(off.x+fb.x0)+'" y="33" font-size="13" font-weight="bold">'+piece.id+' · DIAGNOSTIC</text>'+drawings+points+'</g>';
 }).join('\n');
 return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'mm" height="'+height+
  'mm" viewBox="0 0 '+width+' '+height+'"><title>MI-002 elastic boxer short — NOT FOR CUTTING</title><desc>'+
  esc(p.projectId+' '+p.method.id+'@'+p.method.version+' NO CUT, NO INDUSTRIAL CLASSIFICATION, mm 100%')+
  '</desc><rect width="100%" height="100%" fill="white"/><text x="20" y="17" font-size="11" fill="#a11d2d">DRAFT / NO CUT / PROVISIONAL GEOMETRY</text>'+
  '<text x="20" y="27" font-size="6">Method: '+p.method.version+' · Revision '+p.revision+
  ' · 8 measures in mm · no ease / no margin applied · scalePhysical=NOT_RUN</text>'+groups+'</svg>\n';
}
export type ShortTile={index:number;piece:'FRONT'|'BACK';row:number;col:number;rows:number;cols:number;originXmm:number;originYmm:number;rightMm:number;bottomMm:number;neighbors:{left:number|null;right:number|null;up:number|null;down:number|null}};
export function paginateShortA4(raw:ShortProject):ShortTile[]{
 const p=validateShortProject(raw),pending:Omit<ShortTile,'index'|'rightMm'|'bottomMm'|'neighbors'>[]=[];
 for(const piece of p.pieces){const b=bounds(piece);
  const cols=Math.max(1,Math.ceil((b.x1-b.x0-A4_PRINT.overlapMm)/A4_PRINT.strideXmm)),
   rows=Math.max(1,Math.ceil((b.y1-b.y0-A4_PRINT.overlapMm)/A4_PRINT.strideYmm));
  if(rows*cols>150||pending.length+rows*cols>200)throw Error('MI002_A4_TOO_MANY_PAGES');
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)pending.push({
    piece:piece.id,row,col,rows,cols,originXmm:number(b.x0+col*A4_PRINT.strideXmm),originYmm:number(b.y0+row*A4_PRINT.strideYmm)});
 }
 const ids=new Map(pending.map((x,i)=>[x.piece+':'+x.row+':'+x.col,i+1]));
 const nb=(x:typeof pending[number],row:number,col:number)=>ids.get(x.piece+':'+row+':'+col)??null;
 const pages=pending.map((x,i):ShortTile=>({...x,index:i+1,rightMm:number(x.originXmm+A4_PRINT.frameWidthMm),
  bottomMm:number(x.originYmm+A4_PRINT.frameHeightMm),
  neighbors:{left:nb(x,x.row,x.col-1),right:nb(x,x.row,x.col+1),up:nb(x,x.row-1,x.col),down:nb(x,x.row+1,x.col)}}));
 validateShortTiles(p,pages);return pages;
}
export function validateShortTiles(raw:ShortProject,pages:readonly ShortTile[]):void{
 const p=validateShortProject(raw),seen=new Set<string>();
 if(!pages.length||pages.length>200||pages.some((q,i)=>q.index!==i+1))throw Error('MI002_A4_PAGE_NUMBER_INVALID');
 for(const q of pages){
  const key=q.piece+':'+q.row+':'+q.col;
  if(seen.has(key)||q.row>=q.rows||q.col>=q.cols||q.row<0||q.col<0)throw Error('MI002_A4_TILE_DUPLICATE');
  seen.add(key);
  if(Math.abs(q.rightMm-q.originXmm-A4_PRINT.frameWidthMm)>1e-5||Math.abs(q.bottomMm-q.originYmm-A4_PRINT.frameHeightMm)>1e-5)
   throw Error('MI002_A4_TILE_BOUNDS');
 }
 for(const piece of p.pieces){
  const tiles=pages.filter(q=>q.piece===piece.id),b=bounds(piece);
  if(!tiles.length)throw Error('MI002_A4_PIECE_MISSING');
  const rows=tiles[0].rows,cols=tiles[0].cols;
  if(tiles.length!==rows*cols)throw Error('MI002_A4_TILE_GAP');
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const q=tiles.find(q=>q.row===row&&q.col===col);
   if(!q||Math.abs(q.originXmm-number(b.x0+col*A4_PRINT.strideXmm))>1e-5||
    Math.abs(q.originYmm-number(b.y0+row*A4_PRINT.strideYmm))>1e-5)
    throw Error('MI002_A4_TILE_SHIFT');
  }
  for(let i=0;i<tiles.length;i++)for(let j=i+1;j<tiles.length;j++){
   const a=tiles[i],b=tiles[j];
   const ox=Math.max(0,Math.min(a.rightMm,b.rightMm)-Math.max(a.originXmm,b.originXmm));
   const oy=Math.max(0,Math.min(a.bottomMm,b.bottomMm)-Math.max(a.originYmm,b.originYmm));
   if(ox>10.00001&&oy>10.00001)throw Error('MI002_A4_UNEXPECTED_OVERLAP');
  }
  const last=tiles.find(q=>q.row===rows-1&&q.col===cols-1)!;
  if(last.rightMm<b.x1-1e-5||last.bottomMm<b.y1-1e-5)throw Error('MI002_A4_GEOMETRY_CLIPPED');
 }
}
function drawTile(p:ShortProject,t:ShortTile,total:number,meta:PrintA4Metadata):string{
 const A=A4_PRINT,H=A.pageHeightMm,piece=p.pieces.find(x=>x.id===t.piece)!;
 let d=txt('MI-002 PAGE '+t.index+'/'+total+' | '+t.piece+' | C'+(t.col+1)+'/'+t.cols+' R'+(t.row+1)+'/'+t.rows,11,10,9,H);
 d+=txt('DRAFT / NO CUT / PROVISIONAL GEOMETRY',11,17,10,H);
 d+=txt('Project '+p.projectId+' | '+p.method.id+'@'+p.method.version,11,23,7,H);
 d+=txt('Commit SHA: '+meta.commitSha,11,28,7,H);
 d+=txt('UTC: '+meta.generatedAtISO+' | 100% / 1:1 / mm',11,33,7,H);
 d+=rect(A.frameXmm,A.frameYmm,A.frameWidthMm,A.frameHeightMm,H);
 d+='q\n'+xy(A.frameXmm,A.frameYmm+A.frameHeightMm,H)+' '+n(A.frameWidthMm*PT)+' '+n(A.frameHeightMm*PT)+' re W n\n';
 const translate=(v:{x:number;y:number})=>({x:A.frameXmm+v.x-t.originXmm,y:A.frameYmm+v.y-t.originYmm});
 for(const e of piece.edges){
  const a=translate(pt(piece,e.from)),b=translate(pt(piece,e.to)),controls=e.controlsMm?.map(translate);
  d+=e.classification==='CONSTRUCTION_LINE'?'[5 3] 0 d\n':'[] 0 d\n';
  d+=controls?xy(a.x,a.y,H)+' m '+xy(controls[0].x,controls[0].y,H)+' '+xy(controls[1].x,controls[1].y,H)+' '+xy(b.x,b.y,H)+' c S\n':
   line(a.x,a.y,b.x,b.y,H);
 }
 d+='Q\n[] 0 d\n';
 const mark=(x:number,y:number)=>line(x-2,y,x+2,y,H)+line(x,y-2,x,y+2,H);
 if(t.neighbors.left){d+=mark(20,65)+txt('L p'+t.neighbors.left+' X='+number(t.originXmm+5)+' mm',19,71,6,H)}
 if(t.neighbors.right){d+=mark(190,65)+txt('R p'+t.neighbors.right+' X='+number(t.originXmm+175)+' mm',120,71,6,H)}
 if(t.neighbors.up){d+=mark(70,41)+txt('U p'+t.neighbors.up+' Y='+number(t.originYmm+5)+' mm',30,259,6,H)}
 if(t.neighbors.down){d+=mark(70,245)+txt('D p'+t.neighbors.down+' Y='+number(t.originYmm+209)+' mm',95,259,6,H)}
 d+=txt('Tile X=['+t.originXmm+','+t.rightMm+'] Y=['+t.originYmm+','+t.bottomMm+'] mm',11,267,6,H);
 d+=txt('REGISTRATION overlap 10mm only; NOT seam allowance. cutReady=false',11,274,7,H);
 d+=txt('scalePhysical=NOT_RUN; assembly=NOT_RUN; fit=NOT_RUN',11,281,7,H);
 d+=line(14,291,114,291,H)+txt('100mm',14,287,6,H);
 d+=rect(165,267,25,25,H)+txt('25x25mm',165,264,6,H);
 return d;
}
export function exportShortA4(raw:ShortProject,meta:PrintA4Metadata):Uint8Array{
 assertPrintA4Metadata(meta);const p=validateShortProject(raw),pages=paginateShortA4(p);
 return makeMultipagePdf(pages.map(t=>drawTile(p,t,pages.length,meta)));
}
export const shortExportRecord=(p:ShortProject,meta:PrintA4Metadata)=>({
 projectId:p.projectId,method:p.method,metadata:meta,format:'MI002-A4-PAGE-MAP/1',scale:'100%',
 release:p.release,unit:'mm',tiles:paginateShortA4(p),diagnostic:shortDiagnostic(p)});
