import { mkdir, writeFile } from "node:fs/promises";
import { createDiagnosticDraft } from "./src/pipeline.mjs";
import {
  createResearchPartProbe,createSyntheticAnnotationProof
} from "./src/partBridge.mjs";

const example={
  method:"TWO_PIECE",variant:"BASIC",
  measurementsMm:{seatMm:1020,bodyRiseMm:282,insideLegMm:800}
};
const result=createDiagnosticDraft(example);
const parts=createResearchPartProbe(example);
const annotations=createSyntheticAnnotationProof();

await mkdir(new URL("./out/",import.meta.url),{recursive:true});
await Promise.all([
 writeFile(new URL("./out/ch02-guides.svg",import.meta.url),result.svg,"utf8"),
 writeFile(new URL("./out/ch02-diagnostics.json",import.meta.url),JSON.stringify({
  schemaVersion:result.schemaVersion,purpose:result.purpose,source:result.source,
  measurementsMm:result.measurementsMm,construction:result.construction,
  groups:result.groups,diagnostics:result.diagnostics,
  blockedOperations:result.blockedOperations
 },null,2)+"\n","utf8"),
 writeFile(new URL("./out/ch02-construction-components.json",import.meta.url),
  JSON.stringify(parts,null,2)+"\n","utf8"),
 writeFile(new URL("./out/synthetic-annotation-api-proof.json",import.meta.url),
  JSON.stringify(annotations,null,2)+"\n","utf8")
]);
console.log(JSON.stringify({
 state:result.diagnostics.state,
 pointCount:result.construction.trace.length,
 guideCount:result.groups.flatMap(g=>g.guides).length,
 nativePartCount:parts.parts.length,
 nativePartRoles:parts.parts.map(p=>p.semanticRole),
 syntheticAnnotations:annotations.executedApis,
 blockedOperations:result.blockedOperations,
 output:[
  "out/ch02-guides.svg","out/ch02-diagnostics.json",
  "out/ch02-construction-components.json","out/synthetic-annotation-api-proof.json"
 ]
},null,2));
