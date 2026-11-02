import { expect, test } from "@playwright/test";
import { GamePage } from "./pages/gamePage";
import { SelectProgramPage } from "./pages/selectProgramPage";

test.describe("@full wrong answer flow", () => {
  test.beforeEach(async ({ page }) => {
    const selectPage = new SelectProgramPage(page);
    await selectPage.goto();
    await selectPage.waitForLoad();
    const gamePage = await selectPage.selectAndStart("E2E Test Program");
    await gamePage.waitForLoad();
  });

  test("shows a blinking denial on wrong answer, then recovers", async ({
    page,
  }) => {
    const gamePage = new GamePage(page);

    // Submit wrong answer
    const denialMsg = await gamePage.submitAnswerAndWaitForDenial("wrong");
    expect(denialMsg).toContain("ACCESS DENIED");

    expect(await gamePage.isDenialBlinking()).toBe(true);

    // Submit correct answer — should proceed to Gate 2
    await gamePage.submitAnswer("blue");
    const result = await gamePage.waitForVerificationComplete();
    expect(result).toContain("ACCESS GRANTED");

    await gamePage.waitForActiveGateLabel("Gate 2");
    const label = await gamePage.getActiveGateLabel();
    expect(label).toBe("Gate 2");
  });
});
