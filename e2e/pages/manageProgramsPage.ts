import type { Page } from "@playwright/test";
import { ManageProgramEditorPage } from "./manageProgramEditorPage";

export class ManageProgramsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/programs/manage");
  }

  async waitForLoad() {
    await this.page.getByRole("heading", { name: "My Programs" }).waitFor({
      state: "visible",
    });
  }

  async createProgram(
    name: string,
    visibility: "public" | "unlisted" = "public",
  ): Promise<ManageProgramEditorPage> {
    await this.page.getByPlaceholder("Program name").fill(name);
    await this.page.getByLabel("Visibility").selectOption(visibility);
    await this.page.getByRole("button", { name: "Create Program" }).click();
    await this.page.waitForURL(/\/programs\/manage\//);
    return new ManageProgramEditorPage(this.page);
  }

  async getProgramNames(): Promise<string[]> {
    const links = this.page.locator("a[href*='/programs/manage/']");
    const count = await links.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await links.nth(i).textContent();
      if (text && text !== "Edit") {
        names.push(text.trim());
      }
    }
    return names;
  }
}
