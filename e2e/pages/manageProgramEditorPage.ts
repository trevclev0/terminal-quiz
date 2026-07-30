import type { Page } from "@playwright/test";

export class ManageProgramEditorPage {
  constructor(private page: Page) {}

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
    await form.getByRole("button", { name: "Add Gate" }).click();
    // Wait for the mutation response AND the programGates refetch
    await this.page.waitForResponse((resp) =>
      resp.url().includes("/api/graphql"),
    );
    await this.page.waitForResponse((resp) =>
      resp.url().includes("/api/graphql"),
    );
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

  async getProgramUrl(): Promise<string> {
    return this.page.url();
  }

  async clickPlay() {
    const url = this.page.url();
    const match = url.match(/\/programs\/manage\/(.+)/);
    if (match) {
      await this.page.goto(`/programs/${match[1]}`);
    }
  }
}
