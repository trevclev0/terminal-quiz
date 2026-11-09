import { expect, test } from "@playwright/test";
import { GamePage } from "./pages/gamePage";
import { SelectProgramPage } from "./pages/selectProgramPage";

// Letter-pattern hints are built server-side from the answer and never call
// Workers AI, so unlike the clue specs this one needs no AI_CLUE_STUB.
test.describe("@full mechanical hint flow", () => {
  test.beforeEach(async ({ page }) => {
    const selectPage = new SelectProgramPage(page);
    await selectPage.goto();
    await selectPage.waitForLoad();
    const gamePage = await selectPage.selectAndStart("E2E Test Program");
    await gamePage.waitForLoad();
  });

  test("reveals more of the answer with each wrong guess", async ({ page }) => {
    const gamePage = new GamePage(page);

    // Gate 1's answer is "blue" and its guidance threshold is 2.
    await gamePage.submitAnswerAndWaitForDenial("red");
    await gamePage.submitAnswerAndWaitForDenial("green");

    await gamePage.typeCommand("/hint");
    await expect(gamePage.getHintPatternLocator()).toHaveText("_ _ _ _");
    await expect(gamePage.getHintButtonLocator()).toHaveCount(0);

    await gamePage.submitAnswerAndWaitForDenial("teal");
    await gamePage.getHintButtonLocator().click();
    await expect(gamePage.getHintPatternLocator()).toHaveText("B _ _ _");

    await gamePage.submitAnswer("blue");
    await gamePage.waitForActiveGateLabel("Gate 2");
    await expect(gamePage.getHintPatternLocator()).toHaveCount(0);
  });
});
