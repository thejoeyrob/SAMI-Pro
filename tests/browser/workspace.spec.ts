import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.route("**/api/health", (route) =>
    route.fulfill({ json: { cloud: false, what3words: false, ai: false } }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: /Explore an example/ }).click();
});
test("draw, group, ungroup, style, undo and reopen portable project", async ({
  page,
}, testInfo) => {
  await page.getByRole("button", { name: "Trakway", exact: true }).click();
  await page
    .getByRole("button", { name: "Calculate whole-panel layout", exact: true })
    .click();
  await expect(page.getByText("35 panels", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Place at view centre", exact: true })
    .click();
  await expect(page.getByText("35 selected", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Ungroup selected objects", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Ungroup selected objects", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Group selected objects", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Ungroup selected objects", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("Fill colour", { exact: true }).fill("#cc6633");
  await expect(page.getByLabel("Fill colour", { exact: true })).toHaveValue(
    "#cc6633",
  );
  await page.getByRole("button", { name: "Undo (⌘Z)", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Redo (⌘⇧Z)", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Export plan", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Portable SAMI project", exact: true })
    .click();
  const file = await pending;
  const path = testInfo.outputPath("reopened-project.sami");
  await file.saveAs(path);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Back to projects", exact: true })
    .click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Open a file", exact: true }).click();
  await (await chooser).setFiles(path!);
  await expect(
    page.getByRole("button", { name: "Export plan", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your projects", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
test("CAD and PDF finish while upstream is unavailable", async ({ page }) => {
  await page.route("**/api/cad", (route) => route.abort("timedout"));
  await page.getByRole("button", { name: "CAD", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Export plan", exact: true }),
  ).toBeEnabled({ timeout: 1000 });
  await page.getByRole("button", { name: "Export plan", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export PDF plan", exact: true })
    .click();
  const d = await pending;
  expect(d.suggestedFilename()).toMatch(/\.pdf$/);
});
test("Ask SAMI proposes a precise local edit before applying it", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Ask SAMI", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Create a 20 by 15 metre stone area",
      exact: true,
    })
    .click();
  await expect(page.getByText(/Create 20 × 15 m Stone area/)).toBeVisible();
  await page.getByRole("button", { name: /Apply.*plan|Apply changes/ }).click();
  await expect(
    page.getByText("Applied to the plan. Undo is available.", { exact: true }),
  ).toBeVisible();
});
