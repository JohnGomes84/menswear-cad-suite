import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function openLegacyLab(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Editor multi-entidades" }).click();
  await expect(page.getByRole("heading", { name: "Editor CAD — múltiplas entidades" })).toBeVisible();
}

async function openV4(page: import("@playwright/test").Page) {
  await openLegacyLab(page);
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: /Constraints 0\.4/ }).click();
  await expect(page.getByRole("heading", { name: "Constraints dirigidas — 0.4.0" })).toBeVisible();
  await expect(page.getByTestId("v4-safety-notice")).toContainText("Não utilizar para corte");
}

async function downloadText(page: import("@playwright/test").Page, buttonName: string) {
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: buttonName }).click();
  const download = await downloadEvent;
  const path = await download.path();
  expect(path).toBeTruthy();
  return readFile(path!, "utf8");
}

test("0.4 requires explicit creation and leaves the 0.3 editor intact", async ({ page }) => {
  await openLegacyLab(page);
  page.once("dialog", dialog => {
    expect(dialog.message()).toContain("overlay de constraints 0.4.0");
    dialog.dismiss();
  });
  await page.getByRole("button", { name: /Constraints 0\.4/ }).click();
  await expect(page.getByRole("heading", { name: "Editor CAD — múltiplas entidades" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Constraints dirigidas — 0.4.0" })).toHaveCount(0);

  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: /Constraints 0\.4/ }).click();
  await expect(page.getByRole("heading", { name: "Constraints dirigidas — 0.4.0" })).toBeVisible();
  await page.getByRole("button", { name: "Voltar ao 0.3" }).click();
  await expect(page.getByRole("heading", { name: "Editor CAD — múltiplas entidades" })).toBeVisible();
  await expect(page.getByTestId("entity-path-line-a")).toHaveAttribute("d", "M 20 115 L 105 95");
});

test("recreating the overlay is required after the 0.3 base scene changes", async ({ page }) => {
  await openLegacyLab(page);
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: /Constraints 0\.4/ }).click();
  await page.getByRole("button", { name: "Adicionar regra" }).click();
  await expect(page.getByTestId("constraint-row-rule-1")).toBeVisible();
  await page.getByRole("button", { name: "Voltar ao 0.3" }).click();
  await page.getByRole("button", { name: /Adicionar linha ao Grupo A/ }).click();

  page.once("dialog", dialog => {
    expect(dialog.message()).toContain("A cena 0.3 mudou");
    dialog.dismiss();
  });
  await page.getByRole("button", { name: /Constraints 0\.4/ }).click();
  await expect(page.getByRole("heading", { name: "Editor CAD — múltiplas entidades" })).toBeVisible();

  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: /Constraints 0\.4/ }).click();
  await expect(page.getByRole("heading", { name: "Constraints dirigidas — 0.4.0" })).toBeVisible();
  await expect(page.getByTestId("constraint-row-rule-1")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /lab-1/ })).toBeVisible();
});

test("creates, edits and removes a persistent rule while keeping driver and resolved geometry distinct", async ({ page }) => {
  await openV4(page);
  await page.getByRole("button", { name: "Adicionar regra" }).click();
  await expect(page.getByTestId("constraint-row-rule-1")).toContainText("HORIZONTAL");
  await expect(page.getByTestId("constraint-label-rule-1")).toContainText("rule-1");
  await expect(page.getByTestId("driver-path-line-a")).toHaveAttribute("d", "M 20 115 L 105 95");
  await expect(page.getByTestId("resolved-path-line-a")).toHaveAttribute("d", "M 20 115 L 105 115");

  await page.getByRole("button", { name: "Editar rule-1" }).click();
  await page.getByLabel("Tipo de constraint").selectOption("VERTICAL");
  await page.getByRole("button", { name: "Atualizar regra" }).click();
  await expect(page.getByTestId("constraint-row-rule-1")).toContainText("VERTICAL");
  await expect(page.getByTestId("resolved-path-line-a")).toHaveAttribute("d", "M 20 115 L 20 95");

  await page.getByRole("button", { name: /Desfazer/ }).click();
  await expect(page.getByTestId("resolved-path-line-a")).toHaveAttribute("d", "M 20 115 L 105 115");
  await page.getByRole("button", { name: /Refazer/ }).click();
  await expect(page.getByTestId("resolved-path-line-a")).toHaveAttribute("d", "M 20 115 L 20 95");

  await page.getByRole("button", { name: "Remover rule-1" }).click();
  await expect(page.getByTestId("constraint-row-rule-1")).toHaveCount(0);
  await expect(page.getByTestId("resolved-path-line-a")).toHaveAttribute("d", "M 20 115 L 105 95");
  await page.getByRole("button", { name: /Desfazer/ }).click();
  await expect(page.getByTestId("constraint-row-rule-1")).toBeVisible();
});

test("dragging a driver reprojects dependent geometry immediately", async ({ page }) => {
  await openV4(page);
  await page.getByRole("button", { name: "Adicionar regra" }).click();
  const driver = page.getByTestId("driver-path-line-a");
  const resolved = page.getByTestId("resolved-path-line-a");
  const beforeDriver = await driver.getAttribute("d");
  const beforeResolved = await resolved.getAttribute("d");
  const handle = await page.getByTestId("driver-point-line-a-0").boundingBox();
  expect(handle).toBeTruthy();
  const x = handle!.x + handle!.width / 2;
  const y = handle!.y + handle!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 24, y - 20, { steps: 4 });
  await expect(driver).not.toHaveAttribute("d", beforeDriver!);
  await expect(resolved).not.toHaveAttribute("d", beforeResolved!);
  await page.mouse.up();
  await expect(page.getByRole("button", { name: /Desfazer/ })).toBeEnabled();
  await expect(driver).not.toHaveAttribute("d", beforeDriver!);
  await expect(resolved).not.toHaveAttribute("d", beforeResolved!);
  const movedDriver = await driver.getAttribute("d");
  const movedResolved = await resolved.getAttribute("d");

  await page.getByRole("button", { name: /Desfazer/ }).click();
  await expect(driver).toHaveAttribute("d", beforeDriver!);
  await expect(resolved).toHaveAttribute("d", beforeResolved!);
  await page.getByRole("button", { name: /Refazer/ }).click();
  await expect(driver).toHaveAttribute("d", movedDriver!);
  await expect(resolved).toHaveAttribute("d", movedResolved!);

  const contents = await downloadText(page, "Salvar JSON 0.4");
  await page.locator('input[type="file"]').setInputFiles({
    name: "moved-driver-0.4.json", mimeType: "application/json", buffer: Buffer.from(contents)
  });
  await expect(driver).toHaveAttribute("d", movedDriver!);
  await expect(resolved).toHaveAttribute("d", movedResolved!);
  await page.getByRole("button", { name: /Desfazer/ }).click();
  await expect(driver).toHaveAttribute("d", beforeDriver!);
  await expect(resolved).toHaveAttribute("d", beforeResolved!);
});

test("valid COINCIDENT and DISTANCE rules update geometry in millimetres", async ({ page }) => {
  await openV4(page);
  await page.getByLabel("Tipo de constraint").selectOption("COINCIDENT");
  await page.getByLabel("Entidade de origem").selectOption("line-a");
  await page.getByLabel("Ponto de origem").selectOption("0");
  await page.getByLabel("Entidade de alvo").selectOption("curve-b");
  await page.getByLabel("Ponto de alvo").selectOption("0");
  await page.getByRole("button", { name: "Adicionar regra" }).click();
  await expect(page.getByTestId("constraint-row-rule-1")).toBeVisible();
  await page.getByRole("button", { name: "curve-b Bézier" }).click();
  const coincidentPoint = page.getByTestId("resolved-point-curve-b-0");
  await expect(coincidentPoint).toHaveAttribute("cx", "20");
  await expect(coincidentPoint).toHaveAttribute("cy", "115");

  await page.getByRole("button", { name: "Editar rule-1" }).click();
  await page.getByLabel("Tipo de constraint").selectOption("DISTANCE");
  await page.getByLabel("Distância em mm").fill("40");
  await page.getByRole("button", { name: "Atualizar regra" }).click();
  await expect(page.getByTestId("constraint-row-rule-1")).toContainText("40 mm");
  const distancePoint = page.getByTestId("resolved-point-curve-b-0");
  const x = Number(await distancePoint.getAttribute("cx"));
  const y = Number(await distancePoint.getAttribute("cy"));
  expect(Math.hypot(x - 20, y - 115)).toBeCloseTo(40, 2);
});

test("0.4 JSON round-trips and reconstructs undo history across reload", async ({ page }) => {
  await openV4(page);
  await page.getByRole("button", { name: "Adicionar regra" }).click();
  const contents = await downloadText(page, "Salvar JSON 0.4");
  const json = JSON.parse(contents);
  expect(json.formatVersion).toBe("0.4.0");
  expect(json.purpose).toBe("SYNTHETIC_ONLY");
  expect(json.history).toHaveLength(1);

  await page.locator('input[type="file"]').setInputFiles({
    name: "persisted-0.4.json", mimeType: "application/json", buffer: Buffer.from(contents)
  });
  await expect(page.getByTestId("resolved-path-line-a")).toHaveAttribute("d", "M 20 115 L 105 115");
  await page.getByRole("button", { name: /Desfazer/ }).click();
  await expect(page.getByTestId("constraint-row-rule-1")).toHaveCount(0);
  await expect(page.getByTestId("resolved-path-line-a")).toHaveAttribute("d", "M 20 115 L 105 95");
});

test("surfaces duplicate-target and dependency-cycle diagnostics without partial commits", async ({ page }) => {
  await openV4(page);
  await page.getByRole("button", { name: "Adicionar regra" }).click();
  await page.getByLabel("Tipo de constraint").selectOption("VERTICAL");
  await page.getByRole("button", { name: "Adicionar regra" }).click();
  await expect(page.getByRole("alert")).toContainText("DUPLICATE_TARGET");
  await expect(page.getByTestId("constraint-row-rule-1")).toBeVisible();
  await expect(page.getByTestId("constraint-row-rule-2")).toHaveCount(0);

  await page.getByLabel("Tipo de constraint").selectOption("COINCIDENT");
  await page.getByLabel("Ponto de origem").selectOption("1");
  await page.getByLabel("Ponto de alvo").selectOption("0");
  await page.getByRole("button", { name: "Adicionar regra" }).click();
  await expect(page.getByRole("alert")).toContainText("CYCLIC_DEPENDENCY");
  await expect(page.getByTestId("constraint-row-rule-1")).toBeVisible();
  await expect(page.getByTestId("constraint-row-rule-2")).toHaveCount(0);
});

test("distance without an initial direction is diagnosed and explicit 0.3 import can be cancelled or confirmed", async ({ page }) => {
  await openLegacyLab(page);
  const legacyText = await downloadText(page, "Salvar JSON 0.3");
  const legacy = JSON.parse(legacyText);
  const line = legacy.entities.find((entity: { id: string }) => entity.id === "line-a");
  const curve = legacy.entities.find((entity: { id: string }) => entity.id === "curve-b");
  expect(line).toBeTruthy();
  expect(curve).toBeTruthy();
  curve.pointsMm[0] = { ...line.pointsMm[0] };
  legacy.initialEntities = legacy.entities.map((entity: { id: string; pieceId: string; kind: string; mode: string; pointsMm: {x:number;y:number}[] }) => ({
    ...entity, pointsMm: entity.pointsMm.map(point => ({ ...point }))
  }));
  const coincidentV3 = JSON.stringify(legacy);

  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: /Constraints 0\.4/ }).click();
  await expect(page.getByRole("heading", { name: "Constraints dirigidas — 0.4.0" })).toBeVisible();

  page.once("dialog", dialog => dialog.dismiss());
  await page.locator('input[type="file"]').setInputFiles({
    name: "cancel-migration-0.3.json", mimeType: "application/json", buffer: Buffer.from(coincidentV3)
  });
  await expect(page.getByTestId("resolved-path-line-a")).toBeVisible();
  await expect(page.getByTestId("constraint-row-rule-1")).toHaveCount(0);

  page.once("dialog", dialog => dialog.accept());
  await page.locator('input[type="file"]').setInputFiles({
    name: "coincident-0.3.json", mimeType: "application/json", buffer: Buffer.from(coincidentV3)
  });
  await page.getByLabel("Tipo de constraint").selectOption("DISTANCE");
  await page.getByLabel("Entidade de origem").selectOption("line-a");
  await page.getByLabel("Ponto de origem").selectOption("0");
  await page.getByLabel("Entidade de alvo").selectOption("curve-b");
  await page.getByLabel("Ponto de alvo").selectOption("0");
  await page.getByLabel("Distância em mm").fill("40");
  await page.getByRole("button", { name: "Adicionar regra" }).click();
  await expect(page.getByRole("alert")).toContainText("UNDETERMINED_DIRECTION");
  await expect(page.getByTestId("constraint-row-rule-1")).toHaveCount(0);
});

test("rejects an imported 0.4 file whose active rule lost a referenced entity and preserves the open scene", async ({ page }) => {
  await openV4(page);
  await page.getByRole("button", { name: "Adicionar regra" }).click();
  const contents = await downloadText(page, "Salvar JSON 0.4");
  const corrupt = JSON.parse(contents);
  corrupt.baseScene.entities = corrupt.baseScene.entities.filter((entity: { id: string }) => entity.id !== "line-a");
  corrupt.baseScene.initialEntities = corrupt.baseScene.initialEntities.filter((entity: { id: string }) => entity.id !== "line-a");
  await page.locator('input[type="file"]').setInputFiles({
    name: "missing-dependency.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(corrupt))
  });
  await expect(page.getByRole("alert")).toContainText("UNKNOWN_POINT");
  await expect(page.getByTestId("constraint-row-rule-1")).toBeVisible();
  await expect(page.getByTestId("resolved-path-line-a")).toHaveAttribute("d", "M 20 115 L 105 115");
});

test("pan and zoom change only the viewport, not canonical constraint geometry", async ({ page }) => {
  await openV4(page);
  await page.getByRole("button", { name: "Adicionar regra" }).click();
  const path = page.getByTestId("resolved-path-line-a");
  const before = await path.getAttribute("d");
  const svg = page.getByTestId("v4-viewport");
  const initialView = await svg.getAttribute("viewBox");
  await page.getByRole("button", { name: "Zoom mais" }).click();
  await expect(svg).not.toHaveAttribute("viewBox", initialView!);
  expect(await path.getAttribute("d")).toBe(before);
  const zoomedView = await svg.getAttribute("viewBox");
  const box = await svg.boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.move(box!.x + 12, box!.y + 12);
  await page.mouse.down();
  await page.mouse.move(box!.x + 48, box!.y + 42, { steps: 5 });
  await page.mouse.up();
  await expect(svg).not.toHaveAttribute("viewBox", zoomedView!);
  expect(await path.getAttribute("d")).toBe(before);
});

test("0.4 workspace fits a narrow mobile viewport without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openV4(page);
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await page.screenshot({ path: "test-results/constrained-v4-mobile.png", fullPage: true });
});
