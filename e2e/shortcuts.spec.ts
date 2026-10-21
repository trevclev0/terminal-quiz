import { expect, test } from "@playwright/test";
import { STUB_CLUE_TEXT } from "../src/shared/clueStub";
import type { GamePage } from "./pages/gamePage";
import { SelectProgramPage } from "./pages/selectProgramPage";

test.describe("@full keyboard shortcuts", () => {
  let gamePage: GamePage;

  test.beforeEach(async ({ page }) => {
    const selectPage = new SelectProgramPage(page);
    await selectPage.goto();
    await selectPage.waitForLoad();
    gamePage = await selectPage.selectAndStart("E2E Test Program");
    await gamePage.waitForLoad();
  });

  test("/help opens the shortcuts dialog and Esc refocuses the input", async ({
    page,
  }) => {
    await gamePage.typeCommand("/help");

    await expect(gamePage.getHelpDialogLocator()).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(gamePage.getHelpDialogLocator()).toBeHidden();
    await expect(gamePage.getActiveInputLocator()).toBeFocused();
  });

  test("/clue requests a clue without counting as a guess", async ({
    page,
  }) => {
    await gamePage.submitAnswerAndWaitForDenial("nope");
    await gamePage.submitAnswerAndWaitForDenial("wrong");
    await expect(gamePage.getClueButtonLocator()).toBeVisible();

    const guessRequests: string[] = [];
    page.on("request", (request) => {
      const body = request.postData() ?? "";
      if (body.includes("submitGuess")) guessRequests.push(body);
    });

    await gamePage.typeCommand("/clue");

    // CI runs against the preview Worker, which serves a canned clue
    // (AI_CLUE_STUB); a local dev server may call the real model, so
    // there any non-empty clue passes. Mirrors clue.spec.ts.
    if (process.env.CI) {
      await expect(gamePage.getClueTextLocator()).toHaveText(STUB_CLUE_TEXT, {
        timeout: 15000,
      });
    } else {
      const clueText = await gamePage.waitForClueText();
      expect(clueText?.length).toBeGreaterThan(0);
    }

    // The status line keeps the earlier denial, so prove the command was not
    // submitted as a guess by the absence of a submitGuess request instead.
    await expect(gamePage.getActiveInputLocator()).toHaveValue("");
    expect(guessRequests).toHaveLength(0);
  });

  test("n opens the reset dialog, Esc cancels, r plays again", async ({
    page,
  }) => {
    await gamePage.submitAnswer("blue");
    await gamePage.waitForActiveGateLabel("Gate 2");
    await gamePage.submitAnswer("4");
    await gamePage.waitForActiveGateLabel("Gate 3");
    await gamePage.submitAnswer("cold");
    await gamePage.waitForTheEnd();
    await expect(
      page.locator('button[title="Play program again"]'),
    ).toBeVisible();
    await expect(
      page.locator('button[title="Select new program"]'),
    ).toBeVisible();

    await page.keyboard.press("n");
    expect(await gamePage.isConfirmModalVisible()).toBe(true);

    await page.keyboard.press("Escape");
    await expect(
      page.locator('dialog[aria-label="Reset Progress Confirmation"]'),
    ).toBeHidden();
    expect(await gamePage.isGameComplete()).toBe(true);

    await page.keyboard.press("r");
    await gamePage.waitForActiveGateLabel("Gate 1");
  });
});
