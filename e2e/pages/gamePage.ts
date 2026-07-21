import type { Page } from "@playwright/test";

export class GamePage {
  constructor(private page: Page) {}

  async waitForLoad() {
    // Wait for the active gate form to appear or "The End" heading
    await this.page.waitForFunction(() => {
      // Check for either an active gate form or the end state
      const form = document.querySelector(
        "form[aria-label$='enter password and press Enter to submit']",
      );
      const theEnd = document.querySelector("h2#classic-ending");
      return form !== null || theEnd !== null;
    });
  }

  /**
   * Get the label of the currently active gate, or null if game is complete.
   */
  async getActiveGateLabel(): Promise<string | null> {
    const form = this.page.locator(
      "form[aria-label$='enter password and press Enter to submit']",
    );
    const visible = await form.isVisible();
    if (!visible) return null;

    const ariaLabel = await form.getAttribute("aria-label");
    if (!ariaLabel) return null;
    // aria-label format: "{label} - enter password and press Enter to submit"
    return ariaLabel
      .replace(/- enter password and press Enter to submit$/, "")
      .trim();
  }

  /**
   * Wait for the active gate to become the expected label.
   * Use after a successful guess to wait for the progression query refetch
   * to land and the next gate to render.
   */
  async waitForActiveGateLabel(expectedLabel: string): Promise<void> {
    await this.page.waitForFunction(
      (expected) => {
        const form = document.querySelector(
          "form[aria-label$='enter password and press Enter to submit']",
        );
        if (!form) return false;
        const ariaLabel = form.getAttribute("aria-label") || "";
        const label = ariaLabel
          .replace(/- enter password and press Enter to submit$/, "")
          .trim();
        return label === expected;
      },
      expectedLabel,
      { timeout: 15000 },
    );
  }

  /**
   * Wait for "The End" heading to appear (game complete).
   * Use after solving the final gate.
   */
  async waitForTheEnd(): Promise<void> {
    await this.page
      .getByRole("heading", { name: "The End" })
      .waitFor({ state: "visible", timeout: 15000 });
  }

  /**
   * Submit an answer for the current active gate.
   * Types into the password input and presses Enter.
   * Stores the submitted gate label for later verification.
   */
  async submitAnswer(answer: string) {
    const activeLabel = await this.getActiveGateLabel();
    if (!activeLabel) {
      throw new Error("No active gate to submit answer to");
    }

    // Store the label before submission for isGuessSuccessful check
    this.lastSubmittedGateLabel = activeLabel;

    // Locate the input within the active gate's form
    const input = this.page.getByLabel(`${activeLabel} password input`);
    await input.fill(answer);
    await input.press("Enter");
  }

  /**
   * Wait for a response message to appear after submission.
   * Returns the message text, or null if no message appeared.
   */
  async waitForResponse(): Promise<string | null> {
    // The response message has role="status"
    const status = this.page.locator("[role='status']");
    try {
      await status.waitFor({ state: "visible", timeout: 10000 });
      return await status.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Wait for verification to complete (status changes from "Verifying..." to result).
   * Returns the final status text.
   */
  async waitForVerificationComplete(): Promise<string | null> {
    const status = this.page.locator("[role='status']");
    try {
      // Wait for status to appear and NOT be "Verifying..."
      await this.page.waitForFunction(
        () => {
          const el = document.querySelector("[role='status']");
          if (!el) return false;
          const text = el.textContent || "";
          return text.trim() !== "Verifying..." && text.trim().length > 0;
        },
        { timeout: 15000 },
      );
      return await status.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Check if the guess for the most recently submitted gate was successful
   * by checking the status message for "Correct!" prefix.
   */
  async isGuessSuccessful(): Promise<boolean> {
    const status = this.page.locator("[role='status']");
    try {
      await status.waitFor({ state: "visible", timeout: 5000 });
      const text = await status.textContent();
      return text?.trim().startsWith("Correct!") ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Check if game is complete ("The End" heading visible).
   */
  async isGameComplete(): Promise<boolean> {
    const heading = this.page.getByRole("heading", { name: "The End" });
    return heading.isVisible();
  }

  /**
   * Get visible completed gate labels (for progress verification).
   */
  async getCompletedGateLabels(): Promise<string[]> {
    const completedForms = this.page.locator("form[aria-label$='- completed']");
    const count = await completedForms.count();
    const labels: string[] = [];

    for (let i = 0; i < count; i++) {
      const form = completedForms.nth(i);
      const ariaLabel = await form.getAttribute("aria-label");
      if (ariaLabel) {
        labels.push(ariaLabel.replace(/- completed$/, "").trim());
      }
    }

    return labels;
  }

  /**
   * Read the success message from a completed gate.
   */
  async getSuccessMessage(): Promise<string | null> {
    const paragraph = this.page.locator("p.clue");
    try {
      await paragraph.first().waitFor({ state: "visible", timeout: 5000 });
      return await paragraph.first().textContent();
    } catch {
      return null;
    }
  }
}
