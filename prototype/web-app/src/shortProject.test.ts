import {describe,it,expect} from 'vitest';
import {SHORT_KEYS,SHORT_VERSION,createShortProject,changeShortMeasure,loadShortProject,saveShortProject,proposeShortAllowance,edgeLengthMm,shortDiagnostic} from './shortProject';
import {exportShortSvg,exportShortA4,paginateShortA4,validateShortTiles} from './shortExport';
const meta={commitSha:'1'.repeat(40),generatedAtISO:'2026-10-14T17:20:00.000Z'};
const str=(u:Uint8Array)=>new TextDecoder().decode(u);
describe('MI002 two-panel short — source-independent technical draft',()=>{
 it('generates two separate, stable pieces from all eight cm inputs converted to mm',()=>{
  const p=createShortProject();
  expect(SHORT_KEYS).toHaveLength(8);
  expect(p.pieces.map(x=>x.id)).toEqual(['FRONT','BACK']);
  expect(p.method).toEqual({id:'MI002-ELASTIC-BOXER',version:SHORT_VERSION,authority:'OWNER_SPECIFICATION_TECHNICAL_CANDIDATE',externalMethod:null});
  expect(p.pieces.every(x=>x.edges.length===9&&x.points.length===9)).toBe(true);
  expect(p.release).toEqual({cutReady:false,scalePhysical:'NOT_RUN',assembly:'NOT_RUN',fit:'NOT_RUN'});
  expect(p.decisions.every(x=>x.status==='PENDING_OWNER_DECISION')).toBe(true);
  expect(p.pieces.every(x=>x.edges.every(e=>e.origin&&e.solution&&e.role&&e.review&&e.classificationOrigin))).toBe(true);
  expect(p.pieces.every(x=>x.points.every(v=>v.origin&&v.solution&&v.role&&v.review&&v.classificationOrigin))).toBe(true);
  expect(new Set(p.pieces.flatMap(x=>x.edges.map(e=>e.classification)))).toEqual(new Set(['UNCLASSIFIED','CONSTRUCTION_LINE']));
  expect(p.pieces.flatMap(x=>x.edges).every(x=>x.allowanceMm===null)).toBe(true);
  expect(Object.values(p.edgeAllowances).every(x=>x.proposedMm===null&&x.approval==='PENDING_OWNER_DECISION')).toBe(true);
 });
 it('enforces known widths, enterable rise and exact inseam without using a sewing ease',()=>{
  const p=createShortProject(),d=shortDiagnostic(p);
  for(const row of d.pieces){
   expect(row.waistMm).toBeCloseTo(225,9);
   expect(row.hemMm).toBeCloseTo(310,9);
   expect(row.inseamMm).toBeCloseTo(120,9);
   expect(row.sideMm).toBeGreaterThan(400);
   expect(row.crotchMm).toBeGreaterThan(250);
   const piece=p.pieces.find(x=>x.id===row.id)!;
   expect(piece.points.find(x=>x.id.endsWith(':W1'))!.positionMm.x).toBe(225);
   expect(piece.points.find(x=>x.id.endsWith(':H1'))!.positionMm.x).toBe(255);
   expect(piece.points.find(x=>x.id.endsWith(':G0'))!.positionMm.y).toBe(35);
   expect(row.allEdges).toHaveLength(9);
  }
  expect(p.method.authority).toBe('OWNER_SPECIFICATION_TECHNICAL_CANDIDATE');
 });
 it('rejects contradictory rises and inseam values; no silent adjustment to make fit',()=>{
  expect(()=>createShortProject({...createShortProject().measurements,inseam:80})).toThrow(/MI002_INSEAM_INCOMPATIBLE/);
  expect(()=>createShortProject({...createShortProject().measurements,front_rise:500})).toThrow(/MI002_RISE_OR_ELASTIC/);
  expect(()=>createShortProject({...createShortProject().measurements,waist:NaN})).toThrow(/MI002_MEASURE_INVALID/);
 });
 it('preserves ID/provenance/regeneration/JSON and rejects industrial role injection',()=>{
  const p=createShortProject(),upd=changeShortMeasure(p,'hip',1060),u=loadShortProject(saveShortProject(upd));
  expect(u.revision).toBe(1);expect(u.measurements.hip).toBe(1060);
  expect(u.pieces[0].edges.map(x=>x.id)).toEqual(p.pieces[0].edges.map(x=>x.id));
  expect(p.measurements.hip).toBe(1020);
  for(const role of ['CUT_LINE','SEAM_LINE','FOLD_LINE']){
   const bad=JSON.parse(saveShortProject(p));
   bad.pieces[0].edges[0].classification=role;
   expect(()=>loadShortProject(JSON.stringify(bad))).toThrow(/MI002_GEOMETRY_OR_DECISIONS/);
  }
  const altered=JSON.parse(saveShortProject(p));altered.release.cutReady=true;
  expect(()=>loadShortProject(JSON.stringify(altered))).toThrow(/MI002_RELEASE_NOT_ALLOWED/);
  expect(()=>loadShortProject(JSON.stringify({...p,method:{...p.method,version:'invalid'}}))).toThrow(/MI002_METHOD/);
 });
 it('records a per-edge allowance proposal without applying it to any geometry or approving cut',()=>{
  const p=createShortProject(),next=proposeShortAllowance(p,'FRONT:E04',12.5);
  expect(next.edgeAllowances['FRONT:E04']).toEqual({proposedMm:12.5,approval:'PENDING_OWNER_DECISION'});
  expect(next.pieces).toEqual(p.pieces);
  expect(next.pieces[0].edges[3].allowanceMm).toBeNull();
  expect(next.release.cutReady).toBe(false);
  expect(()=>proposeShortAllowance(p,'BACK:NOT-EDGE',10)).toThrow();
  expect(()=>proposeShortAllowance(p,'FRONT:E04',-1)).toThrow();
  expect(proposeShortAllowance(next,'FRONT:E04',null).edgeAllowances['FRONT:E04'].proposedMm).toBeNull();
  const newSize=changeShortMeasure(next,'waist',920);
  expect(newSize.edgeAllowances['FRONT:E04'].proposedMm).toBe(12.5);
  expect(newSize.pieces[0].edges[3].allowanceMm).toBeNull();
 });
 it('creates dimensionally grounded SVG with every edge attributed and no cut/stitch claims',()=>{
  const p=createShortProject(),svg=exportShortSvg(p);
  expect(svg).toContain('<svg');
  expect(svg).toContain('width="');expect(svg).toContain('mm"');
  expect(svg).toContain('DRAFT / NO CUT / PROVISIONAL GEOMETRY');
  expect((svg.match(/data-classification=/g)??[])).toHaveLength(18);
  expect(svg).toContain('id="FRONT:E06"');
  expect(svg).toContain('id="BACK:E09"');
  expect(svg).not.toContain('ALDRICH');
  expect(svg).not.toContain('data-classification="SEAM_LINE"');
 });
 it('tiles 100% with overlap marks and exactly reproducible A4 pages / SHA/date metadata',()=>{
  const p=createShortProject(),tiles=paginateShortA4(p);
  expect(tiles.length).toBeGreaterThan(2);
  expect(tiles.map(x=>x.piece)).toContain('FRONT');
  expect(tiles.map(x=>x.piece)).toContain('BACK');
  expect(tiles.some(x=>x.neighbors.right)).toBe(true);
  expect(tiles.some(x=>x.neighbors.down)).toBe(true);
  expect(()=>validateShortTiles(p,tiles)).not.toThrow();
  const pdf=exportShortA4(p,meta),text=str(pdf);
  expect(text.startsWith('%PDF-1.4')).toBe(true);
  expect(text).toContain('/Count '+tiles.length);
  expect((text.match(/\/MediaBox \[0 0 595\.27559 841\.88976\]/g)??[])).toHaveLength(tiles.length);
  expect((text.match(/DRAFT \/ NO CUT \/ PROVISIONAL GEOMETRY/g)??[])).toHaveLength(tiles.length);
  expect(text).toContain('100mm');expect(text).toContain('25x25mm');
  expect(text).toContain('REGISTRATION overlap 10mm only');
  expect(text).toContain(meta.commitSha);expect(text).toContain(meta.generatedAtISO);
  expect(exportShortA4(p,meta)).toEqual(pdf);
 });
 it('blocks duplicate or moved A4 pages and preserves clinical NOT_RUN scope',()=>{
  const p=createShortProject(),tiles=paginateShortA4(p);
  expect(()=>validateShortTiles(p,[...tiles,tiles[0]])).toThrow();
  const moved=tiles.map(x=>({...x}));
  moved[0]={...moved[0],originXmm:moved[0].originXmm+20};
  expect(()=>validateShortTiles(p,moved)).toThrow(/MI002_A4_TILE_SHIFT/);
  expect(p.release.scalePhysical).toBe('NOT_RUN');
  expect(p.release.assembly).toBe('NOT_RUN');
  expect(p.release.fit).toBe('NOT_RUN');
 });
});
