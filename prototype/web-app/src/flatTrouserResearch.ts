/**
 * Chapter 2 flat-trouser research scaffold — NOT A PATTERN.
 *
 * Geometric axis signs and point associations were checked visually against
 * the supplied fifth-edition PDF, page 34, alongside text pages 31-33.
 * Only unambiguous front construction points are represented. This does not
 * create a contour, a cut line, a seam allowance or a garment.
 *
 * Original mathematical implementation; no book artwork is redistributed.
 */
import type { Vec2 } from "./domain";

export type TrouserVariant = "BASIC" | "EASY";
export type FlatTrouserResearchKind = "ONE_PIECE" | "TWO_PIECE";
export type FlatTrouserInputs = {
  seatMm: number;
  bodyRiseMm: number;
  insideLegMm: number;
  variant: TrouserVariant;
};
export type FlatTrouserScaffold = {
  purpose: "RESEARCH_ONLY";
  method: FlatTrouserResearchKind;
  variant: TrouserVariant;
  sourcePdfPage: 34;
  unit: "mm";
  frontPointsMm: Readonly<Record<string, Vec2>>;
  /** Auxiliary line segments; NOT finished sewing/cutting edges. */
  guides: ReadonlyArray<readonly [string, string]>;
  unverifiedGeometry: readonly string[];
};

const finitePositive = (n:number):boolean =>
  Number.isFinite(n) && n>0 && n<10000;
const point = (x:number,y:number):Vec2 => {
  if(!Number.isFinite(x)||!Number.isFinite(y))
    throw new RangeError("Resultado geométrico não finito");
  return {x,y};
};

/**
 * Orientation: origin 0 at waist/upper right, positive X to the right,
 * positive Y downward; 0-1-3-2 share X=0. As seen in PDF figure p.34,
 * points 4,8,9 extend left; front knee and hem are below waist.
 *
 * Since the original is a scaled instructional figure, no geometric
 * coordinates are taken from its pixels.
 */
export function draftFlatTrouserFrontResearch(
  method: FlatTrouserResearchKind,
  values: FlatTrouserInputs
):FlatTrouserScaffold {
  if(method!=="ONE_PIECE" && method!=="TWO_PIECE")
    throw new RangeError("Método de calça não suportado");
  if(!finitePositive(values.seatMm) ||
     !finitePositive(values.bodyRiseMm) ||
     !finitePositive(values.insideLegMm) ||
     (values.variant!=="BASIC" && values.variant!=="EASY"))
    throw new RangeError("Medições ou variante inválidas");

  const easy = values.variant==="EASY";
  const rise = values.bodyRiseMm + (easy?40:20);
  const leg = values.insideLegMm;
  const seatQuarter = values.seatMm/4 + (easy?80:40);
  const fork = seatQuarter/4 + (easy?5:-5);
  const p:Record<string,Vec2> = {
    "0":point(0,0),
    "1":point(0,rise),
    "2":point(0,rise+leg),
    "3":point(0,rise+leg/2),
    "4":point(-seatQuarter,rise),
    "5":point(-seatQuarter,0),
    "6":point(-seatQuarter+10,0),
    "7":point(-seatQuarter,rise-rise/4),
    "8":point(-seatQuarter-fork,rise)
  };

  let guides:Array<readonly [string,string]> = [
    ["0","1"],["1","3"],["3","2"],["1","4"],
    ["4","5"],["5","6"],["4","7"],["4","8"]
  ];
  const unresolved=[
    "Todas as curvas do gancho, entreperna e linhas de corte",
    "Construção de costas e montagem das seções",
    "Todas as margens por aresta e orientação de linha de costura",
    "Exatidão de tangências/continuidade e folga física"
  ];

  if(method==="ONE_PIECE"){
    // Diagram p.34 and textual relations p.32: hem reference 9 is
    // displaced from point 2 to the LEFT, knee 10 projects above 9,
    // and knee 11 is 20mm left of 10.
    const hemX=-(2*seatQuarter/3+(easy?25:20));
    p["9"]=point(hemX,rise+leg);
    p["10"]=point(hemX,rise+leg/2);
    p["11"]=point(hemX-20,rise+leg/2);
    guides=[...guides,["2","9"],["9","10"],["10","11"]];
  }else{
    // Text p.33 and diagram p.34: 1-9 goes LEFT, 9 projects down
    // to knee point 10 and hem point 11. Point 12 is LEFT of 11,
    // point 13 is RIGHT of 11, knee 14 intersects the 1-12 guide,
    // and 15 mirrors the knee offset about point 10.
    const centerX=-(seatQuarter/2+10);
    const bottom=rise+leg;
    const knee=rise+leg/2;
    const kneeSpan=seatQuarter/3+10;
    p["9"]=point(centerX,rise);
    p["10"]=point(centerX,knee);
    p["11"]=point(centerX,bottom);
    p["12"]=point(centerX-kneeSpan,bottom);
    p["13"]=point(centerX+kneeSpan,bottom);
    p["14"]=point((0+p["12"].x)/2,knee);
    p["15"]=point(2*centerX-p["14"].x,knee);
    guides=[...guides,["1","9"],["9","10"],["10","11"],
      ["11","12"],["11","13"],["1","12"],["10","14"],
      ["10","15"]];
  }
  return {
    purpose:"RESEARCH_ONLY",method,variant:values.variant,
    sourcePdfPage:34,unit:"mm",frontPointsMm:p,guides,
    unverifiedGeometry:unresolved
  };
}
