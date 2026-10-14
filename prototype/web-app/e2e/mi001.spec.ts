import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test('MI-001 opens on existing CAD UI with three experimental pieces and no cut authorization',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:/Flat Shirt Core — projeto experimental/}).click();
 await expect(page.getByTestId('mi001-workspace')).toBeVisible();
 for(const label of ['FRONT','BACK','SLEEVE'])await expect(page.getByTestId('shirt-svg-viewport').locator('g#'+label)).toHaveCount(1);
 await expect(page.getByText('cutReady:',{exact:false})).toBeVisible();
 await expect(page.getByRole('status')).toContainText('NOT_RUN');
 await expect(page.getByRole('button',{name:/Exportar PDF nominal 1:1/})).toBeVisible();
});

test('MI-001 measure update, save JSON, reopen and preserve regenerated project revision',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:/Flat Shirt Core — projeto experimental/}).click();
 await page.getByRole('spinbutton',{name:'Tórax'}).fill('112');
 await page.getByRole('spinbutton',{name:'Tórax'}).blur();
 await expect(page.getByText(/revisão 1/)).toBeVisible();
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Salvar projeto'}).click()]);
 const raw=await readFile(await download.path(),'utf8');const saved=JSON.parse(raw);
 expect(saved.measurements.chest.valueMm).toBe(1120);expect(saved.revision).toBe(1);
 expect(saved.pieces.map((p:{id:string})=>p.id)).toEqual(['FRONT','BACK','SLEEVE']);
 expect(saved.release.cutReady).toBe(false);
 await page.getByRole('button',{name:'Reiniciar exemplo'}).click();
 await page.locator('input[type=file]').setInputFiles({name:'saved.draft.json',mimeType:'application/json',buffer:Buffer.from(raw)});
 await expect(page.getByText(/revisão 1/)).toBeVisible();
 await expect(page.getByRole('spinbutton',{name:'Tórax'})).toHaveValue('112');
});

test('MI-001 rejects incompatible file without replacing current project',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:/Flat Shirt Core — projeto experimental/}).click();
 const invalid={format:'menswear-garment-project/0.1.0',method:{id:'ALD-FLAT-SHIRT-CORE',version:'research-9.9.9'}};
 await page.locator('input[type=file]').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(invalid))});
 await expect(page.getByRole('alert')).toContainText('migração');
 await expect(page.getByText(/revisão 0/)).toBeVisible();
});

test('MI-001 downloads a PDF and a separate A4 calibration form',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:/Flat Shirt Core — projeto experimental/}).click();
 const [pattern]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:/Exportar PDF nominal 1:1/}).click()]);
 expect(pattern.suggestedFilename()).toContain('diagnostic-1to1.pdf');
 expect((await readFile(await pattern.path())).subarray(0,8).toString()).toMatch(/^%PDF-1/);
 const [calib]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Ficha A4 de calibração'}).click()]);
 expect(calib.suggestedFilename()).toContain('calibracao-a4');
 expect((await readFile(await calib.path())).subarray(0,8).toString()).toMatch(/^%PDF-1/);
});

test('MI-001 keeps diagnostic workspace usable but rejects clipped PDF and persists no-cut mode',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:/Flat Shirt Core — projeto experimental/}).click();
 await page.getByRole('spinbutton',{name:'Comprimento da camisa'}).fill('180');
 await page.getByRole('spinbutton',{name:'Comprimento da camisa'}).blur();
 await expect(page.getByText(/revisão 1/)).toBeVisible();
 await page.getByRole('button',{name:/Exportar PDF nominal 1:1/}).click();
 await expect(page.getByRole('alert')).toContainText('EXPORT_PAGE_OVERFLOW');
 const [saved]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Salvar projeto'}).click()]);
 const project=JSON.parse(await readFile(await saved.path(),'utf8'));
 expect(project.purpose).toBe('SOURCE_DRAFT_DIAGNOSTIC_ONLY');
 expect(project.warning).toBe('DRAFT_NO_CUT_PROVISIONAL_GEOMETRY');
 expect(project.release).toEqual({cutReady:false,scalePhysical:'NOT_RUN',assembly:'NOT_RUN',fit:'NOT_RUN'});
});

test('MI-001 displays undefined cava/head verdict and exports traceable same-mm overlay',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:/Flat Shirt Core — projeto experimental/}).click();
 await expect(page.getByRole('heading',{name:/Cava × meia cabeça · INDEFINIDA/})).toBeVisible();
 await expect(page.getByTestId('mi001-cava-comparison')).toContainText('295.319 mm');
 await expect(page.getByTestId('mi001-excedente-total')).toContainText('21.574 mm');
 const [svg]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Comparação cava–manga SVG'}).click()]);
 const content=await readFile(await svg.path(),'utf8');
 expect(content).toContain('width="910mm"');expect(content).toContain('INDEFINIDA');
 expect(content).toContain('data-geometric-excess-mm="21.574"');
 expect(content).toContain('EXCEDENTE geométrico');
 expect(content).toContain('data-edges="FRONT:E04 FRONT:E03"');
 expect(content).toContain('data-edges="SLEEVE:E04 SLEEVE:E03 SLEEVE:E02 SLEEVE:E01"');
 await page.getByRole('spinbutton',{name:'Tórax'}).fill('112');
 await page.getByRole('spinbutton',{name:'Tórax'}).blur();
 await expect(page.getByTestId('mi001-cava-comparison')).toContainText('302.599 mm');
 await expect(page.getByTestId('mi001-excedente-total')).toContainText('6.415 mm');
 await expect(page.getByRole('heading',{name:/INDEFINIDA/})).toBeVisible();
});

test('MI-001 shows all edge industrial-role classifications and downloads provenance JSON',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Flat Shirt Core — projeto experimental/}).click();
 await expect(page.getByTestId('mi001-classification-count')).toContainText('Arestas: 22');
 await expect(page.getByTestId('mi001-classification-count')).toContainText('indefinidas: 18');
 await expect(page.getByTestId('mi001-line-FRONT:E07')).toContainText('CONSTRUCTION_LINE | SOURCE_INFERRED');
 await expect(page.getByTestId('mi001-line-FRONT:E03')).toContainText('UNCLASSIFIED | PENDING_REVIEW');
 await page.getByRole('button',{name:/SLEEVE ·/}).click();
 await expect(page.getByTestId('mi001-line-SLEEVE:E08')).toContainText('CONSTRUCTION_LINE | SOURCE_EXPLICIT');
 await expect(page.getByTestId('mi001-line-SLEEVE:E01')).toContainText('UNCLASSIFIED | PENDING_REVIEW');
 const [file]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:/Classificação das 22 arestas/}).click()]);
 const diagnostic=JSON.parse(await readFile(await file.path(),'utf8'));
 expect(diagnostic.edgeClassifications).toHaveLength(22);
 expect(diagnostic.geometricExcess.stitchLineStatus).toBe('NOT_IDENTIFIED');
 expect(diagnostic.geometricExcess.excessTotalMm).toBeCloseTo(21.5738894536,4);
 expect(diagnostic.edgeClassifications.filter((x:{classification:string})=>x.classification==='SEAM_LINE')).toHaveLength(0);
 expect(diagnostic.release.cutReady).toBe(false);
});
