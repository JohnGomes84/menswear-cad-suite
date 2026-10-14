import { expect, test } from "@playwright/test";

async function openResearchWorkspace(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Construção Aldrich CH02", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Construção paramétrica documentada" })).toBeVisible();
}

test("CH02 workspace opens with source trace and no-cut safeguards", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openResearchWorkspace(page);

  await expect(page.getByText("Aldrich PDF p. 32 · Diagrama p. 34")).toBeVisible();
  await expect(page.getByText("PESQUISA · NO-CUT")).toBeVisible();
  await expect(page.getByText("Não utilizar para corte.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Exportar para corte — bloqueado" })).toBeDisabled();
  await expect(page.locator('[data-testid^="book-line-"]')).toHaveCount(3);
  await expect(page.getByText("Comprimento geométrico")).toHaveCount(0);

  const viewport = page.getByTestId("ch02-source-viewport");
  await expect(viewport).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("ch02-workspace-desktop.png"), fullPage: true });
});

test("changing method, variant and body measurements regenerates the source geometry", async ({ page }) => {
  await openResearchWorkspace(page);
  const viewport = page.getByTestId("ch02-source-viewport");
  const initialViewBox = await viewport.getAttribute("viewBox");

  await page.getByRole("combobox", { name: "Método de construção" }).selectOption("TWO_PIECE");
  await expect(page.locator('[data-testid^="book-line-"]')).toHaveCount(5);
  await expect(page.getByText("Aldrich PDF p. 33 · Diagrama p. 34")).toBeVisible();

  const beforeVariant = await viewport.getAttribute("viewBox");
  await page.getByRole("combobox", { name: "Variante" }).selectOption("EASY");
  await expect(viewport).not.toHaveAttribute("viewBox", beforeVariant!);

  const beforeMeasurement = await viewport.getAttribute("viewBox");
  await page.getByRole("spinbutton", { name: "Quadril (cm)" }).fill("116");
  await expect(viewport).not.toHaveAttribute("viewBox", beforeMeasurement!);
  expect(await viewport.getAttribute("viewBox")).not.toBe(initialViewBox);
  await expect(page.getByText("Curvas não resolvidas")).toBeVisible();
});

test("front/back visibility and entity inspection stay diagnostic-only", async ({ page }) => {
  await openResearchWorkspace(page);
  const lineCount = page.locator('[data-testid^="book-line-"]');
  await expect(lineCount).toHaveCount(3);

  await page.getByRole("checkbox", { name: "Frente" }).uncheck();
  await expect(lineCount).toHaveCount(2);
  await page.getByRole("checkbox", { name: "Costas" }).uncheck();
  await expect(lineCount).toHaveCount(0);

  await page.getByRole("checkbox", { name: "Frente" }).check();
  const straight = page.locator(".ch02-strokes button").filter({ hasText: "Reta" }).first();
  await straight.click();
  await expect(page.getByText("Comprimento geométrico")).toBeVisible();
  await expect(page.getByText("Função industrial")).toBeVisible();
  await expect(page.getByText("Não classificada")).toBeVisible();
  await expect(page.getByRole("button", { name: "Exportar para corte — bloqueado" })).toBeDisabled();
});

test("CH02 workspace remains usable at a narrow mobile viewport", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openResearchWorkspace(page);
  await expect(page.getByRole("heading", { name: "Construção paramétrica documentada" })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Quadril (cm)" })).toBeVisible();
  await expect(page.getByTestId("ch02-source-viewport")).toBeVisible();

  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport + 1);
  await page.screenshot({ path: testInfo.outputPath("ch02-workspace-mobile.png"), fullPage: true });
});
