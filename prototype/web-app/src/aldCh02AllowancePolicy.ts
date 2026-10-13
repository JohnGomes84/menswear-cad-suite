/**
 * Source-derived block-level allowance statement, Aldrich CH02 PDF p.31.
 *
 * The book says 10 mm are INCLUDED in the flat trouser blocks, with
 * exceptions marked "no seam allowance". It does not license a blanket
 * geometric offset, since the source/piece edge topology remains unverified.
 */
import type { FrontMethod,FrontVariant } from "./aldCh02FlatTrouserProgram";

export const flatTrouserAllowancePolicy = Object.freeze({
  methodId:"ALD-CH02-01" as const,
  source:{chapter:2,pdfPage:31,claim:"BLOCK_LEVEL_GENERAL_ALLOWANCE" as const},
  nominalIncludedMm:10,
  generalRule:"ALREADY_INCLUDED_IN_BLOCK" as const,
  exceptionLabel:"NO_SEAM_ALLOWANCE" as const,
  edgeMapping:"NOT_YET_DEFINED" as const,
  geometryOperation:"BLOCKED_NO_OFFSET" as const
});

export function assessCh02Allowance(
  method:FrontMethod,
  variant:FrontVariant,
  candidateEdgeId:string
){
  if(!["ONE_PIECE","TWO_PIECE"].includes(method)||
     !["BASIC","EASY"].includes(variant) ||
     !/^[A-Za-z0-9:_-]{1,120}$/.test(candidateEdgeId))
    throw new RangeError("Método/variante/aresta não identificados");
  return {
    source:flatTrouserAllowancePolicy.source,
    sourceMethodId:flatTrouserAllowancePolicy.methodId,
    method,variant,candidateEdgeId,
    nominalIncludedMm:flatTrouserAllowancePolicy.nominalIncludedMm,
    rule:flatTrouserAllowancePolicy.generalRule,
    exceptionHandling:"REQUIRES_DIAGRAM_EDGE_MAPPING" as const,
    decision:"BLOCKED_UNTIL_SOURCE_EDGE_TOPOLOGY_REVIEW" as const,
    automaticOffsetAllowed:false as const,
    reason:"10 mm já incluídos no bloco; sem identificar arestas e exceções, um segundo offset seria incorreto."
  };
}
