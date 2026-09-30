import { expect, type Page, test } from "@playwright/test";
import { SelectProgramPage } from "./pages/selectProgramPage";

// "Verifying..." normally lasts one round trip, too briefly to inspect.
// Holding SubmitGuess until the test releases it keeps the spinner on
// screen. Other GraphQL traffic passes straight through.
async function holdSubmitGuess(page: Page): Promise<() => void> {
  let release = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/graphql", async (route) => {
    if (route.request().postData()?.includes("SubmitGuess")) {
      await released;
    }
    await route.continue();
  });
  return release;
}

// The frames are drawn by the spinner's ::before, which only a real
// browser computes styles for, hence an E2E check rather than a unit one.
function spinnerAnimationName(page: Page) {
  return page
    .getByRole("status")
    .getByTestId("spinner")
    .evaluate((el) => getComputedStyle(el, "::before").animationName);
}

async function startGameAndHoldGuess(page: Page) {
  const selectPage = new SelectProgramPage(page);
  await selectPage.goto();
  await selectPage.waitForLoad();
  const gamePage = await selectPage.selectAndStart("E2E Test Program");
  await gamePage.waitForLoad();

  const release = await holdSubmitGuess(page);
  await gamePage.submitAnswer("wrong");
  // Exact text: the glyphs come from CSS, so they never reach textContent.
  await expect(page.getByRole("status")).toHaveText("Verifying...");
  return { gamePage, release };
}

test.describe("@full spinner", () => {
  test("animates beside Verifying... and clears once the guess resolves", async ({
    page,
  }) => {
    const { gamePage, release } = await startGameAndHoldGuess(page);

    expect(await spinnerAnimationName(page)).not.toBe("none");

    release();
    expect(await gamePage.waitForDenial()).toContain("ACCESS DENIED");
    await expect(page.getByTestId("spinner")).toHaveCount(0);
  });

  test("holds still under prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { release } = await startGameAndHoldGuess(page);

    await expect(page.getByRole("status").getByTestId("spinner")).toBeVisible();
    expect(await spinnerAnimationName(page)).toBe("none");

    release();
  });
});
