import {describe,it,expect} from 'vitest';
import {createShirtProject,changeShirtMeasurement,parseShirtProject,serializeShirtProject} from './flatShirtProject';
import {compareShirtArmholesToHalfSleeve,exportCavaMangaOverlaySvg,classifyFlatShirtEdges,ARMHOLE_CHAIN,HALF_SLEEVE_HEAD_CHAIN} from './flatShirtSeamDiagnostic';
import {exportShirtSvg,exportShirtPdf} from './flatShirtExport';

// Numeric references integrated independently using SciPy quad with absolute eps 1e-11,
// directly from saved v0.1.2 fixture cubic controls (not from production cubicLength).
const EXPECTED_100={
 armE04:168.8194096954,armE03:115.7124236710,
 capE04:56.5394253041,capE03:61.1737524013,capE02:93.4814192396,capE01:84.1241811482,
 arm:284.5318333664,half:295.3187780932,
 delta:10.7869447268,fullHypothesisDelta:21.5738894536
} as const;
const EXPECTED_112={front:299.3908625781,half:302.5985741183} as const;

describe('MI-001 — diagnóstico rastreável cava versus meia cabeça (sem SeamPair)',()=>{
 it('declares 2 armhole segments per side and exactly 4 half-cap segments in underarm→top direction',()=>{
  expect(ARMHOLE_CHAIN.map(x=>[x.edgeId,x.from,x.to])).toEqual([['E04','5','12'],['E03','12','17']]);
  expect(HALF_SLEEVE_HEAD_CHAIN.map(x=>[x.edgeId,x.from,x.to])).toEqual([
   ['E04','3','HEAD_HOLLOW_5'],['E03','HEAD_HOLLOW_5','6'],['E02','6','HEAD_RAISE_78'],['E01','HEAD_RAISE_78','0']]);
  const result=compareShirtArmholesToHalfSleeve(createShirtProject());
  expect(result.front.segments.map(x=>[x.edgeId,x.from,x.to])).toEqual([
   ['FRONT:E04','FRONT:5','FRONT:12'],['FRONT:E03','FRONT:12','FRONT:17']]);
  expect(result.back.segments.map(x=>x.edgeId)).toEqual(['BACK:E04','BACK:E03']);
  expect(result.halfSleeveHead.segments.map(x=>x.edgeId)).toEqual(['SLEEVE:E04','SLEEVE:E03','SLEEVE:E02','SLEEVE:E01']);
  for(const chain of [result.front,result.back,result.halfSleeveHead]){
   expect(chain.industrialRole).toBe('UNCLASSIFIED');
   for(const seg of chain.segments){expect(seg.role).toBe('UNCLASSIFIED');expect(seg.origin).toBe('TECHNICAL_DECISION');expect(seg.review).toBe('DRAFT');expect(seg.solution).toMatch(/INTERPOLATION@/);expect(seg.source).toContain('Aldrich5');}
  }
 });
 it('matches independently calculated 100cm fixture lengths at segment granularity, without source-fitting',()=>{
  const r=compareShirtArmholesToHalfSleeve(createShirtProject());
  expect(r.front.segments[0].lengthMm).toBeCloseTo(EXPECTED_100.armE04,6);
  expect(r.front.segments[1].lengthMm).toBeCloseTo(EXPECTED_100.armE03,6);
  expect(r.back.segments[0].lengthMm).toBeCloseTo(EXPECTED_100.armE04,6);
  for(const [i,len] of [EXPECTED_100.capE04,EXPECTED_100.capE03,EXPECTED_100.capE02,EXPECTED_100.capE01].entries())
   expect(r.halfSleeveHead.segments[i].lengthMm).toBeCloseTo(len,6);
  expect(r.front.totalMm).toBeCloseTo(EXPECTED_100.arm,6);
  expect(r.back.totalMm).toBeCloseTo(EXPECTED_100.arm,6);
  expect(r.halfSleeveHead.totalMm).toBeCloseTo(EXPECTED_100.half,6);
  expect(r.differences.halfHeadMinusFrontMm).toBeCloseTo(EXPECTED_100.delta,6);
  expect(r.differences.twoMirroredHalvesMinusBothArmholesMm).toBeCloseTo(EXPECTED_100.fullHypothesisDelta,6);
  expect(r.geometricExcess.headTotalHypothesisMm).toBeCloseTo(590.6375561864,6);
  expect(r.geometricExcess.armscyeTotalMm).toBeCloseTo(569.0636667328,6);
  expect(r.geometricExcess.excessTotalMm).toBeCloseTo(EXPECTED_100.fullHypothesisDelta,6);
  expect(r.geometricExcess.excessFrontHalfMm).toBeCloseTo(EXPECTED_100.delta,6);
  expect(r.geometricExcess.excessBackHalfMm).toBeCloseTo(EXPECTED_100.delta,6);
  expect(r.geometricExcess.stitchLineStatus).toBe('NOT_IDENTIFIED');
  expect(r.geometricExcess.approvedTargetMm).toBeNull();
  expect(r.geometricExcess.approvedToleranceMm).toBeNull();
  expect(r.geometricExcess.frontNotch).toBeNull();
  expect(r.geometricExcess.backNotch).toBeNull();
  expect(r.geometricExcess.upperZoneMm).toBeNull();
  expect(r.geometricExcess.lowerFrontZoneMm).toBeNull();
  expect(r.geometricExcess.lowerBackZoneMm).toBeNull();
  expect(r.geometricExcess.designIntent).toBe('UNDEFINED');
  expect(r.geometricExcess.distribution).toBe('UNDEFINED');
  expect(r.construction.sourceAddedToDiagonalMm).toBeCloseTo(30,8);
  expect(r.construction.hollow5Mm).toBeCloseTo(7.5,8);
  expect(r.construction.riseBetween7and8Mm).toBeCloseTo(15,8);
  expect(r.construction.frontBackArcDifferenceMm).toBe(0);
  expect(r.verdict).toBe('INDEFINITE');
 });
 it('regeneration with chest 112cm maintains segment provenance and no-cut release, and shifts only numeric lengths',()=>{
  const initial=createShirtProject();const stored=serializeShirtProject(initial);
  const edited=changeShirtMeasurement(initial,'chest',1120);
  const reopened=parseShirtProject(serializeShirtProject(edited));
  const a=compareShirtArmholesToHalfSleeve(edited);
  expect(compareShirtArmholesToHalfSleeve(reopened)).toEqual(a);
  expect(a.front.totalMm).toBeCloseTo(EXPECTED_112.front,6);
  expect(a.halfSleeveHead.totalMm).toBeCloseTo(EXPECTED_112.half,6);
  expect(a.geometricExcess.excessTotalMm).toBeCloseTo(6.4154230804,6);
  expect(a.geometricExcess.approvedTargetMm).toBeNull();
  expect(a.method).toEqual(initial.method);
  expect(a.front.segments.map(x=>x.edgeId)).toEqual(compareShirtArmholesToHalfSleeve(initial).front.segments.map(x=>x.edgeId));
  expect(a.halfSleeveHead.segments.map(x=>x.edgeId)).toEqual(compareShirtArmholesToHalfSleeve(initial).halfSleeveHead.segments.map(x=>x.edgeId));
  expect(serializeShirtProject(initial)).toBe(stored);
  expect(a.release).toEqual({cutReady:false,scalePhysical:'NOT_RUN',assembly:'NOT_RUN',fit:'NOT_RUN'});
 });
 it('exports same-scale rigid overlay with all relevant reference anchors but no manufactured notches',()=>{
  const p=createShirtProject();const beforeSvg=exportShirtSvg(p),beforePdf=exportShirtPdf(p);
  const svg=exportCavaMangaOverlaySvg(p);
  expect(svg).toContain('width="910mm"');expect(svg).toContain('height="520mm"');
  expect(svg).toContain('data-edges="FRONT:E04 FRONT:E03"');
  expect(svg).toContain('data-edges="BACK:E04 BACK:E03"');
  expect(svg).toContain('data-edges="SLEEVE:E04 SLEEVE:E03 SLEEVE:E02 SLEEVE:E01"');
  expect(svg).toContain('INDEFINITE');expect(svg).toContain('NOT_RUN');expect(svg).toContain('NÃO CORTAR');
  expect(svg).toContain('não pique');expect(svg).toContain('Espelhar/dobrar a meia manga é hipótese');
  expect(svg).toContain('295.319 mm');expect(svg).toContain('284.532 mm');
  expect(svg).toContain('data-geometric-excess-mm="21.574"');
  expect(svg).toContain('EXCEDENTE geométrico');
  expect(svg).toContain('590.638 mm');
  expect(svg).toContain('569.064 mm');
  expect(svg).toContain('Excedente geométrico ≠ folga de costura aprovada.');
  expect(exportShirtSvg(p)).toBe(beforeSvg);
  expect(exportShirtPdf(p)).toEqual(beforePdf);
 });
 it('does not claim a manufactured seam or decide the front/back mapping even when both computed lengths coincide',()=>{
  const r=compareShirtArmholesToHalfSleeve(createShirtProject());
  expect(r.classifications.some(x=>x.item.includes('Numeric')&&x.class==='GEOMETRY_CALCULATION')).toBe(true);
  expect(r.classifications.some(x=>x.item.includes('Full cap')&&x.class==='TECHNICAL_DECISION_PENDING')).toBe(true);
  expect(r.halfToFull.hypothesis).toBe('MIRROR_ABOUT_0_TO_2_NOT_APPROVED');
  expect(r.matchCandidates.every(x=>!x.approved&&x.kind==='GEOMETRIC_REGISTRATION_NOT_NOTCH')).toBe(true);
  expect(r.reason).toMatch(/Excedente geométrico total mensurável/);
  expect(r.reason).toMatch(/SeamPair/);
  expect(r.front.totalMm).toBe(r.back.totalMm);
 });
 it('classifies all 22 existing edges without inferring a stitch or fold line',()=>{
  const p=createShirtProject(),before=serializeShirtProject(p);
  const roles=classifyFlatShirtEdges(p);
  expect(roles).toHaveLength(22);
  expect(roles.map(x=>x.edgeId)).toEqual(p.pieces.flatMap(x=>x.edges.map(e=>e.id)));
  expect(roles.filter(x=>x.classification==='CONSTRUCTION_LINE').map(x=>x.edgeId))
   .toEqual(['FRONT:E07','BACK:E07','SLEEVE:E05','SLEEVE:E08']);
  expect(roles.filter(x=>x.classification==='UNCLASSIFIED')).toHaveLength(18);
  expect(roles.every(x=>x.classification!=='SEAM_LINE'&&x.classification!=='FOLD_LINE')).toBe(true);
  expect(roles.every(x=>x.stitchLineConfirmed===false&&x.roleRevision==='DRAFT')).toBe(true);
  expect(roles.find(x=>x.edgeId==='SLEEVE:E08')).toMatchObject({
   previousRole:'CONSTRUCTION',classification:'CONSTRUCTION_LINE',classificationOrigin:'SOURCE_EXPLICIT',
   sourceLocation:'PDF p.36; fig. p.38'
  });
  expect(roles.find(x=>x.edgeId==='FRONT:E07')).toMatchObject({
   previousRole:'UNCLASSIFIED',classification:'CONSTRUCTION_LINE',classificationOrigin:'SOURCE_INFERRED'
  });
  for(const id of ['FRONT:E03','FRONT:E04','BACK:E03','BACK:E04',
   'SLEEVE:E01','SLEEVE:E02','SLEEVE:E03','SLEEVE:E04']){
   expect(roles.find(x=>x.edgeId===id)).toMatchObject({
    classification:'UNCLASSIFIED',classificationOrigin:'PENDING_REVIEW',stitchLineConfirmed:false
   });
  }
  expect(serializeShirtProject(p)).toBe(before);
  expect(p.method.version).toBe('research-0.1.2');
 });
 it('exposes edge classification in diagnostic JSON but leaves original stitchLineStatus and lengths untouched',()=>{
  const p=createShirtProject();
  const before=compareShirtArmholesToHalfSleeve(p);
  const snapshot=serializeShirtProject(p);
  const classified=classifyFlatShirtEdges(p);
  const next=compareShirtArmholesToHalfSleeve(p);
  expect(next.edgeClassifications).toEqual(classified);
  expect(next.geometricExcess.stitchLineStatus).toBe('NOT_IDENTIFIED');
  expect(next.front.totalMm).toBeCloseTo(EXPECTED_100.arm,7);
  expect(next.halfSleeveHead.totalMm).toBeCloseTo(EXPECTED_100.half,7);
  expect(next.geometricExcess.excessTotalMm).toBeCloseTo(EXPECTED_100.fullHypothesisDelta,7);
  expect(next.front.segments).toEqual(before.front.segments);
  expect(next.back.segments).toEqual(before.back.segments);
  expect(next.halfSleeveHead.segments).toEqual(before.halfSleeveHead.segments);
  expect(next.release.cutReady).toBe(false);
  expect(JSON.parse(JSON.stringify(next)).edgeClassifications).toHaveLength(22);
  expect(serializeShirtProject(p)).toBe(snapshot);
 });
 it('embeds all classification origins and prior roles in the existing SVG without moving geometry',()=>{
  const p=createShirtProject();
  const svg=exportShirtSvg(p);
  expect((svg.match(/data-line-class=/g)??[])).toHaveLength(22);
  expect((svg.match(/data-class-origin=/g)??[])).toHaveLength(22);
  expect(svg).toContain('data-line-class="CONSTRUCTION_LINE" data-class-origin="SOURCE_EXPLICIT"');
  expect(svg).toContain('data-line-class="UNCLASSIFIED" data-class-origin="PENDING_REVIEW"');
  expect(svg).toContain('0 SEAM_LINE');
  expect(svg).toContain('cutReady=false');
  expect(p.release).toEqual({cutReady:false,scalePhysical:'NOT_RUN',assembly:'NOT_RUN',fit:'NOT_RUN'});
 });

});
