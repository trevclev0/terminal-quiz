import type { Page } from "@playwright/test";
import { GamePage } from "./gamePage";

export class SelectProgramPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/programs/select");
  }

  async waitForLoad() {
    await this.page.getByLabel("Select your program").waitFor({
      state: "visible",
    });
  }

  async getProgramOptions(): Promise<string[]> {
    return this.page
      .getByLabel("Select your program")
      .locator("option")
      .allTextContents();
  }

  async selectProgram(name: string) {
    await this.page
      .getByLabel("Select your program")
      .selectOption({ label: name });
  }

  async startProgram() {
    await this.page.getByRole("button", { name: "Start Program" }).click();
  }

  async selectAndStart(name: string): Promise<GamePage> {
    await this.selectProgram(name);
    await this.startProgram();
    return new GamePage(this.page);
  }
}
