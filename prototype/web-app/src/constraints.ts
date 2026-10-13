/**
 * Directed geometric constraints — synthetic CAD research, not garment rules.
 *
 * Deterministic acyclic projection: each target control point has at most
 * one incoming constraint. This scope intentionally avoids claiming a general
 * nonlinear solver. Canonical units are millimetres, never SVG pixels.
 */
import type { Vec2 } from "./domain";
import type { SketchEntity } from "./scene";

export type ControlRef = { entityId: string; pointIndex: number };
type CommonConstraint = { id: string; source: ControlRef; target: ControlRef };
export type DirectedConstraint =
  | (CommonConstraint & { kind: "COINCIDENT" | "HORIZONTAL" | "VERTICAL" })
  | (CommonConstraint & { kind: "DISTANCE"; distanceMm: number });
export type ConstraintFinding = {
  code: "UNKNOWN_POINT" | "INVALID_INPUT" | "DUPLICATE_TARGET" |
    "CYCLIC_DEPENDENCY" | "UNDETERMINED_DIRECTION" |
    "NONFINITE_RESULT" | "UNSATISFIED";
  constraintId?: string;
  message: string;
};
export type ConstraintMove = {
  ref: ControlRef;
  before: Vec2;
  after: Vec2;
};
export type ConstraintSolution =
  | { status: "SOLVED"; entities: SketchEntity[]; moves: ConstraintMove[];
      residualsMm: Record<string, number> }
  | { status: "BLOCKED"; finding: ConstraintFinding };

const key = (r: ControlRef) => `${r.entityId}#${r.pointIndex}`;
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const isRef = (r: unknown): r is ControlRef => {
  if (typeof r !== "object" || r === null || Array.isArray(r)) return false;
  const v = r as Record<string, unknown>;
  return typeof v.entityId === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(v.entityId) &&
    Number.isSafeInteger(v.pointIndex) && Number(v.pointIndex) >= 0;
};
const clone = (e: SketchEntity): SketchEntity => ({
  id: e.id, pieceId: e.pieceId, kind: e.kind, mode: e.mode,
  pointsMm: e.pointsMm.map(p => ({x:p.x,y:p.y}))
});
const blocked = (
  code: ConstraintFinding["code"], message: string, constraintId?: string
): ConstraintSolution => ({ status:"BLOCKED", finding:{ code,message,constraintId } });
const equals = (a:Vec2,b:Vec2) => a.x === b.x && a.y === b.y;

function residual(c:DirectedConstraint, source:Vec2, target:Vec2):number {
  switch(c.kind) {
    case "COINCIDENT": return Math.hypot(target.x-source.x,target.y-source.y);
    case "HORIZONTAL": return Math.abs(target.y-source.y);
    case "VERTICAL": return Math.abs(target.x-source.x);
    case "DISTANCE": return Math.abs(
      Math.hypot(target.x-source.x,target.y-source.y)-c.distanceMm
    );
  }
}

/**
 * Each target has exactly one independent directing rule. Following source
 * dependencies in stable key order makes solutions independent of input order.
 *
 * This is a one-shot preview; it does not save rules in scene JSON, does not
 * recompute them automatically after future edits and does not mutate inputs.
 */
export function solveDirectedConstraints(
  input: readonly SketchEntity[], constraints: readonly DirectedConstraint[],
  options: { toleranceMm?: number } = {}
): ConstraintSolution {
  const tolerance = options.toleranceMm ?? 1e-7;
  if (!finite(tolerance) || tolerance <= 0 || tolerance > 1) {
    return blocked("INVALID_INPUT","A tolerância experimental deve ser finita e maior que zero");
  }
  if (input.length > 500 || constraints.length > 5000)
    return blocked("INVALID_INPUT","Limite de entidades/constraints excedido");

  const entities = input.map(clone);
  const byEntity = new Map<string, SketchEntity>();
  for (const entity of entities) {
    if (byEntity.has(entity.id) ||
        entity.pointsMm.some(p => !finite(p.x) || !finite(p.y))) {
      return blocked("INVALID_INPUT","Identidade duplicada ou coordenada não finita");
    }
    byEntity.set(entity.id,entity);
  }

  const get = (ref: ControlRef): Vec2 | null => {
    const entity=byEntity.get(ref.entityId);
    return entity?.pointsMm[ref.pointIndex] ?? null;
  };
  const targets=new Map<string, DirectedConstraint>();
  const ids=new Set<string>();

  for (const c of constraints) {
    if (!c || typeof c.id !== "string" || !c.id || ids.has(c.id) ||
        !isRef(c.source) || !isRef(c.target) ||
        !["COINCIDENT","HORIZONTAL","VERTICAL","DISTANCE"].includes(c.kind) ||
        (c.kind==="DISTANCE" && (!finite(c.distanceMm) || c.distanceMm<0))) {
      return blocked("INVALID_INPUT","Constraint inválida, repetida ou distância imprópria",c?.id);
    }
    ids.add(c.id);
    if (!get(c.source) || !get(c.target))
      return blocked("UNKNOWN_POINT","Referência a ponto inexistente",c.id);
    if (key(c.source)===key(c.target))
      return blocked("CYCLIC_DEPENDENCY","Ponto não pode depender de si próprio",c.id);
    if (targets.has(key(c.target)))
      return blocked("DUPLICATE_TARGET","Alvo já possui uma constraint dirigida",c.id);
    targets.set(key(c.target),c);
  }

  const ordered:DirectedConstraint[]=[];
  const visiting=new Set<string>(),done=new Set<string>();
  const visit=(pointKey:string):ConstraintFinding|null=>{
    if(done.has(pointKey))return null;
    if(visiting.has(pointKey))
      return {code:"CYCLIC_DEPENDENCY",message:"Ciclo entre dependências geométricas"};
    visiting.add(pointKey);
    const c=targets.get(pointKey);
    if(c){
      const failure=visit(key(c.source));
      if(failure)return failure;
      ordered.push(c);
    }
    visiting.delete(pointKey);
    done.add(pointKey);
    return null;
  };
  for(const name of [...targets.keys()].sort()){
    const finding=visit(name);
    if(finding)return {status:"BLOCKED",finding};
  }

  const moves:ConstraintMove[]=[];
  const residualsMm:Record<string,number>={};
  for(const c of ordered){
    const source=get(c.source)!,target=get(c.target)!;
    const before={...target};
    let after:Vec2;
    switch(c.kind){
      case "COINCIDENT":
        after={...source};
        break;
      case "HORIZONTAL":
        after={x:target.x,y:source.y};
        break;
      case "VERTICAL":
        after={x:source.x,y:target.y};
        break;
      case "DISTANCE":{
        if(c.distanceMm===0){after={...source};break;}
        const dx=target.x-source.x,dy=target.y-source.y;
        const norm=Math.hypot(dx,dy);
        if(!finite(norm)) return blocked(
          "NONFINITE_RESULT","Distância inicial não finita",c.id);
        if(norm <= 1e-12) return blocked(
          "UNDETERMINED_DIRECTION",
          "Distância positiva sem direção inicial — informar orientação",c.id);
        const factor=c.distanceMm/norm;
        after={x:source.x+dx*factor,y:source.y+dy*factor};
        break;
      }
    }
    if(!finite(after.x)||!finite(after.y))
      return blocked("NONFINITE_RESULT","Resultado projetado não finito",c.id);
    target.x=after.x;target.y=after.y;
    const errorMm=residual(c,source,target);
    if(!finite(errorMm)||errorMm>tolerance)
      return blocked("UNSATISFIED","Resíduo numérico acima da tolerância experimental",c.id);
    residualsMm[c.id]=errorMm;
    if(!equals(before,after))moves.push({
      ref:{...c.target},before,after:{...after}
    });
  }

  // Re-evaluate all upstream constraints after downstream projections.
  for (const c of constraints) {
    const errorMm=residual(c,get(c.source)!,get(c.target)!);
    if(!finite(errorMm)||errorMm>tolerance)
      return blocked("UNSATISFIED","Constraint perdeu satisfação durante projeção",c.id);
    residualsMm[c.id]=errorMm;
  }
  return {status:"SOLVED",entities,moves,residualsMm};
}
