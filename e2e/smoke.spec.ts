import { expect, test } from "@playwright/test";
import { SelectProgramPage } from "./pages/selectProgramPage";

test.describe("@smoke", () => {
  test("app loads and navigates to program select", async ({ page }) => {
    const selectPage = new SelectProgramPage(page);

    // Navigate to /programs/select (root redirects, so go directly)
    await selectPage.goto();
    await selectPage.waitForLoad();

    // Verify programs are listed
    const options = await selectPage.getProgramOptions();
    expect(options.length).toBeGreaterThan(0);
    expect(options).toContain("E2E Test Program");

    // Verify Start Program button visible after selecting a program
    await selectPage.selectProgram("E2E Test Program");
    await expect(
      page.getByRole("button", { name: "Start Program" }),
    ).toBeEnabled();
  });

  test("can start E2E Test Program and see first gate", async ({ page }) => {
    const selectPage = new SelectProgramPage(page);

    // Navigate to /programs/select
    await selectPage.goto();
    await selectPage.waitForLoad();

    // Select E2E Test Program and start it
    const gamePage = await selectPage.selectAndStart("E2E Test Program");
    await gamePage.waitForLoad();

    // Verify first gate is visible
    const label = await gamePage.getActiveGateLabel();
    expect(label).toBe("Gate 1");
  });
});
