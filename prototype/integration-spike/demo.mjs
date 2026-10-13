import { mkdir, writeFile } from "node:fs/promises";
import { createDiagnosticDraft } from "./src/pipeline.mjs";
import {
  createCh02SemanticResearch, assessSemanticRelease
} from "./generated/garmentSemantics.mjs";
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
const semantics=createCh02SemanticResearch(example.method,{
 ...example.measurementsMm,variant:example.variant
});
const semanticGate=assessSemanticRelease(semantics);

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
  JSON.stringify(annotations,null,2)+"\n","utf8"),
 writeFile(new URL("./out/ch02-semantic-contract.json",import.meta.url),
  JSON.stringify({project:semantics,validation:semanticGate},null,2)+"\\n","utf8")
]);
console.log(JSON.stringify({
 state:result.diagnostics.state,
 pointCount:result.construction.trace.length,
 guideCount:result.groups.flatMap(g=>g.guides).length,
 nativePartCount:parts.parts.length,
 nativePartRoles:parts.parts.map(p=>p.semanticRole),
 syntheticAnnotations:annotations.executedApis,
 semanticContract:semanticGate.state,semanticCutReady:semanticGate.cutReady,
 blockedOperations:result.blockedOperations,
 output:[
  "out/ch02-guides.svg","out/ch02-diagnostics.json",
  "out/ch02-construction-components.json","out/synthetic-annotation-api-proof.json",
  "out/ch02-semantic-contract.json"
 ]
},null,2));
