import {describe,it,expect} from 'vitest';
import {SHIRT_KEYS,createShirtProject,changeShirtMeasurement,serializeShirtProject,parseShirtProject,validateShirtProject,evidenceFingerprint} from './flatShirtProject';
import {exportShirtSvg,exportShirtPdf,exportCalibrationPdf} from './flatShirtExport';
const same=(a:unknown,b:unknown)=>expect(a).toEqual(b);
describe('MI-001 real Flat Shirt source plus explicit provisional decisions',()=>{
 it('creates exactly 3 experimental pieces with stable IDs and independent provenance dimensions',()=>{
  const p=createShirtProject();expect(p.pieces.map(x=>x.id)).toEqual(['FRONT','BACK','SLEEVE']);
  expect(p.method).toMatchObject({id:'ALD-FLAT-SHIRT-CORE',version:'research-0.1.1'});
  expect(p.pieces.every(x=>x.status==='EXPERIMENTAL_CONTOUR_ONLY')).toBe(true);
  expect(p.pieces.every(x=>x.edges.every(e=>e.origin&&e.solution&&e.role&&e.review&&e.source&&e.dependsOn))).toBe(true);
  expect(p.pieces.some(x=>x.edges.some(e=>e.kind==='CUBIC_BEZIER'&&e.origin==='TECHNICAL_DECISION'))).toBe(true);
  expect(p.pieces.some(x=>x.edges.some(e=>e.origin==='SOURCE_LINE'))).toBe(true);
  expect(p.pieces.every(x=>x.edges.every(e=>e.role!=='CUT'&&e.role!=='SEAM'))).toBe(true);
  expect(p.pieces.every(x=>x.points.every(v=>v.origin&&v.source&&v.solution&&v.role&&v.review&&v.dependsOn))).toBe(true);
  expect(p.release).toEqual({cutReady:false,scalePhysical:'NOT_RUN',assembly:'NOT_RUN',fit:'NOT_RUN'});
 });
 it('uses original interpreter for body and sleeve deterministic geometric relations',()=>{
  const p=createShirtProject();const b=p.pieces[0].points;const coords=Object.fromEntries(b.map(x=>[x.id,x.positionMm]));
  expect(coords['FRONT:2'].y-coords['FRONT:1'].y).toBeCloseTo(284,8);
  expect(coords['FRONT:5'].x).toBeCloseTo(315,8);
  const sl=Object.fromEntries(p.pieces[2].points.map(x=>[x.id,x.positionMm]));
  expect(sl['SLEEVE:2'].y).toBeCloseTo(630,8);
  expect(Math.hypot(sl['SLEEVE:3'].x,sl['SLEEVE:3'].y)).toBeCloseTo(Math.hypot(coords['FRONT:5'].x-coords['FRONT:17'].x,coords['FRONT:5'].y-coords['FRONT:17'].y)+30,6);
  expect(sl['SLEEVE:4'].x).toBeCloseTo(-139,8);
 });
 it('regenerates changed measurements while preserving point/edge identities and untouched input',()=>{
  const before=createShirtProject();const after=changeShirtMeasurement(before,'chest',1120);
  expect(before.measurements.chest.valueMm).toBe(1000);
  expect(after.measurements.chest.valueMm).toBe(1120);
  expect(after.revision).toBe(1);
  expect(after.pieces.map(x=>x.points.map(y=>y.id))).toEqual(before.pieces.map(x=>x.points.map(y=>y.id)));
  expect(after.pieces.map(x=>x.edges.map(y=>y.id))).toEqual(before.pieces.map(x=>x.edges.map(y=>y.id)));
  expect(after.pieces[0].points.find(x=>x.id==='FRONT:5')?.positionMm.x).not.toEqual(before.pieces[0].points.find(x=>x.id==='FRONT:5')?.positionMm.x);
  expect(after.pieces[2].points.find(x=>x.id==='SLEEVE:3')?.positionMm.x).not.toEqual(before.pieces[2].points.find(x=>x.id==='SLEEVE:3')?.positionMm.x);
 });
 it('roundtrips JSON with method identity, decisions, geometry, mm, trace and blockers',()=>{
  const p=changeShirtMeasurement(createShirtProject(),'neck_size',425);same(parseShirtProject(serializeShirtProject(p)),p);
  same(createShirtProject(),createShirtProject());
 });
 it('rejects invalid measurement and preserves previous project atomically',()=>{
  const p=createShirtProject();const snapshot=serializeShirtProject(p);
  expect(()=>changeShirtMeasurement(p,'chest',Number.NaN)).toThrow();
  expect(()=>changeShirtMeasurement(p,'garment_length',50)).toThrow();
  expect(()=>changeShirtMeasurement(p,'fake' as never,500)).toThrow();
  expect(serializeShirtProject(p)).toBe(snapshot);
 });
 it('refuses silent method upgrade or forged geometry, safety flag and unknown decision',()=>{
  const p=createShirtProject();
  expect(()=>parseShirtProject(JSON.stringify({...p,method:{...p.method,version:'research-0.2.0'}}))).toThrow(/migra/);
  expect(()=>validateShirtProject({...p,release:{...p.release,cutReady:true}})).toThrow();
  const bad=structuredClone(p);bad.pieces[0].points[0].positionMm.x+=1;
  expect(()=>validateShirtProject(bad)).toThrow(/reproduz/);
  expect(()=>validateShirtProject({...p,decisions:[...p.decisions,{...p.decisions[0],id:'EXTRA'}]})).toThrow();
 });
 it('invalidates only impacted reviewed evidence for measurement change',()=>{
  const p=createShirtProject();const reviewed={...p,evidence:p.evidence.map(x=>({...x,state:'REVIEWED' as const,evidenceRef:'simulated-review-ref',evaluatedRevision:0,basisFingerprint:evidenceFingerprint(p,x)}))};
  validateShirtProject(reviewed);
  const changed=changeShirtMeasurement(reviewed,'chest',1050);
  expect(changed.evidence.map(x=>x.state)).toEqual(['STALE','STALE','REVIEWED']);
  expect(changed.evidence[2].evaluatedRevision).toBe(0);
  expect(()=>validateShirtProject({...reviewed,measurements:{...reviewed.measurements,chest:{...reviewed.measurements.chest,valueMm:1050}}})).toThrow();
  expect(changed.release.cutReady).toBe(false);
 });
 it('exports SVG mm geometry and a non-cut warning, provisional decision traces',()=>{
  const x=exportShirtSvg(createShirtProject());
  expect(x).toContain('width="1200mm"');expect(x).toContain('height="850mm"');
  expect(x).toContain('NO CUT');expect(x).toContain('cutReady=false');
  expect(x).toContain('data-origin="TECHNICAL_DECISION"');
  for(const id of ['FRONT','BACK','SLEEVE'])expect(x).toContain(`id="${id}"`);
 });
 it('generates deterministic one-page PDF with nominal physical MediaBox and disclaimer',()=>{
  const p=createShirtProject();const a=exportShirtPdf(p),b=exportShirtPdf(p);
  expect(a).toEqual(b);
  const str=new TextDecoder().decode(a);
  expect(str).toMatch(/^%PDF-1\.4/);expect(str).toContain('/MediaBox [0 0');
  expect(str).toContain('NO CUT');expect(str).toContain('Scale verification: NOT_RUN');
  expect(str).toContain('xref\n');expect(str).toContain('%%EOF');
 });
 it('generates A4 measurement form and calibration square nominally sized',()=>{
  const x=new TextDecoder().decode(exportCalibrationPdf());
  expect(x).toContain('/MediaBox [0 0 595.27559 841.88976]');
  expect(x).toContain('25 x 25');expect(x).toContain('NOT_RUN');
 });

 it('checks documented 7.5mm at sleeve reference 5 and versioned provisional curvature',()=>{
  const p=createShirtProject();const pts=Object.fromEntries(p.pieces[2].points.map(x=>[x.id,x.positionMm]));
  const linear=(pts['SLEEVE:3'].y*0.8+pts['SLEEVE:0'].y*0.2);
  expect(pts['SLEEVE:5'].y-linear).toBeCloseTo(-7.5,7);
  const cap=p.pieces[2].edges.find(e=>e.from==='SLEEVE:7'&&e.to==='SLEEVE:8');
  expect(cap?.solution).toBe('SLEEVE_HEAD_INTERPOLATION@1.0.1');
  expect(p.decisions.find(x=>x.id==='SLEEVE_HEAD_INTERPOLATION')?.version).toBe('1.0.1');
  expect(()=>parseShirtProject(JSON.stringify({...p,method:{...p.method,version:'research-0.1.0'}}))).toThrow(/migra/);
 });
 it('rejects clipping and piece overlap in diagnostic PDF and SVG exports',()=>{
  const original=createShirtProject();expect(exportShirtPdf(original).length).toBeGreaterThan(1000);
  const tooLong=changeShirtMeasurement(original,'garment_length',1800);
  expect(()=>exportShirtSvg(tooLong)).toThrow(/EXPORT_PAGE_OVERFLOW/);
  expect(()=>exportShirtPdf(tooLong)).toThrow(/EXPORT_PAGE_OVERFLOW/);
  expect(exportShirtSvg(tooLong,false)).toContain('NO CUT'); // viewport remains diagnostic, no false export
  const tooWide=changeShirtMeasurement(original,'chest',1600);
  expect(()=>exportShirtPdf(tooWide)).toThrow(/EXPORT_PIECE_OVERLAP/);
 });

 it('maintains individual measure origins and reports provisional status in every piece',()=>{
  const p=createShirtProject();expect(SHIRT_KEYS).toHaveLength(8);
  expect(p.measurements.garment_length.origin).toBe('USER_INPUT');
  expect(p.decisions.every(x=>x.status==='PROVISIONAL')).toBe(true);
  expect(p.pieces.every(x=>x.edges.some(e=>e.origin==='TECHNICAL_DECISION'))).toBe(true);
 });
});
