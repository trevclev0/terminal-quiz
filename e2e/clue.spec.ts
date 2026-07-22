import { expect, test } from "@playwright/test";
import { GamePage } from "./pages/gamePage";
import { SelectProgramPage } from "./pages/selectProgramPage";

test.describe("@full clue flow", () => {
  test.beforeEach(async ({ page }) => {
    const selectPage = new SelectProgramPage(page);
    await selectPage.goto();
    await selectPage.waitForLoad();
    const gamePage = await selectPage.selectAndStart("E2E Test Program");
    await gamePage.waitForLoad();
  });

  test("requests and displays AI clue after reaching guidance threshold", async ({
    page,
  }) => {
    const gamePage = new GamePage(page);

    // Clue button hidden before any attempts (guidance_threshold = 2)
    await expect(gamePage.getClueButtonLocator()).not.toBeVisible();

    // Wrong answer #1: 1 attempt < threshold, button stays hidden
    const denial1 = await gamePage.submitAnswerAndWaitForDenial("nope");
    expect(denial1).toContain("ACCESS DENIED");
    await expect(gamePage.getClueButtonLocator()).not.toBeVisible();

    // Wrong answer #2: 2 attempts >= threshold, button appears
    const denial2 = await gamePage.submitAnswerAndWaitForDenial("wrong");
    expect(denial2).toContain("ACCESS DENIED");
    await expect(gamePage.getClueButtonLocator()).toBeVisible();

    // Request clue and verify AI-generated text appears
    await gamePage.getClueButtonLocator().click();
    const clueText = await gamePage.waitForClueText();
    expect(clueText?.length).toBeGreaterThan(0);
  });
});
