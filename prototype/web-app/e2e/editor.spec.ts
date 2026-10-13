import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function openScene(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", {name:"Editor multi-entidades"}).click();
  await expect(page.getByRole("heading",{name:"Editor CAD — múltiplas entidades"})).toBeVisible();
}

test("add, remove, undo and redo in the browser",async({page})=>{
  await openScene(page);
  await page.getByRole("button",{name:"Adicionar linha ao Grupo B — demonstração"}).click();
  await expect(page.getByText("Selecionada: lab-1")).toBeVisible();
  await expect(page.getByTestId("entity-path-lab-1")).toHaveCount(1);
  page.once("dialog",dialog=>dialog.accept());
  await page.getByRole("button",{name:"Excluir entidade selecionada"}).click();
  await expect(page.getByTestId("entity-path-lab-1")).toHaveCount(0);
  await page.getByRole("button",{name:/Desfazer/}).click();
  await expect(page.getByTestId("entity-path-lab-1")).toHaveCount(1);
  await page.getByRole("button",{name:/Refazer/}).click();
  await expect(page.getByTestId("entity-path-lab-1")).toHaveCount(0);
});

test("zoom and pan do not change geometry",async({page})=>{
  await openScene(page);
  const path=page.getByTestId("entity-path-curve-a");
  const before=await path.getAttribute("d");
  const svg=page.getByTestId("scene-viewport");
  const start=await svg.getAttribute("viewBox");
  await page.getByRole("button",{name:"+",exact:true}).click();
  await expect(svg).not.toHaveAttribute("viewBox",start!);
  expect(await path.getAttribute("d")).toBe(before);
  const zoomed=await svg.getAttribute("viewBox");
  const b=await svg.boundingBox();
  expect(b).toBeTruthy();
  await page.mouse.move(b!.x+20,b!.y+20);
  await page.mouse.down();
  await page.mouse.move(b!.x+68,b!.y+64,{steps:6});
  await page.mouse.up();
  await expect(svg).not.toHaveAttribute("viewBox",zoomed!);
  expect(await path.getAttribute("d")).toBe(before);
});

test("drag, save, reopen and undo across sessions",async({page})=>{
  await openScene(page);
  await page.getByRole("button",{name:/curve-b/}).click();
  const curve=page.getByTestId("entity-path-curve-b");
  const original=await curve.getAttribute("d");
  const handle=page.getByTestId("point-curve-b-1");
  await expect(handle).toBeVisible();
  const b=await handle.boundingBox();
  expect(b).toBeTruthy();
  await page.mouse.move(b!.x+b!.width/2,b!.y+b!.height/2);
  await page.mouse.down();
  await page.mouse.move(b!.x+b!.width/2+18,b!.y+b!.height/2+20,{steps:6});
  await page.mouse.up();
  await expect(curve).not.toHaveAttribute("d",original!);
  const dl=page.waitForEvent("download");
  await page.getByRole("button",{name:"Salvar JSON 0.3"}).click();
  const downloaded=await dl;
  const path=await downloaded.path();
  expect(path).toBeTruthy();
  const contents=await readFile(path!,"utf8");
  const json=JSON.parse(contents);
  expect(json.formatVersion).toBe("0.3.0");
  expect(json.history).toHaveLength(1);
  await page.getByRole("button",{name:"Novo exemplo"}).click();
  await page.locator('input[type="file"]').setInputFiles({
    name:"edited.json",mimeType:"application/json",buffer:Buffer.from(contents)
  });
  await expect(page.getByTestId("entity-path-curve-b")).not.toHaveAttribute("d",original!);
  await page.getByRole("button",{name:/Desfazer/}).click();
  await expect(page.getByTestId("entity-path-curve-b")).toHaveAttribute("d",original!);
});

test("invalid JSON does not replace the current scene",async({page})=>{
  await openScene(page);
  const curve=page.getByTestId("entity-path-curve-a");
  const start=await curve.getAttribute("d");
  await page.locator('input[type="file"]').setInputFiles({
    name:"invalid.json",mimeType:"application/json",
    buffer:Buffer.from(JSON.stringify({formatVersion:"99",purpose:"SYNTHETIC_ONLY"}))
  });
  await expect(page.getByRole("alert")).toContainText("Versão");
  expect(await curve.getAttribute("d")).toBe(start);
  await expect(page.getByText(/não utilizar para corte/i)).toBeVisible();
});

test("synthetic-only safety notice has readable foreground/background contrast", async({page})=>{
  await openScene(page);
  const notice=page.locator(".warning");
  await expect(notice).toBeVisible();
  await expect(notice).toContainText("não utilizar para corte");
  const ratio=await notice.evaluate(node=>{
    const style=getComputedStyle(node);
    const rgb=(value:string):number[]=>{
      const values=value.match(/[0-9.]+/g)?.map(Number)??[];
      if(values.length<3)throw new Error("Cor RGB desconhecida");
      return values.slice(0,3);
    };
    const luminance=(rgbValues:number[]):number=>{
      const linear=rgbValues.map(c=>{
        const v=c/255;
        return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;
      });
      return 0.2126*linear[0]+0.7152*linear[1]+0.0722*linear[2];
    };
    const foreground=luminance(rgb(style.color));
    const background=luminance(rgb(style.backgroundColor));
    const brighter=Math.max(foreground,background);
    const darker=Math.min(foreground,background);
    return (brighter+0.05)/(darker+0.05);
  });
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
