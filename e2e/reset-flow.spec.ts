import { expect, type Page, test } from "@playwright/test";
import type { GamePage } from "./pages/gamePage";
import { SelectProgramPage } from "./pages/selectProgramPage";

/**
 * Play through all 3 gates of the E2E Test Program.
 * Returns the GamePage at "The End" state.
 */
async function completeE2EProgram(page: Page): Promise<GamePage> {
  const selectPage = new SelectProgramPage(page);
  await selectPage.goto();
  await selectPage.waitForLoad();
  const gamePage = await selectPage.selectAndStart("E2E Test Program");
  await gamePage.waitForLoad();

  // Gate 1: "blue"
  await gamePage.submitAnswer("blue");
  const r1 = await gamePage.waitForVerificationComplete();
  expect(r1).toContain("Correct!");
  await gamePage.waitForActiveGateLabel("Gate 2");

  // Gate 2: "4"
  await gamePage.submitAnswer("4");
  const r2 = await gamePage.waitForVerificationComplete();
  expect(r2).toContain("Correct!");
  await gamePage.waitForActiveGateLabel("Gate 3");

  // Gate 3: "cold"
  await gamePage.submitAnswer("cold");
  const r3 = await gamePage.waitForVerificationComplete();
  expect(r3).toContain("Correct!");
  await gamePage.waitForTheEnd();

  return gamePage;
}

test.describe("@full reset flow", () => {
  test("Play again resets session and returns to Gate 1", async ({ page }) => {
    const gamePage = await completeE2EProgram(page);

    await gamePage.clickPlayAgain();
    await gamePage.waitForActiveGateLabel("Gate 1");

    const label = await gamePage.getActiveGateLabel();
    expect(label).toBe("Gate 1");
  });

  test("Select new → Keep preserves completed state", async ({ page }) => {
    const gamePage = await completeE2EProgram(page);

    await gamePage.clickSelectNewProgram();
    expect(await gamePage.isConfirmModalVisible()).toBe(true);

    await gamePage.keepProgress();

    // Should land on program select page
    const selectPage = new SelectProgramPage(page);
    await selectPage.waitForLoad();

    // Re-select and verify progress is preserved (still at The End)
    const resumedGamePage = await selectPage.selectAndStart("E2E Test Program");
    await resumedGamePage.waitForTheEnd();
  });

  test("Select new → Cancel ([x]) closes modal", async ({ page }) => {
    const gamePage = await completeE2EProgram(page);

    await gamePage.clickSelectNewProgram();
    expect(await gamePage.isConfirmModalVisible()).toBe(true);

    await gamePage.cancelReset();
    expect(await gamePage.isConfirmModalVisible()).toBe(false);
    expect(await gamePage.isGameComplete()).toBe(true);
  });

  test("Select new → Reset resets to Gate 1", async ({ page }) => {
    const gamePage = await completeE2EProgram(page);

    await gamePage.clickSelectNewProgram();
    expect(await gamePage.isConfirmModalVisible()).toBe(true);

    await gamePage.confirmReset();

    // Should land on program select page
    const selectPage = new SelectProgramPage(page);
    await selectPage.waitForLoad();

    // Re-select and verify session was truly reset (back at Gate 1)
    const resetGamePage = await selectPage.selectAndStart("E2E Test Program");
    await resetGamePage.waitForActiveGateLabel("Gate 1");
    const label = await resetGamePage.getActiveGateLabel();
    expect(label).toBe("Gate 1");
  });
});
