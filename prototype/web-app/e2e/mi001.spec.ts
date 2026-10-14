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
