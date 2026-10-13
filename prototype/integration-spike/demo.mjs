import { mkdir, writeFile } from "node:fs/promises";
import { createDiagnosticDraft } from "./src/pipeline.mjs";

const result=createDiagnosticDraft({
  method:"TWO_PIECE",variant:"BASIC",
  measurementsMm:{seatMm:1020,bodyRiseMm:282,insideLegMm:800}
});
await mkdir(new URL("./out/",import.meta.url),{recursive:true});
await writeFile(new URL("./out/ch02-guides.svg",import.meta.url),result.svg,"utf8");
await writeFile(new URL("./out/ch02-diagnostics.json",import.meta.url),JSON.stringify({
 schemaVersion:result.schemaVersion,purpose:result.purpose,source:result.source,
 measurementsMm:result.measurementsMm,construction:result.construction,
 groups:result.groups,diagnostics:result.diagnostics,
 blockedOperations:result.blockedOperations
},null,2)+"\n","utf8");
console.log(JSON.stringify({state:result.diagnostics.state,pointCount:result.construction.trace.length,
 guideCount:result.groups.flatMap(g=>g.guides).length,blockedOperations:result.blockedOperations,
 output:["out/ch02-guides.svg","out/ch02-diagnostics.json"]},null,2));
