import { expect, test } from "@playwright/test";
import { SelectProgramPage } from "./pages/selectProgramPage";

test.describe("@full", () => {
  test("complete E2E Test Program — 3 gates to The End", async ({ page }) => {
    const selectPage = new SelectProgramPage(page);
    await selectPage.goto();
    await selectPage.waitForLoad();

    // Verify E2E Test Program exists in list
    const options = await selectPage.getProgramOptions();
    expect(options).toContain("E2E Test Program");

    // Start the program
    const gamePage = await selectPage.selectAndStart("E2E Test Program");
    await gamePage.waitForLoad();

    // Gate 1: What color is the sky? -> blue
    expect(await gamePage.getActiveGateLabel()).toBe("Gate 1");
    await gamePage.submitAnswer("blue");
    await gamePage.waitForVerificationComplete();
    expect(await gamePage.isGuessSuccessful()).toBe(true);

    // Wait for progression refetch -> Gate 2 becomes active
    await gamePage.waitForActiveGateLabel("Gate 2");

    // Gate 2: What is 2 + 2? -> 4
    await gamePage.submitAnswer("4");
    await gamePage.waitForVerificationComplete();
    expect(await gamePage.isGuessSuccessful()).toBe(true);

    // Wait for progression refetch -> Gate 3 becomes active
    await gamePage.waitForActiveGateLabel("Gate 3");

    // Gate 3: What is the opposite of hot? -> cold
    await gamePage.submitAnswer("cold");
    await gamePage.waitForVerificationComplete();
    expect(await gamePage.isGuessSuccessful()).toBe(true);

    // Wait for progression refetch -> game complete ("The End")
    await gamePage.waitForTheEnd();

    // End state verification — buttons visible, do NOT click
    expect(await gamePage.isGameComplete()).toBe(true);
    await expect(
      page.getByRole("button", { name: "Play program again" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Select new program" }),
    ).toBeVisible();
  });
});
