import {describe,it,expect} from 'vitest';
import {createShirtProject,changeShirtMeasurement,serializeShirtProject} from './flatShirtProject';
import {compareShirtArmholesToHalfSleeve} from './flatShirtSeamDiagnostic';
import {A4_PRINT,paginateFlatShirtA4,assertTiledPageLayout,exportShirtTiledA4Pdf,exportPhysicalCalibrationProtocolPdf,PHYSICAL_FORM_FIELDS} from './flatShirtExport';
const FIXED={commitSha:'ab'.repeat(20),generatedAtISO:'2026-10-14T16:17:37.000Z'};
const asText=(bytes:Uint8Array)=>new TextDecoder().decode(bytes);

describe('MI-001 A4 print diagnostic — never pattern authorization',()=>{
 it('deterministically tiles all three pieces in 100%-size 180x214mm windows with 10mm registration strips',()=>{
  const p=createShirtProject();
  const a=paginateFlatShirtA4(p),b=paginateFlatShirtA4(p);
  expect(a).toEqual(b);
  expect(a.length).toBeGreaterThan(1);
  expect(a.length).toBeLessThan(50);
  expect(new Set(a.map(x=>x.piece))).toEqual(new Set(['FRONT','BACK','SLEEVE']));
  expect(a.every((x,i)=>x.index===i+1)).toBe(true);
  expect(A4_PRINT.pageWidthMm).toBe(210);expect(A4_PRINT.pageHeightMm).toBe(297);
  expect(A4_PRINT.frameWidthMm).toBe(180);expect(A4_PRINT.frameHeightMm).toBe(214);
  expect(A4_PRINT.overlapMm).toBe(10);
  expect(a.some(x=>x.neighbors.right!==null)).toBe(true);
  expect(a.some(x=>x.neighbors.down!==null)).toBe(true);
  for(const page of a){
   if(page.neighbors.right!==null){
    const right=a[page.neighbors.right-1];
    expect(right.piece).toBe(page.piece);
    expect(page.originXmm+175).toBeCloseTo(right.originXmm+5,7);
    expect(right.originYmm).toBe(page.originYmm);
   }
   if(page.neighbors.down!==null){
    const down=a[page.neighbors.down-1];
    expect(down.piece).toBe(page.piece);
    expect(page.originYmm+209).toBeCloseTo(down.originYmm+5,7);
    expect(down.originXmm).toBe(page.originXmm);
   }
  }
  expect(()=>assertTiledPageLayout(a,p)).not.toThrow();
 });
 it('refuses duplicate tiles and unexpected overlap rather than silently covering another section',()=>{
  const p=createShirtProject(),pages=paginateFlatShirtA4(p);
  expect(()=>assertTiledPageLayout([...pages,pages[0]],p)).toThrow(/A4_DUPLICATE/);
  const modified=pages.map(x=>({...x}));
  modified[1]={...modified[1],originXmm:pages[0].originXmm+100,worldRightMm:pages[0].originXmm+280};
  expect(()=>assertTiledPageLayout(modified,p)).toThrow(/A4_UNEXPECTED_TILE_OVERLAP/);
  const missing=pages.slice(1);
  expect(()=>assertTiledPageLayout(missing,p)).toThrow(/A4_TILE_GAP/);
 });
 it('generates exact A4 MediaBoxes, mandatory identity per page and no geometric scaling',()=>{
  const p=createShirtProject(),before=serializeShirtProject(p),tiles=paginateFlatShirtA4(p);
  const bytes=exportShirtTiledA4Pdf(p,FIXED),txt=asText(bytes);
  expect(bytes.length).toBeGreaterThan(8000);
  expect(txt.startsWith('%PDF-1.4')).toBe(true);
  expect(txt).toContain('/Count '+tiles.length);
  expect((txt.match(/\/MediaBox \[0 0 595\.27559 841\.88976\]/g)??[])).toHaveLength(tiles.length);
  expect((txt.match(/DRAFT \/ NO CUT \/ PROVISIONAL GEOMETRY/g)??[])).toHaveLength(tiles.length);
  expect((txt.match(new RegExp('Commit SHA: '+FIXED.commitSha,'g'))??[])).toHaveLength(tiles.length);
  expect(txt.split(FIXED.generatedAtISO).length-1).toBe(tiles.length);
  expect((txt.match(/ W n/g)??[])).toHaveLength(tiles.length); // ONLY clip to the nominal 180x214mm window
  expect(txt).toContain('100mm ruler - measure on paper');expect(txt).toContain('25x25 mm');
  expect(txt).toContain('NOT_RUN');expect(txt).toContain('cutReady=false');
  expect(txt).not.toMatch(/\scm\s|scale\(/i);
  expect(exportShirtTiledA4Pdf(p,FIXED)).toEqual(bytes);
  expect(serializeShirtProject(p)).toBe(before);
  expect(p.method.version).toBe('research-0.1.2');
 });
 it('prints explicit mm neighbor references and never edits measurements, curves or sleeve-armhole lengths',()=>{
  const p=createShirtProject(),lengths=compareShirtArmholesToHalfSleeve(p);
  const pdf=asText(exportShirtTiledA4Pdf(p,FIXED));
  const pages=paginateFlatShirtA4(p);
  for(const tile of pages){
   expect(pdf).toContain('Tile X=['+tile.originXmm+', '+tile.worldRightMm+'] mm');
   expect(pdf).toContain('PAGE '+tile.index+'/'+pages.length);
  }
  expect(pdf).toContain('Adjacent tile alignment strip: 10mm overlap');
  const now=compareShirtArmholesToHalfSleeve(p);
  expect(now.front.totalMm).toBe(lengths.front.totalMm);
  expect(now.back.totalMm).toBe(lengths.back.totalMm);
  expect(now.halfSleeveHead.totalMm).toBe(lengths.halfSleeveHead.totalMm);
  expect(now.geometricExcess.stitchLineStatus).toBe('NOT_IDENTIFIED');
  expect(now.verdict).toBe('INDEFINITE');
  expect(p.release).toEqual({cutReady:false,scalePhysical:'NOT_RUN',assembly:'NOT_RUN',fit:'NOT_RUN'});
 });
 it('requires true commit SHA and UTC date, never invents print metadata',()=>{
  const p=createShirtProject();
  expect(()=>exportShirtTiledA4Pdf(p,{...FIXED,commitSha:'UNKNOWN'})).toThrow(/A4_COMMIT_SHA_REQUIRED/);
  expect(()=>exportPhysicalCalibrationProtocolPdf(p,{...FIXED,generatedAtISO:'tomorrow'})).toThrow(/A4_GENERATED_AT_REQUIRED/);
 });
 it('produces one editable A4 AcroForm with all 11 requested fields, no validation flags',()=>{
  const p=createShirtProject(),data=asText(exportPhysicalCalibrationProtocolPdf(p,FIXED));
  expect(data.startsWith('%PDF-1.4')).toBe(true);
  expect(data).toContain('/AcroForm 6 0 R');
  expect(data).toContain('/NeedAppearances true');
  expect(data).toContain('/MediaBox [0 0 595.27559 841.88976]');
  for(const field of PHYSICAL_FORM_FIELDS)expect(data).toContain('/T ('+field+')');
  expect(PHYSICAL_FORM_FIELDS).toHaveLength(11);
  expect(data).toContain('Scale: NOT_RUN');
  expect(data).toContain('Assembly: NOT_RUN');
  expect(data).toContain('Fit: NOT_RUN');
  expect(data).toContain('cutReady=false');
  expect(data).toContain(FIXED.commitSha);
  expect(p.release.scalePhysical).toBe('NOT_RUN');
 });
 it('regenerates new tiles only after a controlled measurement update',()=>{
  const p=createShirtProject(),a=paginateFlatShirtA4(p);
  const updated=changeShirtMeasurement(p,'chest',1120);
  const b=paginateFlatShirtA4(updated);
  expect(b.length).toBeGreaterThan(0);
  expect(updated.revision).toBe(1);
  expect(updated.pieces.map(x=>x.id)).toEqual(p.pieces.map(x=>x.id));
  expect(serializeShirtProject(p)).not.toBe(serializeShirtProject(updated));
  expect(exportShirtTiledA4Pdf(updated,FIXED).length).toBeGreaterThan(8000);
  expect(updated.release).toEqual(p.release);
  expect(a.length).toBeGreaterThan(0);
 });
});
