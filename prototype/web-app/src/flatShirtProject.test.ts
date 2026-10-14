import {describe,it,expect} from 'vitest';
import {SHIRT_KEYS,createShirtProject,changeShirtMeasurement,serializeShirtProject,parseShirtProject,validateShirtProject,evidenceFingerprint} from './flatShirtProject';
import {exportShirtSvg,exportShirtPdf,exportCalibrationPdf} from './flatShirtExport';
import {cubicPoint,cubicDerivative,cubicLength} from './geometry';
const same=(a:unknown,b:unknown)=>expect(a).toEqual(b);
describe('MI-001 real Flat Shirt source plus explicit provisional decisions',()=>{
 it('creates exactly 3 experimental pieces with stable IDs and independent provenance dimensions',()=>{
  const p=createShirtProject();expect(p.pieces.map(x=>x.id)).toEqual(['FRONT','BACK','SLEEVE']);
  expect(p.method).toMatchObject({id:'ALD-FLAT-SHIRT-CORE',version:'research-0.1.2'});
  expect(p.pieces.every(x=>x.status==='EXPERIMENTAL_CONTOUR_ONLY')).toBe(true);
  expect(p.pieces.every(x=>x.edges.every(e=>e.origin&&e.solution&&e.role&&e.review&&e.source&&e.dependsOn))).toBe(true);
  expect(p.pieces.some(x=>x.edges.some(e=>e.kind==='CUBIC_BEZIER'&&e.origin==='TECHNICAL_DECISION'))).toBe(true);
  expect(p.pieces.some(x=>x.edges.some(e=>e.origin==='SOURCE_LINE'))).toBe(true);
  expect(p.pieces.every(x=>x.edges.every(e=>e.role!=='CUT'&&e.role!=='SEAM'))).toBe(true);
  expect(p.pieces.every(x=>x.points.every(v=>v.origin&&v.source&&v.solution&&v.role&&v.review&&v.dependsOn))).toBe(true);
  expect(p.purpose).toBe('SOURCE_DRAFT_DIAGNOSTIC_ONLY');expect(p.warning).toContain('NO_CUT');
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
 it('reconstructs the chapter 2 body scalar matrix from source pp.35-36 without premature rounding',()=>{
  const p=createShirtProject(), pts=Object.fromEntries(p.pieces[0].points.map(x=>[x.id,x.positionMm]));
  const known:Record<string,{x:number;y:number}>={
   '0':{x:0,y:0}, '1':{x:0,y:30}, '2':{x:0,y:314},
   '3':{x:0,y:472}, '4':{x:0,y:730}, '5':{x:315,y:314},
   '6':{x:315,y:0}, '7':{x:315,y:472}, '8':{x:315,y:730},
   '9':{x:74,y:30}, '10':{x:74,y:0}, '11':{x:0,y:172},
   '12':{x:250,y:172}, '13':{x:250,y:314}, '14':{x:250,y:0},
   '15':{x:0,y:57.5}, '16':{x:250,y:57.5}, '17':{x:265,y:57.5},
   '18':{x:0,y:90}
  };
  for(const [id,expected] of Object.entries(known)){
   expect(pts['FRONT:'+id].x).toBeCloseTo(expected.x,8);
   expect(pts['FRONT:'+id].y).toBeCloseTo(expected.y,8);
  }
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
  expect(()=>validateShirtProject({...p,warning:'APPROVED'})).toThrow(/DRAFT\/NO-CUT/);
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

 it('separates source fifths on the diagonal from the proposed sleeve-head contour',()=>{
  const p=createShirtProject(),s=p.pieces[2];
  const pts=Object.fromEntries(s.points.map(q=>[q.id,q.positionMm]));
  const a=pts['SLEEVE:3'],b=pts['SLEEVE:0'];
  // Expected drafting proportions are independent of the generation helper.
  for(const [id,fraction] of [['5',.2],['6',.4],['7',.6],['8',.8]] as const){
   const actual=pts['SLEEVE:'+id];
   expect(actual.x).toBeCloseTo(a.x+(b.x-a.x)*fraction,9);
   expect(actual.y).toBeCloseTo(a.y+(b.y-a.y)*fraction,9);
  }
  expect(pts['SLEEVE:HEAD_HOLLOW_5'].y-pts['SLEEVE:5'].y).toBeCloseTo(7.5,9);
  const midpoint=(pts['SLEEVE:7'].y+pts['SLEEVE:8'].y)/2;
  expect(pts['SLEEVE:HEAD_RAISE_78'].x).toBeCloseTo((pts['SLEEVE:7'].x+pts['SLEEVE:8'].x)/2,9);
  expect(pts['SLEEVE:HEAD_RAISE_78'].y-midpoint).toBeCloseTo(-15,9);
  expect(p.decisions.find(d=>d.id==='SLEEVE_HEAD_INTERPOLATION')?.version).toBe('1.0.2');
  expect(s.edges.filter(e=>e.solution==='SLEEVE_HEAD_INTERPOLATION@1.0.2')).toHaveLength(4);
  expect(s.edges.some(e=>e.solution==='SOURCE_DIAGONAL_0_3'&&e.role==='CONSTRUCTION')).toBe(true);
 });
 it('has smooth C1 tangent direction across provisional head knots with no spike above tip 0',()=>{
  const s=createShirtProject().pieces[2],p=Object.fromEntries(s.points.map(x=>[x.id,x.positionMm]));
  const cap=s.edges.filter(e=>e.solution==='SLEEVE_HEAD_INTERPOLATION@1.0.2');
  expect(cap.map(e=>e.from)).toEqual(['SLEEVE:0','SLEEVE:HEAD_RAISE_78','SLEEVE:6','SLEEVE:HEAD_HOLLOW_5']);
  for(const edge of cap){
   const controls=[p[edge.from],...edge.controlsMm!,p[edge.to]] as const;
   for(let k=0;k<=100;k++){
    const sample=cubicPoint(controls,k/100);
    expect(sample.y).toBeGreaterThanOrEqual(-1e-7);
    expect(sample.x).toBeLessThanOrEqual(1e-7);
    expect(sample.x).toBeGreaterThanOrEqual(p['SLEEVE:3'].x-1e-7);
   }
   expect(cubicLength(controls)).toBeGreaterThan(0);
  }
  for(let i=0;i<cap.length-1;i++){
   const e=cap[i],next=cap[i+1];
   const exit=cubicDerivative([p[e.from],...e.controlsMm!,p[e.to]],1);
   const enter=cubicDerivative([p[next.from],...next.controlsMm!,p[next.to]],0);
   const cross=exit.x*enter.y-exit.y*enter.x;
   expect(Math.abs(cross)/(Math.hypot(exit.x,exit.y)*Math.hypot(enter.x,enter.y))).toBeLessThan(1e-10);
   expect(exit.x*enter.x+exit.y*enter.y).toBeGreaterThan(0);
  }
 });
 it('does not silently reinterpret old version or rely on arbitrary 7–8 control bump',()=>{
  const p=createShirtProject();
  expect(()=>parseShirtProject(JSON.stringify({...p,method:{...p.method,version:'research-0.1.1'}}))).toThrow(/migra/);
  expect(p.pieces[2].points.find(x=>x.id==='SLEEVE:5')?.positionMm.y).toBeCloseTo(75.7333333333,5);
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
