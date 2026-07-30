import { expect, test } from "@playwright/test";
import { setupAuthBypass } from "./helpers";
import { GamePage } from "./pages/gamePage";
import { ManageProgramsPage } from "./pages/manageProgramsPage";

test.describe("@full", () => {
  test("create program → add gates → play through", async ({ page }) => {
    await setupAuthBypass(page);

    // Step 1: Navigate to My Programs via page object
    const managePage = new ManageProgramsPage(page);
    await managePage.goto();
    await managePage.waitForLoad();

    // Step 2: Create a new program
    const editorPage = await managePage.createProgram("E2E Authored Program");

    // Step 3: Add gates
    await editorPage.waitForLoad();
    await editorPage.addGate({
      label: "Math Gate",
      question: "What is 2 + 2?",
      correctAnswer: "4",
      successMessage: "Correct! Basic arithmetic works.",
    });
    await editorPage.addGate({
      label: "Geography Gate",
      question: "What is the capital of France?",
      correctAnswer: "Paris",
      successMessage: "Correct! Paris is the capital.",
    });

    // Verify gates were added
    const gateLabels = await editorPage.getGateLabels();
    expect(gateLabels).toContain("Math Gate");
    expect(gateLabels).toContain("Geography Gate");

    // Step 4: Navigate to play via page object
    await editorPage.clickPlay();

    // Step 5: Solve both gates
    const gamePage = new GamePage(page);
    await gamePage.waitForLoad();

    // Gate 1: Math
    expect(await gamePage.getActiveGateLabel()).toBe("Math Gate");
    await gamePage.submitAnswer("4");
    await gamePage.waitForVerificationComplete();
    expect(await gamePage.isGuessSuccessful()).toBe(true);

    // Wait for Gate 2
    await gamePage.waitForActiveGateLabel("Geography Gate");

    // Gate 2: Geography
    await gamePage.submitAnswer("Paris");
    await gamePage.waitForVerificationComplete();
    expect(await gamePage.isGuessSuccessful()).toBe(true);

    // Step 6: Verify game complete
    await gamePage.waitForTheEnd();
    expect(await gamePage.isGameComplete()).toBe(true);
  });
});
