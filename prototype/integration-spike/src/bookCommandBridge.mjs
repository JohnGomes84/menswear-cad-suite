/**
 * Convert only Aldrich's explicit TEXT straight-line commands to actual
 * FreeSewing paths. Unlike dependency connectors, these lines are commanded
 * by the book. All garment/cut/seam roles remain unclassified.
 */
import {Point,Path} from "@freesewing/core";
import {resolveCh02BookLineCommands} from "../generated/ch02BookLines.mjs";

const esc=(v)=>String(v).replace(/[&<>"']/g,c=>({
 "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"
}[c]));

export function createBookCommandGeometry(
 method,variant,measurementsMm
){
 const resolved=resolveCh02BookLineCommands(method,{...measurementsMm,variant});
 const straights=[],curvesPending=[];
 for(const row of resolved.strokes){
  if(row.geometry==="CURVE"){
   curvesPending.push({
    commandId:row.id,section:row.section,
    requiredPoints:row.pointIds,
    evidence:row.source,reason:"SOURCE_CURVE_REQUIREMENTS_PENDING",
    curveGenerated:false
   });
   continue;
  }
  const line=new Path()
   .move(new Point(row.startMm.x,row.startMm.y))
   .line(new Point(row.endMm.x,row.endMm.y));
  if(Math.abs(line.length()-row.lengthMm)>1e-7)
    throw new Error("FreeSewing não confirmou a distância prescrita "+row.id);
  const pathD=line.asPathstring();
  if(/(?:\s|^)[zZ](?:\s|$)/.test(pathD))
    throw new Error("Fechamento não autorizado");
  straights.push({
   commandId:row.id,section:row.section,
   geometry:"STRAIGHT",lineRole:"TEXT_COMMAND_NOT_SEAM_OR_CUT",
   from:row.pointIds[0],to:row.pointIds[1],
   startMm:row.startMm,endMm:row.endMm,
   lengthMm:line.length(),pathD,source:row.source
  });
 }
 if(straights.length!==(method==="ONE_PIECE"?3:5)||
    curvesPending.length!==4)throw new Error("Registro do método incompleto");
 const points=straights.flatMap(x=>[x.startMm,x.endMm]);
 const minX=Math.min(...points.map(p=>p.x))-50,
       maxX=Math.max(...points.map(p=>p.x))+50,
       minY=Math.min(...points.map(p=>p.y))-50,
       maxY=Math.max(...points.map(p=>p.y))+50;
 // Geometry is physical mm internally; pixel viewport is intentionally
 // uncalibrated and must NOT be used as 1:1 printing.
 const svg=`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="820"
 viewBox="${[minX,minY,maxX-minX,maxY-minY].join(" ")}" role="img">
<title>Linhas retas ordenadas por Aldrich CH02 — pesquisa, não cortar</title>
<desc>EXPLICIT TEXT STRAIGHTS ONLY. Curve instructions unresolved. This is a diagnostic visualization, NOT printable pattern or scale 1:1.</desc>
${straights.map(row=>`<path data-source-id="${esc(row.commandId)}" d="${esc(row.pathD)}" fill="none" stroke="#143a8e" stroke-width="1.5"/>`).join("\n")}
<text x="${minX+10}" y="${minY+18}" font-size="14" fill="#0a2466">PESQUISA: RETAS DO LIVRO, CURVAS PENDENTES — NÃO CORTAR</text>
</svg>`;
 return {
  schema:"book-command-free-sewing-probe/0.1.0",purpose:"RESEARCH_ONLY",
  method,variant,sourceMethodId:"ALD-CH02-01",
  straights,curvesPending,
  figureLabels:resolved.allowanceRegionLabels,
  gates:{cutReady:false,sourceDiagram:"PARTIAL",
    seamClassification:"NOT_YET_DEFINED",allowanceOffset:false,
    mirrorPerformed:false,fit:"NOT_RUN"},
  externalApi:["FreeSewing.Point","FreeSewing.Path.move","FreeSewing.Path.line",
    "FreeSewing.Path.length","FreeSewing.Path.asPathstring"],
  svg
 };
}
