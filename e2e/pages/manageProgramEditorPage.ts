import { expect, type Page } from "@playwright/test";

export class ManageProgramEditorPage {
  readonly programId: string;

  constructor(private page: Page) {
    const match = page.url().match(/\/programs\/manage\/(.+)/);
    if (!match)
      throw new Error(
        `ManageProgramEditorPage: cannot extract programId from "${page.url()}"`,
      );
    this.programId = match[1];
  }

  async waitForLoad() {
    await this.page.getByRole("heading", { name: /Edit:/ }).waitFor({
      state: "visible",
    });
  }

  async addGate(gate: {
    label: string;
    question: string;
    correctAnswer: string;
    successMessage: string;
  }) {
    const form = this.page.getByLabel("Add Gate");
    await form.getByLabel("Label").fill(gate.label);
    await form.getByLabel("Question").fill(gate.question);
    await form.getByLabel("Correct Answer").fill(gate.correctAnswer);
    await form.getByLabel("Success Message").fill(gate.successMessage);

    const gateCards = this.page.locator("[class*='gateCard']");
    const previousCount = await gateCards.count();

    await form.getByRole("button", { name: "Add Gate" }).click();

    // Wait for new gate card to appear in the DOM (mutation + refetch done)
    await expect(gateCards).toHaveCount(previousCount + 1);
  }

  async getGateLabels(): Promise<string[]> {
    const gateCards = this.page.locator("[class*='gateCard']");
    const count = await gateCards.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      const labelInput = gateCards.nth(i).getByLabel("Label");
      const value = await labelInput.inputValue();
      if (value) labels.push(value);
    }
    return labels;
  }

  // ─── Delete confirmation (ConfirmDialog) ───────────────────────────

  private deleteDialog() {
    return this.page.locator('dialog[aria-label="Delete Gate Confirmation"]');
  }

  /**
   * Click "Delete Gate" on the gate card at `index`, opening the dialog.
   */
  async clickDeleteGate(index: number): Promise<void> {
    await this.page
      .locator("[class*='gateCard']")
      .nth(index)
      .getByRole("button", { name: "Delete Gate" })
      .click();
  }

  async isDeleteDialogVisible(): Promise<boolean> {
    return this.deleteDialog().isVisible();
  }

  /**
   * Confirm the pending gate delete and wait for the card count to drop.
   */
  async confirmDeleteGate(): Promise<void> {
    const gateCards = this.page.locator("[class*='gateCard']");
    const previousCount = await gateCards.count();

    await this.deleteDialog()
      .getByRole("button", { name: "Delete", exact: true })
      .click();

    await expect(gateCards).toHaveCount(previousCount - 1);
  }

  /**
   * Dismiss the pending gate delete via the "Cancel" button.
   */
  async cancelDeleteGate(): Promise<void> {
    await this.deleteDialog().getByRole("button", { name: "Cancel" }).click();
    await expect(this.deleteDialog()).toBeHidden();
  }

  async clickPlay() {
    await this.page.goto(`/programs/${this.programId}`);
  }
}
